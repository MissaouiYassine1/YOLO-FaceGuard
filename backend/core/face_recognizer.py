from tensorflow.keras.models import load_model
import numpy as np
import cv2
import os
import pickle

class FaceRecognizer:
    def __init__(self, model_path):
        self.model = load_model(model_path)
        self.known_faces = {}
        self.embeddings_file = "database/embeddings.pkl"
        self._load_known_faces()

    def _load_known_faces(self):
        if os.path.exists(self.embeddings_file):
            with open(self.embeddings_file, 'rb') as f:
                self.known_faces = pickle.load(f)

    def extract_embedding(self, face_image):
        """Extrait l'embedding d'une image de visage"""
        resized = cv2.resize(face_image, (160, 160))
        normalized = (resized - 127.5) / 127.5
        return self.model.predict(np.expand_dims(normalized, axis=0))[0]

    def recognize(self, face_image):
        """Reconnaît un visage et retourne (face_id, confidence)"""
        embedding = self.extract_embedding(face_image)
        
        if not self.known_faces:
            return None, 0.0, embedding
            
        min_dist = float('inf')
        identity = None
        
        for name, known_embeddings in self.known_faces.items():
            for known_embed in known_embeddings:
                dist = np.linalg.norm(embedding - known_embed)
                if dist < min_dist:
                    min_dist = dist
                    identity = name
        
        confidence = 1 - min(min_dist / 2, 1.0)  # Normalise entre 0 et 1
        return identity, confidence, embedding

    def register_face(self, name, embeddings):
        """Enregistre un nouveau visage"""
        if name not in self.known_faces:
            self.known_faces[name] = []
        
        self.known_faces[name].extend(embeddings)
        
        # Sauvegarde dans le fichier
        os.makedirs(os.path.dirname(self.embeddings_file), exist_ok=True)
        with open(self.embeddings_file, 'wb') as f:
            pickle.dump(self.known_faces, f)
            
        return name