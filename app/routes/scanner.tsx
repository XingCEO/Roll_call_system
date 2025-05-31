// app/routes/scanner.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import QRScanner from "~/components/QRScanner";

export const meta: MetaFunction = () => {
  return [
    { title: "QR Code 掃描器 - 動態點名系統" },
    { name: "description", content: "使用相機掃描 QR Code 進行點名" },
  ];
};

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    url: string;
    timestamp: Date;
    isValid: boolean;
  }>>([]);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  // 檢查瀏覽器相機支援
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      setError('您的瀏覽器不支援相機功能，請使用現代瀏覽器');
    }
  }, []);

  const handleScanSuccess = (result: string) => {
    console.log('掃描結果:', result);
    
    // 驗證是否為有效的點名連結
    const isValidAttendanceURL = result.includes('/attend?session=') && result.includes('token=');
    
    // 記錄掃描歷史
    setScanHistory(prev => [{
      url: result,
      timestamp: new Date(),
      isValid: isValidAttendanceURL
    }, ...prev.slice(0, 4)]); // 只保留最近 5 筆記錄

    if (isValidAttendanceURL) {
      // 如果是有效的點名連結，直接跳轉
      try {
        const url = new URL(result);
        const pathname = url.pathname;
        const search = url.search;
        setIsScanning(false);
        navigate(pathname + search);
      } catch (err) {
        setError('無效的 QR Code 格式');
      }
    } else {
      // 如果不是點名連結，詢問用戶是否要開啟
      const confirmOpen = window.confirm(
        `掃描到的內容不是點名連結：\n${result}\n\n是否要開啟此連結？`
      );
      
      if (confirmOpen) {
        window.open(result, '_blank');
      }
      setIsScanning(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('掃描錯誤:', error);
    setError(error);
    setIsScanning(false);
  };

  const startScanning = () => {
    setError('');
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* QR Scanner 元件 */}
      <QRScanner
        isActive={isScanning}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onClose={stopScanning}
      />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 標題 */}
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              📱 QR Code 掃描器
            </h1>
            <p className="text-gray-600">
              點擊下方按鈕開始掃描點名 QR Code
            </p>
          </header>

          {/* 主要操作區域 */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <div className="text-6xl mb-6">📷</div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={startScanning}
                disabled={!!error}
                className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-colors ${
                  error
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isScanning ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    掃描中...
                  </div>
                ) : (
                  '📲 開始掃描 QR Code'
                )}
              </button>

              <div className="flex gap-3">
                <Link
                  to="/"
                  className="flex-1 py-3 px-4 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🏠 返回主頁
                </Link>
                <Link
                  to="/attend"
                  className="flex-1 py-3 px-4 text-center border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                >
                  ✏️ 手動輸入
                </Link>
              </div>
            </div>
          </div>

          {/* 使用說明 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 使用說明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📱 掃描步驟</h4>
                <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
                  <li>點擊「開始掃描 QR Code」按鈕</li>
                  <li>允許瀏覽器使用相機權限</li>
                  <li>將 QR Code 對準掃描框</li>
                  <li>系統自動識別並跳轉到點名頁面</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">⚠️ 注意事項</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 確保光線充足，QR Code 清晰可見</li>
                  <li>• QR Code 每 2 秒更新，請掃描最新的</li>
                  <li>• 支援前後鏡頭切換和閃光燈</li>
                  <li>• 需要 HTTPS 環境才能使用相機功能</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 掃描歷史 */}
          {scanHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">📝 掃描歷史</h3>
              <div className="space-y-3">
                {scanHistory.map((record, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      record.isValid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        record.isValid ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {record.isValid ? '✅ 點名連結' : '⚠️ 其他連結'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {record.timestamp.toLocaleTimeString('zh-TW')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 break-all">
                      {record.url.length > 60 
                        ? `${record.url.substring(0, 60)}...` 
                        : record.url
                      }
                    </p>
                    {record.isValid && (
                      <button
                        onClick={() => {
                          try {
                            const url = new URL(record.url);
                            navigate(url.pathname + url.search);
                          } catch (err) {
                            setError('無效的連結格式');
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        重新使用此連結
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setScanHistory([])}
                className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                清空歷史記錄
              </button>
            </div>
          )}

          {/* 瀏覽器支援檢查 */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">🔧 系統需求</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-700 mb-2">✅ 支援的瀏覽器</h4>
                <ul className="text-blue-600 space-y-1">
                  <li>• Chrome 53+ (推薦)</li>
                  <li>• Firefox 68+</li>
                  <li>• Safari 11+</li>
                  <li>• Edge 79+</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-700 mb-2">⚙️ 功能檢查</h4>
                <ul className="text-blue-600 space-y-1">
                  <li>• 相機權限: {typeof navigator !== 'undefined' && navigator.mediaDevices ? '✅' : '❌'}</li>
                  <li>• HTTPS 環境: {typeof location !== 'undefined' && location.protocol === 'https:' ? '✅' : '❌'}</li>
                  <li>• 現代瀏覽器: {typeof Promise !== 'undefined' ? '✅' : '❌'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 測試用 QR Code */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🧪 測試功能</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-3">
                  因為這是演示版本，真正的 QR Code 解碼尚未完全實現。<br/>
                  請使用以下按鈕模擬掃描成功：
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const testUrl = `${window.location.origin}/attend?session=test_${Date.now()}&token=token_${Math.random().toString(36).substring(7)}`;
                      console.log('🧪 模擬掃描結果:', testUrl);
                      
                      // 直接觸發掃描成功
                      handleScanSuccess(testUrl);
                    }}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    🎯 模擬掃描成功（新課程）
                  </button>
                  
                  <button
                    onClick={() => {
                      // 使用固定的測試 session，方便測試同一課程
                      const testUrl = `${window.location.origin}/attend?session=fixed_test_session&token=token_${Math.random().toString(36).substring(7)}`;
                      console.log('🧪 模擬掃描結果（固定課程）:', testUrl);
                      
                      handleScanSuccess(testUrl);
                    }}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🎯 模擬掃描成功（固定課程）
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-600 mb-2 text-sm">
                  <strong>注意：</strong>相機功能目前只是展示，真正的 QR Code 掃描需要專業的解碼庫（如 jsQR）。
                </p>
                <p className="text-gray-500 text-xs">
                  現在相機會開啟但不會自動檢測 QR Code，請使用上方測試按鈕。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}