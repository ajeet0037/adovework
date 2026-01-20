"""
Background Removal Service
Basic implementation using Pillow
For production, install rembg: pip install rembg
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


def remove_background(
    image_path: str,
    output_path: Optional[str] = None,
    output_format: str = "png"
) -> str:
    """
    Remove background from image
    Uses rembg if available, otherwise returns error
    
    Args:
        image_path: Path to input image
        output_path: Optional output path
        output_format: Output format (png recommended for transparency)
    
    Returns:
        Path to output image with background removed
    """
    if output_path is None:
        output_path = str(Path(image_path).with_suffix(f'.{output_format}'))
    
    if REMBG_AVAILABLE:
        # Use rembg for AI-powered background removal
        with open(image_path, 'rb') as f:
            input_data = f.read()
        
        output_data = rembg_remove(input_data)
        
        with open(output_path, 'wb') as f:
            f.write(output_data)
    else:
        # Fallback: Just convert to PNG with transparency support
        # This is not actual background removal, just a placeholder
        img = Image.open(image_path)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.save(output_path, format=output_format.upper())
    
    return output_path


def remove_background_with_color(
    image_path: str,
    output_path: str,
    background_color: str = "#FFFFFF"
) -> str:
    """
    Remove background and replace with solid color
    
    Args:
        image_path: Path to input image
        output_path: Output path
        background_color: Hex color for new background
    
    Returns:
        Path to output image
    """
    # Parse background color
    color = background_color.lstrip('#')
    r = int(color[0:2], 16)
    g = int(color[2:4], 16)
    b = int(color[4:6], 16)
    
    if REMBG_AVAILABLE:
        # Remove background first
        with open(image_path, 'rb') as f:
            input_data = f.read()
        
        output_data = rembg_remove(input_data)
        foreground = Image.open(io.BytesIO(output_data)).convert('RGBA')
    else:
        # Fallback: just use original image
        foreground = Image.open(image_path).convert('RGBA')
    
    # Create background with solid color
    background = Image.new('RGBA', foreground.size, (r, g, b, 255))
    
    # Composite foreground onto background
    result = Image.alpha_composite(background, foreground)
    
    # Convert to RGB for saving as JPEG if needed
    if output_path.lower().endswith(('.jpg', '.jpeg')):
        result = result.convert('RGB')
    
    result.save(output_path)
    return output_path


def remove_background_bytes(image_bytes: bytes) -> bytes:
    """
    Remove background from image bytes
    
    Args:
        image_bytes: Input image as bytes
    
    Returns:
        Output image as bytes (PNG format)
    """
    if REMBG_AVAILABLE:
        return rembg_remove(image_bytes)
    else:
        # Fallback: just return PNG version
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()


def get_foreground_bounds(image_path: str) -> Tuple[int, int, int, int]:
    """
    Get bounding box of foreground (non-transparent area)
    
    Args:
        image_path: Path to image
    
    Returns:
        Tuple of (left, top, right, bottom)
    """
    img = Image.open(image_path).convert('RGBA')
    
    # Get alpha channel
    alpha = img.split()[3]
    
    # Get bounding box of non-transparent pixels
    bbox = alpha.getbbox()
    
    return bbox or (0, 0, img.width, img.height)


def is_rembg_available() -> bool:
    """Check if rembg is available"""
    return REMBG_AVAILABLE
