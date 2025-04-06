#!/usr/bin/env python3
"""
Script de téléchargement des modèles - Version corrigée
"""

import os
import requests
import urllib.request
from pathlib import Path
import hashlib
from tqdm import tqdm
import warnings

# Configuration
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# URLs et checksums mis à jour (Octobre 2023)
MODELS = {
    "yolov8n-face.pt": {
        "url": "https://github.com/akanametov/yolov8-face/releases/download/v0.0.0/yolov8n-face.pt",
        "md5": "1d8b2f57eec6d8b1c10b2e22e508fe9a"
    },
    "facenet.h5": {
        "url": "https://github.com/nyoki-mtl/keras-facenet/releases/download/v0.0.1/keras-facenet.h5",
        "md5": "0976a2b7e370a3b2a4f6b8d9e5e3d0a2"
    }
}

class ModelDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'FaceGuard Model Downloader'})

    def verify_md5(self, file_path: Path, expected_md5: str) -> bool:
        """Vérifie l'intégrité du fichier téléchargé"""
        if not file_path.exists():
            return False
            
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest() == expected_md5

    def download_with_progress(self, url: str, output_path: Path) -> None:
        """Télécharge un fichier avec barre de progression"""
        try:
            with urllib.request.urlopen(url) as response:
                total_size = int(response.headers.get('content-length', 0))
                
                with tqdm(
                    total=total_size,
                    unit='B',
                    unit_scale=True,
                    desc=f"Téléchargement {output_path.name}",
                    ncols=80
                ) as progress_bar:
                    with open(output_path, 'wb') as f:
                        while True:
                            chunk = response.read(8192)
                            if not chunk:
                                break
                            f.write(chunk)
                            progress_bar.update(len(chunk))
        except Exception as e:
            if output_path.exists():
                output_path.unlink()
            raise RuntimeError(f"Échec du téléchargement: {e}")

    def download_model(self, model_name: str) -> None:
        """Télécharge et vérifie un modèle spécifique"""
        model_info = MODELS[model_name]
        output_path = MODELS_DIR / model_name
        
        # Vérifier si le modèle existe déjà et est valide
        if output_path.exists():
            if self.verify_md5(output_path, model_info["md5"]):
                print(f"{model_name} existe déjà et est valide.")
                return
            else:
                warnings.warn(f"Le modèle {model_name} est corrompu, retéléchargement...")
                output_path.unlink()

        print(f"Début du téléchargement de {model_name}...")
        self.download_with_progress(model_info["url"], output_path)

        # Vérification finale
        if not self.verify_md5(output_path, model_info["md5"]):
            output_path.unlink()
            raise RuntimeError(f"Échec de la vérification MD5 pour {model_name}")

    def download_all(self) -> None:
        """Télécharge tous les modèles manquants"""
        print(f"Vérification des modèles dans {MODELS_DIR}")
        
        for model_name in MODELS:
            try:
                self.download_model(model_name)
            except Exception as e:
                print(f"\n❌ Erreur avec {model_name}: {str(e)}")
                continue

        print("\n✅ Vérification des modèles terminée")
if __name__ == "__main__":
    print("⚠️ Attention : Utilisation des nouveaux liens officiels")
    downloader = ModelDownloader()
    downloader.download_all()