import '../assets/styles/main.scss';
import '../assets/styles/home.css';

const Home = () => {
    document.title = "YOLO FaceGuard";
    return (
        <div className="page welcome-page">
            <div className="text-container">
                <h2>Bienvenue sur YOLO-FaceGuard</h2>
                <p>
                    YOLO FaceGuard
                    est un système de détection faciale (basé sur YOLO) et de reconnaissance (par deep learning) en
                    temps réel.
                    Il localise les visages et vérifie leur correspondance avec une base de données,
                    offrant une solution rapide pour la sécurité et le contrôle d'accès.
                </p>
                <div className="cta-section">
                    <a href="/results" className="cta-button">Voir les résultats</a>
                </div>

            </div>
            <div className="image-container">
                <img src="./src/assets/images/personne.png" alt="personne"/>
            </div>
        </div>


    );
};

export default Home;