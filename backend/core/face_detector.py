from ultralytics import YOLO
import cv2

class FaceDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def detect(self, image, min_confidence=0.5):
        """Détecte les visages dans une image et retourne les coordonnées [x1,y1,x2,y2]"""
        results = self.model(image, conf=min_confidence)
        return [list(map(int, box.xyxy[0])) for box in results[0].boxes]