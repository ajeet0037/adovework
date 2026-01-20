# AdobeWork Python Backend

Production-ready Python FastAPI backend for document and image processing.

## Features

### PDF Tools
- PDF to Word, Excel, PowerPoint conversions
- Word, Excel, PPT to PDF conversions
- Merge, Split, Compress PDFs
- Protect, Unlock, Rotate PDFs
- Add Watermarks, Page Numbers
- PDF/A conversion, OCR

### Image Tools
- Background Removal (AI-powered)
- Compress, Resize, Crop images
- Format conversion (PNG, JPG, WebP, etc.)
- Passport Photo generator
- Image upscaling

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000

# With Docker
docker-compose up
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads
```
