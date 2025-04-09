from fastapi import APIRouter, UploadFile, File, HTTPException
from core.night_enhancer import NightEnhancer
import cv2
import numpy as np

router = APIRouter()
enhancer = NightEnhancer()

@router.post("/enhance")
async def enhance_image(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        enhanced_img = enhancer.enhance(img)
        
        # Convertir l'image améliorée en bytes
        _, encoded_img = cv2.imencode('.jpg', enhanced_img)
        enhanced_bytes = encoded_img.tobytes()
        
        return {"enhanced_image": enhanced_bytes}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement error: {str(e)}")