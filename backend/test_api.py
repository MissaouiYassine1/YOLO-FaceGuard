import requests
import cv2
import numpy as np
import os
import pytest
from fastapi.testclient import TestClient
from app import app  # Importez votre application FastAPI

# Configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_images/me.jpg"
os.makedirs("test_images", exist_ok=True)

# Client de test
client = TestClient(app)

@pytest.fixture
def test_image():
    """Génère une image de test avec un visage"""
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.rectangle(img, (50, 50), (250, 250), (255, 255, 255), -1)  # Carré blanc = visage simulé
    cv2.imwrite(TEST_IMAGE_PATH, img)
    yield TEST_IMAGE_PATH
    if os.path.exists(TEST_IMAGE_PATH):
        os.remove(TEST_IMAGE_PATH)

def test_api_health_check():
    """Teste le endpoint de santé"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "OK"}

def test_face_detection(test_image):
    """Teste la détection de visage avec une image simulée"""
    with open(test_image, "rb") as f:
        response = client.post(
            "/api/detect",
            files={"file": ("test_face.jpg", f, "image/jpeg")}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "faces" in data
    assert len(data["faces"]) > 0
    assert data["faces"][0]["confidence"] > 0.7

def test_invalid_file_upload():
    """Teste le rejet des fichiers non-images"""
    response = client.post(
        "/api/detect",
        files={"file": ("test.txt", b"fake content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Uploaded file must be an image" in response.text

if __name__ == "__main__":
    # Exécute tous les tests avec pytest
    pytest.main(["-v", "--tb=line", __file__])