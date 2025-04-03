from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
from deepface import DeepFace
import time
import uuid
import json
import logging

# Configurer les logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("YOLO FaceGuard")

app = FastAPI()

# CORS (pour les requêtes frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger les modèles
try:
    model_yolo = YOLO("models/yolov8n.pt")  # Modèle YOLO pour la détection de visages
    model_facenet = DeepFace.build_model("Facenet")  # Modèle pour la reconnaissance
    logger.info("Modèles chargés avec succès")
except Exception as e:
    logger.error(f"Erreur lors du chargement des modèles: {e}")
    raise

@app.post("/api/detect")
async def detect_faces(file: UploadFile = File(...)):
    try:
        # Lire l'image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Image invalide")

        # Détection avec YOLO
        results = model_yolo.predict(img, conf=0.7)
        detections = []
        
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                face_img = img[y1:y2, x1:x2]
                
                # Reconnaissance faciale (optionnelle)
                try:
                    analysis = DeepFace.analyze(face_img, actions=['identity'], enforce_detection=False)
                    identity = analysis[0]['identity'] if analysis else "Inconnu"
                except Exception as e:
                    logger.warning(f"Erreur DeepFace: {e}")
                    identity = "Inconnu"
                
                detections.append({
                    "id": str(uuid.uuid4()),
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1,
                    "confidence": float(box.conf[0]),
                    "name": identity,
                    "timestamp": time.time()
                })
        
        return {"faces": detections}
    
    except Exception as e:
        logger.error(f"Erreur lors de la détection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "OK"}