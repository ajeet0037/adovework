"""
PDF API Endpoints
All PDF-related operations
"""
import time
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Query
from fastapi.responses import FileResponse

from app.config import get_settings
from app.models.schemas import (
    FileResponse as FileResponseModel,
    ErrorResponse,
    PDFSplitMode,
    PDFCompressLevel,
    PDFWatermarkPosition,
    PageNumberPosition,
)
from app.utils.file import (
    save_upload_file,
    save_upload_files,
    cleanup_file,
    cleanup_files,
    validate_pdf_file,
    validate_document_file,
    generate_filename,
    get_mime_type,
)
from app.services.pdf import convert as pdf_convert
from app.services.pdf import operations as pdf_ops

settings = get_settings()
router = APIRouter(prefix="/pdf", tags=["PDF"])


# ============ PDF Conversions ============

@router.post("/to-word", response_model=FileResponseModel)
async def pdf_to_word(
    file: UploadFile = File(...),
    mode: str = Form("auto", description="Conversion mode: auto, hybrid, image, text, ocr")
):
    """
    Convert PDF to Word document with smart auto-detection.
    
    Modes:
    - **auto** (default): Automatically detects the best conversion method based on PDF analysis.
      Uses 'text' for simple PDFs, 'hybrid' for complex PDFs (like Aadhaar), 'ocr' for scanned docs.
    
    - **hybrid**: Image + extracted text. Best for complex documents - preserves layout perfectly
      AND includes copyable text below each page.
    
    - **image**: Image only. Perfect visual layout, but text is not copyable.
    
    - **text**: Editable text extraction. May break layout for complex documents.
    
    - **ocr**: Force OCR. For scanned documents with no selectable text.
    """
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pdf")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".docx")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.pdf_to_word(input_path, output_path, mode=mode)
        
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


@router.post("/to-excel", response_model=FileResponseModel)
async def pdf_to_excel(file: UploadFile = File(...)):
    """Extract tables from PDF and convert to Excel"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pdf")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".xlsx")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.pdf_to_excel(input_path, output_path)
        
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


@router.post("/to-ppt", response_model=FileResponseModel)
async def pdf_to_ppt(file: UploadFile = File(...)):
    """Convert PDF to PowerPoint presentation"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pdf")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".pptx")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.pdf_to_pptx(input_path, output_path)
        
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


@router.post("/from-word", response_model=FileResponseModel)
async def word_to_pdf(file: UploadFile = File(...)):
    """Convert Word document to PDF"""
    validate_document_file(file, [".docx", ".doc"])
    
    start_time = time.time()
    input_path = await save_upload_file(file, "word")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.word_to_pdf(input_path, output_path)
        
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


@router.post("/from-excel", response_model=FileResponseModel)
async def excel_to_pdf(file: UploadFile = File(...)):
    """Convert Excel to PDF"""
    validate_document_file(file, [".xlsx", ".xls"])
    
    start_time = time.time()
    input_path = await save_upload_file(file, "excel")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.excel_to_pdf(input_path, output_path)
        
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


@router.post("/from-ppt", response_model=FileResponseModel)
async def ppt_to_pdf(file: UploadFile = File(...)):
    """Convert PowerPoint to PDF"""
    validate_document_file(file, [".pptx", ".ppt"])
    
    start_time = time.time()
    input_path = await save_upload_file(file, "ppt")
    
    try:
        output_filename = generate_filename(file.filename or "document", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.pptx_to_pdf(input_path, output_path)
        
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


@router.post("/from-images", response_model=FileResponseModel)
async def images_to_pdf(files: List[UploadFile] = File(...)):
    """Convert one or more images to PDF"""
    start_time = time.time()
    input_paths = await save_upload_files(files, "images")
    
    try:
        output_filename = generate_filename("images", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_convert.image_to_pdf(input_paths, output_path)
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return FileResponseModel(
            file_url=f"/downloads/{output_filename}",
            filename=output_filename,
            file_size=file_size,
            processing_time=processing_time
        )
    finally:
        cleanup_files(input_paths)


# ============ PDF Operations ============

@router.post("/merge", response_model=FileResponseModel)
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merge multiple PDFs into one"""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files required")
    
    for file in files:
        validate_pdf_file(file)
    
    start_time = time.time()
    input_paths = await save_upload_files(files, "merge")
    
    try:
        output_filename = generate_filename("merged", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.merge_pdfs(input_paths, output_path)
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return FileResponseModel(
            file_url=f"/downloads/{output_filename}",
            filename=output_filename,
            file_size=file_size,
            processing_time=processing_time
        )
    finally:
        cleanup_files(input_paths)


@router.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    mode: PDFSplitMode = Form(PDFSplitMode.ALL),
    start_page: Optional[int] = Form(None),
    end_page: Optional[int] = Form(None),
    pages: Optional[str] = Form(None)  # Comma-separated page numbers
):
    """Split PDF into multiple files"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "split")
    
    try:
        output_dir = f"{settings.DOWNLOAD_DIR}/split_{int(time.time())}"
        os.makedirs(output_dir, exist_ok=True)
        
        # Parse pages if provided
        page_list = None
        if pages:
            page_list = [int(p.strip()) for p in pages.split(",")]
        
        output_paths = pdf_ops.split_pdf(
            input_path,
            output_dir,
            mode=mode.value,
            start_page=start_page,
            end_page=end_page,
            pages=page_list
        )
        
        processing_time = time.time() - start_time
        
        # Return list of files
        files_info = []
        for path in output_paths:
            filename = Path(path).name
            files_info.append({
                "file_url": f"/downloads/split_{int(time.time())}/{filename}",
                "filename": filename,
                "file_size": Path(path).stat().st_size
            })
        
        return {
            "success": True,
            "files": files_info,
            "processing_time": processing_time
        }
    finally:
        cleanup_file(input_path)


@router.post("/compress", response_model=FileResponseModel)
async def compress_pdf(
    file: UploadFile = File(...),
    level: PDFCompressLevel = Form(PDFCompressLevel.MEDIUM)
):
    """Compress PDF to reduce file size"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "compress")
    
    try:
        output_filename = generate_filename(file.filename or "compressed", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        _, original_size, compressed_size = pdf_ops.compress_pdf(
            input_path, output_path, level=level.value
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


@router.post("/protect", response_model=FileResponseModel)
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
    owner_password: Optional[str] = Form(None),
    allow_printing: bool = Form(True),
    allow_copying: bool = Form(False)
):
    """Add password protection to PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "protect")
    
    try:
        output_filename = generate_filename(file.filename or "protected", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.protect_pdf(
            input_path, output_path,
            user_password=password,
            owner_password=owner_password,
            allow_printing=allow_printing,
            allow_copying=allow_copying
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


@router.post("/unlock", response_model=FileResponseModel)
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    """Remove password from PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "unlock")
    
    try:
        output_filename = generate_filename(file.filename or "unlocked", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.unlock_pdf(input_path, output_path, password)
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return FileResponseModel(
            file_url=f"/downloads/{output_filename}",
            filename=output_filename,
            file_size=file_size,
            processing_time=processing_time
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid password or cannot unlock PDF")
    finally:
        cleanup_file(input_path)


@router.post("/rotate", response_model=FileResponseModel)
async def rotate_pdf(
    file: UploadFile = File(...),
    angle: int = Form(..., description="Rotation angle: 90, 180, or 270"),
    pages: Optional[str] = Form(None, description="Comma-separated page numbers")
):
    """Rotate PDF pages"""
    validate_pdf_file(file)
    
    if angle not in [90, 180, 270]:
        raise HTTPException(status_code=400, detail="Angle must be 90, 180, or 270")
    
    start_time = time.time()
    input_path = await save_upload_file(file, "rotate")
    
    try:
        output_filename = generate_filename(file.filename or "rotated", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        page_list = None
        if pages:
            page_list = [int(p.strip()) for p in pages.split(",")]
        
        pdf_ops.rotate_pdf(input_path, output_path, angle, page_list)
        
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


@router.post("/watermark", response_model=FileResponseModel)
async def watermark_pdf(
    file: UploadFile = File(...),
    text: str = Form(...),
    position: PDFWatermarkPosition = Form(PDFWatermarkPosition.DIAGONAL),
    font_size: int = Form(48),
    opacity: float = Form(0.3),
    color: str = Form("#808080"),
    rotation: int = Form(45)
):
    """Add text watermark to PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "watermark")
    
    try:
        output_filename = generate_filename(file.filename or "watermarked", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.add_watermark(
            input_path, output_path,
            text=text,
            position=position.value,
            font_size=font_size,
            opacity=opacity,
            color=color,
            rotation=rotation
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


@router.post("/page-numbers", response_model=FileResponseModel)
async def add_page_numbers(
    file: UploadFile = File(...),
    position: PageNumberPosition = Form(PageNumberPosition.BOTTOM_CENTER),
    start_number: int = Form(1),
    font_size: int = Form(12),
    format_str: str = Form("{page}")
):
    """Add page numbers to PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pagenumbers")
    
    try:
        output_filename = generate_filename(file.filename or "numbered", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.add_page_numbers(
            input_path, output_path,
            position=position.value,
            start_number=start_number,
            font_size=font_size,
            format_str=format_str
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


@router.post("/reorder", response_model=FileResponseModel)
async def reorder_pdf(
    file: UploadFile = File(...),
    order: str = Form(..., description="New page order, comma-separated (e.g., '3,1,2,4')")
):
    """Reorder PDF pages"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "reorder")
    
    try:
        output_filename = generate_filename(file.filename or "reordered", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        new_order = [int(p.strip()) for p in order.split(",")]
        pdf_ops.reorder_pages(input_path, output_path, new_order)
        
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


@router.post("/to-pdfa", response_model=FileResponseModel)
async def pdf_to_pdfa(file: UploadFile = File(...)):
    """Convert PDF to PDF/A format"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "pdfa")
    
    try:
        output_filename = generate_filename(file.filename or "pdfa", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        pdf_ops.pdf_to_pdfa(input_path, output_path)
        
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
async def get_pdf_info(file: UploadFile = File(...)):
    """Get PDF metadata and info"""
    validate_pdf_file(file)
    
    input_path = await save_upload_file(file, "info")
    
    try:
        info = pdf_ops.get_pdf_info(input_path)
        return {"success": True, "info": info}
    finally:
        cleanup_file(input_path)


# ============ Advanced PDF Editor ============

from app.services.pdf import editor as pdf_editor
import json


@router.post("/structure")
async def get_pdf_structure(file: UploadFile = File(...)):
    """
    Get detailed PDF structure including fonts, text, and formatting
    Returns text with exact font names, sizes, colors for reconstruction
    """
    validate_pdf_file(file)
    
    input_path = await save_upload_file(file, "structure")
    
    try:
        structure = pdf_editor.get_pdf_structure(input_path)
        return {"success": True, "structure": structure}
    finally:
        cleanup_file(input_path)


@router.post("/extract-text")
async def extract_text_with_formatting(
    file: UploadFile = File(...),
    page: int = Form(0, description="Page number (0-indexed)")
):
    """
    Extract text with full formatting details
    Returns each text span with font name, size, color, position
    """
    validate_pdf_file(file)
    
    input_path = await save_upload_file(file, "extract")
    
    try:
        with pdf_editor.PDFEditor(input_path) as editor:
            text_items = editor.extract_text_with_formatting(page)
            fonts = editor.get_fonts(page)
            width, height = editor.get_page_size(page)
            
        return {
            "success": True,
            "page": page,
            "page_width": width,
            "page_height": height,
            "fonts_used": fonts,
            "text_items": text_items
        }
    finally:
        cleanup_file(input_path)


@router.post("/add-text", response_model=FileResponseModel)
async def add_text_to_pdf(
    file: UploadFile = File(...),
    page: int = Form(0, description="Page number (0-indexed)"),
    text: str = Form(...),
    x: float = Form(..., description="X position in points"),
    y: float = Form(..., description="Y position in points"),
    font_name: str = Form("helv", description="Font: helv, tiro, cour"),
    font_size: float = Form(12),
    color: str = Form("#000000", description="Hex color"),
    bold: bool = Form(False),
    italic: bool = Form(False)
):
    """Add text to PDF at specified position with formatting"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "addtext")
    
    try:
        output_filename = generate_filename(file.filename or "edited", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        # Parse color
        color_hex = color.lstrip('#')
        r = int(color_hex[0:2], 16) / 255
        g = int(color_hex[2:4], 16) / 255
        b = int(color_hex[4:6], 16) / 255
        
        with pdf_editor.PDFEditor(input_path) as editor:
            editor.add_text(
                page, text, x, y,
                font_name=font_name,
                font_size=font_size,
                color=(r, g, b),
                bold=bold,
                italic=italic
            )
            editor.save(output_path)
        
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


@router.post("/replace-text", response_model=FileResponseModel)
async def replace_text_in_pdf(
    file: UploadFile = File(...),
    old_text: str = Form(...),
    new_text: str = Form(...),
    pages: Optional[str] = Form(None, description="Comma-separated page numbers (0-indexed)")
):
    """Find and replace text while preserving formatting"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "replace")
    
    try:
        output_filename = generate_filename(file.filename or "replaced", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        page_list = None
        if pages:
            page_list = [int(p.strip()) for p in pages.split(",")]
        
        with pdf_editor.PDFEditor(input_path) as editor:
            count = editor.replace_text(old_text, new_text, page_list)
            editor.save(output_path)
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "file_url": f"/downloads/{output_filename}",
            "filename": output_filename,
            "file_size": file_size,
            "replacements_made": count,
            "processing_time": processing_time
        }
    finally:
        cleanup_file(input_path)


@router.post("/add-annotation", response_model=FileResponseModel)
async def add_annotation(
    file: UploadFile = File(...),
    page: int = Form(0),
    annotation_type: str = Form(..., description="highlight, underline, strikeout, rectangle, circle, line, arrow, note, freetext"),
    rect: Optional[str] = Form(None, description="Rect as 'x1,y1,x2,y2'"),
    point: Optional[str] = Form(None, description="Point as 'x,y'"),
    start: Optional[str] = Form(None, description="Start point as 'x,y'"),
    end: Optional[str] = Form(None, description="End point as 'x,y'"),
    center: Optional[str] = Form(None, description="Center as 'x,y'"),
    radius: Optional[float] = Form(None),
    color: str = Form("#FF0000"),
    text: Optional[str] = Form(None),
    width: float = Form(1)
):
    """Add annotation to PDF (highlight, shapes, notes, etc.)"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "annotate")
    
    try:
        output_filename = generate_filename(file.filename or "annotated", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        # Parse color
        color_hex = color.lstrip('#')
        r = int(color_hex[0:2], 16) / 255
        g = int(color_hex[2:4], 16) / 255
        b = int(color_hex[4:6], 16) / 255
        color_tuple = (r, g, b)
        
        with pdf_editor.PDFEditor(input_path) as editor:
            if annotation_type == "highlight" and rect:
                coords = [float(x) for x in rect.split(",")]
                editor.add_highlight(page, tuple(coords), color_tuple)
            
            elif annotation_type == "underline" and rect:
                coords = [float(x) for x in rect.split(",")]
                editor.add_underline(page, tuple(coords))
            
            elif annotation_type == "strikeout" and rect:
                coords = [float(x) for x in rect.split(",")]
                editor.add_strikeout(page, tuple(coords))
            
            elif annotation_type == "rectangle" and rect:
                coords = [float(x) for x in rect.split(",")]
                editor.add_rectangle(page, tuple(coords), color_tuple, width=width)
            
            elif annotation_type == "circle" and center and radius:
                c = [float(x) for x in center.split(",")]
                editor.add_circle(page, tuple(c), radius, color_tuple, width=width)
            
            elif annotation_type == "line" and start and end:
                s = [float(x) for x in start.split(",")]
                e = [float(x) for x in end.split(",")]
                editor.add_line(page, tuple(s), tuple(e), color_tuple, width)
            
            elif annotation_type == "arrow" and start and end:
                s = [float(x) for x in start.split(",")]
                e = [float(x) for x in end.split(",")]
                editor.add_arrow(page, tuple(s), tuple(e), color_tuple, width)
            
            elif annotation_type == "note" and point and text:
                p = [float(x) for x in point.split(",")]
                editor.add_sticky_note(page, tuple(p), text)
            
            elif annotation_type == "freetext" and rect and text:
                coords = [float(x) for x in rect.split(",")]
                editor.add_free_text(page, tuple(coords), text)
            
            else:
                raise HTTPException(status_code=400, detail="Invalid annotation parameters")
            
            editor.save(output_path)
        
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


@router.post("/add-image", response_model=FileResponseModel)
async def add_image_to_pdf(
    file: UploadFile = File(...),
    image: UploadFile = File(...),
    page: int = Form(0),
    x: float = Form(...),
    y: float = Form(...),
    width: float = Form(...),
    height: float = Form(...)
):
    """Add image to PDF at specified position"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "addimg")
    image_path = await save_upload_file(image, "addimg")
    
    try:
        output_filename = generate_filename(file.filename or "edited", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        with pdf_editor.PDFEditor(input_path) as editor:
            editor.add_image(page, image_path, (x, y, x + width, y + height))
            editor.save(output_path)
        
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
        cleanup_file(image_path)


@router.post("/redact", response_model=FileResponseModel)
async def redact_text(
    file: UploadFile = File(...),
    search_text: str = Form(..., description="Text to permanently remove"),
    pages: Optional[str] = Form(None, description="Comma-separated page numbers (0-indexed)")
):
    """Permanently remove (redact) text from PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "redact")
    
    try:
        output_filename = generate_filename(file.filename or "redacted", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        page_list = None
        if pages:
            page_list = [int(p.strip()) for p in pages.split(",")]
        
        with pdf_editor.PDFEditor(input_path) as editor:
            count = editor.redact_text(search_text, page_list)
            editor.save(output_path)
        
        file_size = Path(output_path).stat().st_size
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "file_url": f"/downloads/{output_filename}",
            "filename": output_filename,
            "file_size": file_size,
            "redactions_made": count,
            "processing_time": processing_time
        }
    finally:
        cleanup_file(input_path)


@router.post("/extract-images")
async def extract_images_from_pdf(file: UploadFile = File(...)):
    """Extract all images from PDF"""
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "extract-img")
    
    try:
        output_dir = f"{settings.DOWNLOAD_DIR}/images_{int(time.time())}"
        
        with pdf_editor.PDFEditor(input_path) as editor:
            image_paths = editor.extract_images(output_dir)
        
        processing_time = time.time() - start_time
        
        images_info = []
        for path in image_paths:
            filename = Path(path).name
            images_info.append({
                "file_url": f"/downloads/images_{int(time.time())}/{filename}",
                "filename": filename,
                "file_size": Path(path).stat().st_size
            })
        
        return {
            "success": True,
            "images": images_info,
            "total_images": len(images_info),
            "processing_time": processing_time
        }
    finally:
        cleanup_file(input_path)


@router.post("/edit-batch", response_model=FileResponseModel)
async def edit_pdf_batch(
    file: UploadFile = File(...),
    annotations: str = Form(..., description="JSON array of annotations")
):
    """
    Apply multiple edits/annotations to PDF in one request
    
    Annotation format:
    [
        {"type": "text", "page": 0, "text": "Hello", "x": 100, "y": 700, "size": 12},
        {"type": "highlight", "page": 0, "rect": [100, 680, 200, 700]},
        {"type": "rectangle", "page": 0, "rect": [50, 50, 100, 100], "color": [1, 0, 0]}
    ]
    """
    validate_pdf_file(file)
    
    start_time = time.time()
    input_path = await save_upload_file(file, "batch")
    
    try:
        output_filename = generate_filename(file.filename or "edited", ".pdf")
        output_path = f"{settings.DOWNLOAD_DIR}/{output_filename}"
        
        # Parse annotations JSON
        try:
            annotations_list = json.loads(annotations)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid annotations JSON")
        
        pdf_editor.edit_pdf_with_annotations(input_path, output_path, annotations_list)
        
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
