"""Stripe subscription management routes"""
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase
from utils.dependencies import get_current_user
from utils.subscription import get_user_subscription_tier, get_subscription_info
import stripe
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")  # Set this in your environment

# Models
class CreateCheckoutSessionRequest(BaseModel):
    price_id: Optional[str] = None  # If not provided, uses default pro price

class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    limits: dict
    usage: dict
    subscription: Optional[dict] = None

@router.get("/api/subscription/status", response_model=SubscriptionResponse)
async def get_subscription_status(user_id: str = Depends(get_current_user)):
    """Get current subscription status and limits"""
    try:
        info = await get_subscription_info(user_id)
        return SubscriptionResponse(**info)
    except Exception as e:
        print(f"Error getting subscription status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get subscription status: {str(e)}")

@router.post("/api/subscription/create-checkout-session")
async def create_checkout_session(request: CreateCheckoutSessionRequest, user_id: str = Depends(get_current_user)):
    """Create a Stripe checkout session for subscription"""
    try:
        if not stripe.api_key:
            raise HTTPException(status_code=500, detail="Stripe is not configured")
        
        # Get user email from Supabase
        try:
            user_response = supabase.auth.admin.get_user_by_id(user_id)
            user_email = user_response.user.email if user_response and user_response.user else None
        except:
            user_email = None
        
        # Get or create Stripe customer
        subscription_response = supabase.table("subscriptions").select("stripe_customer_id").eq("user_id", user_id).single().execute()
        
        customer_id = None
        if subscription_response.data and subscription_response.data.get("stripe_customer_id"):
            customer_id = subscription_response.data["stripe_customer_id"]
        else:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"user_id": user_id}
            )
            customer_id = customer.id
            
            # Save customer ID to database
            supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "stripe_customer_id": customer_id,
                "tier": "free",
                "status": "free"
            }).execute()
        
        # Use provided price_id or default pro price
        price_id = request.price_id or STRIPE_PRICE_ID_PRO
        
        if not price_id:
            raise HTTPException(status_code=500, detail="Stripe price ID not configured")
        
        # Get frontend URL from environment
        frontend_url = os.getenv("FRONTEND_URL", "https://jobstalker-ai.com")
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{frontend_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/subscription/cancel",
            metadata={
                "user_id": user_id
            }
        )
        
        return {
            "session_id": checkout_session.id,
            "url": checkout_session.url
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@router.post("/api/subscription/create-portal-session")
async def create_portal_session(user_id: str = Depends(get_current_user)):
    """Create a Stripe customer portal session for managing subscription"""
    try:
        if not stripe.api_key:
            raise HTTPException(status_code=500, detail="Stripe is not configured")
        
        # Get Stripe customer ID
        subscription_response = supabase.table("subscriptions").select("stripe_customer_id").eq("user_id", user_id).single().execute()
        
        if not subscription_response.data or not subscription_response.data.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        customer_id = subscription_response.data["stripe_customer_id"]
        
        # Get frontend URL from environment
        frontend_url = os.getenv("FRONTEND_URL", "https://jobstalker-ai.com")
        
        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{frontend_url}/subscription",
        )
        
        return {
            "url": portal_session.url
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")

@router.post("/api/subscription/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        if not STRIPE_WEBHOOK_SECRET:
            raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")
        
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            print(f"Invalid payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            print(f"Invalid signature: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        event_type = event['type']
        data = event['data']['object']
        
        print(f"Stripe webhook event: {event_type}")
        
        if event_type == 'checkout.session.completed':
            # Payment successful, subscription created
            session = data
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            user_id = session.get('metadata', {}).get('user_id')
            
            if user_id and customer_id and subscription_id:
                # Get subscription details from Stripe
                subscription = stripe.Subscription.retrieve(subscription_id)
                price_id = subscription.items.data[0].price.id if subscription.items.data else None
                
                # Update or create subscription in database
                supabase.table("subscriptions").upsert({
                    "user_id": user_id,
                    "stripe_customer_id": customer_id,
                    "stripe_subscription_id": subscription_id,
                    "stripe_price_id": price_id,
                    "status": subscription.status,
                    "tier": "pro",
                    "current_period_start": datetime.fromtimestamp(subscription.current_period_start).isoformat() if subscription.current_period_start else None,
                    "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat() if subscription.current_period_end else None,
                    "cancel_at_period_end": subscription.cancel_at_period_end
                }).execute()
        
        elif event_type == 'customer.subscription.updated':
            # Subscription updated (e.g., renewed, canceled)
            subscription = data
            customer_id = subscription.get('customer')
            
            # Find user by customer ID
            sub_response = supabase.table("subscriptions").select("user_id").eq("stripe_customer_id", customer_id).single().execute()
            
            if sub_response.data:
                user_id = sub_response.data["user_id"]
                price_id = subscription.items.data[0].price.id if subscription.items.data else None
                
                # Determine tier based on subscription status
                tier = "pro" if subscription.status == "active" else "free"
                
                # Update subscription in database
                supabase.table("subscriptions").update({
                    "stripe_subscription_id": subscription.id,
                    "stripe_price_id": price_id,
                    "status": subscription.status,
                    "tier": tier,
                    "current_period_start": datetime.fromtimestamp(subscription.current_period_start).isoformat() if subscription.current_period_start else None,
                    "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat() if subscription.current_period_end else None,
                    "cancel_at_period_end": subscription.cancel_at_period_end
                }).eq("user_id", user_id).execute()
        
        elif event_type == 'customer.subscription.deleted':
            # Subscription canceled
            subscription = data
            customer_id = subscription.get('customer')
            
            # Find user by customer ID
            sub_response = supabase.table("subscriptions").select("user_id").eq("stripe_customer_id", customer_id).single().execute()
            
            if sub_response.data:
                user_id = sub_response.data["user_id"]
                
                # Update subscription to canceled/free
                supabase.table("subscriptions").update({
                    "status": "canceled",
                    "tier": "free",
                    "cancel_at_period_end": False
                }).eq("user_id", user_id).execute()
        
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook handling failed: {str(e)}")










