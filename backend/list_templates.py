#!/usr/bin/env python3
"""
List all templates in the database.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

def list_templates():
    """List all templates in the database."""
    try:
        print("=" * 60)
        print("Listing all templates in database...")
        print("=" * 60)
        
        result = supabase.table("templates").select("id,name,slug,is_active").execute()
        
        if not result.data:
            print("No templates found in database.")
            return
        
        print(f"\nFound {len(result.data)} template(s):\n")
        
        for i, template in enumerate(result.data, 1):
            print(f"{i}. {template.get('name')}")
            print(f"   ID: {template.get('id')}")
            print(f"   Slug: {template.get('slug')}")
            print(f"   Active: {template.get('is_active', True)}")
            print()
        
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error listing templates: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    list_templates()

