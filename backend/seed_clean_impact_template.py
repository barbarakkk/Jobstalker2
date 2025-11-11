#!/usr/bin/env python3
"""
Seed script to insert the Clean Impact template into the database.
Run this script to populate the templates table with the Clean Impact template.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

# Clean Impact Template Configuration
template_config = {
    "metadata": {
        "id": "clean-impact",
        "name": "Clean Professional Resume",
        "description": "Professional single-column resume with clean design and impact-focused layout",
        "category": "professional",
        "badge": "New",
        "colors": ["#1ca3b8", "#0d7a8a", "#2bb8cc"]
    },
    "layout": {
        "type": "single-column",
        "maxWidth": "800px",
        "padding": "28px",
        "gap": "18px"
    },
    "sections": [
        {
            "type": "header",
            "position": "top",
            "order": 1,
            "visible": True,
            "className": "ci-header",
            "style": {
                "marginBottom": "14px",
                "borderBottom": "2px solid #e7eef3",
                "paddingBottom": "8px",
                "color": "#1ca3b8"
            }
        },
        {
            "type": "summary",
            "position": "after-header",
            "order": 2,
            "visible": True,
            "showTitle": True,
            "title": "SUMMARY",
            "style": {
                "marginTop": "18px",
                "color": "#1c1e21",
                "primaryColor": "#1ca3b8"
            }
        },
        {
            "type": "work",
            "position": "main",
            "order": 3,
            "visible": True,
            "showTitle": True,
            "title": "WORK EXPERIENCE",
            "style": {
                "marginTop": "18px",
                "primaryColor": "#1ca3b8",
                "color": "#1c1e21"
            }
        },
        {
            "type": "education",
            "position": "main",
            "order": 4,
            "visible": True,
            "showTitle": True,
            "title": "EDUCATION",
            "style": {
                "marginTop": "18px",
                "primaryColor": "#1ca3b8",
                "color": "#1c1e21"
            }
        },
        {
            "type": "skills",
            "position": "main",
            "order": 5,
            "visible": True,
            "showTitle": True,
            "title": "Skills",
            "style": {
                "marginTop": "18px",
                "primaryColor": "#1ca3b8",
                "color": "#1c1e21"
            }
        },
        {
            "type": "languages",
            "position": "main",
            "order": 6,
            "visible": True,
            "showTitle": True,
            "title": "Languages",
            "style": {
                "marginTop": "18px",
                "primaryColor": "#1ca3b8",
                "color": "#1c1e21"
            }
        },
    ],
    "theme": {
        "primaryColor": "#1ca3b8",
        "textColor": "#1c1e21",
        "backgroundColor": "#ffffff",
        "borderColor": "#e7eef3",
        "fontFamily": "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        "headingFontSize": "12px",
        "bodyFontSize": "14px"
    },
    "styles": {
        "container": {
            "backgroundColor": "#ffffff",
            "color": "#1c1e21",
            "border": "1px solid #e7eef3",
            "borderRadius": "10px"
        }
    }
}


def seed_template():
    """Insert or update the Clean Impact template in the database."""
    try:
        print("Seeding Clean Impact template...")
        
        # Check if template already exists by slug
        existing_by_slug = supabase.table("templates").select("id,slug,name").eq("slug", "clean-impact").maybe_single().execute()
        
        # Also check by name in case slug is different
        existing_by_name = supabase.table("templates").select("id,slug,name").eq("name", "Clean Professional Resume").maybe_single().execute()
        
        existing = existing_by_slug if (existing_by_slug and existing_by_slug.data) else (existing_by_name if (existing_by_name and existing_by_name.data) else None)
        
        if existing and existing.data:
            print(f"Template already exists with ID: {existing.data['id']}")
            print(f"   Current slug: {existing.data.get('slug')}")
            print(f"   Current name: {existing.data.get('name')}")
            print("Updating existing template...")
            
            # Update existing template (use the ID we found)
            result = supabase.table("templates").update({
                "name": "Clean Professional Resume",
                "slug": "clean-impact",
                "schema": template_config,
                "is_active": True,
                "updated_at": "now()"
            }).eq("id", existing.data['id']).execute()
            
            if result.data:
                print(f"Template updated successfully!")
                print(f"   ID: {result.data[0]['id']}")
                print(f"   Slug: {result.data[0]['slug']}")
                print(f"   Name: {result.data[0]['name']}")
                return result.data[0]
            else:
                print("Failed to update template")
                return None
        else:
            print("Creating new template...")
            
            # Insert new template
            result = supabase.table("templates").insert({
                "name": "Clean Professional Resume",
                "slug": "clean-impact",
                "schema": template_config,
                "is_active": True
            }).execute()
            
            if result.data:
                print(f"Template created successfully!")
                print(f"   ID: {result.data[0]['id']}")
                print(f"   Slug: {result.data[0]['slug']}")
                print(f"   Name: {result.data[0]['name']}")
                return result.data[0]
            else:
                print("Failed to create template")
                return None
                
    except Exception as e:
        print(f"Error seeding template: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("Template Seeder - Clean Impact")
    print("=" * 60)
    seed_template()
    print("=" * 60)

