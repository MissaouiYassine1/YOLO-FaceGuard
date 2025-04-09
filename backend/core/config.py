"""import os
from pathlib import Path

# Chemins des modèles
MODEL_DIR = Path(__file__).parent.parent / "models"
FACE_DETECTION_MODEL = MODEL_DIR / "yolov8n-face.pt"
FACE_RECOGNITION_MODEL = MODEL_DIR / "facenet_keras.h5"

# Base de données
DATABASE_DIR = Path(__file__).parent.parent / "database"
FACE_DATABASE = DATABASE_DIR / "faces.db"
EMBEDDINGS_FILE = DATABASE_DIR / "embeddings.npy"

# Paramètres de reconnaissance
FACE_MATCH_THRESHOLD = 0.7  # Seuil de similarité
MAX_FACES_TO_STORE = 1000   # Nombre maximum de visages à enregistrer

# Créer les répertoires s'ils n'existent pas
os.makedirs(DATABASE_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)"""