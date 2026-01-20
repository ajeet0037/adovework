"""
Passport Photo Service
Generate passport-sized photos with proper dimensions and background
"""
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import io

# Try to import rembg if available
try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False


# Standard passport photo sizes (width x height in mm)
PASSPORT_SIZES = {
    "us": (51, 51),      # 2x2 inches
    "uk": (35, 45),      # 35x45mm
    "eu": (35, 45),      # 35x45mm (Schengen)
    "india": (35, 45),   # 35x45mm (also 51x51mm accepted)
    "china": (33, 48),   # 33x48mm
    "japan": (35, 45),   # 35x45mm
    "canada": (50, 70),  # 50x70mm
    "australia": (35, 45), # 35x45mm
}

# DPI for print quality
PRINT_DPI = 300


def mm_to_pixels(mm: float, dpi: int = PRINT_DPI) -> int:
    """Convert millimeters to pixels at given DPI"""
    return int(mm * dpi / 25.4)


def create_passport_photo(
    image_path: str,
    output_path: str,
    size: str = "us",
    background_color: str = "#FFFFFF",
    custom_width_mm: Optional[int] = None,
    custom_height_mm: Optional[int] = None
) -> str:
    """
    Create passport photo from input image
    
    Args:
        image_path: Path to input image (ideally a portrait/headshot)
        output_path: Output path
        size: Standard size (us, uk, eu, india, etc.)
        background_color: Background color (hex)
        custom_width_mm: Custom width in mm
        custom_height_mm: Custom height in mm
    
    Returns:
        Path to passport photo
    """
    # Get dimensions
    if custom_width_mm and custom_height_mm:
        width_mm, height_mm = custom_width_mm, custom_height_mm
    else:
        width_mm, height_mm = PASSPORT_SIZES.get(size.lower(), (51, 51))
    
    target_width = mm_to_pixels(width_mm)
    target_height = mm_to_pixels(height_mm)
    
    # Parse background color
    color = background_color.lstrip('#')
    r = int(color[0:2], 16)
    g = int(color[2:4], 16)
    b = int(color[4:6], 16)
    
    # Load image
    img = Image.open(image_path)
    
    # Remove background if rembg is available
    if REMBG_AVAILABLE:
        with open(image_path, 'rb') as f:
            input_data = f.read()
        output_data = rembg_remove(input_data)
        foreground = Image.open(io.BytesIO(output_data)).convert('RGBA')
        
        # Get bounding box of foreground (person)
        alpha = foreground.split()[3]
        bbox = alpha.getbbox()
        
        if bbox:
            # Crop to foreground
            foreground = foreground.crop(bbox)
    else:
        # No background removal - just use the image as is
        foreground = img.convert('RGBA')
    
    # Calculate scaling to fit in passport photo with proper proportions
    # Head should occupy roughly 70-80% of the height
    head_ratio = 0.75
    
    fg_width, fg_height = foreground.size
    fg_aspect = fg_width / fg_height
    target_aspect = target_width / target_height
    
    # Scale foreground to fit
    if fg_aspect > target_aspect:
        # Image is wider - fit to width
        new_width = int(target_width * 0.9)  # Leave some margin
        new_height = int(new_width / fg_aspect)
    else:
        # Image is taller - fit to height
        new_height = int(target_height * head_ratio)
        new_width = int(new_height * fg_aspect)
    
    foreground = foreground.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Create background
    background = Image.new('RGBA', (target_width, target_height), (r, g, b, 255))
    
    # Center horizontally, position at bottom with small margin
    x_offset = (target_width - new_width) // 2
    y_offset = target_height - new_height - int(target_height * 0.05)  # 5% margin from bottom
    
    # Paste foreground onto background
    background.paste(foreground, (x_offset, y_offset), foreground)
    
    # Convert to RGB for saving
    result = background.convert('RGB')
    result.save(output_path, 'JPEG', quality=95, dpi=(PRINT_DPI, PRINT_DPI))
    
    return output_path


def create_passport_photo_sheet(
    image_path: str,
    output_path: str,
    size: str = "us",
    background_color: str = "#FFFFFF",
    copies: int = 6,
    paper_size: str = "4x6"
) -> str:
    """
    Create a sheet with multiple passport photos for printing
    
    Args:
        image_path: Path to input image
        output_path: Output path
        size: Passport photo size
        background_color: Background color
        copies: Number of copies on sheet
        paper_size: Paper size (4x6, a4)
    
    Returns:
        Path to passport photo sheet
    """
    # Paper sizes in mm
    paper_sizes = {
        "4x6": (152, 102),  # 6x4 inches
        "a4": (297, 210),
    }
    
    paper_width_mm, paper_height_mm = paper_sizes.get(paper_size.lower(), (152, 102))
    paper_width = mm_to_pixels(paper_width_mm)
    paper_height = mm_to_pixels(paper_height_mm)
    
    # Get passport photo dimensions
    width_mm, height_mm = PASSPORT_SIZES.get(size.lower(), (51, 51))
    photo_width = mm_to_pixels(width_mm)
    photo_height = mm_to_pixels(height_mm)
    
    # Create single passport photo first
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        single_photo_path = tmp.name
    
    create_passport_photo(image_path, single_photo_path, size, background_color)
    single_photo = Image.open(single_photo_path)
    
    # Calculate grid
    margin = mm_to_pixels(3)  # 3mm margin
    cols = (paper_width - margin) // (photo_width + margin)
    rows = (paper_height - margin) // (photo_height + margin)
    
    # Create sheet
    sheet = Image.new('RGB', (paper_width, paper_height), (255, 255, 255))
    
    x_start = (paper_width - (cols * photo_width + (cols - 1) * margin)) // 2
    y_start = (paper_height - (rows * photo_height + (rows - 1) * margin)) // 2
    
    count = 0
    for row in range(rows):
        for col in range(cols):
            if count >= copies:
                break
            
            x = x_start + col * (photo_width + margin)
            y = y_start + row * (photo_height + margin)
            
            sheet.paste(single_photo, (x, y))
            count += 1
    
    sheet.save(output_path, 'JPEG', quality=95, dpi=(PRINT_DPI, PRINT_DPI))
    
    # Cleanup temp file
    Path(single_photo_path).unlink(missing_ok=True)
    
    return output_path
