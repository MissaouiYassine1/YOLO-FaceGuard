import React from 'react';
import '../assets/styles/header.css';
import logo from '../assets/images/logo_YFG.png';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <img 
          src={logo} 
          alt="YOLO-FaceGuard Logo" 
          className="header-logo"
        />
        <h1>YOLO-FaceGuard</h1>
      </div>
      <nav>
        <a href="/"><span>Home</span></a>
        <a href="/contact"><span>Contact</span></a>
        <a href="/results"><span>Results</span></a>
      </nav>
    </header>
  );
};

export default Header;