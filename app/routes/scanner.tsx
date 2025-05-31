// app/routes/scan.tsx
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { getStorage } from "~/utils/storage";

export const meta: MetaFunction = () => {
  return [
    { title: "掃描點名 - QR Code 點名系統" },
    { name: "description", content: "掃描 QR Code 進行點名" },
  ];
};

export default function Scan() {
  const [searchParams] = useSearchParams();
  const [studentName, setStudentName] = useState("");
  const [status, setStatus] = useState<{
    type: 'scan' | 'form' | 'success' | 'error';
    message: string;
  }>({ type: 'scan', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // 如果有 token 參數，表示是掃描後跳轉過來的
      setStatus({ type: 'form', message: '' });
    } else {
      // 沒有 token，顯示掃描介面
      setStatus({ type: 'scan', message: '' });
    }
  }, [token]);

  // 模擬掃描成功
  const simulateScan = () => {
    // 取得當前的 token（模擬掃描到的結果）
    const storage = getStorage();
    const session = storage.getCurrentSession();
    
    if (!session || !session.isActive) {
      alert("目前沒有進行中的課程，請先在主頁面建立課程");
      return;
    }

    // 模擬掃描成功，跳轉到表單頁面
    const currentToken = session.currentToken;
    window.location.href = `/scan?token=${currentToken}`;
  };

  // 提交點名
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setStatus({ type: 'error', message: '請輸入您的姓名' });
      return;
    }

    if (!token) {
      setStatus({ type: 'error', message: '無效的 QR Code' });
      return;
    }

    setIsSubmitting(true);
    
    // 模擬處理延遲
    setTimeout(() => {
      const storage = getStorage();
      const result = storage.addAttendance(token, studentName.trim());
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.message });
      }
      
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          
          {status.type === 'scan' && (
            /* 掃描介面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">📱</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                掃描 QR Code
              </h1>
              <p className="text-gray-600 mb-8">
                將教師提供的 QR Code 對準相機掃描
              </p>
              
              {/* 模擬掃描按鈕 */}
              <div className="space-y-4">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 text-left">
                  <p className="text-yellow-800 text-sm">
                    <strong>演示版本：</strong><br/>
                    目前使用模擬掃描功能。<br/>
                    請先在主頁面建立課程，然後點擊下方按鈕。
                  </p>
                </div>
                
                <button
                  onClick={simulateScan}
                  className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
                >
                  🎯 模擬掃描 QR Code
                </button>
                
                <Link
                  to="/"
                  className="block w-full py-3 px-6 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🏠 返回主頁
                </Link>
              </div>
            </div>
          )}

          {status.type === 'form' && (
            /* 點名表單 */
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  QR Code 掃描成功
                </h1>
                <p className="text-gray-600">
                  請輸入您的姓名完成點名
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    學生姓名 *
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="請輸入您的真實姓名"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    disabled={isSubmitting}
                    maxLength={20}
                    required
                  />
                </div>

                {status.message && (
                  <div className="p-4 rounded-lg text-center bg-red-100 text-red-800 border border-red-200">
                    <p className="font-medium">{status.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !studentName.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-colors ${
                    isSubmitting || !studentName.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      處理中...
                    </div>
                  ) : (
                    '📝 確認點名'
                  )}
                </button>
              </form>
            </div>
          )}

          {status.type === 'success' && (
            /* 成功頁面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">
                點名成功！
              </h1>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-medium">{status.message}</p>
              </div>
              
              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center transition-colors"
                >
                  🏠 返回主頁
                </Link>
                <button
                  onClick={() => {
                    setStatus({ type: 'form', message: '' });
                    setStudentName('');
                  }}
                  className="w-full py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  👥 幫其他同學點名
                </button>
              </div>
            </div>
          )}

          {status.type === 'error' && (
            /* 錯誤頁面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                點名失敗
              </h1>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-red-800 font-medium">{status.message}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setStatus({ type: 'scan', message: '' })}
                  className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 重新掃描
                </button>
                <Link
                  to="/"
                  className="block w-full py-3 px-4 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🏠 返回主頁
                </Link>
              </div>
            </div>
          )}

          {/* 底部說明 */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-center text-sm text-gray-500">
              ⚠️ QR Code 每 2 秒更新一次<br/>
              請確保掃描最新的 QR Code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}