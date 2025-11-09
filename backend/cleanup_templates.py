#!/usr/bin/env python3
"""
Cleanup script to remove placeholder templates that don't have proper schemas.
Keeps only the Modern Professional template.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

def cleanup_templates():
    """Remove templates that don't have proper schemas."""
    try:
        print("=" * 60)
        print("Cleaning up placeholder templates...")
        print("=" * 60)
        
        # List all templates first
        all_templates = supabase.table("templates").select("id,name,slug").execute()
        
        if not all_templates.data:
            print("No templates found in database.")
            return
        
        print(f"\nFound {len(all_templates.data)} template(s):\n")
        
        templates_to_keep = ["modern-professional"]
        deleted_count = 0
        
        for template in all_templates.data:
            slug = template.get('slug')
            name = template.get('name')
            
            if slug not in templates_to_keep:
                print(f"🗑️  Deleting: {name} (slug: {slug})")
                try:
                    result = supabase.table("templates").delete().eq("id", template.get('id')).execute()
                    deleted_count += 1
                    print(f"   ✅ Deleted successfully")
                except Exception as e:
                    print(f"   ❌ Error deleting: {e}")
            else:
                print(f"✅ Keeping: {name} (slug: {slug})")
        
        print(f"\n{'=' * 60}")
        print(f"✅ Cleanup complete! Deleted {deleted_count} template(s).")
        print(f"{'=' * 60}")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    cleanup_templates()

