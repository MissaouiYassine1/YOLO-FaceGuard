import { useRef, useState, useEffect } from 'react';
import { 
  IoCamera as CameraIcon,
  IoPersonAdd as AddPersonIcon,
  IoClose as CloseIcon,
  IoCheckmarkDone as ConfirmIcon,
  IoTrash as DeleteIcon,
  IoArrowBack as BackIcon,
  IoInformationCircle as InfoIcon,
  IoRefresh as RetryIcon,
  IoImages as GalleryIcon,
  IoWarning as WarningIcon
} from 'react-icons/io5';
import '../assets/styles/register.scss';
import apiClient from '../api'

// Configuration API
const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    DETECT: '/api/detect',
    RECOGNIZE: '/api/recognize',
    REGISTER: '/api/register'  
  },
  TIMEOUT: 10000 // 10 seconds
};

document.title = "YOLO FaceGuard - Enregistrement";

const Register = () => {
  // Références
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // États
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [name, setName] = useState('');
  const [step, setStep] = useState(1); // 1: Capture, 2: Review, 3: Confirmation
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionLoading, setFaceDetectionLoading] = useState(false);

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error("Erreur de lecture vidéo:", e));
      }
      setStream(mediaStream);
      setIsCameraActive(true);
      setError(null);
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      setError(`Erreur de caméra: ${err.message}`);
      setIsCameraActive(false);
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Détecter un visage via l'API
  const detectFaceAPI = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'face.jpg');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DETECT}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur de détection');

      const data = await response.json();
      return data.faces && data.faces.length > 0;
    } catch (error) {
      console.error('Erreur de détection:', error);
      return false;
    }
  };

  // Capturer une image
  const captureImage = async () => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFaceDetectionLoading(true);
    try {
      // Convertir en blob pour l'API
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      // Vérifier la détection de visage via l'API
      const hasFace = await detectFaceAPI(blob);
      setFaceDetected(hasFace);

      if (!hasFace) {
        setError("Aucun visage détecté. Veuillez positionner votre visage correctement.");
        return;
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImages(prev => [...prev, {
        id: Date.now(),
        data: imageData,
        timestamp: new Date().toLocaleTimeString(),
        blob: blob
      }]);
      setError(null);
    } catch (err) {
      setError("Erreur lors de la détection du visage");
      console.error(err);
    } finally {
      setFaceDetectionLoading(false);
    }
  };

  // Supprimer une image capturée
  const deleteImage = (id) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage === id) setSelectedImage(null);
  };

  // Soumettre les images au backend
  const submitRegistration = async () => {
    try {
      setLoading(true);
      
      const result = await apiClient.registerFace(
        name,
        capturedImages.map(img => img.blob)
      );
  
      if (result.success) {
        setSuccess(true);
        setStep(3);
      }
    } catch (err) {
      setError(`Échec enregistrement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  // Gérer les fichiers uploadés
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFaceDetectionLoading(true);
    try {
      for (const file of files) {
        // Lire le fichier comme URL de données
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });

        // Convertir en blob pour la détection
        const blob = await fetch(imageData).then(res => res.blob());

        // Vérifier la présence d'un visage
        const hasFace = await detectFaceAPI(blob);
        if (!hasFace) {
          setError(`Aucun visage détecté dans ${file.name}`);
          continue;
        }

        setCapturedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: imageData,
          timestamp: new Date().toLocaleTimeString(),
          blob: blob
        }]);
      }
    } catch (err) {
      setError("Erreur lors du traitement des images");
      console.error(err);
    } finally {
      setFaceDetectionLoading(false);
    }
  };

  // Nettoyage
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Étape 1: Capture
  if (step === 1) {
    return (
      <div className="register-page">
        <header className="page-header">
          <h2>
            <AddPersonIcon size={24} className="header-icon" />
            Enregistrer un nouveau visage
          </h2>
          <button 
            onClick={() => setInstructionsExpanded(!instructionsExpanded)}
            className="info-btn"
            aria-label="Afficher les instructions"
          >
            <InfoIcon size={20} />
          </button>
        </header>

        {instructionsExpanded && (
          <div className="instructions-panel">
            <h3>Instructions d'enregistrement</h3>
            <ol>
              <li>Positionnez-vous face à la caméra avec un éclairage uniforme</li>
              <li>Maintenez une expression neutre</li>
              <li>Capturer 3-5 images sous différents angles</li>
              <li>Évitez les lunettes ou accessoires masquant le visage</li>
            </ol>
            <button 
              onClick={() => setInstructionsExpanded(false)}
              className="close-btn"
            >
              <CloseIcon size={16} /> Fermer
            </button>
          </div>
        )}

        <div className="capture-section">
          <div className="camera-container">
            {isCameraActive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="camera-feed"
                  style={{ width: '100%', height: 'auto' }}
                />
                <canvas 
                  ref={canvasRef} 
                  className="capture-canvas" 
                  style={{ display: 'none' }} 
                />
              </>
            ) : (
              <div className="camera-placeholder">
                <CameraIcon size={48} className="placeholder-icon" />
                <p>Caméra inactive</p>
              </div>
            )}

            <div className="camera-controls">
              {isCameraActive ? (
                <>
                  <button 
                    onClick={captureImage} 
                    className="control-btn capture-btn"
                    disabled={faceDetectionLoading}
                  >
                    {faceDetectionLoading ? (
                      <span className="spinner small"></span>
                    ) : (
                      <>
                        <CameraIcon size={20} /> Capturer
                      </>
                    )}
                  </button>
                  <button onClick={stopCamera} className="control-btn stop-btn">
                    <CloseIcon size={20} /> Arrêter
                  </button>
                </>
              ) : (
                <button onClick={startCamera} className="control-btn start-btn">
                  <CameraIcon size={20} /> Activer la caméra
                </button>
              )}

              <button 
                onClick={() => fileInputRef.current.click()} 
                className="control-btn upload-btn"
                disabled={faceDetectionLoading}
              >
                {faceDetectionLoading ? (
                  <span className="spinner small"></span>
                ) : (
                  <>
                    <GalleryIcon size={20} /> Importer
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </button>
            </div>
          </div>

          <div className="preview-section">
            <h3>Images capturées ({capturedImages.length}/5)</h3>
            
            {error && (
              <div className="error-message">
                <WarningIcon size={16} /> {error}
              </div>
            )}

            <div className="preview-grid">
              {capturedImages.slice(0, 5).map((img) => (
                <div 
                  key={img.id} 
                  className={`preview-item ${selectedImage === img.id ? 'selected' : ''}`}
                  onClick={() => setSelectedImage(img.id)}
                >
                  <img src={img.data} alt={`Capture ${img.timestamp}`} />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(img.id);
                    }} 
                    className="delete-btn"
                  >
                    <DeleteIcon size={14} />
                  </button>
                </div>
              ))}

              {Array.from({ length: 5 - capturedImages.length }).map((_, index) => (
                <div key={`empty-${index}`} className="preview-item empty">
                  <div className="empty-slot">
                    <AddPersonIcon size={24} />
                  </div>
                </div>
              ))}
            </div>

            <div className="name-input">
              <label htmlFor="personName">Nom de la personne :</label>
              <input
                id="personName"
                type="text"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Saisissez le nom complet"
                maxLength={50}
              />
            </div>

            {capturedImages.length > 0 && name.trim() && (
              <button 
                onClick={() => setStep(2)} 
                className="next-btn"
                disabled={capturedImages.length === 0 || !name.trim() || faceDetectionLoading}
              >
                Suivant <ConfirmIcon size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Étape 2: Revue
  if (step === 2) {
    return (
      <div className="register-page">
        <header className="page-header">
          <h2>
            <AddPersonIcon size={24} className="header-icon" />
            Confirmer l'enregistrement
          </h2>
        </header>

        <div className="review-section">
          <div className="review-images">
            {capturedImages.map((img) => (
              <div key={img.id} className="review-image">
                <img src={img.data} alt={`Capture ${img.timestamp}`} />
                <div className="image-meta">
                  <span className="timestamp">{img.timestamp}</span>
                  <button 
                    onClick={() => deleteImage(img.id)} 
                    className="delete-btn"
                  >
                    <DeleteIcon size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="review-details">
            <h3>Détails de l'enregistrement</h3>
            
            <div className="detail-item">
              <strong>Nom :</strong>
              <span>{name || <em>Non spécifié</em>}</span>
            </div>
            
            <div className="detail-item">
              <strong>Nombre d'images :</strong>
              <span>{capturedImages.length}</span>
            </div>
            
            <div className="detail-item">
              <strong>Date :</strong>
              <span>{new Date().toLocaleDateString()}</span>
            </div>

            {error && (
              <div className="error-message">
                <WarningIcon size={16} /> {error}
              </div>
            )}

            <div className="review-actions">
              <button 
                onClick={() => setStep(1)} 
                className="back-btn"
                disabled={loading}
              >
                <BackIcon size={18} /> Retour
              </button>
              
              <button 
                onClick={submitRegistration} 
                className="confirm-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <ConfirmIcon size={18} /> Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Étape 3: Confirmation
  return (
    <div className="register-page">
      <header className="page-header">
        <h2>
          <AddPersonIcon size={24} className="header-icon" />
          Enregistrement réussi
        </h2>
      </header>

      <div className="confirmation-section">
        <div className="confirmation-card">
          <div className="success-icon">
            <ConfirmIcon size={48} />
          </div>
          
          <h3>Visage enregistré avec succès !</h3>
          
          <div className="confirmation-details">
            <p><strong>Nom :</strong> {name}</p>
            <p><strong>Images :</strong> {capturedImages.length} enregistrées</p>
            <p><strong>Date :</strong> {new Date().toLocaleString()}</p>
          </div>

          <div className="confirmation-actions">
            <button 
              onClick={() => {
                setName('');
                setCapturedImages([]);
                setStep(1);
                setSuccess(false);
                stopCamera();
              }} 
              className="new-registration-btn"
            >
              <AddPersonIcon size={18} /> Nouvel enregistrement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;