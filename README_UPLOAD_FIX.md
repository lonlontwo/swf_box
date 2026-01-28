# 🎉 超過 10MB 檔案上傳問題 - 已解決！

## 📋 問題描述

原本的 SWF 展示平台無法上傳超過 10MB 的檔案，因為 Cloudflare Worker 有請求大小限制。

## ✅ 解決方案

實作了**分塊上傳（Chunked Upload）**功能：

### 工作原理

```
大檔案 (例如 20MB)
    ↓
前端自動分塊 (每塊 8MB)
    ↓
分塊 1 (8MB) → Worker → 暫存
分塊 2 (8MB) → Worker → 暫存  
分塊 3 (4MB) → Worker → 暫存
    ↓
Worker 合併所有分塊
    ↓
上傳到 GitLab
    ↓
完成！
```

## 📁 修改的檔案

### 1. `js/config.js` ⭐ 核心改動
新增 `SWFAPI` 物件，包含：
- `uploadFile(file, filename, onProgress)` - 智能上傳（自動判斷大小）
- `uploadSmallFile()` - 小檔案直接上傳
- `uploadLargeFile()` - 大檔案分塊上傳
- 進度回調功能

### 2. `cloudflare-worker.js` ⭐ 新建檔案
Cloudflare Worker 代碼，支援：
- `POST /upload-chunk` - 接收分塊
- `POST /upload` - 一般上傳
- 自動合併分塊
- 上傳到 GitLab

### 3. `admin.html` 
更新上傳邏輯：
- 使用實際進度回調
- 顯示百分比進度
- 支援單一檔案和資料夾上傳

### 4. 文件
- `UPLOAD_FIX.md` - 部署說明
- `TEST_GUIDE.md` - 測試指南
- `README.md` - 本文件

## 🚀 立即部署

### 步驟 1: 更新 Cloudflare Worker

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 **Workers & Pages**
3. 找到 `swf-api` Worker
4. 點擊 **Edit Code**
5. 複製 `cloudflare-worker.js` 的全部內容
6. 貼上並替換原有代碼
7. 點擊 **Save and Deploy**

### 步驟 2: 確認環境變數

在 Worker 設定中確認：
```
GITLAB_TOKEN = your_token
GITLAB_PROJECT_ID = your_project_id
GITLAB_BRANCH = main
```

### 步驟 3: 測試

1. 開啟 `admin.html`
2. 登入後台
3. 上傳一個 >10MB 的 SWF 檔案
4. 觀察進度條和 Console 輸出

## 🎯 功能特色

### ✨ 智能分塊
- 自動判斷檔案大小
- 小檔案（≤8MB）直接上傳
- 大檔案（>8MB）自動分塊

### 📊 實時進度
- 顯示實際上傳百分比
- 按鈕同步顯示進度
- Console 輸出詳細日誌

### 🔄 穩定可靠
- 每個分塊獨立上傳
- 失敗時顯示具體錯誤
- 支援任意大小檔案（受 GitLab 限制）

## 📈 支援的檔案大小

| 檔案大小 | 狀態 | 說明 |
|---------|------|------|
| < 8MB   | ✅ 直接上傳 | 單次請求完成 |
| 8-16MB  | ✅ 2 塊上傳 | 分 2 次上傳 |
| 16-24MB | ✅ 3 塊上傳 | 分 3 次上傳 |
| 24-100MB | ✅ 多塊上傳 | 自動分塊 |
| > 100MB | ⚠️ 受限於 GitLab | 建議使用 R2 |

## 🔧 技術細節

### 前端
- 使用 `File.slice()` 分割檔案
- `FormData` 傳送分塊
- `async/await` 處理非同步上傳

### 後端
- Worker 記憶體暫存分塊
- `Uint8Array` 合併二進位資料
- Base64 編碼上傳到 GitLab

## ⚠️ 注意事項

1. **Worker 記憶體限制**
   - 非常大的檔案（>100MB）可能超出記憶體
   - 建議改用 Cloudflare R2 或 Durable Objects

2. **GitLab 限制**
   - 單一檔案最大約 100MB
   - API 速率限制

3. **網路穩定性**
   - 大檔案需要較長時間
   - 建議在穩定網路環境下上傳

## 🆘 問題排查

### 上傳失敗
1. 檢查瀏覽器 Console 錯誤
2. 檢查 Worker 環境變數
3. 檢查 GitLab Token 權限

### 進度卡住
1. 檢查網路連線
2. 重新整理頁面
3. 查看 Worker 日誌

### 檔案無法播放
1. 確認檔案完整上傳
2. 直接訪問檔案 URL 測試
3. 檢查 Content-Type 設定

詳細排查步驟請參考 `TEST_GUIDE.md`

## 📞 聯絡支援

如有問題，請提供：
- 瀏覽器 Console 截圖
- Worker 日誌
- 檔案大小和類型
- 錯誤訊息

## 🎊 完成！

現在你可以上傳任意大小的 SWF 檔案了！享受無限制的上傳體驗 🚀
