import os
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import torch
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
import tempfile
import time
from datetime import datetime

app = FastAPI(
    title="YOLO FaceGuard API",
    description="API for face detection and recognition using YOLOv8 and FaceNet",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
FACE_DB_PATH = "face_db.npy"
MODEL_PATH = "yolov8n-face.pt"
THRESHOLD = 0.8
NIGHT_LOW_LIGHT_THRESHOLD = 50  # Below this value, consider image as low-light

# Load models
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Load YOLO model
try:
    face_detector = YOLO(MODEL_PATH).to(device)
except Exception as e:
    raise RuntimeError(f"Failed to load YOLO model: {str(e)}")

# Load FaceNet model
facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# Face database
face_db = {"embeddings": np.zeros((0, 512)), "names": np.array([])}  # Initialize empty

# Load existing face database if exists
if os.path.exists(FACE_DB_PATH):
    try:
        face_db = np.load(FACE_DB_PATH, allow_pickle=True).item()
        print(f"Loaded face database with {len(face_db['names'])} entries")
    except Exception as e:
        print(f"Error loading face database: {str(e)}")

# Pydantic models
class FaceBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float

class DetectionResult(BaseModel):
    faces: List[FaceBox]
    is_low_light: bool
    enhanced: bool

class FaceRecognitionResult(BaseModel):
    name: str
    confidence: float
    box: FaceBox

class RegisterRequest(BaseModel):
    name: str
    images: List[str]  # Base64 encoded images

# Utility functions
def enhance_low_light(image: np.ndarray) -> np.ndarray:
    """Enhance low light images using CLAHE and gamma correction"""
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to L-channel
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    
    # Merge channels and convert back to BGR
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    
    # Gamma correction
    gamma = 1.5
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    enhanced = cv2.LUT(enhanced, table)
    
    return enhanced

def is_low_light(image: np.ndarray) -> bool:
    """Check if image is low light"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray)
    return avg_brightness < NIGHT_LOW_LIGHT_THRESHOLD

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Preprocess image for face detection"""
    # Check if image is low light
    low_light = is_low_light(image)
    enhanced = False
    
    if low_light:
        image = enhance_low_light(image)
        enhanced = True
    
    return image, low_light, enhanced

def extract_face_embeddings(image: np.ndarray, boxes: List[List[int]]) -> torch.Tensor:
    """Extract face embeddings using FaceNet"""
    embeddings = []
    for box in boxes:
        x1, y1, x2, y2 = box
        face = image[y1:y2, x1:x2]
        
        # Resize face to 160x160 for FaceNet
        face = cv2.resize(face, (160, 160))
        face = face.astype('float32') / 255.0
        face = (face - 0.5) / 0.5  # Normalize for FaceNet
        
        # Convert to tensor and get embedding
        face_tensor = torch.from_numpy(face).permute(2, 0, 1).unsqueeze(0).to(device)
        embedding = facenet(face_tensor).detach().cpu()
        embeddings.append(embedding)
    
    return torch.stack(embeddings) if embeddings else torch.tensor([])

def recognize_face(embedding: torch.Tensor) -> Dict[str, float]:
    """Recognize face by comparing with database"""
    if len(face_db["embeddings"]) == 0:
        return {"Unknown": 0.0}
    
    # Calculate distances
    dists = torch.cdist(embedding.unsqueeze(0), face_db["embeddings"])
    min_dist, idx = torch.min(dists, dim=1)
    confidence = 1 - min_dist.item()
    
    if confidence < THRESHOLD:
        return {"Unknown": confidence}
    
    return {face_db["names"][idx.item()]: confidence}

# API Endpoints
@app.post("/api/detect", response_model=DetectionResult)
async def detect_faces(file: UploadFile = File(...)):
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocess image (enhance if low light)
        processed_img, is_low_light, enhanced = preprocess_image(image)
        
        # Detect faces with YOLO
        results = face_detector(processed_img)
        
        # Parse results
        faces = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf[0])
                faces.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf
                })
        
        return {
            "faces": faces,
            "is_low_light": is_low_light,
            "enhanced": enhanced
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recognize", response_model=List[FaceRecognitionResult])
async def recognize_faces(file: UploadFile = File(...)):
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocess image
        processed_img, _, _ = preprocess_image(image)
        
        # Detect faces
        results = face_detector(processed_img)
        boxes = [map(int, box.xyxy[0].tolist()) for box in results[0].boxes]
        
        if not boxes:
            return []
        
        # Get embeddings
        embeddings = extract_face_embeddings(processed_img, boxes)
        
        # Recognize each face
        recognition_results = []
        for embedding, box in zip(embeddings, results[0].boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            
            # Recognize face
            recognition = recognize_face(embedding)
            name, confidence = next(iter(recognition.items()))
            
            recognition_results.append({
                "name": name,
                "confidence": confidence,
                "box": {
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": conf
                }
            })
        
        return recognition_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/register")
async def register_face(name: str, files: List[UploadFile] = File(...)):
    try:
        global face_db
        
        # Process each image
        embeddings_list = []
        for file in files:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Preprocess image
            processed_img, _, _ = preprocess_image(image)
            
            # Detect faces
            results = face_detector(processed_img)
            boxes = [map(int, box.xyxy[0].tolist()) for box in results[0].boxes]
            
            if not boxes:
                continue
            
            # Get embeddings (use first face found)
            embeddings = extract_face_embeddings(processed_img, [boxes[0]])
            embeddings_list.append(embeddings[0])
        
        if not embeddings_list:
            raise HTTPException(status_code=400, detail="No faces detected in any images")
        
        # Average embeddings
        avg_embedding = torch.mean(torch.stack(embeddings_list), dim=0)
        
        # Update database
        face_db["embeddings"] = torch.cat([face_db["embeddings"], avg_embedding.unsqueeze(0)])
        face_db["names"] = np.append(face_db["names"], name)
        
        # Save database
        np.save(FACE_DB_PATH, face_db)
        
        return {"success": True, "message": f"Face registered for {name}", "count": len(face_db["names"])}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/faces")
async def get_registered_faces():
    return {
        "count": len(face_db["names"]),
        "names": face_db["names"].tolist() if len(face_db["names"]) > 0 else []
    }

@app.get("/")
async def root():
    return {
        "message": "YOLO FaceGuard API",
        "status": "running",
        "faces_registered": len(face_db["names"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)