from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from datetime import datetime

app = FastAPI()

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adresse de votre frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/detect")
async def detect_faces(file: UploadFile = File(...)):
    try:
        # Log lorsqu'une requête est reçue
        logger.info(f"Requête de détection reçue à {datetime.now().isoformat()}")
        
        # Ici vous ajouteriez votre logique de détection de visage
        # Pour l'exemple, nous retournons une réponse simulée
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "faces": [
                [100, 100, 200, 200],  # Exemple de coordonnées de visage [x1, y1, x2, y2]
                [300, 150, 400, 250]
            ],
            "message": "Détection simulée - 2 visages trouvés"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la détection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recognize")
async def recognize_face(file: UploadFile = File(...)):
    try:
        # Log lorsqu'une requête est reçue
        logger.info(f"Requête de reconnaissance reçue à {datetime.now().isoformat()}")
        
        # Ici vous ajouteriez votre logique de reconnaissance faciale
        # Pour l'exemple, nous retournons une réponse simulée
        
        return {
            "status": "success",
            "face_id": 123,
            "confidence": 0.95,
            "message": "Reconnaissance simulée - Personne 123"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la reconnaissance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)