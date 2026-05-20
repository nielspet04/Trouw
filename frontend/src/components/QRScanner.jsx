import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onSuccess }) {
  const qrScannerRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const qrscanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    qrscanner.render(
      (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        onSuccess(decodedText);
        qrscanner.clear();
      },
      (error) => {
        // Ignore errors during scanning
      }
    );

    scannerRef.current = qrscanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onSuccess]);

  return (
    <div className="qr-scanner">
      <div id="qr-reader"></div>
      <p className="qr-hint">Richt je camera op de QR code</p>
    </div>
  );
}
