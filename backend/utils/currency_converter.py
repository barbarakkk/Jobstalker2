"""Currency conversion utility for converting salaries to USD"""
import os
import requests
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP

# Common currency exchange rates (fallback if API is unavailable)
# These are approximate rates - should be updated periodically
FALLBACK_EXCHANGE_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.35,
    "AUD": 1.52,
    "JPY": 150.0,
    "INR": 83.0,
    "CHF": 0.88,
    "CNY": 7.2,
    "SGD": 1.34,
    "HKD": 7.8,
    "NZD": 1.64,
    "SEK": 10.5,
    "NOK": 10.7,
    "DKK": 6.9,
    "PLN": 4.0,
    "MXN": 17.0,
    "BRL": 5.0,
    "ZAR": 18.5,
    "KRW": 1330.0,
    "TWD": 31.5,
}

def get_exchange_rate(from_currency: str, to_currency: str = "USD") -> Optional[float]:
    """
    Get exchange rate from one currency to another.
    Tries to use a free API, falls back to static rates if unavailable.
    
    Args:
        from_currency: Source currency code (e.g., "EUR", "GBP")
        to_currency: Target currency code (default: "USD")
    
    Returns:
        Exchange rate as float, or None if currency not supported
    """
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    
    # If same currency, return 1.0
    if from_currency == to_currency:
        return 1.0
    
    # Try to use exchangerate-api.com (free tier: 1500 requests/month)
    try:
        api_key = os.getenv("EXCHANGE_RATE_API_KEY")
        if api_key:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{from_currency}"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("result") == "success":
                    rates = data.get("conversion_rates", {})
                    if to_currency in rates:
                        return float(rates[to_currency])
        else:
            # Try free endpoint (no API key required, but limited)
            url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                if to_currency in rates:
                    return float(rates[to_currency])
    except Exception as e:
        print(f"Warning: Could not fetch exchange rate from API: {str(e)}")
    
    # Fallback to static rates
    if from_currency in FALLBACK_EXCHANGE_RATES and to_currency == "USD":
        return FALLBACK_EXCHANGE_RATES[from_currency]
    
    # If converting from USD to another currency
    if from_currency == "USD" and to_currency in FALLBACK_EXCHANGE_RATES:
        return 1.0 / FALLBACK_EXCHANGE_RATES[to_currency]
    
    print(f"Warning: Exchange rate not found for {from_currency} to {to_currency}, using fallback")
    return None

def convert_to_usd(amount: float, from_currency: str) -> Optional[float]:
    """
    Convert an amount from any currency to USD.
    
    Args:
        amount: The amount to convert
        from_currency: Source currency code (e.g., "EUR", "GBP")
    
    Returns:
        Amount in USD as float, or None if conversion failed
    """
    if from_currency.upper() == "USD":
        return float(amount)
    
    exchange_rate = get_exchange_rate(from_currency, "USD")
    if exchange_rate is None:
        print(f"Warning: Could not convert {amount} {from_currency} to USD - exchange rate not available")
        return None
    
    # Use Decimal for precise calculation, then round to 2 decimal places
    result = Decimal(str(amount)) * Decimal(str(exchange_rate))
    return float(result.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
