from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
import numpy as np
import cv2
from database.database import get_db
from database import crud
from sqlalchemy.orm import Session
from core.face_detector import face_detector
from core.face_recognizer import face_recognizer
from pathlib import Path
import os


router = APIRouter(prefix="/register", tags=["Enregistrement"])

@router.post("/")
async def register_face(
    name: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Endpoint pour enregistrer un nouveau visage"""
    try:
        # Validation des entrées
        if not name.strip():
            raise HTTPException(status_code=400, detail="Le nom ne peut pas être vide")
        
        if len(files) < 3:
            raise HTTPException(status_code=400, detail="Au moins 3 images sont requises")

        embeddings = []
        valid_images = 0

        for file in files:
            # Lecture de l'image
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Détection des visages
            boxes = face_detector.detect(image)
            if not boxes:
                continue

            # Extraction du visage principal (le plus grand)
            main_face = max(boxes, key=lambda box: (box[2]-box[0])*(box[3]-box[1]))
            x1, y1, x2, y2 = main_face
            face_img = image[y1:y2, x1:x2]

            # Extraction de l'embedding
            recognizer = face_recognizer()
            embedding = recognizer.get_embedding(face_img)
            embeddings.append(embedding)
            valid_images += 1

            if valid_images >= 5:  # Limite à 5 images maximum
                break

        if valid_images < 3:
            raise HTTPException(status_code=400, detail="Seules {valid_images} images valides trouvées (minimum 3 requises)")

        # Calcul de l'embedding moyen
        avg_embedding = np.mean(embeddings, axis=0)

        # Enregistrement en base de données
        face = crud.create_face(db, name=name, embedding=avg_embedding)

        return {
            "status": "success",
            "face_id": face.id,
            "name": face.name,
            "images_processed": valid_images,
            "created_at": face.created_at
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")