"""
PDF Operations Services
Handles merge, split, compress, protect, watermark, etc.
"""
import io
from pathlib import Path
from typing import Optional, List, Tuple
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import Color
import pikepdf


def merge_pdfs(pdf_paths: List[str], output_path: str) -> str:
    """
    Merge multiple PDFs into one
    
    Args:
        pdf_paths: List of PDF file paths to merge
        output_path: Output merged PDF path
    
    Returns:
        Path to merged PDF
    """
    writer = PdfWriter()
    
    for pdf_path in pdf_paths:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def split_pdf(
    pdf_path: str, 
    output_dir: str,
    mode: str = "all",
    start_page: Optional[int] = None,
    end_page: Optional[int] = None,
    pages: Optional[List[int]] = None
) -> List[str]:
    """
    Split PDF into multiple files
    
    Args:
        pdf_path: Path to input PDF
        output_dir: Directory for output files
        mode: "all" (each page), "range" (page range), "extract" (specific pages)
        start_page: Start page for range mode (1-indexed)
        end_page: End page for range mode (1-indexed)
        pages: List of page numbers for extract mode (1-indexed)
    
    Returns:
        List of output PDF paths
    """
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    output_paths = []
    base_name = Path(pdf_path).stem
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    if mode == "all":
        # Split each page into separate PDF
        for i in range(total_pages):
            writer = PdfWriter()
            writer.add_page(reader.pages[i])
            
            output_path = f"{output_dir}/{base_name}_page_{i+1}.pdf"
            with open(output_path, 'wb') as f:
                writer.write(f)
            output_paths.append(output_path)
    
    elif mode == "range" and start_page and end_page:
        # Extract page range
        writer = PdfWriter()
        for i in range(start_page - 1, min(end_page, total_pages)):
            writer.add_page(reader.pages[i])
        
        output_path = f"{output_dir}/{base_name}_pages_{start_page}-{end_page}.pdf"
        with open(output_path, 'wb') as f:
            writer.write(f)
        output_paths.append(output_path)
    
    elif mode == "extract" and pages:
        # Extract specific pages
        writer = PdfWriter()
        for page_num in pages:
            if 1 <= page_num <= total_pages:
                writer.add_page(reader.pages[page_num - 1])
        
        pages_str = "_".join(map(str, pages[:5]))
        if len(pages) > 5:
            pages_str += "_etc"
        output_path = f"{output_dir}/{base_name}_extracted_{pages_str}.pdf"
        with open(output_path, 'wb') as f:
            writer.write(f)
        output_paths.append(output_path)
    
    return output_paths


def compress_pdf(pdf_path: str, output_path: str, level: str = "medium") -> Tuple[str, int, int]:
    """
    Compress PDF to reduce file size
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path for compressed PDF
        level: Compression level (low, medium, high)
    
    Returns:
        Tuple of (output_path, original_size, compressed_size)
    """
    original_size = Path(pdf_path).stat().st_size
    
    # Use pikepdf for compression
    with pikepdf.open(pdf_path) as pdf:
        # Set compression options based on level
        if level == "high":
            # Maximum compression
            pdf.save(output_path, 
                    compress_streams=True,
                    object_stream_mode=pikepdf.ObjectStreamMode.generate,
                    recompress_flate=True)
        elif level == "medium":
            pdf.save(output_path,
                    compress_streams=True,
                    object_stream_mode=pikepdf.ObjectStreamMode.generate)
        else:  # low
            pdf.save(output_path, compress_streams=True)
    
    compressed_size = Path(output_path).stat().st_size
    return output_path, original_size, compressed_size


def protect_pdf(
    pdf_path: str, 
    output_path: str,
    user_password: str,
    owner_password: Optional[str] = None,
    allow_printing: bool = True,
    allow_copying: bool = False
) -> str:
    """
    Add password protection to PDF
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path for protected PDF
        user_password: Password required to open PDF
        owner_password: Owner password for full access
        allow_printing: Allow printing
        allow_copying: Allow copying text
    
    Returns:
        Path to protected PDF
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        writer.add_page(page)
    
    # Set permissions
    permissions = 0
    if allow_printing:
        permissions |= 4  # Printing permission
    if allow_copying:
        permissions |= 16  # Copy permission
    
    writer.encrypt(
        user_password=user_password,
        owner_password=owner_password or user_password,
        permissions_flag=permissions
    )
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def unlock_pdf(pdf_path: str, output_path: str, password: str) -> str:
    """
    Remove password from PDF
    
    Args:
        pdf_path: Path to protected PDF
        output_path: Output path for unlocked PDF
        password: Password to unlock PDF
    
    Returns:
        Path to unlocked PDF
    """
    reader = PdfReader(pdf_path)
    
    if reader.is_encrypted:
        reader.decrypt(password)
    
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def rotate_pdf(
    pdf_path: str, 
    output_path: str, 
    angle: int,
    pages: Optional[List[int]] = None
) -> str:
    """
    Rotate PDF pages
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path for rotated PDF
        angle: Rotation angle (90, 180, 270)
        pages: Specific pages to rotate (1-indexed), None for all
    
    Returns:
        Path to rotated PDF
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    for i, page in enumerate(reader.pages):
        if pages is None or (i + 1) in pages:
            page.rotate(angle)
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def add_watermark(
    pdf_path: str,
    output_path: str,
    text: str,
    position: str = "diagonal",
    font_size: int = 48,
    opacity: float = 0.3,
    color: str = "#808080",
    rotation: int = 45
) -> str:
    """
    Add text watermark to PDF
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path for watermarked PDF
        text: Watermark text
        position: Position (center, diagonal, etc.)
        font_size: Font size
        opacity: Opacity (0-1)
        color: Hex color
        rotation: Rotation angle
    
    Returns:
        Path to watermarked PDF
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    # Parse color
    color = color.lstrip('#')
    r = int(color[0:2], 16) / 255
    g = int(color[2:4], 16) / 255
    b = int(color[4:6], 16) / 255
    
    for page in reader.pages:
        # Get page dimensions
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        
        # Create watermark overlay
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        # Set transparency
        c.setFillColorRGB(r, g, b, alpha=opacity)
        c.setFont("Helvetica-Bold", font_size)
        
        # Calculate position
        if position == "diagonal":
            c.saveState()
            c.translate(page_width / 2, page_height / 2)
            c.rotate(rotation)
            c.drawCentredString(0, 0, text)
            c.restoreState()
        elif position == "center":
            c.drawCentredString(page_width / 2, page_height / 2, text)
        elif position == "top-left":
            c.drawString(50, page_height - 50, text)
        elif position == "top-right":
            c.drawRightString(page_width - 50, page_height - 50, text)
        elif position == "bottom-left":
            c.drawString(50, 50, text)
        elif position == "bottom-right":
            c.drawRightString(page_width - 50, 50, text)
        
        c.save()
        
        # Create watermark PDF
        packet.seek(0)
        watermark_pdf = PdfReader(packet)
        watermark_page = watermark_pdf.pages[0]
        
        # Merge watermark with original page
        page.merge_page(watermark_page)
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def add_page_numbers(
    pdf_path: str,
    output_path: str,
    position: str = "bottom-center",
    start_number: int = 1,
    font_size: int = 12,
    format_str: str = "{page}"
) -> str:
    """
    Add page numbers to PDF
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path
        position: Position for page numbers
        start_number: Starting page number
        font_size: Font size
        format_str: Format string ({page}, {total})
    
    Returns:
        Path to PDF with page numbers
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    total_pages = len(reader.pages)
    
    for i, page in enumerate(reader.pages):
        page_num = start_number + i
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        
        # Create page number overlay
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=(page_width, page_height))
        c.setFont("Helvetica", font_size)
        
        # Format page number
        text = format_str.replace("{page}", str(page_num)).replace("{total}", str(total_pages))
        
        # Position
        margin = 36  # 0.5 inch
        if position == "bottom-center":
            c.drawCentredString(page_width / 2, margin, text)
        elif position == "bottom-left":
            c.drawString(margin, margin, text)
        elif position == "bottom-right":
            c.drawRightString(page_width - margin, margin, text)
        elif position == "top-center":
            c.drawCentredString(page_width / 2, page_height - margin, text)
        elif position == "top-left":
            c.drawString(margin, page_height - margin, text)
        elif position == "top-right":
            c.drawRightString(page_width - margin, page_height - margin, text)
        
        c.save()
        
        packet.seek(0)
        overlay_pdf = PdfReader(packet)
        page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def reorder_pages(pdf_path: str, output_path: str, new_order: List[int]) -> str:
    """
    Reorder PDF pages
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path
        new_order: New page order (1-indexed)
    
    Returns:
        Path to reordered PDF
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    for page_num in new_order:
        if 1 <= page_num <= len(reader.pages):
            writer.add_page(reader.pages[page_num - 1])
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def crop_pdf(
    pdf_path: str,
    output_path: str,
    left: float,
    bottom: float,
    right: float,
    top: float,
    pages: Optional[List[int]] = None
) -> str:
    """
    Crop PDF pages
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path
        left, bottom, right, top: Crop box coordinates
        pages: Pages to crop (1-indexed), None for all
    
    Returns:
        Path to cropped PDF
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    for i, page in enumerate(reader.pages):
        if pages is None or (i + 1) in pages:
            page.cropbox.lower_left = (left, bottom)
            page.cropbox.upper_right = (right, top)
        writer.add_page(page)
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def pdf_to_pdfa(pdf_path: str, output_path: str) -> str:
    """
    Convert PDF to PDF/A format
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output path
    
    Returns:
        Path to PDF/A file
    """
    with pikepdf.open(pdf_path) as pdf:
        # Add PDF/A metadata
        with pdf.open_metadata() as meta:
            meta['dc:format'] = 'application/pdf'
            meta['pdf:Producer'] = 'AdobeWork Backend'
        
        pdf.save(output_path, linearize=True)
    
    return output_path


def get_pdf_info(pdf_path: str) -> dict:
    """
    Get PDF metadata and info
    
    Args:
        pdf_path: Path to PDF
    
    Returns:
        Dictionary with PDF info
    """
    reader = PdfReader(pdf_path)
    
    info = {
        "num_pages": len(reader.pages),
        "is_encrypted": reader.is_encrypted,
        "metadata": {}
    }
    
    if reader.metadata:
        info["metadata"] = {
            "title": reader.metadata.get("/Title", ""),
            "author": reader.metadata.get("/Author", ""),
            "subject": reader.metadata.get("/Subject", ""),
            "creator": reader.metadata.get("/Creator", ""),
        }
    
    # Get first page dimensions
    if reader.pages:
        first_page = reader.pages[0]
        info["page_width"] = float(first_page.mediabox.width)
        info["page_height"] = float(first_page.mediabox.height)
    
    return info
