from core.config import YOLO_MODEL_PATH, FACENET_MODEL_PATH
import requests
import os
from pathlib import Path

def download_file(url, destination):
    Path(destination.parent).mkdir(parents=True, exist_ok=True)
    
    print(f"Téléchargement {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"✅ Téléchargé à {destination}")

if __name__ == "__main__":
    # YOLOv8n-face
    if not YOLO_MODEL_PATH.exists():
        download_file(
            "https://github.com/akanametov/yolov8-face/releases/download/v0.0.0/yolov8n-face.pt",
            YOLO_MODEL_PATH
        )
    
    # Facenet (version Keras)
    if not FACENET_MODEL_PATH.exists():
        download_file(
            "https://drive.google.com/uc?export=download&id=1PZ_6Zsy1Vb0s0JmjEmVd8FS99zoMCiN1",
            FACENET_MODEL_PATH
        )
    
    print("✅ Tous les modèles sont prêts!")