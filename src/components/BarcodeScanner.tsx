import React, { useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onCodeScanned }) => {
  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      try {
        const result = await codeReader.current.decodeFromImage(undefined, imageSrc);
        if (result) {
          onCodeScanned(result.getText());
        }
      } catch (error) {
        // バーコードが見つからない場合は無視
      }
    }
  }, [onCodeScanned]);

  React.useEffect(() => {
    const interval = setInterval(capture, 500); // 0.5秒ごとにスキャン
    return () => {
      clearInterval(interval);
      codeReader.current.reset();
    };
  }, [capture]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: 'environment',
          width: 1280,
          height: 720
        }}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default BarcodeScanner; 