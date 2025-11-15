"""File upload utilities for Supabase Storage"""
from fastapi import HTTPException, UploadFile
from supabase_client import supabase
import uuid
import logging

logger = logging.getLogger("jobstalker")

async def upload_file_to_supabase(file: UploadFile, folder: str) -> str:
    """Upload file to Supabase Storage and return the URL"""
    try:
        # Generate unique filename
        import os
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        file_path = f"{folder}/{unique_filename}"
        response = supabase.storage.from_("jobstalker-files").upload(
            file_path, 
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_("jobstalker-files").get_public_url(file_path)
        
        return file_url
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

async def upload_profile_picture_to_supabase(file: UploadFile, file_content: bytes, user_id: str) -> str:
    """Upload profile picture to Supabase Storage and return the URL"""
    try:
        # Generate unique filename
        import os
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Upload to Supabase Storage with user ID in path
        file_path = f"{user_id}/profile-pictures/{unique_filename}"
        response = supabase.storage.from_("jobstalker-files").upload(
            file_path, 
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_("jobstalker-files").get_public_url(file_path)
        
        return file_url
    except Exception as e:
        print(f"Profile picture upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")

