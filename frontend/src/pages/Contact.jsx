import '../assets/styles/contact.css';
import '../assets/styles/main.scss';
import yassin from '../assets/images/team/yassin.png';
import emna from '../assets/images/team/emna.png';
import maryem from '../assets/images/team/maryem.png';

const Contact = () => {
    return (
      <div className="page home-page">
        <h1>Notre Équipe</h1>
        <div className="team-container">
            <div className="member-card">
                <img src={yassin} alt="Membre 1" />
                <div className="member-info">
                    <h3>Yassin Missaoui</h3>
                    <p>Développeur Full Stack.</p>
                    <a href="mailto:yassin.missaoui@enis.tn">yassin.missaoui@enis.tn</a>
                </div>
            </div>
            <div className="member-card">
                <img src={emna} alt="Membre 2" />
                <div className="member-info">
                    <h3>Emna Kaanich</h3>
                    <p>Experte en gestion de projet.</p>
                    <a href="mailto:emna.kaanich@enis.tn">emna.kaanich@enis.tn</a>
                </div>
            </div>
            <div className="member-card">
                <img src={maryem} alt="Membre 3" />
                <div className="member-info">
                    <h3>Maryem Kbayer</h3>
                    <p>Spécialiste UX/UI.</p>
                    <a href="mailto:mariem.kbaier@enis.tn">mariem.kbaier@enis.tn</a>
                </div>
            </div>
        </div>
      </div>
    );
};

export default Contact;
