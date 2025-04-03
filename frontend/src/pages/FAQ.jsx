import '../assets/styles/main.scss';
import '../assets/styles/FAQ.css';
const FAQ = () => {
    document.title = "YOLO FaceGuard-FAQ";
    return (
        <div className="page FAQ-page">
            <div className={"video-container"}>
                <video controls>
                    <source src="./src/assets/videos/videoExp.mp4" type="video/mp4"/>
                </video>
            </div>
            <h2>Problèmes fréquents</h2>
            <div className={"question-container"}>
                <div className={"question"}>
                    <h4>Comment fonctionne la version actuelle ? </h4>
                    <ul> Version locale en développement. Utilisez-la pour :
                        <li>Tester la détection faciale et la reconnaissance</li>
                    </ul>
                </div>
                <div className={"question"}>
                    <h4>Comment personnaliser ma base de données ? </h4>
                    <ul> La personnalisation avancée de la base de données n'est pas encore disponible dans cette
                        version de développement. Dès que cette fonctionnalité sera implémentée,
                        nous ajouterons un tutoriel vidéo.
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
                    <li>La luminosité (évitez les contre-jours).</li>
                    <li>L’angle de la caméra (face à la personne).</li>

                </div>
                <div className={"question"}>
                    <h4>Un visage n'est pas détecté ?</h4>
                    <ul> Vérifiez:</ul>
                    <li>La luminosité (évitez les contre-jours).</li>
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
            <div className={"feedback-container"}>
                <label>Ces réponses vous ont aidé ?</label><br/>
                <input type="radio" value={"Oui"} name="reponse"/>
                <label>👍 Oui</label>
                <input type="radio" value={"Non"} name="reponse"/>
                <label>👎 Non</label>
                <br/>
                <button type="submit" onClick={() => window.location.reload()}>
                    Envoyé
                </button>


            </div>
        </div>
    );
};
export default FAQ