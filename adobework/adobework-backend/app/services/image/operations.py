"""
Image Operations Service
Handles resize, crop, compress, convert, rotate
"""
from pathlib import Path
from typing import Optional, Tuple, List
from PIL import Image, ImageEnhance, ImageFilter
import io


def resize_image(
    image_path: str,
    output_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: str = "fit",
    scale: Optional[float] = None
) -> Tuple[str, Tuple[int, int]]:
    """
    Resize image
    
    Args:
        image_path: Path to input image
        output_path: Output path
        width: Target width
        height: Target height
        mode: fit, fill, exact, scale
        scale: Scale factor (for scale mode)
    
    Returns:
        Tuple of (output_path, (new_width, new_height))
    """
    img = Image.open(image_path)
    original_width, original_height = img.size
    
    if mode == "scale" and scale:
        new_width = int(original_width * scale)
        new_height = int(original_height * scale)
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    elif mode == "exact" and width and height:
        resized = img.resize((width, height), Image.Resampling.LANCZOS)
    
    elif mode == "fit":
        if width and height:
            # Maintain aspect ratio, fit within bounds
            img.thumbnail((width, height), Image.Resampling.LANCZOS)
            resized = img
        elif width:
            ratio = width / original_width
            new_height = int(original_height * ratio)
            resized = img.resize((width, new_height), Image.Resampling.LANCZOS)
        elif height:
            ratio = height / original_height
            new_width = int(original_width * ratio)
            resized = img.resize((new_width, height), Image.Resampling.LANCZOS)
        else:
            resized = img
    
    elif mode == "fill" and width and height:
        # Maintain aspect ratio, crop to fill
        img_ratio = original_width / original_height
        target_ratio = width / height
        
        if img_ratio > target_ratio:
            # Image is wider, crop width
            new_height = height
            new_width = int(height * img_ratio)
        else:
            # Image is taller, crop height
            new_width = width
            new_height = int(width / img_ratio)
        
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Crop to target size
        left = (new_width - width) // 2
        top = (new_height - height) // 2
        resized = resized.crop((left, top, left + width, top + height))
    
    else:
        resized = img
    
    # Preserve format
    if resized.mode == 'RGBA' and output_path.lower().endswith(('.jpg', '.jpeg')):
        resized = resized.convert('RGB')
    
    resized.save(output_path)
    return output_path, resized.size


def crop_image(
    image_path: str,
    output_path: str,
    x: int,
    y: int,
    width: int,
    height: int
) -> str:
    """
    Crop image to specified region
    
    Args:
        image_path: Path to input image
        output_path: Output path
        x, y: Top-left corner coordinates
        width, height: Crop dimensions
    
    Returns:
        Path to cropped image
    """
    img = Image.open(image_path)
    cropped = img.crop((x, y, x + width, y + height))
    
    if cropped.mode == 'RGBA' and output_path.lower().endswith(('.jpg', '.jpeg')):
        cropped = cropped.convert('RGB')
    
    cropped.save(output_path)
    return output_path


def rotate_image(
    image_path: str,
    output_path: str,
    angle: float,
    expand: bool = True
) -> str:
    """
    Rotate image by specified angle
    
    Args:
        image_path: Path to input image
        output_path: Output path
        angle: Rotation angle in degrees (counter-clockwise)
        expand: Whether to expand canvas to fit rotated image
    
    Returns:
        Path to rotated image
    """
    img = Image.open(image_path)
    rotated = img.rotate(angle, expand=expand, resample=Image.Resampling.BICUBIC)
    
    if rotated.mode == 'RGBA' and output_path.lower().endswith(('.jpg', '.jpeg')):
        rotated = rotated.convert('RGB')
    
    rotated.save(output_path)
    return output_path


def compress_image(
    image_path: str,
    output_path: str,
    quality: int = 80,
    output_format: Optional[str] = None
) -> Tuple[str, int, int]:
    """
    Compress image to reduce file size
    
    Args:
        image_path: Path to input image
        output_path: Output path
        quality: JPEG quality (1-100)
        output_format: Optional format conversion
    
    Returns:
        Tuple of (output_path, original_size, compressed_size)
    """
    original_size = Path(image_path).stat().st_size
    
    img = Image.open(image_path)
    
    # Determine format
    if output_format:
        fmt = output_format.upper()
    else:
        fmt = img.format or 'JPEG'
    
    # Convert RGBA to RGB for JPEG
    if fmt == 'JPEG' and img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # Save with compression
    save_kwargs = {}
    if fmt == 'JPEG':
        save_kwargs['quality'] = quality
        save_kwargs['optimize'] = True
    elif fmt == 'PNG':
        save_kwargs['optimize'] = True
    elif fmt == 'WEBP':
        save_kwargs['quality'] = quality
    
    img.save(output_path, format=fmt, **save_kwargs)
    
    compressed_size = Path(output_path).stat().st_size
    return output_path, original_size, compressed_size


def convert_image_format(
    image_path: str,
    output_path: str,
    output_format: str
) -> str:
    """
    Convert image to different format
    
    Args:
        image_path: Path to input image
        output_path: Output path
        output_format: Target format (png, jpeg, webp, etc.)
    
    Returns:
        Path to converted image
    """
    img = Image.open(image_path)
    
    fmt = output_format.upper()
    if fmt == 'JPG':
        fmt = 'JPEG'
    
    # Handle transparency
    if fmt == 'JPEG' and img.mode in ('RGBA', 'P'):
        # Create white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[3])
        img = background
    
    img.save(output_path, format=fmt)
    return output_path


def flip_image(
    image_path: str,
    output_path: str,
    direction: str = "horizontal"
) -> str:
    """
    Flip image horizontally or vertically
    
    Args:
        image_path: Path to input image
        output_path: Output path
        direction: horizontal or vertical
    
    Returns:
        Path to flipped image
    """
    img = Image.open(image_path)
    
    if direction == "horizontal":
        flipped = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    else:
        flipped = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    
    flipped.save(output_path)
    return output_path


def adjust_brightness(
    image_path: str,
    output_path: str,
    factor: float = 1.0
) -> str:
    """
    Adjust image brightness
    
    Args:
        image_path: Path to input image
        output_path: Output path
        factor: Brightness factor (1.0 = original, >1.0 = brighter, <1.0 = darker)
    
    Returns:
        Path to adjusted image
    """
    img = Image.open(image_path)
    enhancer = ImageEnhance.Brightness(img)
    adjusted = enhancer.enhance(factor)
    adjusted.save(output_path)
    return output_path


def adjust_contrast(
    image_path: str,
    output_path: str,
    factor: float = 1.0
) -> str:
    """
    Adjust image contrast
    
    Args:
        image_path: Path to input image
        output_path: Output path
        factor: Contrast factor
    
    Returns:
        Path to adjusted image
    """
    img = Image.open(image_path)
    enhancer = ImageEnhance.Contrast(img)
    adjusted = enhancer.enhance(factor)
    adjusted.save(output_path)
    return output_path


def adjust_saturation(
    image_path: str,
    output_path: str,
    factor: float = 1.0
) -> str:
    """
    Adjust image saturation
    
    Args:
        image_path: Path to input image
        output_path: Output path
        factor: Saturation factor
    
    Returns:
        Path to adjusted image
    """
    img = Image.open(image_path)
    enhancer = ImageEnhance.Color(img)
    adjusted = enhancer.enhance(factor)
    adjusted.save(output_path)
    return output_path


def apply_blur(
    image_path: str,
    output_path: str,
    radius: int = 5
) -> str:
    """
    Apply blur effect
    
    Args:
        image_path: Path to input image
        output_path: Output path
        radius: Blur radius
    
    Returns:
        Path to blurred image
    """
    img = Image.open(image_path)
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    blurred.save(output_path)
    return output_path


def apply_sharpen(
    image_path: str,
    output_path: str
) -> str:
    """
    Apply sharpen effect
    
    Args:
        image_path: Path to input image
        output_path: Output path
    
    Returns:
        Path to sharpened image
    """
    img = Image.open(image_path)
    sharpened = img.filter(ImageFilter.SHARPEN)
    sharpened.save(output_path)
    return output_path


def get_image_info(image_path: str) -> dict:
    """
    Get image metadata
    
    Args:
        image_path: Path to image
    
    Returns:
        Dictionary with image info
    """
    img = Image.open(image_path)
    
    return {
        "width": img.width,
        "height": img.height,
        "format": img.format,
        "mode": img.mode,
        "file_size": Path(image_path).stat().st_size
    }
