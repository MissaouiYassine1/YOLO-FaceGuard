from ultralytics import YOLO
from core.config import YOLO_MODEL_PATH, YOLO_CONFIDENCE
import cv2
import numpy as np

class FaceDetector:
    def __init__(self):
        print("Chargement du modèle YOLO...")
        self.model = YOLO(YOLO_MODEL_PATH)
        print("✅ Modèle YOLO chargé avec succès!")

    def detect(self, image_path):
        """Détecte les visages dans une image"""
        try:
            # Lecture de l'image
            if isinstance(image_path, str):
                image = cv2.imread(image_path)
            else:  # Si c'est déjà un array numpy (upload direct)
                image = cv2.imdecode(np.frombuffer(image_path.read(), np.uint8), cv2.IMREAD_COLOR)

            # Détection
            results = self.model.predict(image, conf=YOLO_CONFIDENCE)
            
            # Formatage des résultats
            faces = []
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    faces.append([x1, y1, x2, y2])
            
            print(f"🎭 {len(faces)} visage(s) détecté(s)")
            return {"faces": faces, "image_size": image.shape[:2]}
        
        except Exception as e:
            print(f"❌ Erreur de détection: {str(e)}")
            raise

# Test
if __name__ == "__main__":
    detector = FaceDetector()
    test_img = "test.jpg"  # Mettez une image de test dans le dossier backend
    result = detector.detect(test_img)
    print("Résultat de test:", result)