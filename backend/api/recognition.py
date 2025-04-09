from fastapi import APIRouter, UploadFile, File
from core.face_recognizer import FaceRecognizer
import cv2
import numpy as np

router = APIRouter()
recognizer = FaceRecognizer()

@router.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):
    """Endpoint pour reconnaître un visage"""
    try:
        contents = await file.read()
        image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        result = recognizer.recognize(image)
        return {
            "status": "success",
            "face_id": result["face_id"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

