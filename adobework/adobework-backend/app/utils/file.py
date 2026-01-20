"""
File handling utilities
"""
import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from typing import Optional, List
import time

from app.config import get_settings

settings = get_settings()


def generate_filename(original_name: str, extension: Optional[str] = None) -> str:
    """Generate unique filename"""
    base_name = Path(original_name).stem
    ext = extension or Path(original_name).suffix
    unique_id = uuid.uuid4().hex[:8]
    timestamp = int(time.time())
    return f"{base_name}_{timestamp}_{unique_id}{ext}"


def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return Path(filename).suffix.lower()


def get_mime_type(extension: str) -> str:
    """Get MIME type from extension"""
    mime_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".tiff": "image/tiff",
        ".zip": "application/zip",
    }
    return mime_types.get(extension.lower(), "application/octet-stream")


async def save_upload_file(file: UploadFile, subdir: str = "") -> str:
    """Save uploaded file and return path"""
    upload_dir = Path(settings.UPLOAD_DIR) / subdir
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    filename = generate_filename(file.filename or "file")
    file_path = upload_dir / filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return str(file_path)


async def save_upload_files(files: List[UploadFile], subdir: str = "") -> List[str]:
    """Save multiple uploaded files"""
    paths = []
    for file in files:
        path = await save_upload_file(file, subdir)
        paths.append(path)
    return paths


def save_output_file(content: bytes, filename: str) -> str:
    """Save output file and return download URL"""
    download_dir = Path(settings.DOWNLOAD_DIR)
    download_dir.mkdir(parents=True, exist_ok=True)
    
    output_filename = generate_filename(filename)
    file_path = download_dir / output_filename
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    return f"/downloads/{output_filename}"


def cleanup_file(file_path: str):
    """Remove a file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass


def cleanup_files(file_paths: List[str]):
    """Remove multiple files"""
    for path in file_paths:
        cleanup_file(path)


def validate_file_size(file: UploadFile) -> bool:
    """Validate file size"""
    # This is a rough check, actual size check happens after reading
    return True


def validate_pdf_file(file: UploadFile):
    """Validate PDF file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = get_file_extension(file.filename)
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")


def validate_image_file(file: UploadFile):
    """Validate image file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = get_file_extension(file.filename)
    valid_extensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"]
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid image format. Supported: {', '.join(valid_extensions)}"
        )


def validate_document_file(file: UploadFile, allowed_extensions: List[str]):
    """Validate document file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = get_file_extension(file.filename)
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Supported: {', '.join(allowed_extensions)}"
        )
