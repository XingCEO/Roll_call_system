# 🎯 動態點名系統部署指南

## 📁 檔案結構概覽

```
roll-call-system/
├── app/
│   ├── components/
│   │   └── QRScanner.tsx          # QR Code 掃描器元件
│   ├── routes/
│   │   ├── _index.tsx             # 主頁面 (教師端)
│   │   ├── attend.tsx             # 學生點名頁面
│   │   └── scanner.tsx            # QR Code 掃描頁面
│   ├── utils/
│   │   └── database.ts            # 資料庫邏輯 (Console)
│   ├── root.tsx                   # 根元件 (已存在)
│   └── tailwind.css               # 樣式 (已存在)
├── public/
│   └── qr-scanner.js              # QR Code 掃描器庫
├── vercel.json                    # Vercel 部署配置
├── package.json                   # 更新後的依賴
└── README.md                      # 此檔案
```

## 🚀 部署步驟

### 1. 建立檔案

請按照以下順序建立/更新檔案：

#### 1.1 建立資料庫邏輯
```bash
mkdir -p app/utils
# 將 database.ts 內容複製到 app/utils/database.ts
```

#### 1.2 建立 QR Scanner 元件
```bash
mkdir -p app/components
# 將 QRScanner.tsx 內容複製到 app/components/QRScanner.tsx
```

#### 1.3 更新路由檔案
```bash
# 將對應內容複製到以下檔案：
# - app/routes/_index.tsx (教師端主頁面)
# - app/routes/attend.tsx (學生點名頁面)
# - app/routes/scanner.tsx (QR Code 掃描頁面)
```

#### 1.4 建立靜態資源
```bash
# 將 qr-scanner.js 內容複製到 public/qr-scanner.js
```

#### 1.5 建立部署配置
```bash
# 將 vercel.json 內容複製到專案根目錄
```

#### 1.6 更新 package.json
```bash
# 更新 package.json，新增 vercel 依賴和部署腳本
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 本地測試

```bash
# 開發模式
npm run dev

# 建置測試
npm run build
npm start
```

### 4. 部署到 Vercel

#### 方法一：使用 Vercel CLI（推薦）

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 部署
vercel --prod
```

#### 方法二：使用 GitHub 整合

1. 將專案推送到 GitHub
2. 在 Vercel 官網連接 GitHub 儲存庫
3. Vercel 會自動部署

### 5. 環境設定

確保 Vercel 專案設定中：
- **Framework Preset**: Remix
- **Node.js Version**: 18.x
- **Build Command**: `npm run build`
- **Output Directory**: `build/client`

## 🎯 系統功能

### 教師端功能
- ✅ 建立點名課程
- ✅ 顯示動態 QR Code（每 2 秒更新）
- ✅ 即時出席統計
- ✅ 出席名單管理
- ✅ Console 資料庫記錄

### 學生端功能
- ✅ QR Code 掃描器
- ✅ 手機相機掃描
- ✅ 姓名輸入點名
- ✅ 重複點名防護
- ✅ 過期 QR Code 檢測

### 技術特色
- 🔄 動態 QR Code 更新（每 2 秒）
- 📱 響應式設計
- 💾 Console 資料庫
- 🔒 Token 驗證機制
- 📊 即時統計

## 🔧 使用說明

### 教師操作流程
1. 開啟系統主頁面
2. 輸入課程名稱，點擊「開始點名」
3. 將 QR Code 展示給學生掃描
4. 即時查看出席統計
5. 課程結束後點擊「結束課程」
6. 在瀏覽器 Console 查看完整記錄

### 學生點名流程
1. 掃描教師提供的 QR Code
2. 或點擊「開啟掃描器」按鈕
3. 在點名頁面輸入姓名
4. 點擊「確認點名」完成簽到

### Console 資料庫命令
在瀏覽器 Console 中可使用：
```javascript
// 匯出所有資料
exportRollCallData()

// 查看所有課程
getRollCallSessions()

// 清理過期資料
cleanupRollCallData()
```

## ⚠️ 注意事項

### 瀏覽器支援
- Chrome 53+ （推薦）
- Firefox 68+
- Safari 11+
- Edge 79+

### 功能需求
- HTTPS 環境（相機功能必須）
- 相機權限
- 現代瀏覽器支援

### 安全性考量
- QR Code 每 2 秒更新防止代點名
- Token 驗證機制
- 過期 QR Code 自動失效
- 重複點名防護

## 🐛 故障排除

### 常見問題

**Q: QR Code 掃描器無法啟動？**
A: 確認以下項目：
- 瀏覽器是否支援相機功能
- 是否為 HTTPS 環境
- 是否允許相機權限
- 網路連線是否穩定

**Q: 點名失敗顯示「QR Code 已過期」？**
A: 
- QR Code 每 2 秒更新，請掃描最新的 QR Code
- 確認網路連線穩定
- 重新整理頁面後再試

**Q: Console 看不到點名記錄？**
A: 
- 按 F12 開啟開發者工具
- 切換到 Console 標籤
- 確認已建立課程並有學生點名

**Q: 部署後功能異常？**
A: 
- 確認 vercel.json 配置正確
- 檢查 build 是否成功
- 確認靜態檔案 qr-scanner.js 是否正確上傳

### 效能優化

1. **QR Code 生成**
   - 使用外部 API 生成 QR Code
   - 避免在客戶端進行複雜運算

2. **掃描效能**
   - 控制掃描頻率（預設 5fps）
   - 優化圖像處理演算法

3. **記憶體管理**
   - 定期清理過期資料
   - 限制掃描歷史記錄數量

## 📊 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   教師端介面    │    │   學生端介面    │    │  QR Code 掃描器 │
│  (/_index.tsx)  │    │  (/attend.tsx)  │    │ (/scanner.tsx)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────▼─────────────────┐
                │          資料庫層                 │
                │      (utils/database.ts)         │
                │     - 課程管理                    │
                │     - Token 管理                 │
                │     - 出席記錄                    │
                │     - Console 日誌               │
                └───────────────────────────────────┘
                                 │
                ┌─────────────────▼─────────────────┐
                │        瀏覽器 Console             │
                │      - 即時記錄                   │
                │      - 資料匯出                   │
                │      - 系統監控                   │
                └───────────────────────────────────┘
```

## 🔄 資料流程

### 建立課程流程
```
教師輸入課程名稱 → 生成 Session ID → 生成初始 Token → 
建立 QR Code → 開始 2 秒循環更新
```

### 點名流程
```
學生掃描 QR Code → 解析 Session ID & Token → 
驗證 Token 有效性 → 輸入姓名 → 
檢查重複點名 → 記錄出席 → 更新統計
```

### Token 更新流程
```
每 2 秒觸發 → 生成新 Token → 更新 Session → 
產生新 QR Code → 舊 Token 失效
```

## 📈 擴展功能建議

### 短期擴展
1. **匯出功能**
   - Excel 格式匯出
   - PDF 報告生成
   - 郵件發送功能

2. **統計增強**
   - 出席率圖表
   - 時間分析
   - 趨勢追蹤

3. **用戶體驗**
   - 暗色主題
   - 多語言支援
   - 離線支援

### 長期擴展
1. **資料庫升級**
   - 連接真實資料庫
   - 用戶認證系統
   - 資料持久化

2. **高級功能**
   - 地理位置驗證
   - 臉部識別
   - 批次操作

3. **管理功能**
   - 多課程管理
   - 學生名單匯入
   - 教師權限管理

## 📝 更新日誌

### v1.0.0 (初始版本)
- ✅ 基礎點名功能
- ✅ 動態 QR Code
- ✅ Console 資料庫
- ✅ 響應式設計
- ✅ QR Code 掃描器

### 未來版本規劃
- v1.1.0: 資料匯出功能
- v1.2.0: 統計圖表
- v2.0.0: 真實資料庫整合

## 🤝 技術支援

如遇到問題，請檢查：
1. 瀏覽器 Console 錯誤訊息
2. 網路連線狀態
3. 相機權限設定
4. HTTPS 環境確認

## 📞 聯絡資訊

如需技術支援或功能建議，請透過以下方式聯絡：
- 專案 Issues
- 技術文件
- 社群討論

---

🎉 **恭喜！您的動態點名系統已準備就緒！**

記得在部署前先進行本地測試，確保所有功能正常運作。祝您使用愉快！