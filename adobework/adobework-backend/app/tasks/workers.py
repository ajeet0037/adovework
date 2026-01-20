"""
Celery Worker Tasks
Background tasks for long-running operations
"""
from app.tasks.celery_app import celery_app
from app.services.pdf import convert as pdf_convert
from app.services.pdf import operations as pdf_ops
from app.services.image import background as bg_service
from app.services.ocr import extract as ocr_service
from app.utils.file import cleanup_file
import os


@celery_app.task(bind=True)
def convert_pdf_to_word_task(self, input_path: str, output_path: str):
    """Background task for PDF to Word conversion"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10})
        result = pdf_convert.pdf_to_word(input_path, output_path)
        self.update_state(state="PROCESSING", meta={"progress": 90})
        cleanup_file(input_path)
        return {"success": True, "output_path": result}
    except Exception as e:
        cleanup_file(input_path)
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True)
def convert_pdf_to_excel_task(self, input_path: str, output_path: str):
    """Background task for PDF to Excel conversion"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10})
        result = pdf_convert.pdf_to_excel(input_path, output_path)
        self.update_state(state="PROCESSING", meta={"progress": 90})
        cleanup_file(input_path)
        return {"success": True, "output_path": result}
    except Exception as e:
        cleanup_file(input_path)
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True)
def remove_background_task(self, input_path: str, output_path: str, bg_color: str = None):
    """Background task for AI background removal"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10, "message": "Analyzing image..."})
        
        if bg_color:
            result = bg_service.remove_background_with_color(input_path, output_path, bg_color)
        else:
            result = bg_service.remove_background(input_path, output_path)
        
        self.update_state(state="PROCESSING", meta={"progress": 90})
        cleanup_file(input_path)
        return {"success": True, "output_path": result}
    except Exception as e:
        cleanup_file(input_path)
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True)
def ocr_pdf_task(self, input_path: str, language: str = "eng", dpi: int = 300):
    """Background task for PDF OCR"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10, "message": "Extracting text..."})
        
        text, confidence = ocr_service.ocr_pdf(input_path, language, dpi)
        
        self.update_state(state="PROCESSING", meta={"progress": 90})
        cleanup_file(input_path)
        return {"success": True, "text": text, "confidence": confidence}
    except Exception as e:
        cleanup_file(input_path)
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True)
def ocr_pdf_to_searchable_task(self, input_path: str, output_path: str, language: str = "eng"):
    """Background task for converting scanned PDF to searchable"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10, "message": "Processing pages..."})
        
        result = ocr_service.ocr_pdf_to_searchable(input_path, output_path, language)
        
        self.update_state(state="PROCESSING", meta={"progress": 90})
        cleanup_file(input_path)
        return {"success": True, "output_path": result}
    except Exception as e:
        cleanup_file(input_path)
        return {"success": False, "error": str(e)}


@celery_app.task(bind=True)
def merge_pdfs_task(self, input_paths: list, output_path: str):
    """Background task for merging PDFs"""
    try:
        self.update_state(state="PROCESSING", meta={"progress": 10})
        
        result = pdf_ops.merge_pdfs(input_paths, output_path)
        
        self.update_state(state="PROCESSING", meta={"progress": 90})
        for path in input_paths:
            cleanup_file(path)
        return {"success": True, "output_path": result}
    except Exception as e:
        for path in input_paths:
            cleanup_file(path)
        return {"success": False, "error": str(e)}


@celery_app.task
def cleanup_old_files():
    """Periodic task to cleanup old files"""
    from app.config import get_settings
    import time
    
    settings = get_settings()
    max_age = 3600  # 1 hour
    current_time = time.time()
    
    for directory in [settings.UPLOAD_DIR, settings.DOWNLOAD_DIR]:
        if not os.path.exists(directory):
            continue
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    if current_time - os.path.getmtime(file_path) > max_age:
                        os.remove(file_path)
                except Exception:
                    pass
    
    return {"success": True, "message": "Cleanup completed"}
