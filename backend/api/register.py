from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from database.database import get_db
from database import crud
from sqlalchemy.orm import Session
import numpy as np

router = APIRouter(prefix="/register", tags=["Registration"])

@router.post("/")
async def register_face(
    name: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Simulation d'embedding (remplacé par Facenet plus tard)
        fake_embedding = np.random.rand(128)
        
        # Enregistrement en base
        face = crud.create_face(db, name=name, embedding=fake_embedding)
        
        return {
            "status": "success",
            "face_id": face.id,
            "name": face.name,
            "created_at": face.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))