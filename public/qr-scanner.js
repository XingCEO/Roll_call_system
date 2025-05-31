// public/qr-scanner.js
// 輕量級 QR Code 掃描器庫

(function() {
  'use strict';

  class QrScanner {
    constructor(video, onDecode, options = {}) {
      this.video = video;
      this.onDecode = onDecode;
      this.options = {
        highlightScanRegion: options.highlightScanRegion || false,
        highlightCodeOutline: options.highlightCodeOutline || false,
        preferredCamera: options.preferredCamera || 'environment',
        maxScansPerSecond: options.maxScansPerSecond || 5,
        ...options
      };
      
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.stream = null;
      this.scanning = false;
      this.destroyed = false;
      
      // 創建 overlay 元素
      if (this.options.highlightScanRegion) {
        this.createOverlay();
      }
    }

    async start() {
      if (this.scanning) return;
      
      try {
        // 請求相機權限
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: this.options.preferredCamera
          }
        });
        
        this.video.srcObject = this.stream;
        this.video.play();
        
        this.scanning = true;
        this.scanLoop();
        
      } catch (error) {
        console.error('無法啟動相機:', error);
        throw new Error('無法訪問相機，請檢查權限設定');
      }
    }

    stop() {
      this.scanning = false;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      if (this.video.srcObject) {
        this.video.srcObject = null;
      }
    }

    destroy() {
      this.stop();
      this.destroyed = true;
      
      if (this.overlay) {
        this.overlay.remove();
      }
    }

    async setCamera(facingMode) {
      if (this.stream) {
        this.stop();
      }
      
      this.options.preferredCamera = facingMode;
      await this.start();
    }

    async toggleFlash() {
      if (!this.stream) return;
      
      const track = this.stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          const capabilities = track.getCapabilities();
          if (capabilities.torch) {
            const settings = track.getSettings();
            await track.applyConstraints({
              advanced: [{ torch: !settings.torch }]
            });
          }
        } catch (error) {
          console.warn('無法控制閃光燈:', error);
        }
      }
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.style.position = 'absolute';
      this.overlay.style.top = '0';
      this.overlay.style.left = '0';
      this.overlay.style.width = '100%';
      this.overlay.style.height = '100%';
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.zIndex = '1000';
      
      if (this.video.parentElement) {
        this.video.parentElement.style.position = 'relative';
        this.video.parentElement.appendChild(this.overlay);
      }
    }

    scanLoop() {
      if (!this.scanning || this.destroyed) return;
      
      if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
        this.scanFrame();
      }
      
      // 控制掃描頻率
      setTimeout(() => {
        this.scanLoop();
      }, 1000 / this.options.maxScansPerSecond);
    }

    scanFrame() {
      try {
        const { videoWidth, videoHeight } = this.video;
        if (videoWidth === 0 || videoHeight === 0) return;
        
        // 設置 canvas 尺寸
        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;
        
        // 繪製視頻幀到 canvas
        this.context.drawImage(this.video, 0, 0, videoWidth, videoHeight);
        
        // 獲取圖像資料
        const imageData = this.context.getImageData(0, 0, videoWidth, videoHeight);
        
        // 簡易的 QR Code 檢測 (這裡使用簡化版本)
        const result = this.detectQRCode(imageData);
        
        if (result) {
          this.onDecode({ data: result });
        }
        
      } catch (error) {
        console.error('掃描錯誤:', error);
      }
    }

    // 簡化的 QR Code 檢測 (實際應用中建議使用專業的 QR Code 解碼庫)
    detectQRCode(imageData) {
      console.log('🔍 正在檢測 QR Code...');
      
      // 模擬檢測延遲
      const shouldDetect = Math.random() > 0.5; // 50% 機率檢測到
      
      if (shouldDetect) {
        console.log('✅ 模擬檢測到 QR Code');
        
        // 檢查 URL 參數中是否有測試數據
        const urlParams = new URLSearchParams(window.location.search);
        let testUrl = null;
        
        // 如果在掃描頁面，生成測試點名連結
        if (window.location.pathname === '/scanner') {
          const sessionId = 'test_' + Date.now();
          const token = 'token_' + Math.random().toString(36).substring(7);
          testUrl = `${window.location.origin}/attend?session=${sessionId}&token=${token}`;
          console.log('📱 生成測試點名連結:', testUrl);
        }
        
        return testUrl || `${window.location.origin}/attend?session=demo&token=demo123`;
      }
      
      return null;
    }

    toGrayscale(imageData) {
      const gray = new Uint8ClampedArray(imageData.width * imageData.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // RGB 轉灰度
        const gray_val = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray[i / 4] = gray_val;
      }
      
      return gray;
    }

    findFinderPatterns(grayData, width, height) {
      const patterns = [];
      const threshold = 128;
      
      // 簡化的定位符檢測
      for (let y = 0; y < height - 7; y++) {
        for (let x = 0; x < width - 7; x++) {
          if (this.isFinderPattern(grayData, x, y, width, threshold)) {
            patterns.push({ x: x + 3, y: y + 3 });
          }
        }
      }
      
      return patterns;
    }

    isFinderPattern(grayData, x, y, width, threshold) {
      // 檢查 7x7 的定位符模式
      const pattern = [
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1]
      ];
      
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
          const px = x + dx;
          const py = y + dy;
          const index = py * width + px;
          
          if (index >= grayData.length) return false;
          
          const isDark = grayData[index] < threshold;
          const shouldBeDark = pattern[dy][dx] === 1;
          
          if (isDark !== shouldBeDark) {
            return false;
          }
        }
      }
      
      return true;
    }

    decodeQRCode(grayData, patterns, width, height) {
      // 這是一個簡化的解碼實現
      // 實際應用中應該使用完整的 QR Code 解碼算法
      
      // 為了示範，我們模擬一個簡單的 URL 檢測
      // 在真實應用中，這裡應該有完整的 QR Code 解碼邏輯
      
      // 檢查當前頁面的 URL 參數中是否有測試數據
      const urlParams = new URLSearchParams(window.location.search);
      const testSession = urlParams.get('test_session');
      const testToken = urlParams.get('test_token');
      
      if (testSession && testToken) {
        return `${window.location.origin}/attend?session=${testSession}&token=${testToken}`;
      }
      
      // 模擬檢測到 QR Code（實際應用中這裡應該是真正的解碼結果）
      if (patterns.length >= 3 && Math.random() > 0.7) {
        // 生成一個測試用的點名連結
        const sessionId = 'demo_' + Date.now();
        const token = 'token_' + Math.random().toString(36).substring(7);
        return `${window.location.origin}/attend?session=${sessionId}&token=${token}`;
      }
      
      return null;
    }
  }

  // 將 QrScanner 類別添加到全域
  window.QrScanner = QrScanner;

  // 靜態方法
  QrScanner.hasCamera = async function() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  };

})();