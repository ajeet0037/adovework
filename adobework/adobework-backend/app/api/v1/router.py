"""
API Router
Combines all API routes
"""
from fastapi import APIRouter

from app.api.v1.pdf import router as pdf_router
from app.api.v1.image import router as image_router
from app.api.v1.ocr import router as ocr_router

api_router = APIRouter()

# Include all routers
api_router.include_router(pdf_router)
api_router.include_router(image_router)
api_router.include_router(ocr_router)
