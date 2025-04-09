import numpy as np
import tensorflow as tf
from core.config import FACENET_MODEL_PATH, FACENET_INPUT_SIZE, EMBEDDINGS_PATH, DATABASE_PATH
import cv2
import sqlite3
from pathlib import Path

class FaceRecognizer:
    def __init__(self):
        print("Chargement du modèle Facenet...")
        self.model = tf.keras.models.load_model(FACENET_MODEL_PATH)
        self.input_size = FACENET_INPUT_SIZE
        self.embeddings, self.labels = self._load_embeddings()
        print("✅ Modèle Facenet chargé avec succès!")

    def _load_embeddings(self):
        """Charge les embeddings depuis le fichier .npy"""
        if not EMBEDDINGS_PATH.exists():
            return np.array([]), np.array([])
        
        data = np.load(EMBEDDINGS_PATH, allow_pickle=True)
        return data[:, :-1], data[:, -1]

    def preprocess(self, face_image):
        """Prétraitement de l'image pour Facenet"""
        face = cv2.resize(face_image, self.input_size)
        face = (face - 127.5) / 128.0  # Normalisation Facenet
        return np.expand_dims(face, axis=0)

    def get_embedding(self, face_image):
        """Extrait l'embedding du visage"""
        processed = self.preprocess(face_image)
        return self.model.predict(processed)[0]

    def recognize(self, face_image):
        """Reconnaît un visage en le comparant à la base de données"""
        if len(self.embeddings) == 0:
            return {"face_id": None, "confidence": 0}
        
        embedding = self.get_embedding(face_image)
        distances = np.linalg.norm(self.embeddings - embedding, axis=1)
        min_idx = np.argmin(distances)
        min_dist = distances[min_idx]
        
        confidence = max(0, 1 - min_dist)
        return {
            "face_id": self.labels[min_idx],
            "confidence": float(confidence)
        }

    def register_face(self, face_image, name):
        """Enregistre un nouveau visage"""
        embedding = self.get_embedding(face_image)
        
        if len(self.embeddings) == 0:
            self.embeddings = np.array([embedding])
            self.labels = np.array([name])
        else:
            self.embeddings = np.vstack([self.embeddings, embedding])
            self.labels = np.append(self.labels, name)
        
        # Sauvegarde dans la base de données
        self._save_to_db(name, embedding)
        np.save(EMBEDDINGS_PATH, np.column_stack([self.embeddings, self.labels]))
        
        return True

    def _save_to_db(self, name, embedding):
        """Sauvegarde dans SQLite"""
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        
        # Création de la table si elle n'existe pas
        c.execute('''CREATE TABLE IF NOT EXISTS faces
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      name TEXT NOT NULL,
                      embedding BLOB NOT NULL,
                      date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        
        # Insertion
        c.execute("INSERT INTO faces (name, embedding) VALUES (?, ?)",
                 (name, embedding.tobytes()))
        
        conn.commit()
        conn.close()

# Test
if __name__ == "__main__":
    recognizer = FaceRecognizer()
    test_img = cv2.imread("test_face.jpg")  # Image avec un seul visage
    
    # Test reconnaissance
    result = recognizer.recognize(test_img)
    print("Résultat reconnaissance:", result)
    
    # Test enregistrement
    # recognizer.register_face(test_img, "John_Doe")
    # print("Visage enregistré!")