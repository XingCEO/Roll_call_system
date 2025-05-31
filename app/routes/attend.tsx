// app/routes/attend.tsx
import { useState } from "react";
import { useSearchParams, Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "學生點名 - 動態點名系統" },
    { name: "description", content: "學生點名頁面" },
  ];
};

export default function Attend() {
  const [searchParams] = useSearchParams();
  const [studentName, setStudentName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sessionId = searchParams.get('session');
  const token = searchParams.get('token');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      alert("請輸入您的姓名");
      return;
    }

    // 模擬點名成功
    console.log(`✅ 點名成功: ${studentName} (Session: ${sessionId})`);
    
    // 通知主視窗（如果是從掃描器開啟的）
    if (window.opener) {
      window.opener.postMessage({
        type: 'ATTENDANCE_SUCCESS',
        studentName: studentName.trim(),
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }, '*');
    }
    
    // 顯示成功訊息
    alert(`🎉 ${studentName.trim()} 點名成功！`);
    setIsSubmitted(true);
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
            <p className="text-gray-600">
              請輸入您的姓名完成點名
            </p>
          </div>

          {/* 顯示 URL 參數（除錯用） */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p><strong>Session:</strong> {sessionId}</p>
            <p><strong>Token:</strong> {token}</p>
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
              <p className="text-gray-600 mb-6">
                {studentName} 已成功完成點名
              </p>
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
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-lg"
              >
                ✅ 確認點名
              </button>
            </form>
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