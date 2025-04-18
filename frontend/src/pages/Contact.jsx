import '../assets/styles/contact.css';
import '../assets/styles/main.scss';
import yassin from '../assets/images/team/yassin.png';
import emna from '../assets/images/team/emna.png';
import maryem from '../assets/images/team/maryem.png';

const Contact = () => {
    document.title = "YOLO FaceGuard - Contact";
    return (
    <div><h1 className="team-title">Notre Équipe</h1>        
      <div className="page contact-page">
        
        <div className="team-container">
            <div className="member-card">
                <img src={yassin} alt="Yassin Missaoui" className="member-photo" />
                <div className="member-info">
                    <h3>Yassin Missaoui</h3>
                    <p className="member-position">Développeur Full Stack</p>
                    {/*<p className="member-description">Spécialisé en architectures back-end et solutions AI.</p>*/}
                    <a href="mailto:yassin.missaoui@enis.tn" className="member-email">yassin.missaoui@enis.tn</a>
                    {/*<div className="member-social">
                        <a href="#" className="social-link">LinkedIn</a>
                        <a href="#" className="social-link">GitHub</a>
                    </div>*/}
                </div>
            </div>
            
            <div className="member-card">
                <img src={emna} alt="Emna Kaanich" className="member-photo" />
                <div className="member-info">
                    <h3>Emna Kaanich</h3>
                    <p className="member-position">Experte de projet</p>
                    {/*<p className="member-description">Coordination d'équipe et planification stratégique.</p>*/}
                    <a href="mailto:emna.kaaniche@enis.tn" className="member-email">emna.kaanich@enis.tn</a>
                    {/*<div className="member-social">
                        <a href="#" className="social-link">LinkedIn</a>
                        <a href="#" className="social-link">Portfolio</a>
                    </div>*/}
                </div>
            </div>
            
            <div className="member-card">
                <img src={maryem} alt="Maryem Kbayer" className="member-photo" />
                <div className="member-info">
                    <h3>Maryem Kbayer</h3>
                    <p className="member-position">Spécialiste UX/UI </p>
                    {/*<p className="member-description">Design d'interfaces et expérience utilisateur.</p>*/}
                    <a href="mailto:mariem.kbaier@enis.tn" className="member-email">mariem.kbaier@enis.tn</a>
                    {/*<div className="member-social">
                        <a href="#" className="social-link">LinkedIn</a>
                        <a href="#" className="social-link">Behance</a>
                    </div>*/}
                </div>
            </div>
        </div>
      </div>
      </div>
    );
};

export default Contact;