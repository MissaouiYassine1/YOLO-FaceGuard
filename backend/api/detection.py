from fastapi import APIRouter, UploadFile, File
import cv2
import numpy as np
from core.face_detector import face_detector

router = APIRouter(prefix="/detect", tags=["Detection"])

@router.post("/")
async def detect_faces(file: UploadFile = File(...)):
    # Lecture de l'image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Détection
    boxes = face_detector.detect(image)
    
    return {
        "status": "success",
        "faces": boxes,
        "count": len(boxes)
    }