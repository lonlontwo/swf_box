# 解決超過 10MB 檔案上傳問題

## 📋 問題說明

原本的系統無法上傳超過 10MB 的 SWF 檔案，因為：
1. Cloudflare Worker 有請求大小限制（約 10MB）
2. 前端沒有實作分塊上傳機制

## ✅ 解決方案

已實作**分塊上傳**功能：
- 前端：自動將大於 8MB 的檔案分塊上傳（每塊 8MB）
- 後端：Worker 接收分塊、合併後上傳到 GitLab

## 🚀 部署步驟

### 1. 更新 Cloudflare Worker

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 **Workers & Pages**
3. 找到你的 Worker：`swf-api`
4. 點擊 **Edit Code**
5. 複製 `cloudflare-worker.js` 的內容，貼上並替換原有代碼
6. 點擊 **Save and Deploy**

### 2. 確認環境變數

確保 Worker 有設定以下環境變數：

```
GITLAB_TOKEN = your_gitlab_personal_access_token
GITLAB_PROJECT_ID = your_gitlab_project_id
GITLAB_BRANCH = main
```

設定方式：
1. 在 Worker 頁面點擊 **Settings**
2. 找到 **Variables** 區塊
3. 新增或確認上述變數

### 3. 測試上傳

1. 開啟 `admin.html`
2. 登入後台
3. 嘗試上傳一個超過 10MB 的 SWF 檔案
4. 觀察瀏覽器 Console，應該會看到：
   ```
   📦 開始分塊上傳: filename.swf (X 塊)
   ✅ 已上傳 1/X 塊
   ✅ 已上傳 2/X 塊
   ...
   ✅ 所有分塊上傳完成
   ```

## 📝 技術細節

### 前端改動（`js/config.js`）

新增 `SWFAPI` 物件，包含：
- `uploadFile()`: 自動判斷檔案大小，選擇直接上傳或分塊上傳
- `uploadSmallFile()`: 處理小於 8MB 的檔案
- `uploadLargeFile()`: 處理大於 8MB 的檔案（分塊上傳）

### 後端改動（`cloudflare-worker.js`）

新增端點：
- `POST /upload-chunk`: 接收分塊
- `POST /upload`: 一般上傳（小檔案）
- `DELETE /{filename}`: 刪除檔案
- `GET /{filename}`: 取得檔案（代理 GitLab）
- `GET /`: 列出所有檔案

## ⚠️ 注意事項

1. **Worker 記憶體限制**：
   - 分塊暫存在記憶體中，非常大的檔案（>100MB）可能會超出 Worker 記憶體限制
   - 建議：如果需要上傳超大檔案，考慮使用 Cloudflare R2 或其他物件儲存

2. **上傳時間**：
   - 大檔案會需要較長時間上傳
   - 請確保網路穩定

3. **GitLab 限制**：
   - GitLab 單一檔案大小限制約 100MB
   - 如果需要更大的檔案，建議改用其他儲存方案

## 🔧 進階優化（可選）

如果需要處理更大的檔案（>100MB），可以考慮：

1. **使用 Cloudflare R2**：
   - 無限制的物件儲存
   - 更適合大檔案
   - 需要付費方案

2. **使用 Cloudflare Durable Objects**：
   - 持久化儲存分塊狀態
   - 避免記憶體限制
   - 支援斷點續傳

3. **直接上傳到 GitLab LFS**：
   - Git Large File Storage
   - 專為大檔案設計

## 📞 問題排查

### 上傳失敗

1. 檢查瀏覽器 Console 的錯誤訊息
2. 確認 Worker 環境變數設定正確
3. 確認 GitLab Token 有足夠權限（api, write_repository）

### 分塊上傳卡住

1. 檢查網路連線
2. 重新整理頁面後再試
3. 檢查 Worker 日誌（Cloudflare Dashboard > Workers > Logs）

### 檔案無法播放

1. 確認檔案完整上傳（檢查檔案大小）
2. 確認 Worker 正確設定 Content-Type
3. 嘗試直接訪問檔案 URL 測試
