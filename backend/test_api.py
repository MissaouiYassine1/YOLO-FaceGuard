import requests

BASE_URL = "http://localhost:8000"

def test_root():
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    print("✅ Test root endpoint réussi")
    print("Réponse:", response.json())

if __name__ == "__main__":
    test_root()