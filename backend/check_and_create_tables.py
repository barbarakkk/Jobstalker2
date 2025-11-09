#!/usr/bin/env python3
"""
Check if required tables exist and provide instructions to create them if missing.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

def check_tables():
    """Check if required tables exist."""
    tables_to_check = ['user_skills', 'user_work_experience', 'user_education']
    missing_tables = []
    
    print("=" * 60)
    print("Checking for required database tables...")
    print("=" * 60)
    
    for table_name in tables_to_check:
        try:
            # Try to query the table - if it doesn't exist, it will raise an error
            result = supabase.table(table_name).select("id").limit(1).execute()
            print(f"✅ Table '{table_name}' exists")
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg or "relation" in error_msg.lower():
                print(f"❌ Table '{table_name}' does NOT exist")
                missing_tables.append(table_name)
            else:
                print(f"⚠️  Table '{table_name}' - Error checking: {error_msg}")
    
    print("\n" + "=" * 60)
    
    if missing_tables:
        print(f"❌ Missing tables: {', '.join(missing_tables)}")
        print("\n📝 To create these tables:")
        print("   1. Open your Supabase Dashboard")
        print("   2. Go to SQL Editor")
        print("   3. Run the SQL from: backend/create_missing_tables.sql")
        print("\n   Or run this SQL directly:")
        print("\n" + "-" * 60)
        print("   See: backend/create_missing_tables.sql")
        print("-" * 60)
    else:
        print("✅ All required tables exist!")
    
    print("=" * 60)
    
    return len(missing_tables) == 0

if __name__ == "__main__":
    check_tables()

