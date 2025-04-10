import numpy as np
from database.database import SessionLocal
from database import crud

def test_db_operations():
    db = SessionLocal()
    
    # Test création
    embedding = np.random.rand(128)
    face = crud.create_face(db, name="Test", embedding=embedding)
    print(f"✅ Face créée: {face.id} - {face.name}")
    
    # Test lecture
    retrieved = crud.get_face(db, face.id)
    print(f"✅ Face lue: {retrieved.name}")
    
    # Nettoyage
    crud.delete_face(db, face.id)
    print("✅ Test terminé avec succès")

if __name__ == "__main__":
    test_db_operations()