// app/utils/database.ts
// 使用 Console 作為資料庫的邏輯

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  currentToken: string;
  attendees: Array<{
    name: string;
    timestamp: Date;
    token: string;
  }>;
  isActive: boolean;
  tokenHistory: string[];
}

export interface AttendanceResult {
  success: boolean;
  message: string;
  session?: Session;
}

class ConsoleDatabase {
  private sessions: Map<string, Session> = new Map();

  constructor() {
    // 初始化時在 console 顯示歡迎訊息
    this.logToConsole('🎯 點名系統資料庫已初始化', 'system');
  }

  private logToConsole(message: string, type: 'system' | 'session' | 'attendance' | 'error' = 'system') {
    const timestamp = new Date().toLocaleString('zh-TW');
    const prefix = {
      system: '🔧 [系統]',
      session: '📚 [課程]',
      attendance: '✅ [點名]',
      error: '❌ [錯誤]'
    }[type];
    
    console.log(`${prefix} ${timestamp} - ${message}`);
  }

  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  createSession(name: string): Session {
    const id = `session_${Date.now()}`;
    const token = this.generateToken();
    
    const session: Session = {
      id,
      name: name.trim(),
      createdAt: new Date(),
      currentToken: token,
      attendees: [],
      isActive: true,
      tokenHistory: [token]
    };

    this.sessions.set(id, session);
    
    this.logToConsole(`建立新課程: "${session.name}" (ID: ${id})`, 'session');
    this.logToConsole(`初始 Token: ${token}`, 'session');
    
    return session;
  }

  updateToken(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      this.logToConsole(`嘗試更新不存在或已結束的課程 Token: ${sessionId}`, 'error');
      return null;
    }

    const newToken = this.generateToken();
    session.currentToken = newToken;
    session.tokenHistory.push(newToken);
    
    this.logToConsole(`課程 "${session.name}" Token 已更新: ${newToken}`, 'session');
    
    return session;
  }

  addAttendee(sessionId: string, token: string, studentName: string): AttendanceResult {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.logToConsole(`點名失敗 - 課程不存在: ${sessionId}`, 'error');
      return {
        success: false,
        message: '課程不存在，請確認 QR Code 是否正確'
      };
    }

    if (!session.isActive) {
      this.logToConsole(`點名失敗 - 課程已結束: "${session.name}"`, 'error');
      return {
        success: false,
        message: '課程已結束，無法點名'
      };
    }

    if (session.currentToken !== token) {
      this.logToConsole(`點名失敗 - Token 已過期: ${token} (課程: "${session.name}")`, 'error');
      return {
        success: false,
        message: 'QR Code 已過期，請重新掃描最新的 QR Code'
      };
    }

    // 檢查是否已經點名
    const existingAttendee = session.attendees.find(a => a.name === studentName.trim());
    if (existingAttendee) {
      this.logToConsole(`重複點名嘗試: "${studentName}" (課程: "${session.name}")`, 'error');
      return {
        success: false,
        message: `${studentName} 已經完成點名了`
      };
    }

    // 新增出席記錄
    const attendanceRecord = {
      name: studentName.trim(),
      timestamp: new Date(),
      token: token
    };

    session.attendees.push(attendanceRecord);
    
    // 強化 Console 顯示
    console.group(`✅ 點名成功 - ${studentName}`);
    console.log(`📚 課程: ${session.name}`);
    console.log(`👤 學生: ${studentName}`);
    console.log(`⏰ 時間: ${attendanceRecord.timestamp.toLocaleString('zh-TW')}`);
    console.log(`🔢 序號: 第 ${session.attendees.length} 位`);
    console.log(`🎫 Token: ${token.substring(0, 8)}...`);
    console.groupEnd();
    
    // 更新出席名單顯示
    console.log(
      `📊 目前出席名單 (${session.attendees.length} 人):`,
      session.attendees.map((a, index) => `${index + 1}. ${a.name} (${a.timestamp.toLocaleTimeString('zh-TW')})`).join('\n')
    );

    return {
      success: true,
      message: `${studentName} 點名成功！`,
      session: session
    };
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  endSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.logToConsole(`嘗試結束不存在的課程: ${sessionId}`, 'error');
      return null;
    }

    session.isActive = false;
    
    this.logToConsole(`課程結束: "${session.name}"`, 'session');
    this.logToConsole(
      `最終統計 - 總出席人數: ${session.attendees.length} 人`, 
      'session'
    );
    this.logToConsole(
      `出席名單: ${session.attendees.map(a => `${a.name} (${a.timestamp.toLocaleTimeString('zh-TW')})`).join(', ')}`, 
      'session'
    );
    this.logToConsole(
      `課程持續時間: ${Math.round((Date.now() - session.createdAt.getTime()) / 1000 / 60)} 分鐘`, 
      'session'
    );
    this.logToConsole(
      `總共更新了 ${session.tokenHistory.length} 次 QR Code`, 
      'session'
    );

    return session;
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  // 清理過期的 sessions (可選)
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小時

    for (const [id, session] of this.sessions) {
      if (now - session.createdAt.getTime() > maxAge) {
        this.sessions.delete(id);
        this.logToConsole(`清理過期課程: "${session.name}"`, 'system');
      }
    }
  }

  // 匯出資料 (用於備份)
  exportData(): string {
    const data = {
      sessions: Array.from(this.sessions.entries()),
      exportTime: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    this.logToConsole('資料匯出完成', 'system');
    console.log('📄 匯出資料:', jsonData);
    
    return jsonData;
  }
}

// 建立全域資料庫實例
let dbInstance: ConsoleDatabase;

export function getDatabase(): ConsoleDatabase {
  if (typeof window !== 'undefined') {
    if (!dbInstance) {
      dbInstance = new ConsoleDatabase();
      // 將資料庫實例掛載到 window 以便在 console 中訪問
      (window as any).ROLL_CALL_DB = dbInstance;
      
      // 提供一些便民的 console 命令
      (window as any).exportRollCallData = () => dbInstance.exportData();
      (window as any).getRollCallSessions = () => dbInstance.getAllSessions();
      (window as any).cleanupRollCallData = () => dbInstance.cleanup();
      
      console.log('🎯 點名系統已就緒！可使用以下 console 命令：');
      console.log('  - exportRollCallData() : 匯出所有資料');
      console.log('  - getRollCallSessions() : 查看所有課程');
      console.log('  - cleanupRollCallData() : 清理過期資料');
    }
    return dbInstance;
  }
  
  // 服務端渲染時的備用實例
  return new ConsoleDatabase();
}