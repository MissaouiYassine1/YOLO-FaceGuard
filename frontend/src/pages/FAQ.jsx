import '../assets/styles/main.scss';
import '../assets/styles/FAQ.css';
const FAQ = () => {
    document.title = "YOLO FaceGuard-FAQ";
    return (
        <div className="page FAQ-page">
            <h2>Fonctionnement du système</h2>
            <div className={"video-container"}>
                <video controls>
                    <source src="./src/assets/videos/demo.mp4" type="video/mp4"/>
                </video>
            </div>
            <h2>Problèmes fréquents</h2>
            <div className={"question-container"}>
                <div className={"question"}>
                    <h4>Comment fonctionne la version actuelle ? </h4>
                    <ul> Version locale en développement. Utilisez-la pour :
                        <li>Tester la détection faciale et la reconnaissance</li>
                        <li>Tester l'amélioration d'images nocturnes</li>
                    </ul>
                </div>
                <div className={"question"}>
                    <h4>Comment personnaliser ma base de données ? </h4>
                    <ul> Personnalisez votre base en suivant ces étapes :
                        <li>Capturer une photo via la caméra</li>
                        <li>Ou importer une image contenant un visage</li>
                    </ul>
                </div>

                <div className={"question"}>
                    <h4>Que proposera la version client finale ? </h4>
                    <ul> Une solution gratuite et clé en main pour :

                        <li>Personnaliser sa base de visages</li>
                        <li>Analyser des flux vidéo simples</li>
                    </ul>
                </div>
                
                <div className={"question"}>
                    <h4>Un visage n'est pas détecté ?</h4>
                    <ul> Vérifiez:</ul>
                    <li>La luminosité (évitez les images très sombres).</li>
                    <li>L’angle de la caméra (face à la personne).</li>
                    <li>Si le visage est bien enregistré dans la base.</li>
                </div>
                <div className={"question"}>
                    <h4> YOLO FaceGuard est-il payant ?</h4>
                    <ul> Non, notre service est entièrement gratuit :</ul>
                    <li> Pas de coût caché.</li>
                    <li>Pas d'abonnement requis.</li>
                    <li>Pas de limitation artificielle des fonctionnalités.</li>
                </div>

            </div>
            <h2>Feedback utilisateurs</h2>
            <div className="feedback-container">
                <label className="feedback-title">Ces réponses vous ont aidé ?</label>

                <div className="feedback-options">
                    <input type="radio" id="feedback-oui" name="feedback" value="Oui"/>
                    <label htmlFor="feedback-oui" className="feedback-button">
                        <span className="icon">✅</span> Oui
                    </label>

                    <input type="radio" id="feedback-non" name="feedback" value="Non"/>
                    <label htmlFor="feedback-non" className="feedback-button">
                        <span className="icon">❌</span> Non
                    </label>
                </div>

                <button type="submit" className="submit-button" onClick={() => window.location.reload()}>
                    Envoyer
                </button>
            </div>


        </div>
    );
};
export default FAQ