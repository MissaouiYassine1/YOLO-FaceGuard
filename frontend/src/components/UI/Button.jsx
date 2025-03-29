// src/components/UI/Button.jsx
import { FaCamera, FaMoon, FaSun } from 'react-icons/fa';
import './Button.scss';

export default function Button({
  primary = false,
  outline = false,
  icon,
  text,
  onClick
}) {
  const Icon = () => {
    switch(icon) {
      case 'camera': return <FaCamera />;
      case 'moon': return <FaMoon />;
      case 'sun': return <FaSun />;
      default: return null;
    }
  };

  return (
    <button
      className={`btn ${primary ? 'primary' : ''} ${outline ? 'outline' : ''}`}
      onClick={onClick}
    >
      {icon && <Icon />}
      {text && <span>{text}</span>}
    </button>
  );
}