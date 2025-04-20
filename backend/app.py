from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import numpy as np
import cv2
import os
import torch
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from typing import List
import shutil
import io 
from sklearn.metrics.pairwise import cosine_similarity
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application FastAPI avec des paramètres optimisés
app = FastAPI(
    title="YOLO FaceGuard API",
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600  # Cache les options CORS pendant 10 minutes
)

# Chemins de configuration
FACE_DB_PATH = "face_db.npy"
REGISTERED_FACES_DIR = "registered_faces"
os.makedirs(REGISTERED_FACES_DIR, exist_ok=True)

# Configuration du thread pool pour les opérations bloquantes
executor = ThreadPoolExecutor(max_workers=4)

# Chargement des modèles avec cache
_MODELS = {}
def load_models():
    if not _MODELS:
        try:
            _MODELS['face_detector'] = YOLO("yolov8n-face.pt")
            _MODELS['face_recognizer'] = InceptionResnetV1(pretrained='vggface2').eval()
            logger.info("Modèles chargés avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du chargement des modèles : {str(e)}")
            raise
    return _MODELS

# Initialisation de la base de données des visages avec cache
_FACE_DB = None
def init_face_db():
    global _FACE_DB
    if _FACE_DB is None:
        if os.path.exists(FACE_DB_PATH):
            try:
                loaded_db = np.load(FACE_DB_PATH, allow_pickle=True).item()
                if not isinstance(loaded_db, dict) or "names" not in loaded_db or "embeddings" not in loaded_db:
                    raise ValueError("Format de base de données invalide")
                _FACE_DB = loaded_db
                logger.info("Base de données des visages chargée depuis le fichier")
            except Exception as e:
                logger.warning(f"Erreur de chargement de la base de données, initialisation d'une nouvelle : {str(e)}")
                _FACE_DB = {"names": [], "embeddings": [], "image_paths": []}
        else:
            _FACE_DB = {"names": [], "embeddings": [], "image_paths": []}
    return _FACE_DB

face_db = init_face_db()
models = load_models()

# Fonction pour sauvegarder la base de données de manière asynchrone
async def save_face_db():
    def _save():
        np.save(FACE_DB_PATH, face_db)
    await asyncio.get_event_loop().run_in_executor(executor, _save)

# Fonction pour améliorer les images nocturnes avec optimisation
def enhance_night_image(image):
    # Conversion LAB optimisée
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
<<<<<<< HEAD
    l, a, b = cv2.split(lab)
    
    # CLAHE avec paramètres optimisés
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    
    # Fusion et conversion optimisées
    enhanced_lab = cv2.merge((l_enhanced, a, b))
    enhanced_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    # Dénonçage avec paramètres optimisés
    denoised_image = cv2.fastNlMeansDenoisingColored(enhanced_image, None, 7, 7, 5, 15)
    
=======
    l, a, b = cv2.split(lab)   
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)  
    # Fusionner les canaux et reconvertir en BGR
    enhanced_lab = cv2.merge((l_enhanced, a, b))
    enhanced_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    # Réduction du bruit
    denoised_image = cv2.fastNlMeansDenoisingColored(enhanced_image, None, 10, 10, 7, 21)
>>>>>>> 7e96327479db71ffb56e8dc98d7c65c74c9ad22a
    return denoised_image

# Fonction pour déterminer si une image est sombre (optimisée)
def is_dark_image(image, threshold=30):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return np.mean(gray) < threshold

# Fonction de reconnaissance faciale optimisée
async def recognize_face(face_image, threshold=0.6):
    try:
        # Conversion et normalisation optimisées
        face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        face_tensor = torch.tensor(face_rgb).permute(2, 0, 1).float().unsqueeze(0) / 255.0
        
        # Génération de l'embedding dans le thread pool
        def _get_embedding():
            return models['face_recognizer'](face_tensor).detach().numpy()
        
        query_embedding = await asyncio.get_event_loop().run_in_executor(executor, _get_embedding)
        
        # Comparaison avec la base de données
        if len(face_db["embeddings"]) == 0:
            return "Inconnu", 0.0
        
        # Calcul de similarité optimisé
        similarities = cosine_similarity(query_embedding, np.vstack(face_db["embeddings"]))
        max_idx = np.argmax(similarities)
        max_similarity = similarities[0][max_idx]
        
        return (face_db["names"][max_idx], max_similarity) if max_similarity >= threshold else ("Inconnu", max_similarity)
            
    except Exception as e:
        logger.error(f"Erreur lors de la reconnaissance : {str(e)}")
        return "Erreur", 0.0

# Endpoint optimisé pour enregistrer un nouveau visage
@app.post("/register-face")
async def register_face(
    name: str = Form(..., description="Nom de la personne à enregistrer"),
    images: List[UploadFile] = File(..., description="Liste d'images du visage (3-5 recommandées)")
):
    try:
        # Validation rapide
        if not name or len(name) < 2:
            raise HTTPException(status_code=400, detail="Le nom doit contenir au moins 2 caractères")
        
        if len(images) < 1:
            raise HTTPException(status_code=400, detail="Au moins une image est requise")
        
        embeddings = []
        saved_images = []
        
        # Traitement parallèle des images
        async def process_image(img):
            try:
                # Lecture et conversion de l'image
                img_data = await img.read()
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    logger.warning(f"Image {img.filename} invalide")
                    return None
                
                # Détection de visage avec YOLO dans le thread pool
                def _detect_faces():
                    return models['face_detector'](frame)
                
                results = await asyncio.get_event_loop().run_in_executor(executor, _detect_faces)
                
                if len(results) == 0:
                    return None
                
                # Extraction du visage (première détection)
                x1, y1, x2, y2 = results[0].boxes.xyxy[0].int().tolist()
                face = frame[y1:y2, x1:x2]
                
                # Vérification de la taille minimale
                if face.shape[0] < 50 or face.shape[1] < 50:
                    return None
                
                # Sauvegarde de l'image
                face_id = f"{name.lower().replace(' ', '_')}_{len(face_db['names'])}_{len(saved_images)}"
                face_path = os.path.join(REGISTERED_FACES_DIR, f"{face_id}.jpg")
                
                def _save_face():
                    cv2.imwrite(face_path, face)
                    return face_path
                
                saved_path = await asyncio.get_event_loop().run_in_executor(executor, _save_face)
                saved_images.append(saved_path)
                
                # Génération de l'embedding
                face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face_tensor = torch.tensor(face_rgb).permute(2, 0, 1).float().unsqueeze(0) / 255.0
                
                def _get_embedding():
                    return models['face_recognizer'](face_tensor).detach().numpy()
                
                embedding = await asyncio.get_event_loop().run_in_executor(executor, _get_embedding)
                
                return embedding
            except Exception as e:
                logger.error(f"Erreur de traitement de l'image {img.filename}: {str(e)}")
                return None
        
        # Traitement parallèle des images
        processed_images = await asyncio.gather(*[process_image(img) for img in images])
        embeddings = [emb for emb in processed_images if emb is not None]
        
        if not embeddings:
            raise HTTPException(status_code=400, detail="Aucun visage valide détecté dans les images fournies")
        
        # Moyenne des embeddings
        avg_embedding = np.mean(embeddings, axis=0)
        
        # Mise à jour de la base de données
        face_db["names"].append(name)
        face_db["embeddings"].append(avg_embedding)
        face_db["image_paths"].append(saved_images)
        await save_face_db()
        
        return {
            "status": "success",
            "name": name,
            "num_faces": len(embeddings),
            "message": f"{name} enregistré(e) avec succès"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        # Nettoyage en cas d'erreur
        for img_path in saved_images:
            if os.path.exists(img_path):
                os.remove(img_path)
        logger.error(f"Erreur serveur: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

# Endpoint optimisé pour la détection
@app.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    try:
        # Lecture de l'image en mémoire
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Amélioration nocturne si nécessaire
        if is_dark_image(frame):
            def _enhance_image():
                return enhance_night_image(frame)
            frame = await asyncio.get_event_loop().run_in_executor(executor, _enhance_image)

        # Détection des visages
        def _detect_faces():
            return models['face_detector'](frame, verbose=False)
        
        results = await asyncio.get_event_loop().run_in_executor(executor, _detect_faces)
        
        # Traitement des résultats
        boxes = results[0].boxes.xyxy.cpu().numpy()
        confidences = results[0].boxes.conf.cpu().numpy()
        
        # Traitement parallèle des visages détectés
        async def process_face(box, conf):
            x1, y1, x2, y2 = map(int, box)
            face = frame[y1:y2, x1:x2]
            
            name, similarity = await recognize_face(face)
            
            # Dessiner les annotations
            color = (0, 255, 0) if name != "Inconnu" else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            label = f"{name} ({similarity*100:.1f}%)" if name != "Inconnu" else f"Inconnu ({similarity*100:.1f}%)"
            cv2.putText(frame, label, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Exécution parallèle
        await asyncio.gather(*[process_face(box, conf) for box, conf in zip(boxes, confidences)])

        # Encodage JPEG optimisé
        def _encode_image():
            return cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        
        _, encoded_img = await asyncio.get_event_loop().run_in_executor(executor, _encode_image)
        
        # StreamingResponse avec buffer optimisé
        return StreamingResponse(
            io.BytesIO(encoded_img.tobytes()),
            media_type="image/jpeg",
            headers={"Cache-Control": "no-store, max-age=0"}
        )

    except Exception as e:
        logger.error(f"Erreur lors de la détection : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# Endpoints d'information
@app.get("/")
async def read_root():
    return {
        "status": "running",
        "faces_registered": len(face_db["names"]),
        "model": "YOLOv8 + FaceNet",
        "optimized": True
    }

@app.get("/registered-faces")
async def get_registered_faces():
    return {
        "count": len(face_db["names"]),
        "names": face_db["names"],
        "last_added": face_db["names"][-1] if face_db["names"] else None
    }

# Configuration du serveur UVicorn optimisé
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=1,  # Pour éviter les problèmes avec les modèles GPU
        loop="uvloop",  # Meilleure performance pour asyncio
        http="httptools",  #Serveur HTTP plus rapide
        timeout_keep_alive=30  # Réduit le temps de keep-alive
    )