import '../assets/styles/header.css';

const Header = () => {
  return (
    <header className="app-header">
      <h1>YOLO-FaceGuard</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/contact">Contact</a>
        <a href="/results">Results</a>
      </nav>
    </header>
  );
};

export default Header;