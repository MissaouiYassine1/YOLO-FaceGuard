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
  IoInformationCircle as InfoIcon
} from 'react-icons/io5';

document.title = "YOLO FaceGuard - Résultats";

const Results = () => {
  // Références
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  // États
  const [detections, setDetections] = useState([]);
  const [cameraState, setCameraState] = useState('stopped');
  const [stream, setStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: '400px',
    height: 'auto',
    aspectRatio: 16/9
  });
  const [isResizing, setIsResizing] = useState(false);
  const [presetSize, setPresetSize] = useState('small');
  const [showDetectionInfo, setShowDetectionInfo] = useState(false);
  const [userSelectedSize, setUserSelectedSize] = useState(null);
  const [frozenDetectionTime, setFrozenDetectionTime] = useState(null);

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      if (cameraState === 'stopped') {
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
        setStream(mediaStream);
        setCameraState('running');
        
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current;
          const aspectRatio = video.videoWidth / video.videoHeight;
          setDimensions(prev => ({
            ...prev,
            aspectRatio
          }));
          updateCanvasSize();
          applyPresetSize(userSelectedSize || 'small');
        };
      } else if (cameraState === 'paused') {
        resumeCamera();
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      alert(`Erreur d'accès à la caméra: ${err.message}`);
    }
  };

  // Reprendre la caméra
  const resumeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.enabled = true);
      setCameraState('running');
    }
  };

  // Mettre en pause la caméra
  const pauseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.enabled = false);
      setCameraState('paused');
      stopDetection();
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    stopDetection();
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setCameraState('stopped');
    setDetections([]);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    applyPresetSize('small');
  };

  // Mettre à jour la taille du canvas
  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  }, []);

  // Envoyer une image au backend
  const sendFrameToBackend = async () => {
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      const response = await fetch('http://localhost:8000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur de détection');

      const data = await response.json();
      return data.faces || [];
    } catch (error) {
      console.error('Erreur lors de l\'envoi au backend:', error);
      return [];
    }
  };

  // Détection automatique
  const startDetection = () => {
    if (cameraState !== 'running') return;
    
    setIsDetecting(true);
    let frameCount = 0;
    let lastTime = performance.now();
    
    const detectionInterval = setInterval(async () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      
      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        frameCount = 0;
        lastTime = now;
      }
      
      const newDetections = await sendFrameToBackend();
      if (newDetections.length > 0) {
        setDetections(prev => [
          ...prev,
          ...newDetections.map(d => ({
            ...d,
            timestamp: Date.now(),
            id: `${d.id}-${Date.now()}`,
          }))
        ].slice(-20));
        
        const currentTime = new Date().toLocaleTimeString();
        setLastDetectionTime(currentTime);
        if (!isDetecting) {
          setFrozenDetectionTime(currentTime);
        }
      }
      
      frameCount++;
    }, 1000 / 30);

    return () => clearInterval(detectionInterval);
  };

  // Arrêter la détection
  const stopDetection = () => {
    setIsDetecting(false);
    setFps(0);
    setFrozenDetectionTime(lastDetectionTime);
  };

  // Dessiner les détections
  const drawDetections = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detections.slice(-5).forEach(det => {
      ctx.strokeStyle = '#FF3B30';
      ctx.lineWidth = 2;
      ctx.strokeRect(det.x, det.y, det.width, det.height);
      
      ctx.fillStyle = 'rgba(255, 59, 48, 0.7)';
      ctx.fillRect(det.x, det.y - 20, 120, 20);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${det.name || 'Inconnu'} (${Math.round(det.confidence * 100)}%)`,
        det.x + 5,
        det.y - 5
      );
    });
  }, [detections]);

  // Appliquer une taille prédéfinie
  const applyPresetSize = (size) => {
    setPresetSize(size);
    if (cameraState === 'running') setUserSelectedSize(size);
    
    const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
    const sizes = {
      small: 0.4,
      medium: 0.65,
      large: 0.85,
      full: 1
    };
    
    setDimensions({
      width: size === 'full' ? '100%' : `${containerWidth * sizes[size]}px`,
      height: 'auto',
      aspectRatio: dimensions.aspectRatio
    });
  };

  // Redimensionnement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxWidth = containerRef.current.parentElement.clientWidth;
      const newWidth = Math.min(maxWidth, Math.max(300, e.clientX - containerRect.left));
      const newHeight = newWidth / dimensions.aspectRatio;
      
      setDimensions({
        width: `${newWidth}px`,
        height: `${newHeight}px`,
        aspectRatio: dimensions.aspectRatio
      });
      setPresetSize('custom');
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dimensions.aspectRatio]);

  // Détection automatique
  useEffect(() => {
    if (isDetecting && cameraState === 'running') {
      const cleanup = startDetection();
      return cleanup;
    }
  }, [isDetecting, cameraState]);

  // Dessiner les détections
  useEffect(() => {
    if (detections.length > 0) drawDetections();
  }, [detections, drawDetections]);

  // Nettoyage
  useEffect(() => stopCamera, []);

  return (
    <div className="results-page">
      <header className="page-header">
        <h2>
          <CameraIcon size={24} className="header-icon" />
          Détection en Temps Réel
        </h2>
        <button 
          onClick={() => setShowDetectionInfo(!showDetectionInfo)}
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
              onClick={() => setShowDetectionInfo(false)}
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
          className="video-container"
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
          />
          <canvas ref={canvasRef} className="detection-canvas" />
          
          <div 
            ref={resizeHandleRef}
            className="resize-handle"
            onMouseDown={() => setIsResizing(true)}
            title="Redimensionner la vue"
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
            <button onClick={startCamera} className="control-btn start-btn">
              <CameraIcon size={18} className="icon" />
              Démarrer la caméra
            </button>
          ) : (
            <>
              <div className="control-group">
                <button onClick={stopCamera} className="control-btn stop-btn">
                  <StopIcon size={18} className="icon" />
                  Arrêter
                </button>
                
                {cameraState === 'running' ? (
                  <button onClick={pauseCamera} className="control-btn pause-btn">
                    <PauseIcon size={18} className="icon" />
                    Pause
                  </button>
                ) : (
                  <button onClick={resumeCamera} className="control-btn start-btn">
                    <PlayIcon size={18} className="icon" />
                    Reprendre
                  </button>
                )}
              </div>
              
              <div className="control-group">
                <button 
                  onClick={isDetecting ? stopDetection : startDetection} 
                  className={`control-btn ${isDetecting ? 'active-btn' : 'detect-btn'}`}
                  disabled={cameraState !== 'running'}
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
                  disabled={cameraState !== 'running'}
                >
                  <SearchIcon size={18} className="icon" />
                  Détection manuelle
                </button>
              </div>
              
              <div className="control-group">
                {detections.length > 0 && (
                  <button 
                    onClick={() => {
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
                    }} 
                    className="control-btn save-btn"
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
                  onClick={() => setDetections([])} 
                  className="action-btn clear-btn"
                >
                  <TrashIcon size={16} className="icon" />
                  Effacer tout
                </button>
                <button 
                  onClick={() => {
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
                  }} 
                  className="action-btn save-btn"
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
                    {face.name}
                  </h4>
                  <p><strong>Confiance:</strong> {Math.round(face.confidence * 100)}%</p>
                  <p><strong>Position:</strong> {Math.round(face.x)}px, {Math.round(face.y)}px</p>
                  <p><strong>Taille:</strong> {Math.round(face.width)}×{Math.round(face.height)}</p>
                  <p className="timestamp">
                    <small>{new Date(face.timestamp).toLocaleTimeString()}</small>
                  </p>
                </div>
                <div className="face-preview-container">
                  <div 
                    className="face-preview" 
                    style={{
                      backgroundImage: `url(${canvasRef.current?.toDataURL() || ''})`,
                      backgroundPosition: `-${Math.round(face.x)}px -${Math.round(face.y)}px`,
                      width: `${Math.round(face.width)}px`,
                      height: `${Math.round(face.height)}px`
                    }}
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