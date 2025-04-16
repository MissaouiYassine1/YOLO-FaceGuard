import cv2
import torch
import numpy as np
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
import os

YOLO_PATH = "models/yolov8n-face.pt"
DB_PATH = "models/face_db.npy"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def preprocess(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

def extract_embedding(face, facenet):
    if face.size == 0:
        return None
    face = cv2.resize(face, (160, 160)).astype('float32') / 255.0
    face = (face - 0.5) / 0.5
    tensor = torch.from_numpy(face).permute(2, 0, 1).unsqueeze(0).to(device)
    with torch.no_grad():
        return facenet(tensor).cpu()

def load_models():
    detector = YOLO(YOLO_PATH).to(device)
    facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    db = {"embeddings": torch.zeros((0, 512)), "names": np.array([])}
    if os.path.exists(DB_PATH):
        data = np.load(DB_PATH, allow_pickle=True).item()
        db["embeddings"] = torch.from_numpy(data["embeddings"]).float()
        db["names"] = data["names"]
    return detector, facenet, db

def save_db(db):
    np.save(DB_PATH, {
        "embeddings": db["embeddings"].numpy(),
        "names": db["names"]
    })

def detect_faces(image, detector):
    results = detector(image)
    boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
    return boxes

def recognize_faces(image, detector, facenet, db, threshold=0.7):
    boxes = detect_faces(image, detector)
    results = []
    for box in boxes:
        x1, y1, x2, y2 = box
        face = image[y1:y2, x1:x2]
        emb = extract_embedding(face, facenet)
        if emb is None or db["embeddings"].nelement() == 0:
            label = "Inconnu"
        else:
            dists = torch.norm(db["embeddings"] - emb, dim=1)
            min_idx = torch.argmin(dists)
            label = db["names"][min_idx] if dists[min_idx] < (1 - threshold) else "Inconnu"
        results.append({
            "box": box.tolist(),
            "label": label
        })
    return results

def register_face(image, name, detector, facenet, db):
    boxes = detect_faces(image, detector)
    if len(boxes) == 0:
        return False, "Aucun visage détecté."
    x1, y1, x2, y2 = boxes[0]
    face = image[y1:y2, x1:x2]
    emb = extract_embedding(face, facenet)
    if emb is None:
        return False, "Échec de l'extraction d'embedding."
    db["embeddings"] = torch.cat((db["embeddings"], emb), dim=0)
    db["names"] = np.append(db["names"], name)
    save_db(db)
    return True, f"Visage enregistré pour {name}."
