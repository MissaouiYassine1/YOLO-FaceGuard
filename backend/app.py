import os
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import torch
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from datetime import datetime
import logging
from logging.config import dictConfig
import time

# Configuration du logging
dictConfig({
    "version": 1,
    "formatters": {
        "default": {
            "format": "[%(asctime)s] %(levelname)s: %(message)s",
        }
    },
    "handlers": {
        "file": {
            "class": "logging.FileHandler",
            "filename": "faceguard.log",
            "formatter": "default",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {
        "handlers": ["file", "console"],
        "level": "INFO",
    }
})

app = FastAPI(
    title="YOLO FaceGuard API",
    description="API for face detection and recognition using YOLOv8 and FaceNet",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"]
)

# Constants
MODEL_DIR = "models"
FACE_DB_PATH = os.path.join(MODEL_DIR, "face_db.npy")
YOLO_MODEL_PATH = os.path.join(MODEL_DIR, "yolov8n-face.pt")
THRESHOLD = 0.7
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MIN_FACE_SIZE = 80  # pixels

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

# Models initialization
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger = logging.getLogger(__name__)

# Load models with error handling
try:
    face_detector = YOLO(YOLO_MODEL_PATH).to(device)
    facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    logger.info(f"Models loaded successfully on device: {device}")
except Exception as e:
    logger.error(f"Model loading failed: {str(e)}")
    raise RuntimeError(f"Model loading failed: {str(e)}")

# Face database
face_db = {"embeddings": torch.zeros((0, 512)), "names": np.array([])}

# Load existing database
if os.path.exists(FACE_DB_PATH):
    try:
        loaded_data = np.load(FACE_DB_PATH, allow_pickle=True).item()
        face_db["embeddings"] = torch.from_numpy(loaded_data["embeddings"]).float()
        face_db["names"] = loaded_data["names"]
        logger.info(f"Loaded face database with {len(face_db['names'])} entries")
    except Exception as e:
        logger.error(f"Error loading face database: {str(e)}")

# Pydantic Models
class FaceBox(BaseModel):
    x1: int
    y1: int
    x2: int
    x2: int
    confidence: float

class DetectionResult(BaseModel):
    faces: List[FaceBox]
    is_low_light: bool
    processing_time: float

class RecognitionResult(BaseModel):
    name: str
    confidence: float
    box: FaceBox

class RegisterResponse(BaseModel):
    success: bool
    face_id: str
    message: str

# Helper Functions
def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Enhance image quality for better detection"""
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l_channel)
    
    # Merge channels and convert back to BGR
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    
    return enhanced

def validate_image_size(file: UploadFile) -> None:
    """Validate image size before processing"""
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer
    
    if file_size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large. Max size: {MAX_IMAGE_SIZE//1024//1024}MB"
        )

def extract_embeddings(image: np.ndarray, boxes: List[List[int]]) -> torch.Tensor:
    """Extract face embeddings using FaceNet"""
    embeddings = []
    for box in boxes:
        x1, y1, x2, y2 = box
        
        # Skip small faces
        if (x2 - x1) < MIN_FACE_SIZE or (y2 - y1) < MIN_FACE_SIZE:
            continue
            
        face = image[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = face.astype('float32') / 255.0
        face = (face - 0.5) / 0.5  # Normalize
        
        face_tensor = torch.from_numpy(face).permute(2, 0, 1).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = facenet(face_tensor)
        embeddings.append(embedding.cpu())
    
    return torch.stack(embeddings) if embeddings else torch.tensor([])

# API Endpoints
@app.post("/api/detect", response_model=DetectionResult)
async def detect_faces(file: UploadFile = File(...)):
    print("Start detection...")
    """Endpoint for face detection"""
    start_time = time.time()
    
    try:
        validate_image_size(file)
        
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format"
            )
        
        # Preprocess image
        processed_img = preprocess_image(image)
        
        # Detect faces with YOLO
        results = face_detector(processed_img)
        
        # Parse results
        faces = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf[0])
                faces.append(FaceBox(
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=conf
                ))
        
        processing_time = round(time.time() - start_time, 3)
        print("Detection completed!")
        return DetectionResult(
            faces=faces,
            is_low_light=False,  # Can implement actual check
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/recognize", response_model=List[RecognitionResult])
async def recognize_faces(file: UploadFile = File(...)):
    """Endpoint for face recognition"""
    start_time = time.time()
    
    try:
        validate_image_size(file)
        
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format"
            )
        
        # Preprocess and detect
        processed_img = preprocess_image(image)
        results = face_detector(processed_img)
        boxes = [list(map(int, box.xyxy[0].tolist())) for box in results[0].boxes]
        
        if not boxes:
            return []
        
        # Get embeddings and recognize
        embeddings = extract_embeddings(processed_img, boxes)
        if embeddings.nelement() == 0:
            return []
        
        # Calculate distances
        dists = torch.cdist(embeddings, face_db["embeddings"])
        min_dists, min_idxs = torch.min(dists, dim=1)
        
        recognition_results = []
        for i, (box, min_dist, min_idx) in enumerate(zip(boxes, min_dists, min_idxs)):
            confidence = 1 - min_dist.item()
            name = face_db["names"][min_idx] if confidence > THRESHOLD else "Unknown"
            
            recognition_results.append(RecognitionResult(
                name=name,
                confidence=confidence,
                box=FaceBox(
                    x1=box[0], y1=box[1], x2=box[2], y2=box[3],
                    confidence=float(results[0].boxes[i].conf[0])
                )
            ))
        
        logger.info(f"Recognition completed in {time.time() - start_time:.3f}s")
        return recognition_results
        
    except Exception as e:
        logger.error(f"Recognition error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/register", response_model=RegisterResponse)
async def register_face(name: str, files: List[UploadFile] = File(...)):
    """Endpoint to register new faces"""
    start_time = time.time()
    
    try:
        if not name or len(name) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name must be between 1-50 characters"
            )
        
        if len(files) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one image is required"
            )
        
        # Process all images
        embeddings = []
        for file in files:
            validate_image_size(file)
            
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                continue
                
            # Detect and extract embeddings
            processed_img = preprocess_image(image)
            results = face_detector(processed_img)
            boxes = [list(map(int, box.xyxy[0].tolist())) for box in results[0].boxes]
            
            if boxes:
                face_embeddings = extract_embeddings(processed_img, [boxes[0]])  # Use first face
                if face_embeddings.nelement() > 0:
                    embeddings.append(face_embeddings[0])
        
        if not embeddings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid faces found in any images"
            )
        
        # Average embeddings
        avg_embedding = torch.mean(torch.stack(embeddings), dim=0)
        
        # Update database
        face_db["embeddings"] = torch.cat([face_db["embeddings"], avg_embedding.unsqueeze(0)])
        face_db["names"] = np.append(face_db["names"], name)
        
        # Save database
        np.save(FACE_DB_PATH, {
            "embeddings": face_db["embeddings"].numpy(),
            "names": face_db["names"]
        })
        
        face_id = f"FG-{datetime.now().strftime('%Y%m%d')}-{len(face_db['names'])}"
        processing_time = time.time() - start_time
        
        logger.info(f"Registered new face: {name} (ID: {face_id}) in {processing_time:.2f}s")
        
        return RegisterResponse(
            success=True,
            face_id=face_id,
            message=f"Face registered successfully with {len(embeddings)} valid images"
        )
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/faces")
async def list_registered_faces():
    """List all registered faces"""
    return {
        "count": len(face_db["names"]),
        "names": face_db["names"].tolist()
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "YOLOv8 + FaceNet",
        "device": str(device),
        "faces_registered": len(face_db["names"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="key.pem",
        ssl_certfile="cert.pem"
    )