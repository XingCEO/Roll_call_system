// app/routes/attend.tsx
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "學生點名 - 動態點名系統" },
    { name: "description", content: "學生點名頁面" },
  ];
};

// 獲取全域資料庫的函數
const getGlobalDatabase = () => {
  if (typeof window !== 'undefined') {
    // 嘗試從主視窗獲取資料庫
    if (window.opener && window.opener.ROLL_CALL_DB) {
      return window.opener.ROLL_CALL_DB;
    }
    // 或從當前視窗獲取
    if ((window as any).ROLL_CALL_DB) {
      return (window as any).ROLL_CALL_DB;
    }
    // 如果都沒有，初始化一個簡單的資料庫
    const simpleDB = {
      sessions: new Map(),
      addAttendee: function(sessionId: string, token: string, studentName: string) {
        console.log(`🔍 點名請求 - Session: ${sessionId}, Student: ${studentName}`);
        
        if (!this.sessions.has(sessionId)) {
          const mockSession = {
            id: sessionId,
            name: `測試課程 ${sessionId.substring(5, 10)}`,
            currentToken: token,
            attendees: [],
            isActive: true,
            createdAt: new Date()
          };
          this.sessions.set(sessionId, mockSession);
          console.log(`📚 建立模擬課程:`, mockSession);
        }
        
        const session = this.sessions.get(sessionId);
        
        // 檢查重複點名
        const existing = session.attendees.find((a: any) => a.name === studentName);
        if (existing) {
          return { success: false, message: `${studentName} 已經完成點名了` };
        }
        
        // 添加出席記錄
        const attendanceRecord = {
          name: studentName,
          timestamp: new Date(),
          token: token
        };
        
        session.attendees.push(attendanceRecord);
        
        console.group(`✅ 點名成功 - ${studentName}`);
        console.log(`📚 課程: ${session.name}`);
        console.log(`👤 學生: ${studentName}`);
        console.log(`⏰ 時間: ${attendanceRecord.timestamp.toLocaleString('zh-TW')}`);
        console.log(`🔢 序號: 第 ${session.attendees.length} 位`);
        console.groupEnd();
        
        return { success: true, message: `${studentName} 點名成功！`, session: session };
      }
    };
    
    (window as any).ROLL_CALL_DB = simpleDB;
    return simpleDB;
  }
  return null;
};

export default function Attend() {
  const [searchParams] = useSearchParams();
  const [studentName, setStudentName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const sessionId = searchParams.get('session');
  const token = searchParams.get('token');

  useEffect(() => {
    if (sessionId && token) {
      // 獲取或建立課程資訊
      const db = getGlobalDatabase();
      if (db) {
        if (!db.sessions.has(sessionId)) {
          const mockSession = {
            id: sessionId,
            name: `測試課程 ${sessionId.substring(5, 10)}`,
            currentToken: token,
            attendees: [],
            isActive: true,
            createdAt: new Date()
          };
          db.sessions.set(sessionId, mockSession);
        }
        setSessionInfo(db.sessions.get(sessionId));
      }
    }
  }, [sessionId, token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      alert("請輸入您的姓名");
      return;
    }

    const db = getGlobalDatabase();
    if (!db || !sessionId || !token) {
      alert("❌ 系統錯誤，請重新掃描");
      return;
    }

    // 執行點名
    const result = db.addAttendee(sessionId, token, studentName.trim());
    
    if (result.success) {
      // 更新本地狀態
      setIsSubmitted(true);
      if (result.session) {
        setSessionInfo(result.session);
      }
      
      // 通知主視窗更新（如果存在）
      if (window.opener) {
        try {
          // 立即通知
          window.opener.postMessage({
            type: 'ATTENDANCE_SUCCESS',
            studentName: studentName.trim(),
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            attendeeCount: result.session?.attendees.length || 1
          }, '*');
          console.log('📡 已通知主視窗更新出席名單');
          
          // 延遲再次通知以確保更新
          setTimeout(() => {
            window.opener.postMessage({
              type: 'ATTENDANCE_SUCCESS',
              studentName: studentName.trim(),
              sessionId: sessionId,
              timestamp: new Date().toISOString(),
              attendeeCount: result.session?.attendees.length || 1
            }, '*');
            console.log('📡 延遲通知已發送');
          }, 500);
          
        } catch (error) {
          console.log('📡 無法通知主視窗:', error);
        }
      }
      
      // 顯示成功訊息
      alert(`🎉 ${studentName.trim()} 點名成功！您是第 ${result.session?.attendees.length || 1} 位`);
    } else {
      alert(`❌ 點名失敗: ${result.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              學生點名
            </h1>
            {sessionInfo && (
              <div className="text-gray-600">
                <p className="font-medium">{sessionInfo.name}</p>
                <p className="text-sm">已有 {sessionInfo.attendees.length} 位同學完成點名</p>
              </div>
            )}
          </div>

          {/* 顯示 URL 參數（除錯用） */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p><strong>Session:</strong> {sessionId}</p>
            <p><strong>Token:</strong> {token ? `${token.substring(0, 8)}...` : 'N/A'}</p>
            <p><strong>狀態:</strong> 頁面正常載入 ✅</p>
          </div>

          {!sessionId || !token ? (
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <p className="text-red-600 mb-4">無效的 QR Code，請重新掃描！</p>
              <Link
                to="/scanner"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                📱 重新掃描
              </Link>
            </div>
          ) : isSubmitted ? (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-green-600 mb-4">點名成功！</h2>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-medium">
                  {studentName} 已成功完成點名
                </p>
                {sessionInfo && (
                  <p className="text-green-700 text-sm mt-2">
                    您是第 {sessionInfo.attendees.length} 位完成點名的同學
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
                >
                  🏠 返回主頁
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setStudentName("");
                  }}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  👥 幫其他同學點名
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  學生姓名 *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="請輸入您的姓名"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  required
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  請輸入真實姓名
                </p>
              </div>

              <button
                type="submit"
                disabled={!studentName.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-colors ${
                  !studentName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                ✅ 確認點名
              </button>
            </form>
          )}

          {/* 當前出席名單（僅顯示） */}
          {sessionInfo && sessionInfo.attendees.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                📊 目前出席名單 ({sessionInfo.attendees.length} 人)
              </h4>
              <div className="space-y-1 text-sm">
                {sessionInfo.attendees.slice(-5).map((attendee: any, index: number) => (
                  <div key={index} className="text-blue-700">
                    {sessionInfo.attendees.length - 4 + index}. {attendee.name} 
                    <span className="text-blue-500 ml-2">
                      {attendee.timestamp.toLocaleTimeString('zh-TW')}
                    </span>
                  </div>
                ))}
                {sessionInfo.attendees.length > 5 && (
                  <p className="text-blue-600 text-xs">...還有 {sessionInfo.attendees.length - 5} 位同學</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-blue-500 hover:text-blue-600"
            >
              ← 返回主頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}