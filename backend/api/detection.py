from fastapi import APIRouter, UploadFile, File, HTTPException
from core.face_detector import YOLOFaceDetector
import cv2
import numpy as np

router = APIRouter()
detector = YOLOFaceDetector("ml_models/detection/yolov8n-face.pt")

@router.post("/detect")
async def detect_faces(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        faces = detector.detect(img)
        return {"faces": faces}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")