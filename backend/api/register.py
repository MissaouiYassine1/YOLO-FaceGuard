from fastapi import APIRouter, UploadFile, File, Form
from core.face_recognizer import FaceRecognizer
import cv2
import numpy as np

router = APIRouter()
recognizer = FaceRecognizer()

@router.post("/register")
async def register_face(
    name: str = Form(...),
    files: list[UploadFile] = File(...)
):
    """Endpoint pour enregistrer un nouveau visage"""
    try:
        for file in files:
            contents = await file.read()
            image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
            recognizer.register_face(image, name)
        
        return {"status": "success", "message": f"{len(files)} images enregistrées pour {name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

