import cv2
import numpy as np

class NightEnhancer:
    def enhance(self, image):
        """Améliore la visibilité des images nocturnes"""
        # Convertir en LAB pour travailler sur la luminosité
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l_enhanced = clahe.apply(l)
        
        # Fusionner les canaux
        enhanced_lab = cv2.merge((l_enhanced, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        # Réduction du bruit
        enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
        
        return enhanced