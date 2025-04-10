from fastapi import FastAPI
from api.detection import router as detection_router
from api.recognition import router as recognition_router
from api.register import router as register_router
from database.database import engine, Base
from core.config import settings

# Création des tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

# Include routers
app.include_router(detection_router, prefix=settings.api_prefix)
app.include_router(recognition_router, prefix=settings.api_prefix)
app.include_router(register_router, prefix=settings.api_prefix)

print("✅ All systems operational")