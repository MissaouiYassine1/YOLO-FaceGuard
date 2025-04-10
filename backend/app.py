from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.detection import router as detection_router
from api.recognition import router as recognition_router

app = FastAPI(title=settings.app_name)
app.include_router(detection_router, prefix="/api")
app.include_router(recognition_router, prefix="/api")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": f"Bienvenue sur {settings.app_name}",
        "status": "API en cours d'exécution"
    }

print("✅ Application FastAPI initialisée")