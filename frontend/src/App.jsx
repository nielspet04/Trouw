import { useState, useRef } from 'react';
import './App.css';
import QRScanner from './components/QRScanner';
import UploadMedia from './components/UploadMedia';
import SpotifyRequest from './components/SpotifyRequest';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [scanned, setScanned] = useState(false);

  const handleQRSuccess = (data) => {
    console.log('QR Scanned:', data);
    setScanned(true);
    setActiveTab('upload');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎉 Trouwfeest App</h1>
        <p>Deel fotos, video's en request nummers!</p>
      </header>

      {!scanned && (
        <div className="qr-section">
          <h2>Scan QR Code</h2>
          <QRScanner onSuccess={handleQRSuccess} />
        </div>
      )}

      {scanned && (
        <nav className="tabs">
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📸 Upload Media
          </button>
          <button 
            className={`tab ${activeTab === 'spotify' ? 'active' : ''}`}
            onClick={() => setActiveTab('spotify')}
          >
            🎵 Request Nummer
          </button>
        </nav>
      )}

      <main className="content">
        {activeTab === 'upload' && scanned && <UploadMedia />}
        {activeTab === 'spotify' && scanned && <SpotifyRequest />}
      </main>
    </div>
  );
}

export default App;
