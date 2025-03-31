import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(true);

  // Mémoïser la fonction pour éviter des recréations inutiles
  const createStars = useCallback(() => {
    if (!isAnimating) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Suppression efficace des étoiles existantes
    starsRef.current.forEach(star => star.remove());
    starsRef.current = [];

    // Création des étoiles avec requestAnimationFrame pour meilleure performance
    requestAnimationFrame(() => {
      const starCount = Math.floor(window.innerWidth / 20); // Adaptatif selon la largeur d'écran
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.setAttribute('aria-hidden', 'true');
        
        // Configuration des propriétés en une passe
        Object.assign(star.style, {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          opacity: Math.random() * 0.5 + 0.5,
          animationDuration: `${Math.random() * 5 + 5}s`,
          animationPlayState: isAnimating ? 'running' : 'paused'
        });
        
        fragment.appendChild(star);
        starsRef.current.push(star);
      }

      container.appendChild(fragment);
    });
  }, [isAnimating]);

  useEffect(() => {
    createStars();
    
    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(createStars);
    };
    
    let animationFrameId;
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [createStars]);

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
    starsRef.current.forEach(star => {
      star.style.animationPlayState = isAnimating ? 'paused' : 'running';
    });
  };

  return (
    <div 
      className="not-found-page" 
      ref={containerRef}
      role="main"
      aria-labelledby="error-title"
    >
      <div className="error-container">
        <div className="error-content">
          <div 
            className="error-illustration"
            onClick={toggleAnimation}
            aria-label="Cliquez pour arrêter/relancer l'animation des étoiles"
            role="button"
            tabIndex="0"
          >
            <div className="error-number">
              <span className="digit">4</span>
              <div className="planet" aria-hidden="true">
                <div className="crater"></div>
                <div className="crater"></div>
                <div className="crater"></div>
              </div>
              <span className="digit">4</span>
            </div>
            <div className="astronaut" aria-hidden="true">
              <div className="helmet"></div>
              <div className="body"></div>
            </div>
          </div>
          
          <h1 id="error-title" className="error-title">Page Perdue dans l'Espace</h1>
          <p className="error-message">
            La page que vous cherchez a été déplacée ou n'existe plus.
            <br />
            Peut-être qu'elle voyage à travers une autre dimension...
          </p>
          
          <div className="error-actions">
            <Link 
              to="/" 
              className="action-btn home-btn"
              aria-label="Retour à la page d'accueil"
            >
              <HomeIcon className="icon" aria-hidden="true" />
              <span>Retour à l'accueil</span>
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="action-btn back-btn"
              aria-label="Retour à la page précédente"
            >
              <BackIcon className="icon" aria-hidden="true" />
              <span>Page précédente</span>
            </button>
            <Link 
              to="/search" 
              className="action-btn search-btn"
              aria-label="Aller à la page de recherche"
            >
              <SearchIcon className="icon" aria-hidden="true" />
              <span>Rechercher</span>
            </Link>
          </div>
          
          <div className="error-tips">
            <div className="tip-card" tabIndex="0" aria-label="Astuce">
              <RocketIcon className="tip-icon" aria-hidden="true" />
              <p>Essayez notre moteur de recherche pour trouver ce que vous cherchez</p>
            </div>
            <div className="tip-card" tabIndex="0" aria-label="Astuce">
              <WarningIcon className="tip-icon" aria-hidden="true" />
              <p>Vérifiez l'URL pour d'éventuelles erreurs de saisie</p>
            </div>
          </div>

          <div className="animation-control">
            <button 
              onClick={toggleAnimation}
              className="animation-btn"
              aria-label={isAnimating ? 'Arrêter animation' : 'Démarrer animation'}
            >
              {isAnimating ? '⏸️ Pause' : '▶️ Lecture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;