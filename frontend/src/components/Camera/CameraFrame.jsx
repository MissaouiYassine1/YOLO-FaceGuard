// src/components/Camera/CameraFrame.jsx
import { forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import Button from '../UI/Button';
import './CameraFrame.scss';

const CameraFrame = forwardRef(({ onCapture }, ref) => {
  const webcamRef = useRef(null);
  const [isNightMode, setIsNightMode] = useState(false);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const imageSrc = webcamRef.current.getScreenshot();
      return imageSrc;
    }
  }));

  return (
    <div className={`camera-container ${isNightMode ? 'night-mode' : ''}`}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'user' }}
      />

      <div className="controls">
        <Button 
          icon={isNightMode ? 'sun' : 'moon'}
          onClick={() => setIsNightMode(!isNightMode)}
        />
        
        <Button 
          primary
          icon="camera"
          onClick={() => onCapture(webcamRef.current.getScreenshot())}
          className="capture-btn"
        />
      </div>
    </div>
  );
});

export default CameraFrame;