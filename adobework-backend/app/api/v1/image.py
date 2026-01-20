"""
Image API Endpoints
All image-related operations
"""
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form

from app.config import get_settings
from app.models.schemas import (
    FileResponse as FileResponseModel,
    ImageFormat,
    ImageResizeMode,
    PassportPhotoSize,
)
from app.utils.file import (
    save_upload_file,
    cleanup_file,
    validate_image_file,
    generate_filename,
)
from app.services.image import background as bg_service
from app.services.image import operations as img_ops
from app.services.image import passport as passport_service

settings = get_settings()
router = APIRouter(prefix="/image", tags=["Image"])


@router.post("/remove-bg", response_model=FileResponseModel)
async def remove_background(
    file: UploadFile = File(...),
    output_format: ImageFormat = Form(ImageFormat.PNG),
    background_color: Optional[str] = Form(None)
):
    """Remove background from image using AI"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "bg-remove")
    
    try:
        output_filename = generate_filename(
            file.filename or "nobg",
            f".{output_format.value}"
        )
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        if background_color:
            bg_service.remove_background_with_color(
                input_path, output_path, background_color
            )
        else:
            bg_service.remove_background(
                input_path, output_path, output_format.value
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


@router.post("/resize", response_model=FileResponseModel)
async def resize_image(
    file: UploadFile = File(...),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
    mode: ImageResizeMode = Form(ImageResizeMode.FIT),
    scale: Optional[float] = Form(None)
):
    """Resize image"""
    validate_image_file(file)
    
    if not width and not height and not scale:
        raise HTTPException(
            status_code=400,
            detail="At least one of width, height, or scale must be provided"
        )
    
    start_time = time.time()
    input_path = await save_upload_file(file, "resize")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "resized", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.resize_image(
            input_path, output_path,
            width=width,
            height=height,
            mode=mode.value,
            scale=scale
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


@router.post("/crop", response_model=FileResponseModel)
async def crop_image(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...)
):
    """Crop image to specified region"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "crop")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "cropped", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.crop_image(input_path, output_path, x, y, width, height)
        
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


@router.post("/rotate", response_model=FileResponseModel)
async def rotate_image(
    file: UploadFile = File(...),
    angle: float = Form(...),
    expand: bool = Form(True)
):
    """Rotate image by specified angle"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "rotate")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "rotated", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.rotate_image(input_path, output_path, angle, expand)
        
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


@router.post("/compress")
async def compress_image(
    file: UploadFile = File(...),
    quality: int = Form(80),
    output_format: Optional[ImageFormat] = Form(None)
):
    """Compress image to reduce file size"""
    validate_image_file(file)
    
    if quality < 1 or quality > 100:
        raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
    
    start_time = time.time()
    input_path = await save_upload_file(file, "compress")
    
    try:
        fmt = output_format.value if output_format else None
        ext = f".{fmt}" if fmt else Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "compressed", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        _, original_size, compressed_size = img_ops.compress_image(
            input_path, output_path, quality, fmt
        )
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "file_url": f"/downloads/{output_filename}",
            "filename": output_filename,
            "file_size": compressed_size,
            "original_size": original_size,
            "compression_ratio": round((1 - compressed_size / original_size) * 100, 2),
            "processing_time": processing_time
        }
    finally:
        cleanup_file(input_path)


@router.post("/convert", response_model=FileResponseModel)
async def convert_image(
    file: UploadFile = File(...),
    output_format: ImageFormat = Form(...)
):
    """Convert image to different format"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "convert")
    
    try:
        output_filename = generate_filename(
            file.filename or "converted",
            f".{output_format.value}"
        )
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.convert_image_format(input_path, output_path, output_format.value)
        
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


@router.post("/flip", response_model=FileResponseModel)
async def flip_image(
    file: UploadFile = File(...),
    direction: str = Form("horizontal")
):
    """Flip image horizontally or vertically"""
    validate_image_file(file)
    
    if direction not in ["horizontal", "vertical"]:
        raise HTTPException(
            status_code=400,
            detail="Direction must be 'horizontal' or 'vertical'"
        )
    
    start_time = time.time()
    input_path = await save_upload_file(file, "flip")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "flipped", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.flip_image(input_path, output_path, direction)
        
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


@router.post("/adjust", response_model=FileResponseModel)
async def adjust_image(
    file: UploadFile = File(...),
    brightness: Optional[float] = Form(None),
    contrast: Optional[float] = Form(None),
    saturation: Optional[float] = Form(None)
):
    """Adjust image brightness, contrast, and/or saturation"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "adjust")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "adjusted", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        # Apply adjustments sequentially
        current_path = input_path
        temp_paths = []
        
        if brightness is not None:
            temp_path = f"{settings.UPLOAD_DIR}/temp_bright_{int(time.time())}{ext}"
            img_ops.adjust_brightness(current_path, temp_path, brightness)
            if current_path != input_path:
                temp_paths.append(current_path)
            current_path = temp_path
        
        if contrast is not None:
            temp_path = f"{settings.UPLOAD_DIR}/temp_contrast_{int(time.time())}{ext}"
            img_ops.adjust_contrast(current_path, temp_path, contrast)
            if current_path != input_path:
                temp_paths.append(current_path)
            current_path = temp_path
        
        if saturation is not None:
            img_ops.adjust_saturation(current_path, output_path, saturation)
        else:
            # Copy to output
            import shutil
            shutil.copy(current_path, output_path)
        
        # Cleanup temp files
        for tp in temp_paths:
            cleanup_file(tp)
        if current_path != input_path:
            cleanup_file(current_path)
        
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


@router.post("/blur", response_model=FileResponseModel)
async def blur_image(
    file: UploadFile = File(...),
    radius: int = Form(5)
):
    """Apply blur effect to image"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "blur")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "blurred", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.apply_blur(input_path, output_path, radius)
        
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


@router.post("/sharpen", response_model=FileResponseModel)
async def sharpen_image(file: UploadFile = File(...)):
    """Apply sharpen effect to image"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "sharpen")
    
    try:
        ext = Path(file.filename or "image.jpg").suffix
        output_filename = generate_filename(file.filename or "sharpened", ext)
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        img_ops.apply_sharpen(input_path, output_path)
        
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


@router.post("/passport-photo", response_model=FileResponseModel)
async def create_passport_photo(
    file: UploadFile = File(...),
    size: PassportPhotoSize = Form(PassportPhotoSize.US),
    background_color: str = Form("#FFFFFF"),
    custom_width_mm: Optional[int] = Form(None),
    custom_height_mm: Optional[int] = Form(None)
):
    """Create passport-sized photo with proper dimensions"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "passport")
    
    try:
        output_filename = generate_filename(file.filename or "passport", ".jpg")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        passport_service.create_passport_photo(
            input_path, output_path,
            size=size.value,
            background_color=background_color,
            custom_width_mm=custom_width_mm,
            custom_height_mm=custom_height_mm
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


@router.post("/passport-photo-sheet", response_model=FileResponseModel)
async def create_passport_photo_sheet(
    file: UploadFile = File(...),
    size: PassportPhotoSize = Form(PassportPhotoSize.US),
    background_color: str = Form("#FFFFFF"),
    copies: int = Form(6),
    paper_size: str = Form("4x6")
):
    """Create a sheet with multiple passport photos for printing"""
    validate_image_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "passport-sheet")
    
    try:
        output_filename = generate_filename(file.filename or "passport_sheet", ".jpg")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        passport_service.create_passport_photo_sheet(
            input_path, output_path,
            size=size.value,
            background_color=background_color,
            copies=copies,
            paper_size=paper_size
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


@router.post("/info")
async def get_image_info(file: UploadFile = File(...)):
    """Get image metadata"""
    validate_image_file(file)
    
    input_path = await save_upload_file(file, "info")
    
    try:
        info = img_ops.get_image_info(input_path)
        return {"success": True, "info": info}
    finally:
        cleanup_file(input_path)
