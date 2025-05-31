// app/routes/scan.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { MockDB as RealtimeDB } from "~/utils/mock-db";

export const meta: MetaFunction = () => {
  return [
    { title: "學生點名 - QR Code 點名系統" },
    { name: "description", content: "掃描 QR Code 進行點名" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const sessionId = formData.get('sessionId') as string;
  const token = formData.get('token') as string;
  const studentName = formData.get('studentName') as string;

  if (!sessionId || !token || !studentName?.trim()) {
    return json({ 
      success: false, 
      message: '缺少必要資訊' 
    });
  }

  const result = await RealtimeDB.addAttendance(sessionId, token, studentName);
  return json(result);
}

// 定義 action 返回的型別
type ActionData = {
  success: boolean;
  message: string;
  record?: any;
};

export default function StudentScan() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [status, setStatus] = useState<'scan' | 'form' | 'success' | 'error'>('scan');
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const sessionId = searchParams.get('sessionId');
  const token = searchParams.get('token');
  const isSubmitting = navigation.state === 'submitting';

  // 檢查 URL 參數和載入課程資訊
  useEffect(() => {
    const loadSessionInfo = async () => {
      if (sessionId && token) {
        try {
          // 這裡可以呼叫 API 取得課程資訊（為了簡化，我們先用模擬資料）
          setSessionInfo({
            name: `課程 ${sessionId.substring(8, 12)}`,
            id: sessionId
          });
          setStatus('form');
        } catch (error) {
          setStatus('error');
        }
      } else {
        setStatus('scan');
      }
    };

    loadSessionInfo();
  }, [sessionId, token]);

  // 處理點名結果
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }
  }, [actionData]);

  // 模擬掃描成功（演示用）
  const simulateScan = () => {
    // 生成測試 URL
    const testSessionId = 'session_' + Date.now();
    const testToken = 'token_' + Math.random().toString(36).substring(7);
    window.location.href = `/scan?sessionId=${testSessionId}&token=${testToken}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          
          {status === 'scan' && (
            /* 掃描介面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">📱</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                掃描 QR Code 點名
              </h1>
              <p className="text-gray-600 mb-8">
                掃描教師螢幕上的 QR Code 進行點名
              </p>
              
              {/* QR Code 掃描器會放在這裡 */}
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                <div className="text-gray-500 mb-4">
                  📷 相機掃描器
                </div>
                <p className="text-sm text-gray-500">
                  真實版本會在這裡開啟相機
                </p>
              </div>
              
              {/* 演示用按鈕 */}
              <div className="space-y-4">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 text-left">
                  <p className="text-yellow-800 text-sm">
                    <strong>演示版本：</strong><br/>
                    點擊下方按鈕模擬掃描成功
                  </p>
                </div>
                
                <button
                  onClick={simulateScan}
                  className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
                >
                  🎯 模擬掃描 QR Code
                </button>
              </div>
            </div>
          )}

          {status === 'form' && (
            /* 點名表單 */
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  掃描成功！
                </h1>
                {sessionInfo && (
                  <p className="text-gray-600">
                    課程：{sessionInfo.name}
                  </p>
                )}
              </div>

              <Form method="post" className="space-y-6">
                <input type="hidden" name="sessionId" value={sessionId || ''} />
                <input type="hidden" name="token" value={token || ''} />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    請輸入您的姓名 *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    placeholder="請輸入真實姓名"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    disabled={isSubmitting}
                    maxLength={20}
                    required
                  />
                </div>

                {actionData && !actionData.success && (
                  <div className="p-4 rounded-lg text-center bg-red-100 text-red-800 border border-red-200">
                    <p className="font-medium">{actionData.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-colors ${
                    isSubmitting
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
              </Form>
            </div>
          )}

          {status === 'success' && (
            /* 成功頁面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">
                點名成功！
              </h1>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-medium">
                  {actionData?.message || '點名完成'}
                </p>
                <p className="text-green-700 text-sm mt-2">
                  您的出席已記錄到教師端
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/scan'}
                  className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 重新掃描
                </button>
                <button
                  onClick={() => {
                    setStatus('form');
                  }}
                  className="w-full py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  👥 幫其他同學點名
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            /* 錯誤頁面 */
            <div className="p-8 text-center">
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                點名失敗
              </h1>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-red-800 font-medium">
                  {actionData?.message || '發生錯誤，請重試'}
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/scan'}
                  className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 重新掃描
                </button>
              </div>
            </div>
          )}

          {/* 底部說明 */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-center text-sm text-gray-500">
              ⚠️ QR Code 每 2 秒更新一次<br/>
              請確保掃描教師螢幕上的最新 QR Code
            </p>
          </div>
        </div>

        {/* 學生端專用說明 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">📱 學生端操作說明</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>將手機對準教師螢幕上的 QR Code</li>
            <li>掃描成功後輸入您的真實姓名</li>
            <li>點擊確認點名完成簽到</li>
            <li>點名成功後教師端會立即顯示</li>
          </ol>
        </div>
      </div>
    </div>
  );
}