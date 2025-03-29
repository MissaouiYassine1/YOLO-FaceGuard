// src/components/UI/Loader.jsx
import './Loader.scss';

export default function Loader({ fullscreen = false }) {
  return (
    <div className={`loader-container ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="loader-spinner"></div>
    </div>
  );
}