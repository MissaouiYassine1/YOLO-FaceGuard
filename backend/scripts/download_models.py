import requests
import os
from pathlib import Path
from core.config import MODEL_DIR, FACE_DETECTION_MODEL, FACE_RECOGNITION_MODEL

MODEL_URLS = {
    "yolov8n-face.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-face.pt",
    "facenet_keras.h5": "https://drive.google.com/uc?export=download&id=1PZ_6Zsy1Vb0s0JmjEmVd8FS99zoMCiN1"
}

def download_file(url: str, destination: Path):
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Saved to {destination}")

def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Télécharger YOLO face model
    if not FACE_DETECTION_MODEL.exists():
        download_file(MODEL_URLS["yolov8n-face.pt"], FACE_DETECTION_MODEL)
    
    # Télécharger Facenet model
    if not FACE_RECOGNITION_MODEL.exists():
        download_file(MODEL_URLS["facenet_keras.h5"], FACE_RECOGNITION_MODEL)
    
    print("All models downloaded successfully!")

if __name__ == "__main__":
    main()