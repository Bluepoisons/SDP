import React, { useState, useRef } from 'react';

const ScreenCapture = () => {
  const [capturing, setCapturing] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const videoRef = useRef(null);

  const getSources = async () => {
    try {
      const { desktopCapturer } = window.require('electron');
      const inputSources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
      setSources(inputSources);
      if (inputSources.length > 0) {
        setSelectedSource(inputSources[0].id);
      }
    } catch (err) {
      console.error("Error getting sources:", err);
    }
  };

  const startCapture = async () => {
    if (!selectedSource) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSource,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCapturing(true);
      }
    } catch (e) {
      console.error("Error capturing screen:", e);
    }
  };

  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCapturing(false);
    }
  };

  // Load sources on mount
  React.useEffect(() => {
    getSources();
  }, []);

  return (
    <div className="screen-capture">
      <div className="controls" style={{ marginBottom: '15px' }}>
        <select 
          value={selectedSource} 
          onChange={(e) => setSelectedSource(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
        >
          {sources.map(source => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        {!capturing ? (
          <button onClick={startCapture}>开始捕获</button>
        ) : (
          <button onClick={stopCapture} style={{ backgroundColor: '#cc3300' }}>停止捕获</button>
        )}
        
        <button onClick={getSources} style={{ marginLeft: '10px', backgroundColor: '#555' }}>刷新源</button>
      </div>
      
      <div className="video-container">
        <video 
          ref={videoRef} 
          style={{ width: '100%', border: '1px solid #444', backgroundColor: '#000' }}
        />
      </div>
    </div>
  );
};

export default ScreenCapture;
