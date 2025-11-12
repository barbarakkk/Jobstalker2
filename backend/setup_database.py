#!/usr/bin/env python3
"""
Database Setup Script for JobStalker2 Profile Section

This script helps set up the database schema for the profile section.
It creates all necessary tables, indexes, and security policies.

Usage:
    python setup_database.py

Requirements:
    - Supabase project configured
    - Environment variables set (SUPABASE_URL, SUPABASE_KEY)
"""

import os
import sys
from supabase_client import supabase

def read_sql_file(filename):
    """Read SQL file content"""
    try:
        with open(filename, 'r') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: SQL file '{filename}' not found")
        sys.exit(1)

def execute_sql_statements(sql_content):
    """Execute SQL statements"""
    try:
        # Split SQL content into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"Executing statement {i}/{len(statements)}...")
                try:
                    # Execute the SQL statement
                    result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                    print(f"✓ Statement {i} executed successfully")
                except Exception as e:
                    print(f"⚠ Statement {i} failed (this might be expected): {str(e)}")
                    # Continue with other statements
                    
    except Exception as e:
        print(f"Error executing SQL statements: {str(e)}")
        sys.exit(1)

def check_tables_exist():
    """Check if required tables exist"""
    required_tables = [
        'profiles', 'skills', 'work_experience', 
        'education', 'jobs'
    ]
    
    existing_tables = []
    missing_tables = []
    
    for table in required_tables:
        try:
            # Try to select from the table
            result = supabase.table(table).select('id').limit(1).execute()
            existing_tables.append(table)
            print(f"✓ Table '{table}' exists")
        except Exception:
            missing_tables.append(table)
            print(f"✗ Table '{table}' missing")
    
    return existing_tables, missing_tables

def create_storage_bucket():
    """Create storage bucket for file uploads"""
    try:
        # Create storage bucket for files
        bucket_name = "jobstalker-files"
        
        # Check if bucket exists
        try:
            buckets = supabase.storage.list_buckets()
            bucket_exists = any(bucket['name'] == bucket_name for bucket in buckets)
            
            if not bucket_exists:
                print(f"Creating storage bucket '{bucket_name}'...")
                supabase.storage.create_bucket(bucket_name, {
                    'public': True,
                    'allowedMimeTypes': ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                    'fileSizeLimit': 5242880  # 5MB
                })
                print(f"✓ Storage bucket '{bucket_name}' created successfully")
            else:
                print(f"✓ Storage bucket '{bucket_name}' already exists")
                
        except Exception as e:
            print(f"⚠ Storage bucket creation failed (this might be expected): {str(e)}")
            
    except Exception as e:
        print(f"Error creating storage bucket: {str(e)}")

def main():
    """Main setup function"""
    print("=" * 60)
    print("JobStalker2 Database Setup")
    print("=" * 60)
    
    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        print("Please set these in your .env file or environment")
        sys.exit(1)
    
    print("✓ Environment variables configured")
    
    # Test database connection
    try:
        result = supabase.table('jobs').select('id').limit(1).execute()
        print("✓ Database connection successful")
    except Exception as e:
        print(f"Error: Database connection failed: {str(e)}")
        print("Please check your Supabase configuration")
        sys.exit(1)
    
    # Check existing tables
    print("\nChecking existing tables...")
    existing_tables, missing_tables = check_tables_exist()
    
    if not missing_tables:
        print("\n✓ All required tables already exist!")
        print("Database setup is complete.")
        return
    
    # Create missing tables
    print(f"\nCreating {len(missing_tables)} missing tables...")
    
    # Read and execute SQL schema
    sql_file = "schema.sql"
    if os.path.exists(sql_file):
        print(f"Reading SQL schema from '{sql_file}'...")
        sql_content = read_sql_file(sql_file)
        execute_sql_statements(sql_content)
    else:
        print(f"Error: SQL schema file '{sql_file}' not found")
        sys.exit(1)
    
    # Create storage bucket
    print("\nSetting up file storage...")
    create_storage_bucket()
    
    # Verify setup
    print("\nVerifying setup...")
    existing_tables, missing_tables = check_tables_exist()
    
    if not missing_tables:
        print("\n" + "=" * 60)
        print("✓ Database setup completed successfully!")
        print("=" * 60)
        print("\nAll tables created:")
        for table in existing_tables:
            print(f"  - {table}")
        print("\nStorage bucket created: jobstalker-files")
        print("\nYou can now start the backend server:")
        print("  python main.py")
    else:
        print(f"\n✗ Setup incomplete. Missing tables: {missing_tables}")
        print("Please check the error messages above and try again.")

if __name__ == "__main__":
    main()
