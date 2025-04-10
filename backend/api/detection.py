from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import time

router = APIRouter(prefix="/detect", tags=["Detection"])

@router.post("/")
async def detect_faces(file: UploadFile = File(...)):
    start_time = time.time()
    
    # Simulation de traitement
    await file.read()
    processing_time = time.time() - start_time
    
    print(f"✅ Requête de détection reçue - Temps simulé: {processing_time:.2f}s")
    
    return {
        "status": "success",
        "faces": [[100, 100, 200, 200]],  # Format: [x1, y1, x2, y2]
        "processing_time": processing_time
    }