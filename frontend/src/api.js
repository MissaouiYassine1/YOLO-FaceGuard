/**
 * Client API pour YOLO-FaceGuard
 * Documentation Swagger : http://localhost:8000/docs
 */

const API_BASE_URL = "http://localhost:8000";

// ======================== Fonctions Principales ========================

/**
 * Enregistre un nouveau visage dans la base de données
 * @param {string} name - Nom de la personne
 * @param {Array<{data: string}>} images - Tableau d'images (DataURL ou Blob)
 * @returns {Promise<{status: string, name: string, num_faces: number, message: string}>}
 */
export const registerFace = async (name, images) => {
  const formData = new FormData();
  formData.append("name", name);

  try {
    // Conversion des images en Blobs
    for (const [index, img] of images.entries()) {
      let blob;
      if (img.data.startsWith('blob:')) {
        blob = await fetch(img.data).then(r => r.blob());
      } else {
        // Gestion des DataURL base64
        const res = await fetch(img.data);
        blob = await res.blob();
      }
      formData.append("images", blob, `face_${name}_${index}.jpg`);
    }

    const response = await fetch(`${API_BASE_URL}/register-face`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Erreur lors de l'enregistrement");
    }

    return await response.json();
  } catch (error) {
    console.error("API.registerFace error:", error);
    throw new Error(`Échec de l'enregistrement: ${error.message}`);
  }
};

/**
 * Détecte et reconnaît les visages dans une image
 * @param {Blob|File} imageBlob - Image à analyser
 * @returns {Promise<Blob>} - Image annotée au format Blob (JPEG)
 */
export const detectFaces = async (imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');

  try {
    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Erreur lors de la détection");
    }

    return await response.blob();
  } catch (error) {
    console.error('API.detectFaces error:', error);
    throw new Error(`Échec de la détection: ${error.message}`);
  }
};

// ======================== Fonctions Utilitaires ========================

/**
 * Récupère la liste des visages enregistrés
 * @returns {Promise<{count: number, names: string[], last_added: string|null}>}
 */
export const getRegisteredFaces = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/registered-faces`);
    return await response.json();
  } catch (error) {
    console.error("API.getRegisteredFaces error:", error);
    throw new Error("Impossible de charger les visages enregistrés");
  }
};

/**
 * Vérifie l'état de l'API
 * @returns {Promise<{status: string, faces_registered: number, model: string}>}
 */
export const checkAPIStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return await response.json();
  } catch (error) {
    console.error("API.checkAPIStatus error:", error);
    throw new Error("API indisponible");
  }
};

// ======================== Helpers pour le Frontend ========================

/**
 * Convertit un Blob en URL utilisable dans un <img>
 * @param {Blob} blob 
 * @returns {string} DataURL
 */
export const blobToDataURL = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

/**
 * Capture une frame depuis une vidéo
 * @param {HTMLVideoElement} videoElement 
 * @param {number} [quality=0.92] - Qualité JPEG (0-1)
 * @returns {Promise<Blob>}
 */
export const captureVideoFrame = async (videoElement, quality = 0.92) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
};

// ======================== Types (pour TypeScript) ========================
/**
 * @typedef {Object} FaceDetectionResult
 * @property {string} name - Nom reconnu ou "Inconnu"
 * @property {number} similarity - Pourcentage de similarité (0-1)
 * @property {number[]} bbox - [x1, y1, x2, y2]
 */

/**
 * @typedef {Object} RegisteredFace
 * @property {string} name
 * @property {string[]} imagePaths
 */