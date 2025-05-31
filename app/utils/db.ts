// app/utils/db.ts
import { kv } from "@vercel/kv";

export interface AttendanceRecord {
  id: string;
  name: string;
  timestamp: string;
  sessionId: string;
}

export interface Session {
  id: string;
  name: string;
  currentToken: string;
  createdAt: string;
  isActive: boolean;
}

export class RealtimeDB {
  // 建立新課程
  static async createSession(name: string): Promise<Session> {
    const sessionId = `session_${Date.now()}`;
    const token = this.generateToken();
    
    const session: Session = {
      id: sessionId,
      name: name.trim(),
      currentToken: token,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 儲存到 KV
    await kv.set(`session:${sessionId}`, session);
    await kv.set(`session:${sessionId}:records`, []);
    
    console.log(`📚 建立課程: ${name} (${sessionId})`);
    return session;
  }

  // 更新 Token
  static async updateToken(sessionId: string): Promise<string> {
    const session = await kv.get<Session>(`session:${sessionId}`);
    if (!session || !session.isActive) return '';

    const newToken = this.generateToken();
    session.currentToken = newToken;
    
    await kv.set(`session:${sessionId}`, session);
    console.log(`🔄 Token 更新: ${newToken.substring(0, 8)}...`);
    
    return newToken;
  }

  // 新增點名記錄
  static async addAttendance(sessionId: string, token: string, studentName: string): Promise<{
    success: boolean;
    message: string;
    record?: AttendanceRecord;
  }> {
    // 檢查課程
    const session = await kv.get<Session>(`session:${sessionId}`);
    if (!session) {
      return { success: false, message: '課程不存在' };
    }

    if (!session.isActive) {
      return { success: false, message: '課程已結束' };
    }

    if (session.currentToken !== token) {
      return { success: false, message: 'QR Code 已過期，請重新掃描' };
    }

    // 檢查重複點名
    const records = await kv.get<AttendanceRecord[]>(`session:${sessionId}:records`) || [];
    const existing = records.find(r => r.name === studentName.trim());
    
    if (existing) {
      return { success: false, message: `${studentName} 已經完成點名了` };
    }

    // 新增記錄
    const record: AttendanceRecord = {
      id: `record_${Date.now()}`,
      name: studentName.trim(),
      timestamp: new Date().toISOString(),
      sessionId
    };

    records.unshift(record); // 最新的在前面
    await kv.set(`session:${sessionId}:records`, records);

    console.log(`✅ ${studentName} 點名成功 (${sessionId})`);
    return { success: true, message: `${studentName} 點名成功！`, record };
  }

  // 取得課程
  static async getSession(sessionId: string): Promise<Session | null> {
    return await kv.get<Session>(`session:${sessionId}`);
  }

  // 取得點名記錄
  static async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    return await kv.get<AttendanceRecord[]>(`session:${sessionId}:records`) || [];
  }

  // 結束課程
  static async endSession(sessionId: string): Promise<void> {
    const session = await kv.get<Session>(`session:${sessionId}`);
    if (session) {
      session.isActive = false;
      await kv.set(`session:${sessionId}`, session);
      console.log(`🏁 課程結束: ${session.name}`);
    }
  }

  // 生成 Token
  private static generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
}

// 預設匯出
export default RealtimeDB;