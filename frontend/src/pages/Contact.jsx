import '../assets/styles/main.scss';
const Contact = () => {
    // Données des membres
    const teamMembers = [
      { id: 1, name: "Jean Dupont", role: "Développeur", email: "jean@example.com" },
      { id: 2, name: "Marie Martin", role: "Designer", email: "marie@example.com" }
    ];
  
    return (
      <div className="page contact-page">
        <h2>Contactez notre équipe</h2>
        
        <section className="contact-form">
          <h3>Formulaire de contact</h3>
          <form>
            <input type="text" placeholder="Votre nom" />
            <input type="email" placeholder="Votre email" />
            <textarea placeholder="Votre message"></textarea>
            <button type="submit">Envoyer</button>
          </form>
        </section>
  
        <section className="team-section">
          <h3>Notre équipe</h3>
          <div className="member-cards">
            {teamMembers.map(member => (
              <div key={member.id} className="member-card">
                <h4>{member.name}</h4>
                <p>{member.role}</p>
                <p>{member.email}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };
  
  export default Contact;