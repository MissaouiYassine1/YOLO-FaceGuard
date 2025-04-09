import cv2
from ultralytics import YOLO

class YOLOFaceDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
    
    def detect(self, image):
        results = self.model.predict(image, conf=0.5)
        detections = []
        
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf.item())
                detections.append([x1, y1, x2, y2, conf])
        
        return detections