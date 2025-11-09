#!/usr/bin/env python3
"""
Seed script to insert the Modern Professional template into the database.
Run this script to populate the templates table with a default template.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

# Modern Professional Template Configuration
template_config = {
    "metadata": {
        "id": "modern-professional",
        "name": "Modern Professional",
        "description": "Clean, modern single-column resume perfect for any industry",
        "category": "professional",
        "badge": "Popular",
        "colors": ["#2563eb", "#1e40af", "#3b82f6"]
    },
    "layout": {
        "type": "single-column",
        "maxWidth": "800px",
        "padding": "2rem",
        "gap": "1.5rem"
    },
    "sections": [
        {
            "type": "header",
            "position": "top",
            "order": 1,
            "visible": True,
            "style": {
                "paddingBottom": "1.5rem",
                "borderBottom": "2px solid #e5e7eb"
            }
        },
        {
            "type": "summary",
            "position": "after-header",
            "order": 2,
            "visible": True,
            "showTitle": False,
            "style": {
                "paddingTop": "1rem",
                "paddingBottom": "1rem"
            }
        },
        {
            "type": "work",
            "position": "main",
            "order": 3,
            "visible": True,
            "showTitle": True,
            "title": "Work Experience",
            "style": {
                "paddingTop": "1rem"
            }
        },
        {
            "type": "education",
            "position": "main",
            "order": 4,
            "visible": True,
            "showTitle": True,
            "title": "Education",
            "style": {
                "paddingTop": "1rem"
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
                "paddingTop": "1rem"
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
                "paddingTop": "1rem"
            }
        }
    ],
    "theme": {
        "primaryColor": "#2563eb",
        "textColor": "#111827",
        "backgroundColor": "#ffffff",
        "borderColor": "#e5e7eb",
        "fontFamily": "Inter, system-ui, sans-serif",
        "headingFontSize": "1.5rem",
        "bodyFontSize": "0.875rem"
    },
    "styles": {
        "container": {
            "backgroundColor": "#ffffff",
            "color": "#111827"
        }
    }
}


def seed_template():
    """Insert or update the Modern Professional template in the database."""
    try:
        print("🌱 Seeding Modern Professional template...")
        
        # Check if template already exists by slug
        existing_by_slug = supabase.table("templates").select("id,slug,name").eq("slug", "modern-professional").maybe_single().execute()
        
        # Also check by name in case slug is different
        existing_by_name = supabase.table("templates").select("id,slug,name").eq("name", "Modern Professional").maybe_single().execute()
        
        existing = existing_by_slug if (existing_by_slug and existing_by_slug.data) else (existing_by_name if (existing_by_name and existing_by_name.data) else None)
        
        if existing and existing.data:
            print(f"📝 Template already exists with ID: {existing.data['id']}")
            print(f"   Current slug: {existing.data.get('slug')}")
            print(f"   Current name: {existing.data.get('name')}")
            print("🔄 Updating existing template...")
            
            # Update existing template (use the ID we found)
            result = supabase.table("templates").update({
                "name": "Modern Professional",
                "slug": "modern-professional",
                "schema": template_config,
                "is_active": True,
                "updated_at": "now()"
            }).eq("id", existing.data['id']).execute()
            
            if result.data:
                print(f"✅ Template updated successfully!")
                print(f"   ID: {result.data[0]['id']}")
                print(f"   Slug: {result.data[0]['slug']}")
                print(f"   Name: {result.data[0]['name']}")
                return result.data[0]
            else:
                print("❌ Failed to update template")
                return None
        else:
            print("➕ Creating new template...")
            
            # Insert new template
            result = supabase.table("templates").insert({
                "name": "Modern Professional",
                "slug": "modern-professional",
                "schema": template_config,
                "is_active": True
            }).execute()
            
            if result.data:
                print(f"✅ Template created successfully!")
                print(f"   ID: {result.data[0]['id']}")
                print(f"   Slug: {result.data[0]['slug']}")
                print(f"   Name: {result.data[0]['name']}")
                return result.data[0]
            else:
                print("❌ Failed to create template")
                return None
                
    except Exception as e:
        print(f"❌ Error seeding template: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("Template Seeder - Modern Professional")
    print("=" * 60)
    seed_template()
    print("=" * 60)

