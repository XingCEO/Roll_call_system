// app/routes/api.events.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { MockDB as RealtimeDB } from "~/utils/mock-db";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  // 建立 Server-Sent Events 連線
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // 發送初始資料
      const sendData = async () => {
        try {
          const session = await RealtimeDB.getSession(sessionId);
          const records = await RealtimeDB.getAttendanceRecords(sessionId);
          
          const data = {
            session,
            records,
            timestamp: new Date().toISOString()
          };

          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('SSE Error:', error);
        }
      };

      // 立即發送一次
      sendData();

      // 每 2 秒更新一次
      const interval = setInterval(sendData, 2000);

      // 清理函數
      return () => {
        clearInterval(interval);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}