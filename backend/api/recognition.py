from fastapi import APIRouter, UploadFile
from ..core.face_recognizer import recognize_face
import cv2
import numpy as np

router = APIRouter()

@router.post("/recognize")
async def recognize_face_endpoint(file: UploadFile):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    result = recognize_face(face_img)  # Doit retourner {"face_id": str, "confidence": float}
    return result