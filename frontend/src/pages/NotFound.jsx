import { useEffect, useRef } from 'react';
import { 
  IoWarning as WarningIcon,
  IoHome as HomeIcon,
  IoArrowBack as BackIcon,
  IoSearch as SearchIcon,
  IoRocket as RocketIcon
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import '../assets/styles/NotFound.scss';

const NotFound = () => {
  const containerRef = useRef(null);
  const starsRef = useRef([]);

  useEffect(() => {
    // Animation des étoiles
    const createStars = () => {
      const container = containerRef.current;
      if (!container) return;

      // Supprimer les anciennes étoiles
      starsRef.current.forEach(star => {
        if (star.parentNode === container) {
          container.removeChild(star);
        }
      });
      starsRef.current = [];

      // Créer de nouvelles étoiles
      const starCount = 50;
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Position aléatoire
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Taille et opacité aléatoires
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.5 + 0.5;
        const duration = Math.random() * 5 + 5;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = opacity;
        star.style.animationDuration = `${duration}s`;
        
        container.appendChild(star);
        starsRef.current.push(star);
      }
    };

    createStars();
    window.addEventListener('resize', createStars);

    return () => {
      window.removeEventListener('resize', createStars);
    };
  }, []);

  return (
    <div className="not-found-page" ref={containerRef}>
      <div className="error-container">
        <div className="error-content">
          <div className="error-illustration">
            <div className="error-number">
              <span className="digit">4</span>
              <div className="planet">
                <div className="crater"></div>
                <div className="crater"></div>
                <div className="crater"></div>
              </div>
              <span className="digit">4</span>
            </div>
            <div className="astronaut">
              <div className="helmet"></div>
              <div className="body"></div>
            </div>
          </div>
          
          <h1 className="error-title">Page Perdue dans l'Espace</h1>
          <p className="error-message">
            La page que vous cherchez a été déplacée ou n'existe plus.
            <br />
            Peut-être qu'elle voyage à travers une autre dimension...
          </p>
          
          <div className="error-actions">
            <Link to="/" className="action-btn home-btn">
              <HomeIcon className="icon" />
              Retour à l'accueil
            </Link>
            <button onClick={() => window.history.back()} className="action-btn back-btn">
              <BackIcon className="icon" />
              Page précédente
            </button>
            <Link to="/search" className="action-btn search-btn">
              <SearchIcon className="icon" />
              Rechercher
            </Link>
          </div>
          
          <div className="error-tips">
            <div className="tip-card">
              <RocketIcon className="tip-icon" />
              <p>Essayez notre moteur de recherche pour trouver ce que vous cherchez</p>
            </div>
            <div className="tip-card">
              <WarningIcon className="tip-icon" />
              <p>Vérifiez l'URL pour d'éventuelles erreurs de saisie</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;