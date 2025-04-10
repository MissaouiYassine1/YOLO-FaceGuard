from fastapi import APIRouter, UploadFile, File
import time

router = APIRouter(prefix="/recognize", tags=["Reconnaissance"])

@router.post("/")
async def recognize_face(file: UploadFile = File(...)):
    start_time = time.time()
    
    # Simulation de traitement
    await file.read()
    processing_time = time.time() - start_time
    
    print(f"✅ Requête de reconnaissance reçue - Temps simulé: {processing_time:.2f}s")
    
    return {
        "status": "success",
        "face_id": 123,
        "confidence": 0.95,
        "processing_time": processing_time
    }