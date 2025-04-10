from pydantic import BaseSettings

class Settings(BaseSettings):
    app_name: str = "YOLO FaceGuard API"
    api_prefix: str = "/api"
    models_dir: str = "ml_models"
    database_path: str = "database/faces.db"
    
    class Config:
        env_file = ".env"

settings = Settings()

print("✅ Configuration chargée avec succès")