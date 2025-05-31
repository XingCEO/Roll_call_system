// app/routes/_index.tsx
import { useState, useEffect } from "react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { MockDB as RealtimeDB, type Session, type AttendanceRecord } from "~/utils/mock-db";

export const meta: MetaFunction = () => {
  return [
    { title: "QR Code 點名系統 - 教師端" },
    { name: "description", content: "即時點名系統" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'create') {
    const courseName = formData.get('courseName') as string;
    if (!courseName?.trim()) {
      return json({ error: '請輸入課程名稱' });
    }
    
    const session = await RealtimeDB.createSession(courseName);
    return json({ session });
  }

  if (action === 'end') {
    const sessionId = formData.get('sessionId') as string;
    await RealtimeDB.endSession(sessionId);
    return json({ ended: true });
  }

  return json({ error: '無效操作' });
}

// 定義 action 返回的型別
type ActionData = 
  | { error: string; session?: never; ended?: never }
  | { session: Session; error?: never; ended?: never }
  | { ended: boolean; error?: never; session?: never };

function generateQRCodeURL(sessionId: string, token: string): string {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
  const scanURL = `${baseURL}/scan?sessionId=${sessionId}&token=${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(scanURL)}`;
}

export default function TeacherIndex() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 當收到新建立的課程時
  useEffect(() => {
    if (actionData?.session) {
      setSession(actionData.session);
    }
    if (actionData?.ended) {
      setSession(null);
      setRecords([]);
      setQrCodeURL("");
    }
  }, [actionData]);

  // Server-Sent Events 即時更新
  useEffect(() => {
    if (!session?.id) return;

    const eventSource = new EventSource(`/api/events?sessionId=${session.id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.session) {
          setSession(data.session);
          // 更新 QR Code
          if (data.session.currentToken) {
            setQrCodeURL(generateQRCodeURL(data.session.id, data.session.currentToken));
          }
        }
        
        if (data.records) {
          setRecords(data.records);
          setLastUpdate(new Date());
        }
        
      } catch (error) {
        console.error('SSE 解析錯誤:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE 連線錯誤:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [session?.id]);

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 標題 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📺 教師端 - QR Code 點名系統
          </h1>
          <p className="text-gray-600 text-lg">
            專用顯示螢幕 - 學生用手機掃描下方 QR Code
          </p>
        </header>

        {!session ? (
          /* 建立課程 */
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🎓</div>
            <h2 className="text-2xl font-semibold mb-6">建立新的點名課程</h2>
            
            <Form method="post" className="space-y-6">
              <input type="hidden" name="_action" value="create" />
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <input
                  type="text"
                  name="courseName"
                  placeholder="請輸入課程名稱"
                  className="px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg w-full sm:w-80"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium whitespace-nowrap disabled:opacity-50"
                >
                  {isSubmitting ? '建立中...' : '🚀 開始點名'}
                </button>
              </div>
            </Form>

            {actionData?.error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                {actionData.error}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* QR Code 顯示區域 */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                📱 {session.name}
              </h2>
              
              {qrCodeURL && (
                <div className="text-center mb-6">
                  <img
                    src={qrCodeURL}
                    alt="點名 QR Code"
                    className="mx-auto border-4 border-gray-200 rounded-xl shadow-lg"
                  />
                </div>
              )}
              
              <div className="text-center text-lg text-gray-600 mb-6">
                <p>👆 請學生用手機掃描此 QR Code 進行點名</p>
                <p className="text-sm text-blue-600 mt-2">
                  QR Code 每 2 秒自動更新 🔄
                </p>
              </div>

              <div className="text-center">
                <Form method="post">
                  <input type="hidden" name="_action" value="end" />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-lg font-medium"
                  >
                    🏁 結束課程
                  </button>
                </Form>
              </div>
            </div>

            {/* 即時點名記錄 */}
            <div className="xl:col-span-1 bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">📊 即時點名記錄</h3>
                {lastUpdate && (
                  <span className="text-xs text-green-600">
                    最後更新：{lastUpdate.toLocaleTimeString('zh-TW')}
                  </span>
                )}
              </div>
              
              {/* 統計 */}
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {records.length}
                </div>
                <div className="text-green-700 font-medium">已出席人數</div>
              </div>

              {/* 記錄列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>等待學生點名...</p>
                    <p className="text-sm">學生掃描 QR Code 後會即時顯示</p>
                  </div>
                ) : (
                  records.map((record: AttendanceRecord, index: number) => (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg transition-all duration-500 ${
                        index === 0 ? 'border-l-4 border-green-500 bg-green-50 animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {records.length - index}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{record.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(record.timestamp).toLocaleString('zh-TW')}
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

        {/* 使用說明 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">💡 使用說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🏫 教師操作</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>輸入課程名稱並開始點名</li>
                <li>將此頁面投影或放置在教室前方</li>
                <li>學生掃描 QR Code 後會即時顯示記錄</li>
                <li>課程結束後點擊結束課程</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">👨‍🎓 學生操作</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>用手機瀏覽器開啟掃描頁面</li>
                <li>掃描螢幕上的 QR Code</li>
                <li>輸入姓名完成點名</li>
                <li>確認點名成功訊息</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
            <strong>🔄 即時同步：</strong>學生點名成功後，此頁面會自動更新，無需手動重新整理
          </div>
        </div>
      </div>
    </div>
  );
}