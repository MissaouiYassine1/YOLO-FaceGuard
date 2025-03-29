// src/components/Results/FaceCard.jsx
import './FaceCard.scss';

export default function FaceCard({ face }) {
  return (
    <article className="face-card">
      <img 
        src={face.image} 
        alt={`Visage détecté ${face.id}`}
        className="face-image"
      />
      
      <div className="face-info">
        <h3>{face.name || 'Inconnu'}</h3>
        <p>Confiance: {(face.confidence * 100).toFixed(1)}%</p>
      </div>
    </article>
  );
}