import { useRef, useState, useEffect } from 'react';
import { 
  IoCamera as CameraIcon,
  IoPersonAdd as AddPersonIcon,
  IoClose as CloseIcon,
  IoCheckmarkDone as ConfirmIcon,
  IoTrash as DeleteIcon,
  IoArrowBack as BackIcon,
  IoInformationCircle as InfoIcon,
  IoImages as GalleryIcon,
  IoWarning as WarningIcon
} from 'react-icons/io5';
import '../assets/styles/register.scss';
import { registerFace } from '../api';

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
  const [step, setStep] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionLoading, setFaceDetectionLoading] = useState(false);

  // Effet pour les messages d'erreur temporaires
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      videoRef.current.srcObject = mediaStream;
      
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = resolve;
      });
      
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
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraActive(false);
  };

  // Simuler la détection de visage
  const simulateFaceDetection = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.2); // 80% de succès
      }, 500);
    });
  };

  // Capturer une image
  const captureImage = async () => {
    if (!isCameraActive || !videoRef.current || capturedImages.length >= 5) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFaceDetectionLoading(true);
    try {
      const hasFace = await simulateFaceDetection();
      setFaceDetected(hasFace);

      if (!hasFace) {
        setError("Aucun visage détecté. Veuillez repositionner votre visage.");
        return;
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImages(prev => [
        ...prev,
        {
          id: Date.now(),
          data: imageData,
          timestamp: new Date().toLocaleTimeString(),
          blob: null
        }
      ]);
    } catch (err) {
      setError("Erreur lors de la capture");
      console.error(err);
    } finally {
      setFaceDetectionLoading(false);
    }
  };

  // Gérer l'upload de fichiers
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - capturedImages.length);
    if (files.length === 0) return;

    setFaceDetectionLoading(true);
    try {
      for (const file of files) {
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        const hasFace = await simulateFaceDetection();
        if (!hasFace) {
          setError(`Aucun visage détecté dans ${file.name}`);
          continue;
        }

        setCapturedImages(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            data: imageData,
            timestamp: new Date().toLocaleTimeString(),
            blob: null
          }
        ]);
      }
    } catch (err) {
      setError("Erreur lors du traitement des images");
      console.error(err);
    } finally {
      setFaceDetectionLoading(false);
    }
  };

  // Supprimer une image
  const deleteImage = (id) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage === id) setSelectedImage(null);
  };

  // Simuler l'enregistrement
  const submitRegistration = async () => {
    setLoading(true);
    try {
      const result = await registerFace(name, capturedImages);
      
      if (result.status === "success") {
        setSuccess(true);
        setStep(3);
      } else {
        setError(result.message || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          >
            <InfoIcon size={20} />
          </button>
        </header>

        {instructionsExpanded && (
          <div className="instructions-panel">
            <h3>Instructions</h3>
            <ul>
              <li>Capturer 3-5 images sous différents angles</li>
              <li>Maintenir une expression neutre</li>
              <li>Bonne luminosité</li>
            </ul>
            <button onClick={() => setInstructionsExpanded(false)} className="close-btn">
              <CloseIcon size={16} /> Fermer
            </button>
          </div>
        )}

        <div className="capture-section">
          <div className="camera-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`camera-feed ${isCameraActive ? 'active' : 'inactive'}`}
            />
            <canvas ref={canvasRef} className="capture-canvas" style={{ display: 'none' }} />
            
            {!isCameraActive && (
              <div className="camera-placeholder">
                <CameraIcon size={48} />
                <p>Caméra inactive</p>
              </div>
            )}

            <div className="camera-controls">
              {isCameraActive ? (
                <>
                  <button 
                    onClick={captureImage} 
                    className="control-btn capture-btn"
                    disabled={faceDetectionLoading || capturedImages.length >= 5}
                  >
                    {faceDetectionLoading ? (
                      <span className="spinner small"></span>
                    ) : (
                      <>
                        <CameraIcon size={20} /> Capturer
                        {capturedImages.length > 0 && ` (${capturedImages.length}/5)`}
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
                disabled={faceDetectionLoading || capturedImages.length >= 5}
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
            
            {error && (
              <div className="error-message fade-out">
                <WarningIcon size={16} /> {error}
              </div>
            )}

            <div className="preview-grid">
              {capturedImages.map((img) => (
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

              {Array.from({ length: Math.max(0, 5 - capturedImages.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="preview-item empty">
                  <AddPersonIcon size={24} />
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
                  <span>{img.timestamp}</span>
                  <button onClick={() => deleteImage(img.id)} className="delete-btn">
                    <DeleteIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="review-details">
            <h3>Détails</h3>
            <div className="detail-item">
              <strong>Nom :</strong> {name}
            </div>
            <div className="detail-item">
              <strong>Images :</strong> {capturedImages.length}
            </div>
            <div className="detail-item">
              <strong>Date :</strong> {new Date().toLocaleDateString()}
            </div>

            {error && (
              <div className="error-message fade-out">
                <WarningIcon size={16} /> {error}
              </div>
            )}

            <div className="review-actions">
              <button onClick={() => setStep(1)} className="back-btn">
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
          <h3>Succès !</h3>
          <p><strong>{name}</strong> a été enregistré(e)</p>
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
  );
};

export default Register;