import requests
from pathlib import Path
from core.config import settings

def download_file(url, path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

# YOLOv8-face
yolo_url = "https://github.com/akanametov/yolov8-face/releases/download/v0.0.0/yolov8n-face.pt"
yolo_path = Path(settings.models_dir) / "detection/yolov8n-face.pt"

def download_facenet():
    url = "https://github.com/serengil/deepface_models/releases/download/v1.0/facenet_weights.h5"
    save_path = Path(settings.models_dir) / "recognition/facenet_keras.h5"
    
    print(f"Téléchargement de FaceNet depuis {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"✅ Modèle sauvegardé à {save_path}")
def download_arcface():
    url = "https://github.com/serengil/deepface_models/releases/download/v1.0/arcface_weights.h5"
    save_path = Path(settings.models_dir) / "recognition/arcface_weights.h5"
    
    print("Téléchargement d'ArcFace...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print("✅ ArcFace téléchargé avec succès")
if __name__ == "__main__":
    print("Downloading YOLOv8...")
    download_file(yolo_url, yolo_path)
    
    print("Downloading FaceNet...")
    download_facenet()
    
    print("✅ All models downloaded")