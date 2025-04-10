from pydantic import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    app_name: str = "YOLO FaceGuard API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///database/faces.db"
    embeddings_dir: str = "database/embeddings"
    
    def __init__(self):
        super().__init__()
        os.makedirs(self.embeddings_dir, exist_ok=True)
        os.makedirs("database", exist_ok=True)

settings = Settings()
print(f"✅ Config loaded | DB: {settings.database_url}")
print("✅ Configuration chargée")