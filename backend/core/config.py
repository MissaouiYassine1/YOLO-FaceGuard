from pathlib import Path

# Chemins absolus
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "ml_models"

# Configuration YOLO
YOLO_MODEL_PATH = MODELS_DIR / "detection" / "yolov8n-face.pt"
YOLO_CONFIDENCE = 0.7

# Configuration Facenet
FACENET_MODEL_PATH = MODELS_DIR / "recognition" / "facenet_keras.h5"
FACENET_INPUT_SIZE = (160, 160)
FACENET_THRESHOLD = 0.8

# Base de données
DATABASE_PATH = BASE_DIR / "database" / "faces.db"
EMBEDDINGS_PATH = BASE_DIR / "database" / "embeddings.npy"

print("✅ Configuration chargée avec succès!")