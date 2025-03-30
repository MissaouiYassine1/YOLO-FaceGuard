import '../assets/styles/contact.scss';
import '../assets/styles/main.scss';
const Home = () => {
    return (
      <div className="page home-page">
        <h2>Bienvenue sur YOLO-FaceGuard</h2>
        <p>Solution de détection faciale basée sur YOLO</p>
        <div className="cta-section">
          <a href="/results" className="cta-button">Voir les résultats</a>
        </div>
      </div>
    );
  };
  
  export default Home;