import cv2
import numpy as np
from keras.models import load_model
import os

class FaceRecognizer:
    def __init__(self, model_path, embeddings_path):
        self.model = load_model(model_path)
        self.embeddings_path = embeddings_path
        self.load_embeddings()
    
    def load_embeddings(self):
        if os.path.exists(self.embeddings_path):
            self.embeddings = np.load(self.embeddings_path, allow_pickle=True).item()
        else:
            self.embeddings = {"ids": [], "vectors": np.empty((0, 128))}
    
    def save_embeddings(self):
        np.save(self.embeddings_path, self.embeddings)
    
    def get_embedding(self, face_image):
        face = cv2.resize(face_image, (160, 160))
        face = face.astype('float32')
        mean, std = face.mean(), face.std()
        face = (face - mean) / std
        face = np.expand_dims(face, axis=0)
        return self.model.predict(face)[0]
    
    def recognize(self, face_image):
        embedding = self.get_embedding(face_image)
        
        if len(self.embeddings["vectors"]) == 0:
            return None, 0.0
        
        distances = np.linalg.norm(self.embeddings["vectors"] - embedding, axis=1)
        min_idx = np.argmin(distances)
        min_dist = distances[min_idx]
        
        if min_dist < 0.7:  # Seuil de confiance
            return self.embeddings["ids"][min_idx], 1 - min_dist
        return "unknown", 1 - min_dist
    
    def register(self, name, face_image):
        embedding = self.get_embedding(face_image)
        
        self.embeddings["ids"].append(name)
        self.embeddings["vectors"] = np.vstack((self.embeddings["vectors"], embedding))
        self.save_embeddings()