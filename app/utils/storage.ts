// app/utils/storage.ts
// 簡化的點名資料管理

export interface AttendanceRecord {
  id: string;
  name: string;
  timestamp: Date;
  qrToken: string;
}

export interface Session {
  id: string;
  name: string;
  currentToken: string;
  records: AttendanceRecord[];
  createdAt: Date;
  isActive: boolean;
}

class SimpleStorage {
  private session: Session | null = null;

  // 建立新的點名課程
  createSession(name: string): Session {
    const sessionId = `session_${Date.now()}`;
    const token = this.generateToken();
    
    this.session = {
      id: sessionId,
      name: name.trim(),
      currentToken: token,
      records: [],
      createdAt: new Date(),
      isActive: true
    };

    this.logToConsole(`📚 建立新課程: "${name}" (ID: ${sessionId})`);
    return this.session;
  }

  // 更新 QR Code Token
  updateToken(): string {
    if (!this.session || !this.session.isActive) return '';
    
    const newToken = this.generateToken();
    this.session.currentToken = newToken;
    
    this.logToConsole(`🔄 QR Code Token 已更新: ${newToken.substring(0, 8)}...`);
    return newToken;
  }

  // 新增出席記錄
  addAttendance(token: string, studentName: string): { success: boolean; message: string } {
    if (!this.session || !this.session.isActive) {
      return { success: false, message: '沒有進行中的課程' };
    }

    if (this.session.currentToken !== token) {
      return { success: false, message: 'QR Code 已過期，請重新掃描' };
    }

    // 檢查重複點名
    const existing = this.session.records.find(r => r.name === studentName.trim());
    if (existing) {
      return { success: false, message: `${studentName} 已經完成點名了` };
    }

    // 新增記錄
    const record: AttendanceRecord = {
      id: `record_${Date.now()}`,
      name: studentName.trim(),
      timestamp: new Date(),
      qrToken: token
    };

    this.session.records.push(record);

    this.logToConsole(`✅ ${studentName} 點名成功！(第 ${this.session.records.length} 位)`);
    return { success: true, message: `${studentName} 點名成功！` };
  }

  // 結束課程
  endSession(): void {
    if (this.session) {
      this.session.isActive = false;
      this.logToConsole(`🏁 課程結束: "${this.session.name}"`);
      this.logToConsole(`📊 最終統計: 共 ${this.session.records.length} 人出席`);
    }
  }

  // 獲取當前課程
  getCurrentSession(): Session | null {
    return this.session;
  }

  // 生成隨機 Token
  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  // Console 日誌
  private logToConsole(message: string): void {
    const timestamp = new Date().toLocaleString('zh-TW');
    console.log(`[${timestamp}] ${message}`);
  }

  // 匯出資料
  exportData(): string {
    if (!this.session) return '{}';
    
    const data = {
      session: this.session,
      exportTime: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    console.log('📄 匯出資料:', jsonData);
    return jsonData;
  }
}

// 全域實例
let storageInstance: SimpleStorage;

export function getStorage(): SimpleStorage {
  if (typeof window !== 'undefined') {
    if (!storageInstance) {
      storageInstance = new SimpleStorage();
      // 掛載到 window 供 console 使用
      (window as any).ATTENDANCE_STORAGE = storageInstance;
      
      // 提供 console 命令
      (window as any).exportAttendanceData = () => storageInstance.exportData();
      
      console.log('🎯 點名系統已初始化！');
      console.log('💡 Console 命令: exportAttendanceData()');
    }
    return storageInstance;
  }
  
  // 服務端備用
  return new SimpleStorage();
}