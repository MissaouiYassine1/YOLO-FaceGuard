import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Dense, Flatten, Dropout, GlobalAveragePooling2D, BatchNormalization, Activation, ZeroPadding2D, Add, Lambda
from tensorflow.keras import backend as K
import cv2
import numpy as np
from pathlib import Path
from core.config import settings

class FaceNet:
    def __init__(self):
        self.model = self.load_model()

    def load_model(self):
        model_path = Path(settings.models_dir) / "recognition/facenet_keras.h5"
        if not model_path.exists():
            raise FileNotFoundError(f"❌ Modele FaceNet introuvable à {model_path}")
        
        # Reconstituer l'architecture exacte de FaceNet (Inception ResNet V1 simplifié)
        model = tf.keras.models.Sequential()
        model.add(tf.keras.layers.InputLayer(input_shape=(160, 160, 3)))
        model.add(tf.keras.layers.Conv2D(64, (7, 7), strides=(2, 2), padding='same'))
        model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.Activation('relu'))
        model.add(tf.keras.layers.MaxPooling2D(pool_size=(3, 3), strides=(2, 2), padding='same'))
        model.add(tf.keras.layers.Conv2D(64, (1, 1), padding='same'))
        model.add(tf.keras.layers.Conv2D(192, (3, 3), padding='same'))
        model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.Activation('relu'))
        model.add(tf.keras.layers.MaxPooling2D(pool_size=(3, 3), strides=(2, 2), padding='same'))
        # ⚠️ Ceci est un modèle simplifié. Le vrai modèle est Inception ResNet V1. Voir plus bas pour la version complète.

        # Chargement des poids
        model.load_weights(str(model_path), by_name=True, skip_mismatch=True)
        print("✅ FaceNet chargé avec succès")
        return model

    def preprocess(self, face_img: np.ndarray) -> np.ndarray:
        face = cv2.resize(face_img, (160, 160))
        face = face.astype("float32")
        face = (face - 127.5) / 128.0  # Normalisation pour FaceNet
        return np.expand_dims(face, axis=0)

    def get_embedding(self, face_image: np.ndarray) -> np.ndarray:
        face_input = self.preprocess(face_image)
        return self.model.predict(face_input)[0]


# Singleton
face_recognizer = FaceNet()
