// frontend/src/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Intercepteur pour la gestion globale des erreurs
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.detail || 
                    error.message || 
                    'Erreur inconnue';
    console.error('API Error:', errorMsg);
    return Promise.reject(errorMsg);
  }
);

// Fonctions API spécifiques
export default {
  // Détection de visages
  detectFaces(imageBlob) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'face.jpg');
    return apiClient.post('/detect', formData);
  },

  // Enregistrement de visage
  registerFace(name, faceImages) {
    const formData = new FormData();
    formData.append('name', name);
    faceImages.forEach((img, i) => {
      formData.append(`faces`, img, `face_${i}.jpg`);
    });
    return apiClient.post('/register', formData);
  },

  // Reconnaissance faciale
  recognizeFace(faceBlob) {
    const formData = new FormData();
    formData.append('face', faceBlob, 'verify.jpg');
    return apiClient.post('/recognize', formData);
  },

  // Liste des visages enregistrés
  listFaces() {
    return apiClient.get('/faces');
  }
};