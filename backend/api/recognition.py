from fastapi import APIRouter, UploadFile, File
from core.face_recognizer import face_recognizer
from core.face_detector import face_detector
import cv2
import numpy as np

router = APIRouter(prefix="/recognize", tags=["Recognition"])

@router.post("/")
async def recognize_face(file: UploadFile = File(...)):
    try:
        # Lecture de l'image
        contents = await file.read()
        image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        
        # Détection des visages
        boxes = face_detector.detect(image)
        if not boxes:
            return {"status": "error", "message": "Aucun visage détecté"}
        
        # Extraction et reconnaissance
        x1, y1, x2, y2 = boxes[0]
        embedding = face_recognizer.get_embedding(image[y1:y2, x1:x2])
        
        return {
            "status": "success",
            "embedding": embedding.tolist(),
            "face_box": boxes[0]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}