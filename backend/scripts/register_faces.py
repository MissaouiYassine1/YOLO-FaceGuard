import cv2
import numpy as np
from core.face_recognizer import FaceRecognizer
from core.face_detector import FaceDetector
import argparse

def register_from_images(name: str, image_paths: list):
    detector = FaceDetector()
    recognizer = FaceRecognizer()
    
    embeddings = []
    for path in image_paths:
        image = cv2.imread(path)
        if image is None:
            print(f"Could not read image: {path}")
            continue
        
        faces = detector.detect(image)
        if not faces:
            print(f"No faces found in {path}")
            continue
        
        # Prendre le premier visage détecté
        x1, y1, x2, y2 = faces[0]
        face_img = image[y1:y2, x1:x2]
        
        embedding = recognizer.extract_embedding(face_img)
        if embedding is not None:
            embeddings.append(embedding)
    
    if embeddings:
        face_id = recognizer.register_face(name, np.array(embeddings))
        print(f"Registered {name} with ID: {face_id} and {len(embeddings)} embeddings")
    else:
        print("No valid faces found to register")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Register faces from images")
    parser.add_argument("name", help="Name of the person to register")
    parser.add_argument("images", nargs='+', help="Paths to images containing the face")
    
    args = parser.parse_args()
    register_from_images(args.name, args.images)