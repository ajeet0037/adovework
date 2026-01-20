"""
OCR Text Extraction Service
Extract text from images and PDFs using pytesseract
"""
from pathlib import Path
from typing import Optional, List, Tuple
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import tempfile
import os


def ocr_image(
    image_path: str,
    language: str = "eng",
    output_format: str = "text"
) -> Tuple[str, Optional[float]]:
    """
    Extract text from image using OCR
    
    Args:
        image_path: Path to input image
        language: OCR language (eng, hin, spa, fra, deu, etc.)
        output_format: Output format (text, hocr)
    
    Returns:
        Tuple of (extracted_text, confidence)
    """
    img = Image.open(image_path)
    
    # Get OCR data with confidence
    data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)
    
    # Calculate average confidence
    confidences = [int(c) for c in data['conf'] if int(c) > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    # Get text based on format
    if output_format == "hocr":
        text = pytesseract.image_to_pdf_or_hocr(img, lang=language, extension='hocr').decode('utf-8')
    else:
        text = pytesseract.image_to_string(img, lang=language)
    
    return text.strip(), avg_confidence


def ocr_image_to_searchable_pdf(
    image_path: str,
    output_path: str,
    language: str = "eng"
) -> str:
    """
    Convert image to searchable PDF with OCR layer
    
    Args:
        image_path: Path to input image
        output_path: Output PDF path
        language: OCR language
    
    Returns:
        Path to searchable PDF
    """
    img = Image.open(image_path)
    pdf_bytes = pytesseract.image_to_pdf_or_hocr(img, lang=language, extension='pdf')
    
    with open(output_path, 'wb') as f:
        f.write(pdf_bytes)
    
    return output_path


def ocr_pdf(
    pdf_path: str,
    language: str = "eng",
    dpi: int = 300
) -> Tuple[str, Optional[float]]:
    """
    Extract text from PDF using OCR
    Converts PDF pages to images and applies OCR
    
    Args:
        pdf_path: Path to input PDF
        language: OCR language
        dpi: DPI for PDF to image conversion
    
    Returns:
        Tuple of (extracted_text, average_confidence)
    """
    # Convert PDF to images
    images = convert_from_path(pdf_path, dpi=dpi)
    
    all_text = []
    all_confidences = []
    
    for i, img in enumerate(images):
        # Get OCR data
        data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)
        
        # Get confidences
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        all_confidences.extend(confidences)
        
        # Get text
        text = pytesseract.image_to_string(img, lang=language)
        all_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
    
    combined_text = "\n\n".join(all_text)
    avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0
    
    return combined_text, avg_confidence


def ocr_pdf_to_searchable(
    pdf_path: str,
    output_path: str,
    language: str = "eng",
    dpi: int = 300
) -> str:
    """
    Convert scanned PDF to searchable PDF with OCR layer
    
    Args:
        pdf_path: Path to input PDF
        output_path: Output PDF path
        language: OCR language
        dpi: DPI for conversion
    
    Returns:
        Path to searchable PDF
    """
    from PyPDF2 import PdfWriter, PdfReader
    import io
    
    # Convert PDF to images
    images = convert_from_path(pdf_path, dpi=dpi)
    
    writer = PdfWriter()
    
    for img in images:
        # Create searchable PDF for this page
        pdf_bytes = pytesseract.image_to_pdf_or_hocr(img, lang=language, extension='pdf')
        
        # Read the single-page PDF
        reader = PdfReader(io.BytesIO(pdf_bytes))
        writer.add_page(reader.pages[0])
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    return output_path


def get_available_languages() -> List[str]:
    """
    Get list of available Tesseract languages
    
    Returns:
        List of language codes
    """
    try:
        return pytesseract.get_languages()
    except Exception:
        return ["eng"]  # Default to English if can't detect


def extract_tables_with_ocr(
    image_path: str,
    language: str = "eng"
) -> List[List[List[str]]]:
    """
    Attempt to extract tables from image using OCR
    
    Args:
        image_path: Path to input image
        language: OCR language
    
    Returns:
        List of tables, each table is a list of rows, each row is a list of cells
    """
    img = Image.open(image_path)
    
    # Get detailed OCR data
    data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)
    
    # Group words by line number
    lines = {}
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        if text:
            line_num = data['line_num'][i]
            if line_num not in lines:
                lines[line_num] = []
            lines[line_num].append({
                'text': text,
                'left': data['left'][i],
                'top': data['top'][i],
                'width': data['width'][i],
            })
    
    # Convert to table format (simple implementation)
    table = []
    for line_num in sorted(lines.keys()):
        words = sorted(lines[line_num], key=lambda x: x['left'])
        row = [w['text'] for w in words]
        table.append(row)
    
    return [table] if table else []
