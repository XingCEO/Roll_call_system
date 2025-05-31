// app/components/QRScanner.tsx
import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: string) => void;
  isActive: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    QrScanner: any;
  }
}

export default function QRScanner({ onScanSuccess, onScanError, isActive, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isActive) return;

    const initScanner = async () => {
      try {
        setIsLoading(true);
        setError('');

        // 動態載入 QR Scanner 庫
        if (!window.QrScanner) {
          await loadQRScannerLibrary();
        }

        if (!videoRef.current) return;

        // 檢查相機權限
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setHasPermission(true);
        } catch (permissionError) {
          setHasPermission(false);
          setError('需要相機權限才能掃描 QR Code');
          onScanError?.('需要相機權限才能掃描 QR Code');
          return;
        }

        // 初始化 QR Scanner
        const QrScanner = window.QrScanner;
        
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result: any) => {
            console.log('QR Code 掃描成功:', result.data);
            onScanSuccess(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // 後置鏡頭
            maxScansPerSecond: 5,
          }
        );

        await scannerRef.current.start();
        setIsLoading(false);

      } catch (err) {
        console.error('QR Scanner 初始化失敗:', err);
        setError('QR Scanner 初始化失敗，請確認瀏覽器支援相機功能');
        onScanError?.('QR Scanner 初始化失敗');
        setIsLoading(false);
      }
    };

    initScanner();

    // 清理函數
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isActive, onScanSuccess, onScanError]);

  const loadQRScannerLibrary = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.QrScanner) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/qr-scanner.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load QR Scanner library'));
      document.head.appendChild(script);
    });
  };

  const handleSwitchCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.setCamera('user'); // 切換到前置鏡頭
      } catch (err) {
        try {
          await scannerRef.current.setCamera('environment'); // 切換到後置鏡頭
        } catch (err2) {
          console.error('切換鏡頭失敗:', err2);
        }
      }
    }
  };

  const handleToggleFlash = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.toggleFlash();
      } catch (err) {
        console.error('切換閃光燈失敗:', err);
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        {/* 標題列 */}
        <div className="bg-white rounded-t-lg p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">掃描 QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 掃描區域 */}
        <div className="bg-white p-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>啟動相機中...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100">
                <div className="text-red-800 text-center p-4">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-yellow-100">
                <div className="text-yellow-800 text-center p-4">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm">請允許相機權限</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    重新載入
                  </button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* 掃描框 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-48 border-4 border-white opacity-50 rounded-lg"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
              </div>
            </div>
          </div>

          {/* 控制按鈕 */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={handleSwitchCamera}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              🔄 切換鏡頭
            </button>
            <button
              onClick={handleToggleFlash}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              💡 閃光燈
            </button>
          </div>

          {/* 說明文字 */}
          <div className="mt-4 text-center text-gray-600 text-sm">
            <p>將 QR Code 對準掃描框</p>
            <p>系統會自動識別並跳轉到點名頁面</p>
          </div>
        </div>
      </div>
    </div>
  );
}