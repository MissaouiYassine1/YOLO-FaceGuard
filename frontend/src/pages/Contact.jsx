import { useEffect, useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/styles/contact.css"

const Contact = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHtmlContent = async () => {
      try {
        const response = await fetch('contact.html');
        if (!response.ok) throw new Error('Failed to load contact page');
        
        const html = await response.text();
        const cleanedHtml = html
          .replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i, '')
          .replace(/<\/body>[\s\S]*<\/html>/i, '')
          .trim();

        setHtmlContent(cleanedHtml);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHtmlContent();
  }, []);

  if (loading) return (
    <div className="page-loading">
      <Header />
      <main className="loading-state">
        <div className="spinner"></div>
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="page-error">
      <Header />
      <main className="error-state">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="contact-page">
      <Header />
      
      <main className="contact-content">
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="html-content"
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;