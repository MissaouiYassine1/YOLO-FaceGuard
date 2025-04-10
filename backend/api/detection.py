from fastapi import APIRouter, UploadFile, File
from typing import List
import time

router = APIRouter(prefix="/detect", tags=["Détection faciale"])

@router.post("/")
async def detect_faces(file: UploadFile = File(...)):
    """Endpoint simulé pour la détection de visages"""
    start_time = time.time()
    
    # Simulation de traitement (remplacé plus tard par YOLOv8)
    await file.read()  # Lit l'image sans traitement
    processing_time = time.time() - start_time

    # Réponse simulée (coordonnées factices)
    return {
        "status": "success",
        "faces": [[10, 10, 100, 100]],  # [x1, y1, x2, y2]
        "processing_time": f"{processing_time:.2f}s",
        "message": "Détection simulée (base de données désactivée)"
    }