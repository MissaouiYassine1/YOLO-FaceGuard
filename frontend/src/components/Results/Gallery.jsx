// src/components/Results/Gallery.jsx
import FaceCard from './FaceCard';
import Button from '../UI/Button';
import './Gallery.scss';

export default function ResultsGallery({ faces, onRetry }) {
  return (
    <div className="results-gallery">
      <header className="gallery-header">
        <h2>Résultats de détection</h2>
        <Button 
          outline
          onClick={onRetry}
          text="Nouvelle analyse"
        />
      </header>

      <div className="faces-grid">
        {faces.map((face, index) => (
          <FaceCard 
            key={index}
            face={face}
          />
        ))}
      </div>
    </div>
  );
}