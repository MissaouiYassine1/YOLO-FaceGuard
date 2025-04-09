from fastapi import APIRouter, UploadFile, File
from core.face_detector import FaceDetector
import logging

router = APIRouter()
detector = FaceDetector()

@router.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    """Endpoint pour détecter les visages dans une image"""
    try:
        result = detector.detect(await file.read())
        return {
            "status": "success",
            "faces": result["faces"],
            "image_size": result["image_size"]
        }
    except Exception as e:
        logging.error(f"Detection error: {str(e)}")
        return {"status": "error", "message": str(e)}

