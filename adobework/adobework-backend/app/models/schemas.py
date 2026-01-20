"""
Pydantic models/schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ============ Common ============

class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str = "Operation completed successfully"


class FileResponse(BaseModel):
    """Response with file information"""
    success: bool = True
    file_url: str
    filename: str
    file_size: int
    processing_time: float


class TaskResponse(BaseModel):
    """Response for async tasks"""
    success: bool = True
    task_id: str
    status: str = "processing"
    message: str = "Your file is being processed"


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None


# ============ PDF Models ============

class PDFSplitMode(str, Enum):
    """PDF split modes"""
    ALL = "all"
    RANGE = "range"
    EXTRACT = "extract"


class PDFSplitRequest(BaseModel):
    """PDF split request"""
    mode: PDFSplitMode = PDFSplitMode.ALL
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    pages: Optional[List[int]] = None


class PDFMergeOrder(BaseModel):
    """PDF merge order item"""
    file_index: int
    pages: Optional[List[int]] = None  # None means all pages


class PDFCompressLevel(str, Enum):
    """PDF compression levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PDFProtectRequest(BaseModel):
    """PDF protection request"""
    password: str = Field(..., min_length=1)
    owner_password: Optional[str] = None
    allow_printing: bool = True
    allow_copying: bool = False


class PDFWatermarkPosition(str, Enum):
    """Watermark positions"""
    CENTER = "center"
    TOP_LEFT = "top-left"
    TOP_RIGHT = "top-right"
    BOTTOM_LEFT = "bottom-left"
    BOTTOM_RIGHT = "bottom-right"
    DIAGONAL = "diagonal"


class PDFWatermarkRequest(BaseModel):
    """PDF watermark request"""
    text: str = Field(..., min_length=1)
    position: PDFWatermarkPosition = PDFWatermarkPosition.DIAGONAL
    font_size: int = Field(default=48, ge=8, le=200)
    opacity: float = Field(default=0.3, ge=0.1, le=1.0)
    color: str = "#808080"
    rotation: int = Field(default=45, ge=0, le=360)


class PDFRotateRequest(BaseModel):
    """PDF rotation request"""
    angle: int = Field(..., description="Rotation angle: 90, 180, or 270")
    pages: Optional[List[int]] = None  # None means all pages


class PageNumberPosition(str, Enum):
    """Page number positions"""
    BOTTOM_CENTER = "bottom-center"
    BOTTOM_LEFT = "bottom-left"
    BOTTOM_RIGHT = "bottom-right"
    TOP_CENTER = "top-center"
    TOP_LEFT = "top-left"
    TOP_RIGHT = "top-right"


class PageNumberRequest(BaseModel):
    """Page number request"""
    position: PageNumberPosition = PageNumberPosition.BOTTOM_CENTER
    start_number: int = Field(default=1, ge=1)
    font_size: int = Field(default=12, ge=8, le=36)
    format: str = "{page}"  # Can use {page}, {total}


# ============ Image Models ============

class ImageFormat(str, Enum):
    """Supported image formats"""
    PNG = "png"
    JPEG = "jpeg"
    WEBP = "webp"
    GIF = "gif"
    BMP = "bmp"
    TIFF = "tiff"


class ImageResizeMode(str, Enum):
    """Image resize modes"""
    FIT = "fit"
    FILL = "fill"
    EXACT = "exact"
    SCALE = "scale"


class ImageResizeRequest(BaseModel):
    """Image resize request"""
    width: Optional[int] = Field(None, ge=1, le=10000)
    height: Optional[int] = Field(None, ge=1, le=10000)
    mode: ImageResizeMode = ImageResizeMode.FIT
    scale: Optional[float] = Field(None, ge=0.1, le=10.0)


class ImageCropRequest(BaseModel):
    """Image crop request"""
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)


class ImageCompressRequest(BaseModel):
    """Image compression request"""
    quality: int = Field(default=80, ge=1, le=100)
    format: Optional[ImageFormat] = None


class BackgroundRemoveRequest(BaseModel):
    """Background removal request"""
    output_format: ImageFormat = ImageFormat.PNG
    background_color: Optional[str] = None  # Hex color for replacement


class PassportPhotoSize(str, Enum):
    """Standard passport photo sizes"""
    US = "us"  # 2x2 inches
    UK = "uk"  # 35x45mm
    EU = "eu"  # 35x45mm
    INDIA = "india"  # 35x45mm (2x2 inches also accepted)
    CUSTOM = "custom"


class PassportPhotoRequest(BaseModel):
    """Passport photo request"""
    size: PassportPhotoSize = PassportPhotoSize.US
    background_color: str = "#FFFFFF"
    custom_width_mm: Optional[int] = None
    custom_height_mm: Optional[int] = None


# ============ OCR Models ============

class OCRLanguage(str, Enum):
    """Supported OCR languages"""
    ENGLISH = "eng"
    HINDI = "hin"
    SPANISH = "spa"
    FRENCH = "fra"
    GERMAN = "deu"
    CHINESE_SIMPLIFIED = "chi_sim"
    JAPANESE = "jpn"
    KOREAN = "kor"
    ARABIC = "ara"


class OCRRequest(BaseModel):
    """OCR request"""
    language: OCRLanguage = OCRLanguage.ENGLISH
    output_format: str = "text"  # text, json, hocr


class OCRResponse(BaseModel):
    """OCR response"""
    success: bool = True
    text: str
    confidence: Optional[float] = None
    processing_time: float
