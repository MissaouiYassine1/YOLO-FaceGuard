from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.detection import router as detection_router
from api.recognition import router as recognition_router
from api.enhance import router as enhance_router

app = FastAPI(title="YOLO-FaceGuard API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(detection_router, prefix="/api")
app.include_router(recognition_router, prefix="/api")
app.include_router(enhance_router, prefix="/api")