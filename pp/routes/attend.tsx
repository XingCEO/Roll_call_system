// app/routes/attend.tsx
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { getDatabase, type AttendanceResult } from "~/utils/database";

export const meta: MetaFunction = () => {
  return [
    { title: "學生點名 - 動態點名系統" },
    { name: "description", content: "學生點名頁面" },
  ];
};

export default function Attend() {
  const [searchParams] = useSearchParams();
  const [studentName, setStudentName] = useState("");
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'loading';
    message: string;
  }>({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const sessionId = searchParams.get('session');
  const token = searchParams.get('token');

  // 確保在客戶端運行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 驗證 URL 參數並獲取課程資訊
  useEffect(() => {
    if (!isClient) return;

    if (!sessionId || !token) {
      setStatus({
        type: 'error',
        message: '無效的 QR Code，請重新掃描！'
      });
      return;
    }

    // 獲取課程資訊
    const db = getDatabase();
    const session = db.getSession(sessionId);
    
    if (!session) {
      setStatus({
        type: 'error',
        message: '課程不存在，請確認 QR Code 是否正確'
      });
      return;
    }

    if (!session.isActive) {
      setStatus({
        type: 'error',
        message: '課程已結束，無法進行點名'
      });
      return;
    }

    if (session.currentToken !== token) {
      setStatus({
        type: 'error',
        message: 'QR Code 已過期，請重新掃描最新的 QR Code'
      });
      return;
    }

    setSessionInfo(session);
    setStatus({ type: 'idle', message: '' });
  }, [sessionId, token, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setStatus({
        type: 'error',
        message: '請輸入您的姓名'
      });
      return;
    }

    if (studentName.trim().length < 2) {
      setStatus({
        type: 'error',
        message: '姓名至少需要 2 個字元'
      });
      return;
    }

    if (!sessionId || !token) {
      setStatus({
        type: 'error',
        message: '無效的 QR Code'
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'loading', message: '處理中...' });
    
    // 模擬網路延遲
    setTimeout(() => {
      const db = getDatabase();
      const result: AttendanceResult = db.addAttendee(sessionId, token, studentName.trim());
      
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        setStudentName("");
        // 更新課程資訊以顯示最新的出席人數
        if (result.session) {
          setSessionInfo(result.session);
        }
      }
      
      setIsSubmitting(false);
    }, 800);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* 標題區域 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h1 className="text-2xl font-bold mb-2">學生點名</h1>
            {sessionInfo && (
              <div className="text-blue-100">
                <p className="font-medium">{sessionInfo.name}</p>
                <p className="text-sm opacity-90">
                  已有 {sessionInfo.attendees.length} 位同學完成點名
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* 錯誤狀態 */}
            {(!sessionId || !token || (sessionInfo === null && status.type === 'error')) ? (
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-xl font-semibold text-red-600 mb-4">點名失敗</h2>
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="text-red-800">{status.message}</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🔄 重新載入
                  </button>
                  <Link
                    to="/scanner"
                    className="block w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center"
                  >
                    📱 重新掃描
                  </Link>
                </div>
              </div>
            ) : status.type === 'success' ? (
              /* 成功狀態 */
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-xl font-semibold text-green-600 mb-4">點名成功！</h2>
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-green-800 font-medium">{status.message}</p>
                  {sessionInfo && (
                    <p className="text-green-700 text-sm mt-2">
                      您是第 {sessionInfo.attendees.length} 位完成點名的同學
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Link
                    to="/"
                    className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
                  >
                    🏠 返回主頁
                  </Link>
                  <button
                    onClick={() => {
                      setStatus({ type: 'idle', message: '' });
                      setStudentName('');
                    }}
                    className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    👥 幫其他同學點名
                  </button>
                </div>
              </div>
            ) : (
              /* 點名表單 */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="studentName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    請輸入您的姓名 *
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="例：王小明"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    disabled={isSubmitting}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    請輸入真實姓名，至少 2 個字元
                  </p>
                </div>

                {/* 狀態訊息 */}
                {status.message && status.type !== 'idle' && (
                  <div className={`p-4 rounded-lg text-center ${
                    status.type === 'error'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : status.type === 'loading'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <div className="text-2xl mb-2">
                      {status.type === 'error' ? '❌' : 
                       status.type === 'loading' ? '⏳' : '✅'}
                    </div>
                    <p className="font-medium">{status.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !studentName.trim() || !sessionId || !token}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-colors ${
                    isSubmitting || !studentName.trim() || !sessionId || !token
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      處理中...
                    </div>
                  ) : (
                    '✅ 確認點名'
                  )}
                </button>
              </form>
            )}

            {/* 說明區域 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500 space-y-2">
                <p>⚠️ QR Code 每 2 秒更新一次</p>
                <p>如果點名失敗，請重新掃描 QR Code</p>
                <p>每位同學在同一課程中只能點名一次</p>
              </div>
            </div>

            {/* 操作按鈕 */}
            {status.type !== 'success' && (
              <div className="mt-6 flex gap-3">
                <Link
                  to="/"
                  className="flex-1 text-center px-4 py-2 text-blue-500 hover:text-blue-600 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  🏠 返回主頁
                </Link>
                <Link
                  to="/scanner"
                  className="flex-1 text-center px-4 py-2 text-green-500 hover:text-green-600 font-medium border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  📱 重新掃描
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 課程資訊卡片 */}
        {sessionInfo && status.type !== 'success' && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">📚 課程資訊</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">課程名稱：</span>{sessionInfo.name}</p>
              <p><span className="font-medium">開始時間：</span>{sessionInfo.createdAt.toLocaleString('zh-TW')}</p>
              <p><span className="font-medium">目前出席：</span>{sessionInfo.attendees.length} 人</p>
              <p><span className="font-medium">Token ID：</span>{sessionInfo.currentToken.substring(0, 8)}...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}