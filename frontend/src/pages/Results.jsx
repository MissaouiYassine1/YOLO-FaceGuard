import { useRef, useState, useEffect } from 'react';
import '../assets/styles/results.scss';

const Results = () => {
  // Références
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  // États
  const [detections, setDetections] = useState([]);
  const [cameraState, setCameraState] = useState('stopped'); // 'stopped' | 'paused' | 'running'
  const [stream, setStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);

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
        
        // Attendre que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
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

  // Arrêter complètement la caméra
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
  };

  // Démarrer la détection automatique
  const startDetection = () => {
    if (cameraState !== 'running') return;
    
    setIsDetecting(true);
    let frameCount = 0;
    let lastTime = performance.now();
    
    detectionIntervalRef.current = setInterval(() => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      
      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        frameCount = 0;
        lastTime = now;
      }
      
      detectFaces();
      frameCount++;
    }, 1000 / 30); // ~30 FPS
  };

  // Arrêter la détection automatique
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
  };

  // Détection des visages (simulée)
  const detectFaces = () => {
    if (!videoRef.current || cameraState !== 'running') return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ajuster la taille si nécessaire
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Dessiner l'image actuelle
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simulation de détection
    const newDetections = generateMockDetections(canvas.width, canvas.height);
    drawDetections(ctx, newDetections);
    
    setDetections(prev => [...prev, ...newDetections].slice(-20)); // Garder les 20 dernières
    setLastDetectionTime(new Date().toLocaleTimeString());
  };

  // Générer des détections factices
  const generateMockDetections = (width, height) => {
    if (Math.random() < 0.3) return []; // 30% de chance de ne rien détecter
    
    const names = ["Yassin", "Emna", "Alex", "Sarah", "Mohamed", "Léa", "Jean", "Marie"];
    const count = Math.min(4, Math.floor(Math.random() * 3) + 1);
    
    return Array.from({ length: count }, (_, i) => {
      const size = Math.min(width, height) * (0.15 + Math.random() * 0.15);
      return {
        id: Date.now() + i,
        x: Math.random() * (width - size),
        y: Math.random() * (height - size),
        width: size,
        height: size,
        confidence: 0.85 + Math.random() * 0.1,
        name: names[Math.floor(Math.random() * names.length)],
        timestamp: new Date().toISOString()
      };
    });
  };

  // Dessiner les rectangles de détection
  const drawDetections = (ctx, detections) => {
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Arial';
    
    detections.forEach(det => {
      // Rectangle de détection
      ctx.strokeStyle = `hsl(${Math.round(det.confidence * 120)}, 80%, 50%)`;
      ctx.strokeRect(det.x, det.y, det.width, det.height);
      
      // Fond pour le texte
      const text = `${det.name} ${Math.round(det.confidence * 100)}%`;
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(3, 8, 16, 0.7)';
      ctx.fillRect(det.x - 1, det.y - 22, textWidth + 10, 20);
      
      // Texte
      ctx.fillStyle = '#f3fbfd';
      ctx.fillText(text, det.x + 4, det.y - 6);
    });
  };

  // Sauvegarder les détections
  const saveDetections = () => {
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

  // Nettoyage
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="results-page">
      <h2>Détection en Temps Réel</h2>
      
      <div className="realtime-section">
        <div className="video-container">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`video-preview ${cameraState === 'paused' ? 'paused' : ''}`}
          />
          <canvas 
            ref={canvasRef} 
            className="detection-canvas"
          />
          
          <div className="video-overlay">
            {cameraState === 'running' && isDetecting && (
              <span className="fps-counter">{fps} FPS</span>
            )}
            {lastDetectionTime && (
              <span className="last-detection">Dernière détection: {lastDetectionTime}</span>
            )}
          </div>
        </div>
        
        <div className="controls">
          {cameraState === 'stopped' ? (
            <button onClick={startCamera} className="control-btn start-btn">
              <i className="fas fa-video"></i> Démarrer
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="control-btn stop-btn">
                <i className="fas fa-stop"></i> Arrêter
              </button>
              
              {cameraState === 'running' ? (
                <button onClick={pauseCamera} className="control-btn pause-btn">
                  <i className="fas fa-pause"></i> Pause
                </button>
              ) : (
                <button onClick={resumeCamera} className="control-btn start-btn">
                  <i className="fas fa-play"></i> Reprendre
                </button>
              )}
              
              <button 
                onClick={isDetecting ? stopDetection : startDetection} 
                className={`control-btn ${isDetecting ? 'active-btn' : 'detect-btn'}`}
                disabled={cameraState !== 'running'}
              >
                <i className={`fas fa-${isDetecting ? 'stop' : 'search'}`}></i>
                {isDetecting ? 'Arrêter détection' : 'Détection auto'}
              </button>
              
              <button 
                onClick={detectFaces} 
                className="control-btn detect-btn"
                disabled={cameraState !== 'running'}
              >
                <i className="fas fa-search-plus"></i> Détecter
              </button>
              
              {detections.length > 0 && (
                <button 
                  onClick={saveDetections} 
                  className="control-btn save-btn"
                >
                  <i className="fas fa-save"></i> Sauvegarder
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="detection-results">
        <div className="results-header">
          <h3>Visages Détectés ({detections.length})</h3>
          
          <div className="results-actions">
            {detections.length > 0 && (
              <>
                <button 
                  onClick={() => setDetections([])} 
                  className="action-btn clear-btn"
                >
                  <i className="fas fa-trash-alt"></i> Effacer
                </button>
                <button 
                  onClick={saveDetections} 
                  className="action-btn save-btn"
                >
                  <i className="fas fa-download"></i> Exporter
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
                  <h4>{face.name}</h4>
                  <p><strong>Confiance:</strong> {Math.round(face.confidence * 100)}%</p>
                  <p><strong>Position:</strong> {Math.round(face.x)}px, {Math.round(face.y)}px</p>
                  <p><strong>Taille:</strong> {Math.round(face.width)}×{Math.round(face.height)}</p>
                  <p><small>{new Date(face.timestamp).toLocaleTimeString()}</small></p>
                </div>
                <div 
                  className="face-preview" 
                  style={{
                    backgroundImage: `url(${canvasRef.current?.toDataURL() || ''})`,
                    backgroundPosition: `-${Math.round(face.x)}px -${Math.round(face.y)}px`,
                    width: `${Math.round(face.width)}px`,
                    height: `${Math.round(face.height)}px`
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-user-slash"></i>
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