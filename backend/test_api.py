import requests

BASE_URL = "http://localhost:8000"

def test_root():
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    print("✅ Test root endpoint réussi")
    print("Réponse:", response.json())

def test_detection():
    test_file = "../frontend/src/assets/images/personne.png"  # Créez un fichier test ou utilisez une image existante
    with open(test_file, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{BASE_URL}/api/detect", files=files)
    
    assert response.status_code == 200
    print("✅ Test detection endpoint réussi")
    print("Réponse:", response.json())

def test_recognition():
    test_file = "../frontend/src/assets/images/personne.png"
    with open(test_file, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{BASE_URL}/api/recognize", files=files)
    
    assert response.status_code == 200
    print("✅ Test recognition endpoint réussi")
    print("Réponse:", response.json())

if __name__ == "__main__":
    test_root()
    test_detection()
    test_recognition()