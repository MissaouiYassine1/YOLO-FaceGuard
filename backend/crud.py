import numpy as np
from sqlalchemy.orm import Session
from database.models import Face
from core.config import settings
import os
import time
def save_embedding(embedding: np.ndarray) -> str:
    """Sauvegarde l'embedding sur le disque"""
    os.makedirs(settings.embeddings_dir, exist_ok=True)
    filename = f"embedding_{int(time.time())}.npy"
    path = os.path.join(settings.embeddings_dir, filename)
    np.save(path, embedding)
    return path

def create_face(db: Session, name: str, embedding: np.ndarray):
    """Crée une nouvelle entrée de visage"""
    try:
        embedding_path = save_embedding(embedding)
        db_face = Face(name=name, embedding_path=embedding_path)
        db.add(db_face)
        db.commit()
        db.refresh(db_face)
        return db_face
    except Exception as e:
        db.rollback()
        raise e