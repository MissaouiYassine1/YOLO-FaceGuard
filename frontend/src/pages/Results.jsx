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

// Configuration API
const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    DETECT: '/api/detect',
    RECOGNIZE: '/api/recognize'
  },
  TIMEOUT: 10000 // 10 seconds
};

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
    isProcessing: false
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
    isProcessing
  } = state;

  // Mise à jour optimisée de l'état
  const updateState = (newState) => {
    setState(prev => ({ ...prev, ...newState }));
  };

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
          detections: [],
          isDetecting: false,
          fps: 0
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

  // Détection avec gestion d'erreur et timeout
  const sendFrameToBackend = async () => {
    try {
      // 1. Capture du frame
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => 
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
  
      // 2. Détection YOLO
      const detection = await apiClient.detectFaces(blob);
      if (!detection?.faces) return;
  
      // 3. Mise à jour de l'état
      updateState({
        detections: [
          ...detections,
          ...detection.faces.map(face => ({
            id: crypto.randomUUID(),
            box: face.bbox,
            identity: face.identity || { name: "Inconnu", confidence: 0 }
          }))
        ],
        lastDetectionTime: new Date().toLocaleTimeString()
      });
  
    } catch (err) {
      updateState({ apiError: `Erreur détection: ${err.message}` });
    }
  };

  // Boucle de détection optimisée
  useEffect(() => {
    let animationId;
    let lastTimestamp = 0;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const detectionLoop = (timestamp) => {
      if (isDetecting && cameraState === 'running') {
        // Limiter à ~15 FPS pour réduire la charge CPU
        if (timestamp - lastTimestamp >= 1000 / 15) {
          sendFrameToBackend();
          lastTimestamp = timestamp;
          frameCount++;
        }

        // Mettre à jour les FPS toutes les secondes
        if (timestamp - lastFpsUpdate >= 1000) {
          updateState({ fps: Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate)) });
          frameCount = 0;
          lastFpsUpdate = timestamp;
        }
      }
      animationId = requestAnimationFrame(detectionLoop);
    };

    animationId = requestAnimationFrame(detectionLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isDetecting, cameraState]);

  // Dessin des détections
  const drawDetections = useCallback(() => {
    if (!canvasRef.current || detections.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner seulement les 5 dernières détections
    detections.slice(-5).forEach(det => {
      const { x, y, width, height } = det.box;
      const { name, confidence } = det.identity;

      // Box de détection
      ctx.strokeStyle = confidence > 0.8 ? '#4CD964' : '#FF3B30';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Label
      ctx.fillStyle = confidence > 0.8 ? 'rgba(76, 217, 100, 0.7)' : 'rgba(255, 59, 48, 0.7)';
      ctx.fillRect(x, y - 20, 120, 20);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${name} (${Math.round(confidence * 100)}%)`,
        x + 5,
        y - 5
      );
    });
  }, [detections]);

  useEffect(() => {
    if (detections.length > 0) drawDetections();
  }, [detections, drawDetections]);

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

  // Exporter les détections
  const exportDetections = (format = 'json') => {
    const data = {
      timestamp: new Date().toISOString(),
      detections: detections,
      videoResolution: {
        width: videoRef.current?.videoWidth || 0,
        height: videoRef.current?.videoHeight || 0
      }
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detections-${new Date().toISOString().slice(0, 19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="results-page">
      {/* Message d'erreur */}
      {apiError && (
        <div className="error-banner" role="alert">
          <WarningIcon size={18} />
          {apiError}
        </div>
      )}

      {/* Indicateur de chargement */}
      {isProcessing && (
        <div className="processing-overlay" aria-live="polite">
          <div className="processing-spinner"></div>
          <p>Analyse en cours...</p>
        </div>
      )}

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
            <h3>Informations sur la détection</h3>
            <ul>
              <li><strong>Technologie :</strong> YOLO FaceGuard (version 1.0)</li>
              <li><strong>Précision :</strong> 92-96% selon les conditions</li>
              <li><strong>Latence :</strong> ~120ms par détection</li>
              <li><strong>Résolution :</strong> 1280x720 recommandée</li>
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
                  {isDetecting ? 'Arrêter détection' : 'Détection auto'}
                </button>
                
                <button 
                  onClick={sendFrameToBackend} 
                  className="control-btn detect-btn"
                  disabled={cameraState !== 'running' || isProcessing}
                  aria-label="Détection manuelle"
                >
                  <SearchIcon size={18} className="icon" />
                  Détection manuelle
                </button>
              </div>
              
              <div className="control-group">
                {detections.length > 0 && (
                  <button 
                    onClick={() => exportDetections('json')} 
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
            Visages Détectés ({detections.length})
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
                  onClick={() => exportDetections('json')} 
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
            {[...detections].reverse().map((face) => (
              <div key={face.id} className="face-card">
                <div className="face-info">
                  <h4>
                    <PersonIcon size={14} className="icon" />
                    {face.identity.name}
                  </h4>
                  <p><strong>Confiance:</strong> {Math.round(face.identity.confidence * 100)}%</p>
                  <p><strong>Position:</strong> {Math.round(face.box.x)}px, {Math.round(face.box.y)}px</p>
                  <p><strong>Taille:</strong> {Math.round(face.box.width)}×{Math.round(face.box.height)}</p>
                  <p className="timestamp">
                    <small>{new Date(face.timestamp).toLocaleTimeString()}</small>
                  </p>
                </div>
                <div className="face-preview-container">
                  <div 
                    className="face-preview" 
                    style={{
                      backgroundImage: `url(${canvasRef.current?.toDataURL() || ''})`,
                      backgroundPosition: `-${Math.round(face.box.x)}px -${Math.round(face.box.y)}px`,
                      width: `${Math.round(face.box.width)}px`,
                      height: `${Math.round(face.box.height)}px`
                    }}
                    aria-label={`Aperçu du visage de ${face.identity.name}`}
                  />
                  <div className="face-preview-label">
                    <ImageIcon size={12} /> Aperçu
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PersonIcon size={48} className="empty-icon" />
            <p>Aucune détection disponible</p>
            {cameraState === 'running' ? (
              <p>Cliquez sur "Détecter" pour analyser le flux vidéo</p>
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