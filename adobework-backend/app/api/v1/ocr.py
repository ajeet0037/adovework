"""
OCR API Endpoints
Text extraction from images and PDFs
"""
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form

from app.config import get_settings
from app.models.schemas import (
    FileResponse as FileResponseModel,
    OCRLanguage,
    OCRResponse,
)
from app.utils.file import (
    save_upload_file,
    cleanup_file,
    validate_image_file,
    validate_pdf_file,
    generate_filename,
)
from app.services.ocr import extract as ocr_service

settings = get_settings()
router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/image", response_model=OCRResponse)
async def ocr_image(
    file: UploadFile = File(...),
    language: OCRLanguage = Form(OCRLanguage.ENGLISH)
):
    """Extract text from image using OCR"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "ocr")
    
    try:
        text, confidence = ocr_service.ocr_image(
            input_path,
            language=language.value
        )
        
        processing_time = time.time() - start_time
        
        return OCRResponse(
            text=text,
            confidence=confidence,
            processing_time=processing_time
        )
    finally:
        cleanup_file(input_path)


@router.post("/pdf", response_model=OCRResponse)
async def ocr_pdf(
    file: UploadFile = File(...),
    language: OCRLanguage = Form(OCRLanguage.ENGLISH),
    dpi: int = Form(300)
):
    """Extract text from PDF using OCR"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "ocr-pdf")
    
    try:
        text, confidence = ocr_service.ocr_pdf(
            input_path,
            language=language.value,
            dpi=dpi
        )
        
        processing_time = time.time() - start_time
        
        return OCRResponse(
            text=text,
            confidence=confidence,
            processing_time=processing_time
        )
    finally:
        cleanup_file(input_path)


@router.post("/image-to-pdf", response_model=FileResponseModel)
async def image_to_searchable_pdf(
    file: UploadFile = File(...),
    language: OCRLanguage = Form(OCRLanguage.ENGLISH)
):
    """Convert image to searchable PDF with OCR layer"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "ocr-to-pdf")
    
    try:
        output_filename = generate_filename(file.filename or "searchable", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        ocr_service.ocr_image_to_searchable_pdf(
            input_path, output_path, language.value
        )
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return FileResponseModel(
            file_url=f"/downloads/{output_filename}",
            filename=output_filename,
            file_size=file_size,
            processing_time=processing_time
        )
    finally:
        cleanup_file(input_path)


@router.post("/pdf-to-searchable", response_model=FileResponseModel)
async def pdf_to_searchable_pdf(
    file: UploadFile = File(...),
    language: OCRLanguage = Form(OCRLanguage.ENGLISH),
    dpi: int = Form(300)
):
    """Convert scanned PDF to searchable PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pdf-searchable")
    
    try:
        output_filename = generate_filename(file.filename or "searchable", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        ocr_service.ocr_pdf_to_searchable(
            input_path, output_path,
            language=language.value,
            dpi=dpi
        )
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return FileResponseModel(
            file_url=f"/downloads/{output_filename}",
            filename=output_filename,
            file_size=file_size,
            processing_time=processing_time
        )
    finally:
        cleanup_file(input_path)


@router.get("/languages")
async def get_available_languages():
    """Get list of available OCR languages"""
    try:
        languages = ocr_service.get_available_languages()
        return {"success": True, "languages": languages}
    except Exception as e:
        return {"success": True, "languages": ["eng"]}
