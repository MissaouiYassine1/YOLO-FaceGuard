# 🧠 YOLO FaceGuard API

Bienvenue dans l'API **YOLO FaceGuard**, une solution intelligente basée sur **FastAPI** pour la **détection et reconnaissance faciale en temps réel**. Ce backend utilise des techniques avancées de **Computer Vision** pour fournir une expérience fiable, rapide et efficace.

## 🚀 Fonctionnalités de Computer Vision

### 1. 📸 Détection de Visages avec YOLOv8
- Utilise le modèle **YOLOv8n-face** pour détecter des visages dans une image.
- Fonctionne même sur des images à faible luminosité grâce à un **module d'amélioration nocturne**.
- Retourne les coordonnées précises des visages détectés.

### 2. 🧬 Reconnaissance Faciale avec InceptionResnetV1
- Intègre **InceptionResnetV1** (pré-entraîné sur VGGFace2) pour extraire des **empreintes faciales**.
- Compare les embeddings à ceux de la base enregistrée avec une **similarité cosinus**.
- Identifie l’individu ou retourne “Inconnu” si aucune correspondance n’est trouvée.

### 3. ✍️ Enregistrement de Nouveaux Visages
- Permet d’enregistrer un nouveau visage via un formulaire (nom + 3 à 5 images).
- Chaque image est analysée :
  - Le visage est détecté avec YOLO.
  - Un **embedding** est généré pour chaque visage.
- L’API fait une **moyenne pondérée** des embeddings pour plus de robustesse.

### 4. 🌒 Amélioration Automatique d’Images Sombres
- Détection automatique des images à faible luminosité.
- Utilise :
  - Conversion LAB + CLAHE (Contraste adaptatif).
  - Dénonçage avec `fastNlMeansDenoisingColored`.

### 5. ⚡ Traitement Asynchrone & Parallèle
- Intégration de **ThreadPoolExecutor** pour :
  - L'inférence des modèles (YOLO, ResNet).
  - Le traitement des images (lecture, sauvegarde, conversion).
- Toutes les tâches lourdes sont exécutées **hors du thread principal**.

### 6. 💾 Base de Données de Visages
- Stockée localement sous forme d’un fichier `.npy`.
- Contient :
  - `names` : noms enregistrés.
  - `embeddings` : vecteurs d’identité faciale.
  - `image_paths` : chemins d’accès aux images originales.

---

## 🔌 Endpoints Principaux

| Méthode | URL               | Description                      |
|--------|-------------------|----------------------------------|
| POST   | `/register-face`  | Enregistrer un nouveau visage   |
| POST   | `/detect`         | Détecter et reconnaître un visage |

---

## 🛠️ Stack Technologique

- **FastAPI** : Framework backend ultra-rapide.
- **OpenCV** : Manipulation et traitement d’images.
- **YOLOv8** : Détection rapide de visages.
- **facenet-pytorch** : Reconnaissance faciale.
- **Torch** + **Sklearn** : Modèles et similarité.
- **AsyncIO** + **ThreadPoolExecutor** : Optimisation parallèle.

---

## 📂 Organisation des Fichiers

- `face_db.npy` : Base de données d’empreintes faciales.
- `registered_faces/` : Images sauvegardées des visages enregistrés.
- `yolov8n-face.pt` : Poids du modèle YOLO utilisé.

---

## 🧪 Exemple d'utilisation

### ➕ Enregistrement de visage
- Envoie les "frames" :
  - `name` : Nom de la personne.
  - `images[]` : Liste d’images du visage.

### 🔍 Détection et Reconnaissance
- Upload d’une seule image.
- L’API :
  - Détecte les visages.
  - Améliore l’image si nécessaire.
  - Retourne le **nom estimé** et la **similarité**.

---

## 📦 À venir
- Suivi vidéo en direct (Webcam).
- Visualisation graphique des résultats (video frame).
- Interface utilisateur (frontend léger react vite).

---

## 👤 Auteurs
Missaoui Yassine,Emna Kaaniche et Maryem Kbayer.

---

