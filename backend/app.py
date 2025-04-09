from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import detection, recognition, register
import uvicorn

app = FastAPI(
    title="YOLO FaceGuard API",
    description="API pour la détection et reconnaissance faciale",
    version="1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(detection.router, prefix="/api", tags=["Detection"])
app.include_router(recognition.router, prefix="/api", tags=["Recognition"])
app.include_router(register.router, prefix="/api", tags=["Registration"])

@app.get("/")
def read_root():
    return {"message": "YOLO FaceGuard API - Documentation disponible sur /docs"}

if __name__ == "__main__":
    print("🚀 Lancement de l'API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)