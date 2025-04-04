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
  IoImages as GalleryIcon
} from 'react-icons/io5';
import '../assets/styles/register.scss';

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

  // Capturer une image
  const captureImage = () => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Vérifier la détection de visage (simulé - à remplacer par votre logique YOLO)
    const hasFace = detectFaceOnCanvas(canvas);
    setFaceDetected(hasFace);

    if (!hasFace) {
      setError("Aucun visage détecté. Veuillez positionner votre visage correctement.");
      return;
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, {
      id: Date.now(),
      data: imageData,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setError(null);
  };

  // Fonction simulée de détection de visage
  const detectFaceOnCanvas = (canvas) => {
    // À remplacer par votre logique YOLO réelle
    return Math.random() > 0.2; // 80% de chance de détection pour la démo
  };

  // Supprimer une image capturée
  const deleteImage = (id) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage === id) setSelectedImage(null);
  };

  // Soumettre les images au backend
  const submitRegistration = async () => {
    if (!name.trim() || capturedImages.length === 0) {
      setError("Veuillez saisir un nom et capturer au moins une image");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simuler l'envoi au backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setStep(3);
    } catch (err) {
      setError("Erreur lors de l'enregistrement. Veuillez réessayer.");
      console.error("Erreur d'enregistrement:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les fichiers uploadés
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: event.target.result,
          timestamp: new Date().toLocaleTimeString()
        }]);
      };
      reader.readAsDataURL(file);
    });
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
                />
                <canvas ref={canvasRef} className="capture-canvas" style={{ display: 'none' }} />
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
                  <button onClick={captureImage} className="control-btn capture-btn">
                    <CameraIcon size={20} /> Capturer
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
              >
                <GalleryIcon size={20} /> Importer
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
            
            {error && <div className="error-message">{error}</div>}

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
                disabled={capturedImages.length === 0 || !name.trim()}
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

            {error && <div className="error-message">{error}</div>}

            <div className="review-actions">
              <button 
                onClick={() => setStep(1)} 
                className="back-btn"
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
            <p><strong>ID :</strong> {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>

          <div className="confirmation-actions">
            <button 
              onClick={() => {
                setName('');
                setCapturedImages([]);
                setStep(1);
                setSuccess(false);
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