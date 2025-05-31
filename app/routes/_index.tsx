// app/routes/_index.tsx
import { useState, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import { getStorage, type Session } from "~/utils/storage";

export const meta: MetaFunction = () => {
  return [
    { title: "QR Code 點名系統" },
    { name: "description", content: "簡單高效的點名系統" },
  ];
};

function generateQRCodeURL(token: string): string {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
  const scanURL = `${baseURL}/scan?token=${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanURL)}`;
}

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [courseName, setCourseName] = useState("");
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [countdown, setCountdown] = useState(2);
  const [isClient, setIsClient] = useState(false);

  // 確保在客戶端運行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 建立課程
  const createCourse = () => {
    if (!courseName.trim()) {
      alert("請輸入課程名稱");
      return;
    }
    
    const storage = getStorage();
    const newSession = storage.createSession(courseName.trim());
    setSession(newSession);
    setCourseName("");
    updateQRCode(newSession);
  };

  // 更新 QR Code
  const updateQRCode = (currentSession: Session) => {
    const storage = getStorage();
    const newToken = storage.updateToken();
    const updatedSession = storage.getCurrentSession();
    
    if (updatedSession) {
      setSession(updatedSession);
      setQrCodeURL(generateQRCodeURL(newToken));
    }
  };

  // 結束課程
  const endCourse = () => {
    if (session) {
      const storage = getStorage();
      storage.endSession();
      setSession(null);
      setQrCodeURL("");
      setCountdown(2);
    }
  };

  // 刷新記錄
  const refreshRecords = () => {
    if (session) {
      const storage = getStorage();
      const currentSession = storage.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
      }
    }
  };

  // 每 2 秒更新 QR Code
  useEffect(() => {
    if (!session || !session.isActive || !isClient) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          updateQRCode(session);
          return 2;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isClient]);

  // 自動刷新記錄 (每 3 秒)
  useEffect(() => {
    if (!session || !session.isActive || !isClient) return;

    const refreshInterval = setInterval(() => {
      refreshRecords();
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, [session, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 標題 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📱 QR Code 點名系統
          </h1>
          <p className="text-gray-600 text-lg">
            簡單、快速、安全的點名解決方案
          </p>
        </header>

        {!session ? (
          /* 建立課程區域 */
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🎓</div>
            <h2 className="text-2xl font-semibold mb-6">建立點名課程</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="請輸入課程名稱"
                className="px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg w-full sm:w-80"
                onKeyPress={(e) => e.key === 'Enter' && createCourse()}
              />
              <button
                onClick={createCourse}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium whitespace-nowrap"
              >
                🚀 開始點名
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code 區域 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                📱 {session.name}
              </h2>
              
              {qrCodeURL && (
                <div className="text-center mb-6">
                  <img
                    src={qrCodeURL}
                    alt="點名 QR Code"
                    className="mx-auto border-4 border-gray-200 rounded-xl shadow-md"
                  />
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-lg font-medium text-gray-700 mb-3">
                  QR Code 將在 <span className="text-blue-600 font-bold text-xl">{countdown}</span> 秒後更新
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${((2 - countdown) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateQRCode(session)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  🔄 立即更新 QR Code
                </button>
                
                <button
                  onClick={endCourse}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🏁 結束課程
                </button>
              </div>
            </div>

            {/* 點名記錄區域 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">📊 點名記錄</h3>
                <button
                  onClick={refreshRecords}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  🔄 刷新
                </button>
              </div>
              
              {/* 統計資訊 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {session.records.length}
                </div>
                <div className="text-blue-700 font-medium">已出席人數</div>
              </div>

              {/* 記錄列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {session.records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>尚無點名記錄</p>
                    <p className="text-sm">學生掃描 QR Code 後會顯示在這裡</p>
                  </div>
                ) : (
                  session.records.map((record, index) => (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg ${
                        index === 0 ? 'border-l-4 border-green-500 bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {session.records.length - index}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{record.name}</div>
                          <div className="text-sm text-gray-500">
                            {record.timestamp.toLocaleString('zh-TW')}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium ${
                        index === 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {index === 0 ? '✨ 最新' : '✓ 已出席'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 掃描按鈕區域 */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">👨‍🎓 學生點名</h3>
            <a
              href="/scan"
              className="inline-block w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-medium"
            >
              📲 掃描 QR Code 點名
            </a>
            <p className="text-gray-500 text-sm mt-3">
              點擊開啟掃描器進行點名
            </p>
          </div>
        </div>

        {/* 系統說明 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">💡 使用說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🏫 教師操作</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>輸入課程名稱並開始點名</li>
                <li>展示 QR Code 給學生掃描</li>
                <li>即時查看點名記錄</li>
                <li>課程結束後點擊結束課程</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">👨‍🎓 學生操作</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>點擊「掃描 QR Code 點名」按鈕</li>
                <li>掃描教師提供的 QR Code</li>
                <li>輸入姓名完成點名</li>
                <li>確認點名成功訊息</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded text-xs text-yellow-700">
            <strong>💡 提示：</strong>QR Code 每 2 秒更新一次，確保點名安全性。所有記錄會保存在瀏覽器 Console 中。
          </div>
        </div>
      </div>
    </div>
  );
}