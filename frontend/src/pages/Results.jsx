import { useRef, useState, useEffect } from 'react';
import '../assets/styles/results.scss';

const Results = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Simuler la détection de visages (à remplacer par votre logique YOLO)
  const detectFaces = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Dessiner l'image de la vidéo sur le canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simulation de détection - remplacer par votre API YOLO
    const mockDetections = [
      { x: 100, y: 150, width: 120, height: 120, confidence: 0.95, name: "Yassin" },
      { x: 300, y: 200, width: 110, height: 110, confidence: 0.93, name: "Emna" }
    ];
    
    // Dessiner les rectangles de détection
    mockDetections.forEach(det => {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(det.x, det.y, det.width, det.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '16px Arial';
      ctx.fillText(`${det.name} (${Math.round(det.confidence * 100)}%)`, det.x, det.y - 5);
    });
    
    setDetections(mockDetections);
  };

  useEffect(() => {
    return () => {
      // Nettoyer à la sortie du composant
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
            className="video-preview"
          />
          <canvas 
            ref={canvasRef} 
            width="640" 
            height="480"
            className="detection-canvas"
          />
        </div>
        
        <div className="controls">
          {!isRecording ? (
            <button onClick={startCamera} className="control-btn start-btn">
              Démarrer la Caméra
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="control-btn stop-btn">
                Arrêter
              </button>
              <button onClick={detectFaces} className="control-btn detect-btn">
                Détecter les Visages
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="detection-results">
        <h3>Visages Détectés ({detections.length})</h3>
        
        <div className="faces-grid">
          {detections.map((face, index) => (
            <div key={index} className="face-card">
              <div className="face-info">
                <h4>{face.name || `Visage ${index + 1}`}</h4>
                <p>Confiance: {Math.round(face.confidence * 100)}%</p>
                <p>Position: ({face.x}, {face.y})</p>
              </div>
              <div 
                className="face-preview" 
                style={{
                  backgroundPosition: `-${face.x}px -${face.y}px`,
                  width: `${face.width}px`,
                  height: `${face.height}px`
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;