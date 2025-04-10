from ultralytics import YOLO
import cv2
import numpy as np
from pathlib import Path
from core.config import settings

class FaceDetector:
    def __init__(self):
        model_path = Path(settings.models_dir) / "detection/yolov8n-face.pt"
        self.model = YOLO(model_path)
        print("✅ YOLOv8 face detector loaded")

    def detect(self, image: np.ndarray):
        """Retourne les bounding boxes des visages"""
        results = self.model.predict(image, verbose=False)
        boxes = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append([x1, y1, x2, y2])
        return boxes

# Singleton
face_detector = FaceDetector()