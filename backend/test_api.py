import requests
import cv2
import numpy as np
import os
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"

def test_detection(image_path: str):
    files = {'file': open(image_path, 'rb')}
    response = requests.post(f"{BASE_URL}/detect", files=files)
    print("Detection Response:", response.json())

def test_recognition(face_path: str):
    files = {'file': open(face_path, 'rb')}
    response = requests.post(f"{BASE_URL}/recognize", files=files)
    print("Recognition Response:", response.json())

def test_register(name: str, image_paths: list):
    files = [('files', open(p, 'rb')) for p in image_paths]
    data = {'name': name}
    response = requests.post(f"{BASE_URL}/register", files=files, data=data)
    print("Registration Response:", response.json())

def test_enhancement(image_path: str):
    files = {'file': open(image_path, 'rb')}
    response = requests.post(f"{BASE_URL}/enhance", files=files)
    
    if response.status_code == 200:
        enhanced = np.frombuffer(response.json()['enhanced_image'], np.uint8)
        enhanced = cv2.imdecode(enhanced, cv2.IMREAD_COLOR)
        cv2.imwrite("enhanced.jpg", enhanced)
        print("Enhanced image saved as enhanced.jpg")

if __name__ == "__main__":
    test_images = [str(Path("test_images") / f) for f in os.listdir("test_images") if f.endswith(".jpg")]
    
    if test_images:
        print("Testing face detection...")
        test_detection(test_images[0])
        
        print("\nTesting face recognition...")
        test_recognition(test_images[0])
        
        print("\nTesting face registration...")
        test_register("test_person", test_images[:2])
        
        print("\nTesting night enhancement...")
        test_enhancement(test_images[0])
    else:
        print("No test images found in test_images directory")