'''import cv2
import numpy as np

class NightEnhancer:
    def __init__(self):
        self.clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    
    def enhance(self, image):
        """Améliore la visibilité dans des conditions de faible luminosité"""
        # Conversion en LAB
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Amélioration du canal L
        l_enhanced = self.clahe.apply(l)
        
        # Fusion des canaux
        enhanced_lab = cv2.merge((l_enhanced, a, b))
        
        # Reconversion en BGR
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        # Réduction du bruit
        enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
        
        return enhanced'''