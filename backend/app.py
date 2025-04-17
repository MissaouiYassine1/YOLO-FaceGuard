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

# Initialisation de l'application FastAPI
app = FastAPI(title="YOLO FaceGuard API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chemins de configuration
FACE_DB_PATH = "face_db.npy"
REGISTERED_FACES_DIR = "registered_faces"
os.makedirs(REGISTERED_FACES_DIR, exist_ok=True)

# Chargement des modèles
try:
    face_detector = YOLO("yolov8n-face.pt")
    face_recognizer = InceptionResnetV1(pretrained='vggface2').eval()
except Exception as e:
    print(f"Erreur lors du chargement des modèles : {str(e)}")
    raise

# Initialisation de la base de données des visages
def init_face_db():
    if os.path.exists(FACE_DB_PATH):
        try:
            face_db = np.load(FACE_DB_PATH, allow_pickle=True).item()
            if not isinstance(face_db, dict) or "names" not in face_db or "embeddings" not in face_db:
                raise ValueError("Format de base de données invalide")
            return face_db
        except Exception as e:
            print(f"Erreur de chargement de la base de données, initialisation d'une nouvelle : {str(e)}")
    
    # Création d'une nouvelle base de données
    return {"names": [], "embeddings": [], "image_paths": []}

face_db = init_face_db()

# Fonction pour sauvegarder la base de données
def save_face_db():
    np.save(FACE_DB_PATH, face_db)

# Endpoint pour enregistrer un nouveau visage
@app.post("/register-face")
async def register_face(
    name: str = Form(..., description="Nom de la personne à enregistrer"),
    images: List[UploadFile] = File(..., description="Liste d'images du visage (3-5 recommandées)")
):
    try:
        if not name or len(name) < 2:
            raise HTTPException(status_code=400, detail="Le nom doit contenir au moins 2 caractères")
        
        if len(images) < 1:
            raise HTTPException(status_code=400, detail="Au moins une image est requise")
        
        embeddings = []
        saved_images = []
        
        for idx, img in enumerate(images):
            try:
                # Lecture et conversion de l'image
                img_data = await img.read()
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    raise HTTPException(status_code=400, detail=f"Image {img.filename} invalide")
                
                # Détection de visage avec YOLO
                results = face_detector(frame)
                if len(results) == 0:
                    continue
                
                # Extraction du visage (première détection)
                x1, y1, x2, y2 = results[0].boxes.xyxy[0].int().tolist()
                face = frame[y1:y2, x1:x2]
                
                # Vérification de la taille minimale
                if face.shape[0] < 50 or face.shape[1] < 50:
                    continue
                
                # Sauvegarde de l'image brute (optionnel)
                face_id = f"{name.lower().replace(' ', '_')}_{len(face_db['names'])}_{idx}"
                face_path = os.path.join(REGISTERED_FACES_DIR, f"{face_id}.jpg")
                cv2.imwrite(face_path, face)
                saved_images.append(face_path)
                
                # Génération de l'embedding avec FaceNet
                face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face_tensor = torch.tensor(face_rgb).permute(2, 0, 1).float().unsqueeze(0) / 255.0
                embedding = face_recognizer(face_tensor).detach().numpy()
                embeddings.append(embedding)
                
            except Exception as e:
                print(f"Erreur de traitement de l'image {img.filename}: {str(e)}")
                continue
        
        if not embeddings:
            raise HTTPException(status_code=400, detail="Aucun visage valide détecté dans les images fournies")
        
        # Moyenne des embeddings pour la personne
        avg_embedding = np.mean(embeddings, axis=0)
        
        # Mise à jour de la base de données
        face_db["names"].append(name)
        face_db["embeddings"].append(avg_embedding)
        face_db["image_paths"].append(saved_images)
        save_face_db()
        
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
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@app.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    try:
        # Lire l'image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Détection avec YOLOv8
        results = face_detector(frame, verbose=False)
        
        # Dessiner les bounding boxes
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            
            for box, conf in zip(boxes, confidences):
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Face: {conf:.2f}", (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Encoder en JPEG
        _, encoded_img = cv2.imencode('.jpg', frame)
        return StreamingResponse(
            io.BytesIO(encoded_img.tobytes()),
            media_type="image/jpeg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Endpoint pour vérifier l'état de l'API
@app.get("/")
def read_root():
    return {
        "status": "running",
        "faces_registered": len(face_db["names"]),
        "model": "YOLOv8 + FaceNet"
    }

# Endpoint pour récupérer la liste des visages enregistrés
@app.get("/registered-faces")
def get_registered_faces():
    return {
        "count": len(face_db["names"]),
        "names": face_db["names"],
        "last_added": face_db["names"][-1] if face_db["names"] else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)