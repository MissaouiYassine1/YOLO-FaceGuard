from fastapi import APIRouter, UploadFile, File, HTTPException
from core.night_enhancer import NightEnhancer
import numpy as np
import cv2
import base64

router = APIRouter(prefix="/api/v1", tags=["Enhancement"])
enhancer = NightEnhancer()

class EnhanceResponse(BaseModel):
    enhanced_image: str  # Base64 encoded image

@router.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    """Endpoint pour améliorer les images sous faible éclairage"""
    try:
        # Convertir l'image uploadée en format OpenCV
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Impossible de décoder l'image")

        # Amélioration de l'image
        enhanced = enhancer.enhance(image)
        
        # Encodage en base64 pour la réponse
        _, buffer = cv2.imencode('.jpg', enhanced)
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        
        return {"enhanced_image": encoded_image}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'amélioration de l'image: {str(e)}"
        )