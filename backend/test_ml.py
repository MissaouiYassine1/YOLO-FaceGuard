import cv2
from core.face_detector import face_detector
from core.face_recognizer import face_recognizer

def test_face_recognition(image_path: str):
    print("\n=== Starting Face Recognition Test ===")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ Failed to load image: {image_path}")
        return

    # Face detection
    print("Detecting faces...")
    boxes = face_detector.detect(image)
    print(f"Detected {len(boxes)} faces")

    if boxes:
        # Process first face
        x1, y1, x2, y2 = boxes[0]
        face_img = image[y1:y2, x1:x2]
        
        # Ensure recognizer is loaded
        if face_recognizer.model is None:
            print("❌ Face recognizer not initialized")
            return

        print("Generating embedding...")
        try:
            embedding = face_recognizer.get_embedding(face_img)
            print(f"✅ Embedding generated (length: {len(embedding)})")
            print("First 5 values:", embedding[:5])
        except Exception as e:
            print(f"❌ Embedding generation failed: {str(e)}")

    print("=== Test Completed ===")

if __name__ == "__main__":
    test_face_recognition("personne.png")  # Replace with your test image