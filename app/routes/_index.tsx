// app/routes/_index.tsx
import { useState, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import { getDatabase, type Session } from "~/utils/database";

export const meta: MetaFunction = () => {
  return [
    { title: "動態點名系統 - 教師端" },
    { name: "description", content: "基於動態 QR Code 的即時點名系統" },
  ];
};

function generateQRCodeURL(sessionId: string, token: string): string {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
  const attendanceURL = `${baseURL}/attend?session=${sessionId}&token=${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(attendanceURL)}`;
}

export default function TeacherIndex() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [countdown, setCountdown] = useState(2);
  const [isClient, setIsClient] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateNotification, setUpdateNotification] = useState<string>('');

  // 確保在客戶端運行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 建立新課程
  const createNewSession = () => {
    if (!sessionName.trim()) {
      alert("請輸入課程名稱");
      return;
    }
    
    const db = getDatabase();
    const session = db.createSession(sessionName.trim());
    setCurrentSession(session);
    setSessionName("");
    updateQRCode(session);
    
    // 確保資料庫可被其他視窗訪問
    if (typeof window !== 'undefined') {
      (window as any).ROLL_CALL_DB = db;
      console.log('🔗 資料庫已設定為全域可訪問');
    }
  };

  // 更新 QR Code
  const updateQRCode = (session: Session) => {
    const db = getDatabase();
    const updatedSession = db.updateToken(session.id);
    if (updatedSession) {
      setCurrentSession(updatedSession);
      setQrCodeURL(generateQRCodeURL(updatedSession.id, updatedSession.currentToken));
    }
  };

  // 結束課程
  const endSession = () => {
    if (currentSession) {
      const db = getDatabase();
      const endedSession = db.endSession(currentSession.id);
      if (endedSession) {
        setCurrentSession(null);
        setQrCodeURL("");
        setCountdown(2);
      }
    }
  };

  // 每 2 秒更新 QR Code
  useEffect(() => {
    if (!currentSession || !currentSession.isActive || !isClient) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          updateQRCode(currentSession);
          return 2;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isClient]);

  // 初始化 QR Code
  useEffect(() => {
    if (currentSession && currentSession.isActive && isClient) {
      setQrCodeURL(generateQRCodeURL(currentSession.id, currentSession.currentToken));
      setCountdown(2);
    }
  }, [currentSession, isClient]);

  // 手動刷新出席名單
  const refreshAttendance = () => {
    if (currentSession) {
      const db = getDatabase();
      const session = db.getSession(currentSession.id);
      if (session) {
        const oldCount = currentSession.attendees.length;
        const newCount = session.attendees.length;
        
        setCurrentSession(session);
        setLastUpdate(new Date());
        
        if (newCount > oldCount) {
          setUpdateNotification(`🎉 新增 ${newCount - oldCount} 位學生出席！總共 ${newCount} 人`);
          // 3秒後清除通知
          setTimeout(() => setUpdateNotification(''), 3000);
        }
        
        console.log('🔄 出席名單已刷新:', session.attendees);
      }
    }
  };

  // 自動刷新出席名單 (每 3 秒)
  useEffect(() => {
    if (!currentSession || !currentSession.isActive || !isClient) return;

    const refreshInterval = setInterval(() => {
      refreshAttendance();
    }, 3000); // 每 3 秒自動刷新

    return () => clearInterval(refreshInterval);
  }, [currentSession, isClient]);

  // 監聽來自點名頁面的訊息
  useEffect(() => {
    if (!isClient) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ATTENDANCE_SUCCESS') {
        const { studentName, sessionId, timestamp, attendeeCount } = event.data;
        
        console.log(`📡 收到點名成功通知: ${studentName} (課程: ${sessionId})`);
        
        // 顯示大型成功通知
        setUpdateNotification(`🎉 ${studentName} 點名成功！目前共 ${attendeeCount} 人出席`);
        
        // 如果是當前課程，立即刷新出席名單
        if (currentSession && currentSession.id === sessionId) {
          console.log('🔄 正在更新當前課程出席名單...');
          
          // 立即刷新
          refreshAttendance();
          
          // 額外延遲刷新以確保資料同步
          setTimeout(() => {
            refreshAttendance();
          }, 500);
          
          // 1.5秒後再次刷新
          setTimeout(() => {
            refreshAttendance();
          }, 1500);
        }
        
        // 5秒後清除通知
        setTimeout(() => setUpdateNotification(''), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentSession, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">系統載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎯 動態點名系統
          </h1>
          <p className="text-gray-600 text-lg">
            QR Code 每 2 秒自動更新，確保點名的即時性和安全性
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>📱 支援手機掃描</span>
            <span>🔄 自動更新 QR Code</span>
            <span>📊 即時統計</span>
            <span>💾 Console 資料庫</span>
          </div>
        </header>

        {!currentSession ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">👨‍🏫</div>
            <h2 className="text-2xl font-semibold mb-6">建立新的點名課程</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="請輸入課程名稱 (例：資料結構與演算法)"
                className="px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg w-full sm:w-80"
                onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
              />
              <button
                onClick={createNewSession}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium whitespace-nowrap"
              >
                🚀 開始點名
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">💡 系統特色</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 動態 QR Code 每 2 秒更新，防止代點名</li>
                <li>• 學生掃描後輸入姓名即可完成點名</li>
                <li>• 即時顯示出席統計和名單</li>
                <li>• 所有資料記錄在瀏覽器 Console 中</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* QR Code 區域 */}
            <div className="xl:col-span-1 bg-white rounded-xl shadow-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                📱 {currentSession.name}
              </h2>
              
              {qrCodeURL && (
                <div className="mb-6">
                  <img
                    src={qrCodeURL}
                    alt="點名 QR Code"
                    className="mx-auto border-4 border-gray-200 rounded-xl shadow-md max-w-full h-auto"
                  />
                </div>
              )}
              
              <div className="mb-6">
                <div className="text-lg font-medium text-gray-700 mb-3">
                  QR Code 將在 <span className="text-blue-600 font-bold text-xl">{countdown}</span> 秒後更新
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((2 - countdown) / 2) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Token: {currentSession.currentToken.substring(0, 8)}...
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateQRCode(currentSession)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  🔄 立即更新 QR Code
                </button>
                
                <button
                  onClick={endSession}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🏁 結束課程
                </button>
              </div>
            </div>

            {/* 出席統計區域 */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">📊 即時出席統計</h3>
                <button
                  onClick={refreshAttendance}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  🔄 刷新
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {currentSession.attendees.length}
                  </div>
                  <div className="text-green-700 font-medium">已出席</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentSession.tokenHistory.length}
                  </div>
                  <div className="text-blue-700 font-medium">QR 更新次數</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round((Date.now() - currentSession.createdAt.getTime()) / 1000 / 60)}
                  </div>
                  <div className="text-purple-700 font-medium">進行時間 (分鐘)</div>
                </div>
              </div>

              {/* 出席名單 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">出席名單</h4>
                  {lastUpdate && (
                    <span className="text-xs text-green-600">
                      最後更新：{lastUpdate.toLocaleTimeString('zh-TW')}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {currentSession.attendees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      <p>尚無學生點名</p>
                      <p className="text-sm">學生掃描 QR Code 後會顯示在這裡</p>
                    </div>
                  ) : (
                    currentSession.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm transition-all duration-300 ${
                          // 最新的記錄加上特殊樣式
                          index === 0 ? 'border-l-4 border-green-500 bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                            index === 0 ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{attendee.name}</div>
                            <div className="text-sm text-gray-500">
                              {attendee.timestamp.toLocaleString('zh-TW')}
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
          </div>
        )}

        {/* 學生操作區域 */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">👨‍🎓 學生操作區</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">📱</div>
                <h4 className="font-semibold mb-2">手機掃描點名</h4>
                <p className="text-gray-600 text-sm mb-4">
                  點擊按鈕開啟掃描器，然後使用測試按鈕模擬掃描
                </p>
                <a
                  href="/scanner"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  📲 開啟掃描器
                </a>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🧪</div>
                <h4 className="font-semibold mb-2">快速測試點名</h4>
                <p className="text-gray-600 text-sm mb-4">
                  直接測試點名功能（需要先建立課程）
                </p>
                {currentSession ? (
                  <button
                    onClick={() => {
                      const testUrl = `/attend?session=${currentSession.id}&token=${currentSession.currentToken}`;
                      window.open(testUrl, '_blank', 'width=400,height=600');
                    }}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    🖱️ 快速點名測試
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    請先建立課程
                  </button>
                )}
              </div>
            </div>
            
            {/* 說明文字 */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>📌 使用說明：</strong><br/>
                1. 先在上方建立課程<br/>
                2. 點擊「開啟掃描器」<br/>
                3. 在掃描器頁面點擊「🎯 模擬掃描成功」按鈕<br/>
                4. 或直接點擊「🖱️ 快速點名測試」
              </p>
            </div>
          </div>
        </div>

        {/* 系統說明 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💡 系統使用說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🏫 教師操作流程</h4>
              <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
                <li>輸入課程名稱並點擊「開始點名」</li>
                <li>將 QR Code 顯示給學生掃描</li>
                <li>即時查看出席統計和名單</li>
                <li>課程結束後點擊「結束課程」</li>
                <li>在瀏覽器 Console 查看完整記錄</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">👨‍🎓 學生點名流程</h4>
              <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
                <li>使用手機掃描教師提供的 QR Code</li>
                <li>在點名頁面輸入自己的姓名</li>
                <li>點擊「確認點名」完成簽到</li>
                <li>系統會顯示點名成功訊息</li>
                <li>如果 QR Code 過期，請重新掃描</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ 重要提醒</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• QR Code 每 2 秒自動更新，過期的 QR Code 無法使用</li>
              <li>• 每位學生在同一課程中只能點名一次</li>
              <li>• 所有點名記錄都會保存在瀏覽器 Console 中</li>
              <li>• 建議使用現代瀏覽器以獲得最佳體驗</li>
              <li>• 確保網路連接穩定以保證 QR Code 正常更新</li>
            </ul>
          </div>
        </div>

        {/* Console 操作說明 */}
        {currentSession && (
          <div className="mt-8 bg-gray-800 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Console 資料庫操作</h3>
            <p className="text-gray-300 mb-4">按 F12 開啟開發者工具，在 Console 中輸入以下命令：</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-700 p-3 rounded">
                <code className="text-green-400">exportRollCallData()</code>
                <p className="text-gray-300 mt-1">匯出所有點名資料</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <code className="text-green-400">getRollCallSessions()</code>
                <p className="text-gray-300 mt-1">查看所有課程資料</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <code className="text-green-400">cleanupRollCallData()</code>
                <p className="text-gray-300 mt-1">清理過期資料</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}