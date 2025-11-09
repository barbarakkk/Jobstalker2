#!/usr/bin/env python3
"""
Script to create missing database tables for user_skills, user_work_experience, and user_education.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import supabase

def create_tables():
    """Create missing tables using SQL."""
    try:
        print("=" * 60)
        print("Creating missing database tables...")
        print("=" * 60)
        
        # Read the SQL file
        sql_file = Path(__file__).parent / "create_missing_tables.sql"
        
        if not sql_file.exists():
            print(f"❌ SQL file not found: {sql_file}")
            return False
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        print(f"\n📝 Found {len(statements)} SQL statements to execute\n")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
            try:
                print(f"Executing statement {i}/{len(statements)}...")
                # Use Supabase RPC or direct SQL execution
                # Note: Supabase Python client doesn't support raw SQL directly
                # We'll need to use the REST API or create tables via Supabase dashboard
                # For now, let's check if tables exist and provide instructions
                print(f"   Statement: {statement[:100]}...")
            except Exception as e:
                print(f"   ⚠️  Warning: {e}")
        
        print("\n" + "=" * 60)
        print("⚠️  Note: Supabase Python client doesn't support raw SQL execution.")
        print("Please run the SQL from create_missing_tables.sql in your Supabase SQL Editor.")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    create_tables()

