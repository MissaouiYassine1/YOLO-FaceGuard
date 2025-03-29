// src/pages/ProcessPage.jsx
import { useState, useRef } from 'react';
import CameraFrame from '../components/Camera/CameraFrame';
import ResultsGallery from '../components/Results/Gallery';
import Loader from '../components/UI/Loader';
import { detectFaces } from '../utils/api';
import '../assets/styles/main.scss';

export default function ProcessPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  const handleCapture = async (imageSrc) => {
    setLoading(true);
    setError(null);
    
    try {
      const detectionResults = await detectFaces(imageSrc);
      setResults(detectionResults);
    } catch (err) {
      setError('La détection a échoué. Veuillez réessayer.');
      console.error('Detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="process-page">
      {loading && <Loader fullscreen />}
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleRetry}>Réessayer</button>
        </div>
      )}

      {results ? (
        <ResultsGallery 
          faces={results.faces} 
          onRetry={handleRetry}
        />
      ) : (
        <CameraFrame 
          ref={cameraRef}
          onCapture={handleCapture}
        />
      )}
    </div>
  );
}