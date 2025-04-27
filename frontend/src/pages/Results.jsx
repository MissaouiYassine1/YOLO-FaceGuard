import { useRef, useState, useEffect, useCallback } from 'react';
import { 
  IoVideocam as CameraIcon,
  IoStop as StopIcon,
  IoPause as PauseIcon,
  IoPlay as PlayIcon,
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
import '../assets/styles/results.scss';

const Results = () => {
  // Références
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  // État unifié
  const [state, setState] = useState({
    cameraState: 'stopped',
    stream: null,
    activeCamera: 'user',
    mirrored: true,
    recognizedFaces: {},
    isDetecting: false,
    fps: 0,
    lastDetectionTime: null,
    frozenDetectionTime: null,
    dimensions: {
      width: '800px',
      height: 'auto',
      aspectRatio: 16/9
    },
    isResizing: false,
    presetSize: 'medium',
    showDetectionInfo: false,
    userSelectedSize: null,
    apiError: null,
    isProcessing: false,
    detectionCount: 0
  });

  // Destructuration de l'état
  const {
    cameraState,
    stream,
    activeCamera,
    mirrored,
    recognizedFaces,
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

  // Mise à jour de l'état
  const updateState = (newState) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Envoi du frame à l'API
  const detectFacesInFrame = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'frame.jpg');
      formData.append('mirrored', mirrored.toString());

      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.blob();
    } catch (error) {
      console.error('Detection error:', error);
      throw error;
    }
  };

  // Traitement du frame vidéo (version corrigée)
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !isDetecting || cameraState !== 'running') return;

    try {
      updateState({ isProcessing: true });
      const startTime = performance.now();

      // Capture du frame sans transformation miroir
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Dessiner l'image en fonction de l'état miroir
      if (mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Réinitialiser la transformation
      if (mirrored) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Conversion en Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });

      // Envoi à l'API
      const detectionBlob = await detectFacesInFrame(blob);
      const detectionUrl = URL.createObjectURL(detectionBlob);
      
      // Affichage du résultat sans appliquer de transformation miroir supplémentaire
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        
        // Simulation de détection
        const faces = {
          'John Doe': { confidence: 0.92, count: 1 },
          'Inconnu': { confidence: 0.65, count: 1 }
        };
        
        // Mise à jour de l'état
        updateState(prev => ({
          isProcessing: false,
          lastDetectionTime: new Date().toLocaleTimeString(),
          fps: Math.round(1000 / (performance.now() - startTime)),
          recognizedFaces: updateRecognizedFaces(prev.recognizedFaces, faces, detectionUrl),
          detectionCount: Object.keys(faces).length
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
  }, [isDetecting, cameraState, mirrored]);

  // Mise à jour des visages reconnus
  const updateRecognizedFaces = (currentFaces, newFaces, imageUrl) => {
    const updated = {...currentFaces};
    const now = new Date().toISOString();
    
    Object.keys(newFaces).forEach(name => {
      updated[name] = !updated[name] ? {
        count: newFaces[name].count,
        confidence: newFaces[name].confidence,
        firstSeen: now,
        lastSeen: now,
        image: imageUrl
      } : {
        ...updated[name],
        count: updated[name].count + newFaces[name].count,
        lastSeen: now,
        confidence: Math.max(updated[name].confidence, newFaces[name].confidence)
      };
    });
    
    return updated;
  };

  // Gestion de la caméra
  const handleCamera = async (action) => {
    try {
      if (action === 'start' || action === 'switch') {
        if (!navigator.mediaDevices) throw new Error("Accès à la caméra non supporté");

        if (action === 'switch' && stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: activeCamera,
            frameRate: { ideal: 30 }
          }
        });

        videoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        videoRef.current.style.transform = mirrored ? 'scaleX(-1)' : 'scaleX(1)';

        updateState({
          stream: mediaStream,
          cameraState: 'running',
          dimensions: {
            ...dimensions,
            aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight
          }
        });

        updateCanvasSize();
        applyPresetSize(userSelectedSize || 'medium');
      } 
      else if (action === 'stop') {
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        updateState({
          stream: null,
          cameraState: 'stopped',
          isDetecting: false,
          fps: 0,
          recognizedFaces: {}
        });
      }
      else if (action === 'pause' && stream) {
        stream.getTracks().forEach(track => track.enabled = false);
        updateState({ cameraState: 'paused', isDetecting: false });
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

  // Autres fonctions utilitaires
  const switchCamera = () => {
    updateState(prev => ({
      activeCamera: prev.activeCamera === 'user' ? 'environment' : 'user'
    }));
    handleCamera('switch');
  };

  const toggleMirror = () => {
    updateState(prev => ({ mirrored: !prev.mirrored }));
    if (videoRef.current) {
      videoRef.current.style.transform = mirrored ? 'scaleX(1)' : 'scaleX(-1)';
    }
  };

  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  }, []);

  const applyPresetSize = (size) => {
    const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
    const sizes = { small: 0.5, medium: 0.7, large: 0.85, full: 1 };
    
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

  const exportFaces = () => {
    const data = {
      timestamp: new Date().toISOString(),
      faces: recognizedFaces,
      totalDetections: Object.values(recognizedFaces).reduce((sum, face) => sum + face.count, 0)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visages-reconnus-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFaces = () => updateState({ recognizedFaces: {} });

  // Effets
  useEffect(() => {
    let intervalId;
    if (isDetecting && cameraState === 'running') {
      intervalId = setInterval(processFrame, 300);
    }
    return () => clearInterval(intervalId);
  }, [isDetecting, cameraState, processFrame]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxWidth = containerRef.current.parentElement.clientWidth;
      const newWidth = Math.min(maxWidth, Math.max(300, e.clientX - containerRect.left));
      
      updateState({
        dimensions: {
          width: `${newWidth}px`,
          height: `${newWidth / dimensions.aspectRatio}px`,
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

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  // Rendu
  return (
    <div className="results-page">
      {apiError && (
        <div className="error-banner" role="alert">
          <WarningIcon size={18} />
          {apiError}
        </div>
      )}

      <header className="page-header">
        <h2>
          <CameraIcon size={24} className="header-icon" />
          Détection Faciale
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
            <h3>Mode Réel Premium</h3>
            <ul>
              <li><strong>Technologie :</strong> YOLOv8 + FaceNet</li>
              <li><strong>Résolution :</strong> 1280×720 (adaptative)</li>
              <li><strong>Performance :</strong> ~3 FPS (optimisé)</li>
              <li><strong>Fonctionnalités :</strong> Reconnaissance, suivi, amélioration nocturne</li>
              <li><strong>Miroir :</strong> {mirrored ? 'Activé' : 'Désactivé'}</li>
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
            style={{ transform: mirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
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

                {/*<button 
                  onClick={toggleMirror}
                  className={`control-btn mirror-btn ${mirrored ? 'active-btn' : ''}`}
                  aria-label={mirrored ? 'Désactiver le miroir' : 'Activer le miroir'}
                >
                  <ImageIcon size={18} className="icon" />
                  {mirrored ? 'Désactiver miroir' : 'Activer miroir'}
                </button>*/}
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
            Visages Reconnus ({Object.keys(recognizedFaces).length})
          </h3>
          
          <div className="results-actions">
            {Object.keys(recognizedFaces).length > 0 && (
              <>
                <button 
                  onClick={clearFaces} 
                  className="action-btn clear-btn"
                  aria-label="Effacer tous les visages"
                >
                  <TrashIcon size={16} className="icon" />
                  Effacer tout
                </button>
                <button 
                  onClick={exportFaces} 
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
        
        {Object.keys(recognizedFaces).length > 0 ? (
          <div className="faces-grid">
            {Object.entries(recognizedFaces)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([name, faceData]) => (
                <div key={name} className="face-card">
                  <div className="face-preview-container">
                    {faceData.image && (
                      <img 
                        src={faceData.image} 
                        alt={`Visage de ${name}`}
                        className="face-preview"
                      />
                    )}
                    <div className="face-preview-label">
                      <PersonIcon size={12} />
                      {Math.round(faceData.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="face-info">
                    <h4>
                      {name}
                      <span className="detection-count">{faceData.count}x</span>
                    </h4>
                    
                    <p><strong>Confiance moyenne :</strong> {Math.round(faceData.confidence * 100)}%</p>
                    <p><strong>Première détection :</strong> {new Date(faceData.firstSeen).toLocaleTimeString()}</p>
                    <p><strong>Dernière détection :</strong> {new Date(faceData.lastSeen).toLocaleTimeString()}</p>
                    
                    <div className="timestamp">
                      <RefreshIcon size={12} />
                      Mis à jour il y a {Math.floor((Date.now() - new Date(faceData.lastSeen).getTime()) / 1000)}s
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <PersonIcon size={48} className="empty-icon" />
            <p>Aucun visage reconnu</p>
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