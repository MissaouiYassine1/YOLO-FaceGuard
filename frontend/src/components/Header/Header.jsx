// src/components/Header/Header.jsx
import { Link, useLocation } from 'react-router-dom';
import { FaUserShield, FaMoon, FaSun } from 'react-icons/fa';
import './Header.scss';

export default function Header() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  // Applique le mode sombre au body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <FaUserShield className="logo-icon" />
          <span className="logo-text">YOLO FaceGuard</span>
        </Link>

        <nav className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Accueil
          </Link>
          <Link 
            to="/process" 
            className={`nav-link ${location.pathname === '/process' ? 'active' : ''}`}
          >
            Détection
          </Link>
        </nav>

        <button 
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </header>
  );
}