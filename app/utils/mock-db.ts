# 建立 mock-db.ts 檔案
cat > app/utils/mock-db.ts << 'EOF'
// app/utils/mock-db.ts
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

const mockStorage = new Map<string, any>();

export class MockDB {
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

    mockStorage.set(`session:${sessionId}`, session);
    mockStorage.set(`session:${sessionId}:records`, []);
    
    console.log(`📚 建立課程: ${name} (${sessionId})`);
    return session;
  }

  static async updateToken(sessionId: string): Promise<string> {
    const session = mockStorage.get(`session:${sessionId}`) as Session;
    if (!session || !session.isActive) return '';

    const newToken = this.generateToken();
    session.currentToken = newToken;
    
    mockStorage.set(`session:${sessionId}`, session);
    console.log(`🔄 Token 更新: ${newToken.substring(0, 8)}...`);
    
    return newToken;
  }

  static async addAttendance(sessionId: string, token: string, studentName: string): Promise<{
    success: boolean;
    message: string;
    record?: AttendanceRecord;
  }> {
    const session = mockStorage.get(`session:${sessionId}`) as Session;
    if (!session) {
      return { success: false, message: '課程不存在' };
    }

    if (!session.isActive) {
      return { success: false, message: '課程已結束' };
    }

    if (session.currentToken !== token) {
      return { success: false, message: 'QR Code 已過期，請重新掃描' };
    }

    const records = mockStorage.get(`session:${sessionId}:records`) as AttendanceRecord[] || [];
    const existing = records.find(r => r.name === studentName.trim());
    
    if (existing) {
      return { success: false, message: `${studentName} 已經完成點名了` };
    }

    const record: AttendanceRecord = {
      id: `record_${Date.now()}`,
      name: studentName.trim(),
      timestamp: new Date().toISOString(),
      sessionId
    };

    records.unshift(record);
    mockStorage.set(`session:${sessionId}:records`, records);

    console.log(`✅ ${studentName} 點名成功 (${sessionId})`);
    return { success: true, message: `${studentName} 點名成功！`, record };
  }

  static async getSession(sessionId: string): Promise<Session | null> {
    return mockStorage.get(`session:${sessionId}`) || null;
  }

  static async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    return mockStorage.get(`session:${sessionId}:records`) || [];
  }

  static async endSession(sessionId: string): Promise<void> {
    const session = mockStorage.get(`session:${sessionId}`) as Session;
    if (session) {
      session.isActive = false;
      mockStorage.set(`session:${sessionId}`, session);
      console.log(`🏁 課程結束: ${session.name}`);
    }
  }

  private static generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
}

export default MockDB;
EOF