from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from core.face_detector import FaceDetector
from core.face_recognizer import FaceRecognizer
from core.night_enhancer import NightEnhancer
import numpy as np
import cv2
import uvicorn
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

app = FastAPI(
    title="YOLO FaceGuard API",
    description="API for face detection and recognition using YOLOv8 and FaceNet",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement des modèles
face_detector = FaceDetector("models/yolov8n-face.pt")
face_recognizer = FaceRecognizer("models/facenet_keras.h5")
night_enhancer = NightEnhancer()

# Modèles Pydantic
class DetectionResult(BaseModel):
    faces: List[List[int]]  # [x1, y1, x2, y2]
    image_size: List[int]   # [width, height]

class RecognitionResult(BaseModel):
    face_id: Optional[str]
    confidence: float
    embedding: List[float]

class EnhancementResult(BaseModel):
    enhanced_image: bytes

class RegisterResult(BaseModel):
    face_id: str
    registered_embeddings: int

class FaceData(BaseModel):
    name: str
    images: List[UploadFile]

# Endpoints API
@app.post("/api/v1/detect", response_model=DetectionResult)
async def detect_faces(
    file: UploadFile = File(...),
    min_confidence: float = Query(0.5, description="Confidence threshold", ge=0, le=1)
):
    """
    Detect faces in an image with optional confidence threshold.
    Returns bounding boxes in [x1,y1,x2,y2] format.
    """
    try:
        image = await process_uploaded_image(file)
        faces = face_detector.detect(image, min_confidence)
        return {
            "faces": faces,
            "image_size": [image.shape[1], image.shape[0]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/recognize", response_model=RecognitionResult)
async def recognize_face(file: UploadFile = File(...)):
    """
    Recognize a face and return identity with confidence score.
    """
    try:
        image = await process_uploaded_image(file)
        face_id, confidence, embedding = face_recognizer.recognize(image)
        return {
            "face_id": face_id,
            "confidence": confidence,
            "embedding": embedding.tolist() if embedding is not None else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/enhance", response_model=EnhancementResult)
async def enhance_image(file: UploadFile = File(...)):
    """
    Enhance low-light/night images for better detection.
    """
    try:
        image = await process_uploaded_image(file)
        enhanced = night_enhancer.enhance(image)
        _, encoded_image = cv2.imencode(".jpg", enhanced)
        return {"enhanced_image": encoded_image.tobytes()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/register", response_model=RegisterResult)
async def register_face(data: FaceData):
    """
    Register a new face with multiple reference images.
    """
    try:
        if not data.name or len(data.images) == 0:
            raise HTTPException(status_code=400, detail="Name and at least one image are required")
        
        embeddings = []
        for file in data.images:
            image = await process_uploaded_image(file)
            embedding = face_recognizer.extract_embedding(image)
            if embedding is not None:
                embeddings.append(embedding)
        
        if len(embeddings) == 0:
            raise HTTPException(status_code=400, detail="No valid faces found in provided images")
        
        face_id = face_recognizer.register_face(data.name, np.array(embeddings))
        return {
            "face_id": face_id,
            "registered_embeddings": len(embeddings)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Utilitaires
async def process_uploaded_image(file: UploadFile):
    """
    Process uploaded image file to OpenCV format
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image")
    return image

# Documentation Swagger personnalisée
app.openapi_tags = [{
    "name": "Face Detection",
    "description": "Endpoints for face detection and recognition"
}]

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=2,
        log_level="info"
    )