"""
Advanced PDF Editor Service
Professional-grade PDF editing with font preservation
Uses PyMuPDF (fitz) for high-quality operations
"""
import fitz  # PyMuPDF
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import io
import os


class PDFEditor:
    """Professional PDF Editor with advanced features"""
    
    def __init__(self, pdf_path: str):
        """Load PDF for editing"""
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
    
    def close(self):
        """Close the document"""
        self.doc.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def get_page_count(self) -> int:
        """Get number of pages"""
        return len(self.doc)
    
    def get_page_size(self, page_num: int = 0) -> Tuple[float, float]:
        """Get page dimensions in points"""
        page = self.doc[page_num]
        rect = page.rect
        return rect.width, rect.height
    
    def get_fonts(self, page_num: int = 0) -> List[Dict]:
        """Get fonts used on a page"""
        page = self.doc[page_num]
        fonts = []
        for font in page.get_fonts():
            fonts.append({
                "xref": font[0],
                "name": font[3],
                "type": font[4],
                "encoding": font[5] if len(font) > 5 else None
            })
        return fonts
    
    def extract_text_with_formatting(self, page_num: int = 0) -> List[Dict]:
        """
        Extract text with full formatting information
        Preserves font, size, color, and position
        """
        page = self.doc[page_num]
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        
        text_items = []
        for block in blocks:
            if block["type"] == 0:  # Text block
                for line in block["lines"]:
                    for span in line["spans"]:
                        text_items.append({
                            "text": span["text"],
                            "font": span["font"],
                            "size": span["size"],
                            "color": span["color"],
                            "flags": span["flags"],  # bold, italic, etc.
                            "origin": span["origin"],
                            "bbox": span["bbox"],
                            "is_bold": bool(span["flags"] & 2**4),
                            "is_italic": bool(span["flags"] & 2**1),
                        })
        return text_items
    
    def add_text(
        self,
        page_num: int,
        text: str,
        x: float,
        y: float,
        font_name: str = "helv",
        font_size: float = 12,
        color: Tuple[float, float, float] = (0, 0, 0),
        bold: bool = False,
        italic: bool = False
    ):
        """
        Add text to a page with precise positioning
        
        Args:
            page_num: Page number (0-indexed)
            text: Text to add
            x, y: Position in points
            font_name: Font name (helv, tiro, cour, symb, zadb)
            font_size: Font size in points
            color: RGB color tuple (0-1 range)
            bold: Bold text
            italic: Italic text
        """
        page = self.doc[page_num]
        
        # Build font variant name
        if bold and italic:
            font_suffix = "bi"
        elif bold:
            font_suffix = "bo"
        elif italic:
            font_suffix = "it"
        else:
            font_suffix = ""
        
        actual_font = font_name + font_suffix if font_suffix else font_name
        
        # Insert text
        page.insert_text(
            point=(x, y),
            text=text,
            fontname=actual_font,
            fontsize=font_size,
            color=color
        )
    
    def add_text_box(
        self,
        page_num: int,
        text: str,
        rect: Tuple[float, float, float, float],
        font_name: str = "helv",
        font_size: float = 12,
        color: Tuple[float, float, float] = (0, 0, 0),
        align: int = 0  # 0=left, 1=center, 2=right, 3=justify
    ):
        """Add text within a rectangular area with word wrapping"""
        page = self.doc[page_num]
        rect_obj = fitz.Rect(rect)
        
        page.insert_textbox(
            rect_obj,
            text,
            fontname=font_name,
            fontsize=font_size,
            color=color,
            align=align
        )
    
    def replace_text(
        self,
        old_text: str,
        new_text: str,
        page_nums: Optional[List[int]] = None
    ) -> int:
        """
        Find and replace text while preserving formatting
        
        Returns:
            Number of replacements made
        """
        count = 0
        pages = page_nums if page_nums else range(len(self.doc))
        
        for page_num in pages:
            page = self.doc[page_num]
            text_instances = page.search_for(old_text)
            
            for inst in text_instances:
                # Get the text properties at this location
                blocks = page.get_text("dict")["blocks"]
                font_name = "helv"
                font_size = 12
                color = (0, 0, 0)
                
                # Try to find matching span for formatting
                for block in blocks:
                    if block["type"] == 0:
                        for line in block["lines"]:
                            for span in line["spans"]:
                                if old_text in span["text"]:
                                    font_name = span["font"]
                                    font_size = span["size"]
                                    # Convert color int to RGB
                                    c = span["color"]
                                    color = ((c >> 16) / 255, ((c >> 8) & 0xFF) / 255, (c & 0xFF) / 255)
                                    break
                
                # Redact old text
                page.add_redact_annot(inst)
                page.apply_redactions()
                
                # Add new text at same position
                page.insert_text(
                    point=(inst.x0, inst.y1),
                    text=new_text,
                    fontsize=font_size,
                    color=color
                )
                count += 1
        
        return count
    
    def add_image(
        self,
        page_num: int,
        image_path: str,
        rect: Tuple[float, float, float, float],
        keep_proportion: bool = True
    ):
        """Add image to page"""
        page = self.doc[page_num]
        rect_obj = fitz.Rect(rect)
        page.insert_image(rect_obj, filename=image_path, keep_proportion=keep_proportion)
    
    def add_highlight(
        self,
        page_num: int,
        rect: Tuple[float, float, float, float],
        color: Tuple[float, float, float] = (1, 1, 0)  # Yellow
    ):
        """Add highlight annotation"""
        page = self.doc[page_num]
        annot = page.add_highlight_annot(fitz.Rect(rect))
        annot.set_colors(stroke=color)
        annot.update()
    
    def add_underline(
        self,
        page_num: int,
        rect: Tuple[float, float, float, float]
    ):
        """Add underline annotation"""
        page = self.doc[page_num]
        page.add_underline_annot(fitz.Rect(rect))
    
    def add_strikeout(
        self,
        page_num: int,
        rect: Tuple[float, float, float, float]
    ):
        """Add strikeout annotation"""
        page = self.doc[page_num]
        page.add_strikeout_annot(fitz.Rect(rect))
    
    def add_rectangle(
        self,
        page_num: int,
        rect: Tuple[float, float, float, float],
        color: Tuple[float, float, float] = (1, 0, 0),
        fill: Optional[Tuple[float, float, float]] = None,
        width: float = 1
    ):
        """Add rectangle shape"""
        page = self.doc[page_num]
        shape = page.new_shape()
        shape.draw_rect(fitz.Rect(rect))
        shape.finish(color=color, fill=fill, width=width)
        shape.commit()
    
    def add_circle(
        self,
        page_num: int,
        center: Tuple[float, float],
        radius: float,
        color: Tuple[float, float, float] = (1, 0, 0),
        fill: Optional[Tuple[float, float, float]] = None,
        width: float = 1
    ):
        """Add circle shape"""
        page = self.doc[page_num]
        rect = fitz.Rect(
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius
        )
        shape = page.new_shape()
        shape.draw_circle(center, radius)
        shape.finish(color=color, fill=fill, width=width)
        shape.commit()
    
    def add_line(
        self,
        page_num: int,
        start: Tuple[float, float],
        end: Tuple[float, float],
        color: Tuple[float, float, float] = (0, 0, 0),
        width: float = 1
    ):
        """Add line"""
        page = self.doc[page_num]
        shape = page.new_shape()
        shape.draw_line(fitz.Point(start), fitz.Point(end))
        shape.finish(color=color, width=width)
        shape.commit()
    
    def add_arrow(
        self,
        page_num: int,
        start: Tuple[float, float],
        end: Tuple[float, float],
        color: Tuple[float, float, float] = (0, 0, 0),
        width: float = 1
    ):
        """Add arrow"""
        page = self.doc[page_num]
        annot = page.add_line_annot(fitz.Point(start), fitz.Point(end))
        annot.set_colors(stroke=color)
        annot.set_border(width=width)
        # Add arrow head
        annot.set_line_ends(fitz.PDF_ANNOT_LE_NONE, fitz.PDF_ANNOT_LE_OPEN_ARROW)
        annot.update()
    
    def add_sticky_note(
        self,
        page_num: int,
        point: Tuple[float, float],
        content: str,
        icon: str = "Note"  # Note, Comment, Help, Insert, Key, NewParagraph, Paragraph
    ):
        """Add sticky note annotation"""
        page = self.doc[page_num]
        annot = page.add_text_annot(fitz.Point(point), content, icon=icon)
        annot.update()
    
    def add_free_text(
        self,
        page_num: int,
        rect: Tuple[float, float, float, float],
        text: str,
        font_size: float = 12,
        font_color: Tuple[float, float, float] = (0, 0, 0),
        fill_color: Optional[Tuple[float, float, float]] = (1, 1, 0.8),
        border_color: Tuple[float, float, float] = (0, 0, 0)
    ):
        """Add free text annotation (comment box)"""
        page = self.doc[page_num]
        annot = page.add_freetext_annot(
            fitz.Rect(rect),
            text,
            fontsize=font_size,
            fontname="helv",
            text_color=font_color,
            fill_color=fill_color,
            border_color=border_color
        )
        annot.update()
    
    def redact_text(
        self,
        search_text: str,
        page_nums: Optional[List[int]] = None,
        fill_color: Tuple[float, float, float] = (0, 0, 0)
    ) -> int:
        """
        Permanently remove (redact) text from PDF
        
        Returns:
            Number of redactions made
        """
        count = 0
        pages = page_nums if page_nums else range(len(self.doc))
        
        for page_num in pages:
            page = self.doc[page_num]
            instances = page.search_for(search_text)
            
            for inst in instances:
                page.add_redact_annot(inst, fill=fill_color)
                count += 1
            
            if instances:
                page.apply_redactions()
        
        return count
    
    def extract_images(self, output_dir: str) -> List[str]:
        """Extract all images from PDF"""
        os.makedirs(output_dir, exist_ok=True)
        image_paths = []
        
        for page_num in range(len(self.doc)):
            page = self.doc[page_num]
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = self.doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                image_path = f"{output_dir}/page{page_num + 1}_img{img_index + 1}.{image_ext}"
                with open(image_path, "wb") as f:
                    f.write(image_bytes)
                image_paths.append(image_path)
        
        return image_paths
    
    def save(self, output_path: Optional[str] = None, garbage: int = 4, deflate: bool = True):
        """
        Save the edited PDF
        
        Args:
            output_path: Output path (None = overwrite original)
            garbage: Garbage collection level (0-4, higher = smaller file)
            deflate: Compress streams
        """
        if output_path is None:
            output_path = self.pdf_path
        
        self.doc.save(
            output_path,
            garbage=garbage,
            deflate=deflate,
            clean=True
        )
    
    def save_as_bytes(self) -> bytes:
        """Get PDF as bytes"""
        return self.doc.tobytes(garbage=4, deflate=True)


def edit_pdf_with_annotations(
    pdf_path: str,
    output_path: str,
    annotations: List[Dict[str, Any]]
) -> str:
    """
    Apply multiple annotations to a PDF
    
    Args:
        pdf_path: Input PDF path
        output_path: Output PDF path
        annotations: List of annotation dicts with type and properties
    
    Returns:
        Output path
    """
    with PDFEditor(pdf_path) as editor:
        for annot in annotations:
            annot_type = annot.get("type", "")
            page_num = annot.get("page", 0)
            
            if annot_type == "text":
                editor.add_text(
                    page_num,
                    annot["text"],
                    annot["x"],
                    annot["y"],
                    font_name=annot.get("font", "helv"),
                    font_size=annot.get("size", 12),
                    color=annot.get("color", (0, 0, 0)),
                    bold=annot.get("bold", False),
                    italic=annot.get("italic", False)
                )
            
            elif annot_type == "highlight":
                editor.add_highlight(page_num, annot["rect"], annot.get("color", (1, 1, 0)))
            
            elif annot_type == "rectangle":
                editor.add_rectangle(
                    page_num,
                    annot["rect"],
                    color=annot.get("color", (1, 0, 0)),
                    fill=annot.get("fill"),
                    width=annot.get("width", 1)
                )
            
            elif annot_type == "circle":
                editor.add_circle(
                    page_num,
                    annot["center"],
                    annot["radius"],
                    color=annot.get("color", (1, 0, 0)),
                    fill=annot.get("fill"),
                    width=annot.get("width", 1)
                )
            
            elif annot_type == "line":
                editor.add_line(
                    page_num,
                    annot["start"],
                    annot["end"],
                    color=annot.get("color", (0, 0, 0)),
                    width=annot.get("width", 1)
                )
            
            elif annot_type == "arrow":
                editor.add_arrow(
                    page_num,
                    annot["start"],
                    annot["end"],
                    color=annot.get("color", (0, 0, 0)),
                    width=annot.get("width", 1)
                )
            
            elif annot_type == "note":
                editor.add_sticky_note(
                    page_num,
                    annot["point"],
                    annot["content"],
                    icon=annot.get("icon", "Note")
                )
            
            elif annot_type == "freetext":
                editor.add_free_text(
                    page_num,
                    annot["rect"],
                    annot["text"],
                    font_size=annot.get("size", 12),
                    font_color=annot.get("color", (0, 0, 0)),
                    fill_color=annot.get("fill", (1, 1, 0.8))
                )
            
            elif annot_type == "image":
                editor.add_image(
                    page_num,
                    annot["image_path"],
                    annot["rect"],
                    keep_proportion=annot.get("keep_proportion", True)
                )
            
            elif annot_type == "underline":
                editor.add_underline(page_num, annot["rect"])
            
            elif annot_type == "strikeout":
                editor.add_strikeout(page_num, annot["rect"])
        
        editor.save(output_path)
    
    return output_path


def get_pdf_structure(pdf_path: str) -> Dict[str, Any]:
    """
    Get detailed PDF structure including fonts, text, and formatting
    """
    with PDFEditor(pdf_path) as editor:
        structure = {
            "page_count": editor.get_page_count(),
            "pages": []
        }
        
        for page_num in range(editor.get_page_count()):
            width, height = editor.get_page_size(page_num)
            fonts = editor.get_fonts(page_num)
            text_items = editor.extract_text_with_formatting(page_num)
            
            structure["pages"].append({
                "page_number": page_num + 1,
                "width": width,
                "height": height,
                "fonts": fonts,
                "text_count": len(text_items),
                "sample_text": text_items[:10] if text_items else []
            })
    
    return structure
