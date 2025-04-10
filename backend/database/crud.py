from sqlalchemy.orm import Session
from database.models import Face
from core.config import settings
from datetime import datetime
import numpy as np
import os

def save_embedding(embedding: np.ndarray) -> str:
    """Sauvegarde l'embedding et retourne le chemin"""
    os.makedirs(settings.embeddings_dir, exist_ok=True)
    path = f"{settings.embeddings_dir}/{datetime.now().timestamp()}.npy"
    np.save(path, embedding)
    return path

def create_face(db: Session, name: str, embedding: np.ndarray):
    """Crée un nouveau visage dans la base"""
    embedding_path = save_embedding(embedding)
    db_face = Face(name=name, embedding_path=embedding_path)
    db.add(db_face)
    db.commit()
    db.refresh(db_face)
    return db_face

def get_face(db: Session, face_id: int):
    """Récupère un visage par son ID"""
    return db.query(Face).filter(Face.id == face_id).first()

def delete_face(db: Session, face_id: int):
    """Supprime un visage"""
    face = db.query(Face).filter(Face.id == face_id).first()
    if face:
        db.delete(face)
        db.commit()
        return True
    return False