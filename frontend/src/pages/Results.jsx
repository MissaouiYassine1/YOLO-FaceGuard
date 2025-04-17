import { useRef, useState, useEffect, useCallback } from 'react';
import '../assets/styles/results.scss';
import { 
  IoVideocam as CameraIcon,
  IoStop as StopIcon,
  IoPause as PauseIcon,
  IoPlay as PlayIcon,
  IoSearch as SearchIcon,
  IoStopCircle as StopCircleIcon,
  IoExpand as ResizeIcon,
  IoDownload as DownloadIcon,
  IoTrash as TrashIcon,
  IoSearchCircle as SearchCircleIcon,
  IoPerson as PersonIcon,
  IoStatsChart as StatsIcon,
  IoRefresh as RefreshIcon,
  IoOptions as OptionsIcon,
  IoCloseCircle as ClearIcon,
  IoImage as ImageIcon,
  IoInformationCircle as InfoIcon,
  IoWarning as WarningIcon,
  IoCameraReverse as SwitchCameraIcon
} from 'react-icons/io5';

document.title = "YOLO FaceGuard - Résultats";

const Results = () => {
  // Références
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  // État unifié
  const [state, setState] = useState({
    // Camera
    cameraState: 'stopped', // 'stopped' | 'running' | 'paused'
    stream: null,
    activeCamera: 'user', // 'user' | 'environment'
    
    // Detection
    detections: [],
    isDetecting: false,
    fps: 0,
    lastDetectionTime: null,
    frozenDetectionTime: null,
    
    // UI
    dimensions: {
      width: '400px',
      height: 'auto',
      aspectRatio: 16/9
    },
    isResizing: false,
    presetSize: 'small',
    showDetectionInfo: false,
    userSelectedSize: null,
    
    // System
    apiError: null,
    isProcessing: false,
    detectionCount: 0
  });

  // Destructuration de l'état
  const {
    cameraState,
    stream,
    activeCamera,
    detections,
    isDetecting,
    fps,
    lastDetectionTime,
    frozenDetectionTime,
    dimensions,
    isResizing,
    presetSize,
    showDetectionInfo,
    userSelectedSize,
    apiError,
    isProcessing,
    detectionCount
  } = state;

  // Mise à jour optimisée de l'état
  const updateState = (newState) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Fonction pour envoyer le frame à l'API
  const detectFaces = async (imageBlob) => {
    const formData = new FormData();
    formData.append('file', imageBlob, 'frame.jpg');

    const response = await fetch('http://localhost:8000/detect', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  };

  // Traitement du frame vidéo
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !isDetecting || cameraState !== 'running') return;

    try {
      // Capturer le frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convertir en Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });

      updateState({ isProcessing: true });
      
      // Envoyer à l'API
      const detectionBlob = await detectFaces(blob);
      const detectionUrl = URL.createObjectURL(detectionBlob);
      
      // Afficher le résultat
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Compter les détections (approximation basée sur les pixels verts)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const greenPixels = countGreenRectangles(imageData.data, canvas.width, canvas.height);
        
        updateState(prev => ({
          isProcessing: false,
          lastDetectionTime: new Date().toLocaleTimeString(),
          fps: calculateFPS(prev.lastDetectionTime),
          detectionCount: greenPixels,
          detections: [...prev.detections, {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            count: greenPixels
          }].slice(-50) // Garder seulement les 50 dernières détections
        }));
        
        URL.revokeObjectURL(detectionUrl);
      };
      img.src = detectionUrl;
      
    } catch (error) {
      console.error('Detection failed:', error);
      updateState({
        apiError: "Erreur de détection - Vérifiez que le serveur est en marche",
        isProcessing: false
      });
    }
  }, [isDetecting, cameraState]);

  // Calculer le FPS
  const calculateFPS = (lastTime) => {
    if (!lastTime) return 0;
    const now = Date.now();
    const last = new Date(lastTime).getTime();
    return Math.floor(1000 / (now - last));
  };

  // Compter les rectangles verts (approximation)
  const countGreenRectangles = (data, width, height) => {
    // Cette méthode compte grossièrement les pixels verts significatifs
    let greenAreas = 0;
    const greenThreshold = 200;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+1] > greenThreshold && data[i] < 50 && data[i+2] < 50) {
        greenAreas++;
      }
    }
    
    // Approximation basée sur la taille moyenne d'un rectangle
    return Math.floor(greenAreas / 500);
  };

  // Boucle de détection
  useEffect(() => {
    let intervalId;
    if (isDetecting && cameraState === 'running') {
      intervalId = setInterval(processFrame, 300); // ~3 FPS pour éviter la surcharge
    }
    return () => clearInterval(intervalId);
  }, [isDetecting, cameraState, processFrame]);

  // Démarrer/arrêter la caméra
  const handleCamera = async (action) => {
    try {
      if (action === 'start' || action === 'switch') {
        if (!navigator.mediaDevices) {
          throw new Error("Accès à la caméra non supporté");
        }

        // Arrêter le flux existant si on switch
        if (action === 'switch' && stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: activeCamera,
            frameRate: { ideal: 30 }
          }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = mediaStream;
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        updateState({
          stream: mediaStream,
          cameraState: 'running',
          dimensions: {
            ...dimensions,
            aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight
          }
        });

        updateCanvasSize();
        applyPresetSize(userSelectedSize || 'small');
      } 
      else if (action === 'stop') {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        updateState({
          stream: null,
          cameraState: 'stopped',
          isDetecting: false,
          fps: 0,
          detections: []
        });
      }
      else if (action === 'pause' && stream) {
        stream.getTracks().forEach(track => track.enabled = false);
        updateState({
          cameraState: 'paused',
          isDetecting: false
        });
      }
      else if (action === 'resume' && stream) {
        stream.getTracks().forEach(track => track.enabled = true);
        updateState({ cameraState: 'running' });
      }
    } catch (err) {
      console.error(`Erreur caméra: ${err.message}`);
      updateState({
        apiError: `Erreur: ${err.message}`,
        cameraState: 'stopped'
      });
      setTimeout(() => updateState({ apiError: null }), 5000);
    }
  };

  // Switch entre caméra avant/arrière
  const switchCamera = () => {
    updateState(prev => ({
      activeCamera: prev.activeCamera === 'user' ? 'environment' : 'user'
    }));
    handleCamera('switch');
  };

  // Redimensionnement canvas
  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  }, []);

  // Appliquer une taille prédéfinie
  const applyPresetSize = (size) => {
    const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
    const sizes = {
      small: 0.4,
      medium: 0.65,
      large: 0.85,
      full: 1
    };
    
    updateState({
      presetSize: size,
      userSelectedSize: cameraState === 'running' ? size : userSelectedSize,
      dimensions: {
        width: size === 'full' ? '100%' : `${containerWidth * sizes[size]}px`,
        height: 'auto',
        aspectRatio: dimensions.aspectRatio
      }
    });
  };

  // Exporter les détections
  const exportDetections = () => {
    const data = {
      timestamp: new Date().toISOString(),
      detections: detections,
      videoResolution: {
        width: videoRef.current?.videoWidth || 0,
        height: videoRef.current?.videoHeight || 0
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detections-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Redimensionnement manuel
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxWidth = containerRef.current.parentElement.clientWidth;
      const newWidth = Math.min(maxWidth, Math.max(300, e.clientX - containerRect.left));
      const newHeight = newWidth / dimensions.aspectRatio;
      
      updateState({
        dimensions: {
          width: `${newWidth}px`,
          height: `${newHeight}px`,
          aspectRatio: dimensions.aspectRatio
        },
        presetSize: 'custom'
      });
    };

    const handleMouseUp = () => updateState({ isResizing: false });

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dimensions.aspectRatio]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  return (
    <div className="results-page">
      {/* Message d'erreur */}
      {apiError && (
        <div className="error-banner" role="alert">
          <WarningIcon size={18} />
          {apiError}
        </div>
      )}

      {/* Indicateur de chargement 
      {isProcessing && (
        <div className="processing-overlay" aria-live="polite">
          <div className="processing-spinner"></div>
          <p>Analyse en cours...</p>
        </div>
      )*/}

      <header className="page-header">
        <h2>
          <CameraIcon size={24} className="header-icon" />
          Détection en Temps Réel
        </h2>
        <button 
          onClick={() => updateState({ showDetectionInfo: !showDetectionInfo })}
          className="info-btn"
          aria-label="Afficher les informations de détection"
        >
          <InfoIcon size={20} />
        </button>
      </header>

      {showDetectionInfo && (
        <div className="info-panel">
          <div className="info-content">
            <h3>Mode Réel</h3>
            <ul>
              <li><strong>Technologie :</strong> YOLOv8 Face Detection</li>
              <li><strong>Résolution :</strong> 1280×720 (adaptative)</li>
              <li><strong>Performance :</strong> ~3 FPS (limité intentionnellement)</li>
              <li><strong>Détections :</strong> En temps réel via API FastAPI</li>
            </ul>
            <button 
              onClick={() => updateState({ showDetectionInfo: false })}
              className="close-info-btn"
            >
              <ClearIcon size={16} /> Fermer
            </button>
          </div>
        </div>
      )}
      
      <div className="realtime-section">
        <div 
          ref={containerRef}
          className="video-contain"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            aspectRatio: dimensions.aspectRatio
          }}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`video-preview ${cameraState === 'paused' ? 'paused' : ''}`}
            aria-label="Flux de la caméra"
          />
          <canvas ref={canvasRef} className="detection-canvas" />
          
          <div 
            ref={resizeHandleRef}
            className="resize-handle"
            onMouseDown={() => updateState({ isResizing: true })}
            title="Redimensionner la vue"
            aria-label="Redimensionner la vue"
          >
            <ResizeIcon size={18} />
          </div>
          
          <div className="video-overlay">
            {cameraState === 'running' && isDetecting && (
              <span className="fps-counter">
                <StatsIcon size={16} className="icon" />
                {fps} FPS
              </span>
            )}
            {(frozenDetectionTime || lastDetectionTime) && cameraState === 'running' && (
              <span className="last-detection">
                <RefreshIcon size={14} className="icon" />
                Dernière détection: {frozenDetectionTime || lastDetectionTime}
              </span>
            )}
            {detectionCount > 0 && (
              <span className="face-count">
                <PersonIcon size={14} className="icon" />
                Visages: {detectionCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="controls">
          {cameraState === 'stopped' ? (
            <button 
              onClick={() => handleCamera('start')} 
              className="control-btn start-btn"
              aria-label="Démarrer la caméra"
            >
              <CameraIcon size={18} className="icon" />
              Démarrer la caméra
            </button>
          ) : (
            <>
              <div className="control-group">
                <button 
                  onClick={() => handleCamera('stop')} 
                  className="control-btn stop-btn"
                  aria-label="Arrêter la caméra"
                >
                  <StopIcon size={18} className="icon" />
                  Arrêter
                </button>
                
                {cameraState === 'running' ? (
                  <button 
                    onClick={() => handleCamera('pause')} 
                    className="control-btn pause-btn"
                    aria-label="Mettre en pause"
                  >
                    <PauseIcon size={18} className="icon" />
                    Pause
                  </button>
                ) : (
                  <button 
                    onClick={() => handleCamera('resume')} 
                    className="control-btn start-btn"
                    aria-label="Reprendre la caméra"
                  >
                    <PlayIcon size={18} className="icon" />
                    Reprendre
                  </button>
                )}

                <button 
                  onClick={switchCamera}
                  className="control-btn switch-btn"
                  aria-label="Changer de caméra"
                >
                  <SwitchCameraIcon size={18} className="icon" />
                  Caméra
                </button>
              </div>
              
              <div className="control-group">
                <button 
                  onClick={() => updateState({ isDetecting: !isDetecting })} 
                  className={`control-btn ${isDetecting ? 'active-btn' : 'detect-btn'}`}
                  disabled={cameraState !== 'running' || isProcessing}
                  aria-label={isDetecting ? 'Arrêter la détection' : 'Démarrer la détection'}
                  aria-busy={isProcessing}
                >
                  {isDetecting ? (
                    <StopCircleIcon size={18} className="icon" />
                  ) : (
                    <SearchCircleIcon size={18} className="icon" />
                  )}
                  {isDetecting ? 'Arrêter détection' : 'Détection'}
                </button>
              </div>
              
              <div className="control-group">
                {detections.length > 0 && (
                  <button 
                    onClick={exportDetections} 
                    className="control-btn save-btn"
                    aria-label="Exporter les détections"
                  >
                    <DownloadIcon size={18} className="icon" />
                    Exporter données
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="size-presets">
          <span className="size-label">
            <OptionsIcon size={16} className="icon" />
            Taille de la vue :
          </span>
          {['small', 'medium', 'large', 'full'].map((size) => (
            <button
              key={size}
              onClick={() => applyPresetSize(size)}
              className={`size-btn ${presetSize === size ? 'active' : ''}`}
              aria-label={`Taille ${size}`}
            >
              {size === 'small' && 'Petit'}
              {size === 'medium' && 'Moyen'}
              {size === 'large' && 'Grand'}
              {size === 'full' && 'Plein écran'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="detection-results">
        <div className="results-header">
          <h3>
            <PersonIcon size={20} className="header-icon" />
            Historique des Détections ({detections.length})
          </h3>
          
          <div className="results-actions">
            {detections.length > 0 && (
              <>
                <button 
                  onClick={() => updateState({ detections: [] })} 
                  className="action-btn clear-btn"
                  aria-label="Effacer toutes les détections"
                >
                  <TrashIcon size={16} className="icon" />
                  Effacer tout
                </button>
                <button 
                  onClick={exportDetections} 
                  className="action-btn save-btn"
                  aria-label="Exporter en JSON"
                >
                  <DownloadIcon size={16} className="icon" />
                  Exporter JSON
                </button>
              </>
            )}
          </div>
        </div>
        
        {detections.length > 0 ? (
          <div className="faces-grid">
            {[...detections].reverse().map((detection) => (
              <div key={detection.id} className="detection-card">
                <div className="detection-info">
                  <h4>
                    <PersonIcon size={14} className="icon" />
                    Détection #{detections.length - detections.indexOf(detection)}
                  </h4>
                  <p><strong>Visages détectés:</strong> {detection.count || 0}</p>
                  <p><strong>Heure:</strong> {new Date(detection.timestamp).toLocaleTimeString()}</p>
                  <p><strong>Durée:</strong> {(Date.now() - new Date(detection.timestamp).getTime()) / 1000}s</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PersonIcon size={48} className="empty-icon" />
            <p>Aucune détection enregistrée</p>
            {cameraState === 'running' ? (
              <p>Activez la détection pour commencer l'analyse</p>
            ) : (
              <p>Démarrez la caméra pour commencer</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;