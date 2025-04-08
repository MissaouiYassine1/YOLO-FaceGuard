from fastapi import APIRouter, UploadFile, Query
from ..core.face_detector import detect_faces
from ..core.face_recognizer import recognize_face
import cv2
import numpy as np

router = APIRouter()

@router.post("/detect")
async def detect_faces_endpoint(
    file: UploadFile,
    min_confidence: float = Query(0.5, description="Seuil minimal de confiance")
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    faces = detect_faces(img, min_confidence)  # Doit retourner [[x1,y1,x2,y2],...]
    return {"faces": faces}