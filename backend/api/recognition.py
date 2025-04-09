from fastapi import APIRouter, UploadFile, File, HTTPException
from core.face_recognizer import FaceRecognizer
import cv2
import numpy as np

router = APIRouter()
recognizer = FaceRecognizer("ml_models/recognition/facenet_keras.h5", "database/embeddings.npy")

@router.post("/recognize")
async def recognize_face(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        face_id, confidence = recognizer.recognize(img)
        return {
            "face_id": face_id,
            "confidence": float(confidence)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition error: {str(e)}")

@router.post("/register")
async def register_face(name: str, image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        recognizer.register(name, img)
        return {"status": "success", "name": name}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")