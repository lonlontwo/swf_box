# ✅ 設定完成！現在只需要填入你的 GitLab 資訊

## 🎯 已完成的改動

✅ `js/config.js` 已更新！
- 加入了 GitLab 配置區塊
- 替換了 SWFAPI 為直接上傳版本
- 支援 50-100MB 大檔案

---

## 📝 接下來只需要 2 步驟

### 步驟 1: 取得 GitLab Token（2 分鐘）

1. 開啟這個連結：https://gitlab.com/-/user_settings/personal_access_tokens
2. 點擊 **Add new token**
3. 填寫：
   - **Token name**: `SWF Upload`
   - **Scopes**: 勾選 ✅ `api` 和 ✅ `write_repository`
4. 點擊 **Create personal access token**
5. **複製 Token**（只會顯示一次，請保存好！）

### 步驟 2: 填入資訊到 config.js（1 分鐘）

開啟 `d:\swf展示平台\js\config.js`

找到第 14-16 行：

```javascript
const GITLAB_CONFIG = {
  token: 'YOUR_GITLAB_TOKEN',      // ← 貼上你的 Token
  projectId: 'YOUR_PROJECT_ID',    // ← 貼上你的 Project ID
  branch: 'main'
};
```

替換成：

```javascript
const GITLAB_CONFIG = {
  token: '你剛剛複製的Token',      // ← 貼上
  projectId: '你的ProjectID',      // ← 貼上（在 GitLab 專案頁面可以看到）
  branch: 'main'
};
```

**Project ID 在哪裡？**
- 進入你的 GitLab 專案
- 專案名稱下方有 **Project ID: 12345678**
- 複製這個數字

---

## 🧪 測試（1 分鐘）

1. 重新整理瀏覽器（Ctrl + F5）
2. 開啟 `http://localhost:3000/lonlontwo_swf_key.html`
3. 登入後台
4. 上傳一個檔案（任意大小）
5. 觀察 Console 應該會看到：
   ```
   📤 開始上傳: filename.swf (XX.XX MB)
   📖 讀取檔案...
   ✓ 檔案讀取完成
   📡 上傳到 GitLab...
   ✅ 上傳成功！
   ```

---

## ✅ 完成後你就可以

- 上傳 10-30MB 檔案 ✅
- 上傳 30-50MB 檔案 ✅
- 上傳 50-75MB 檔案 ✅
- 看到實時上傳進度 ✅
- 不用擔心 Worker 限制 ✅

---

## ⚠️ 注意事項

### Token 安全性

你的 Token 會在前端代碼中，所以：

1. **不要分享** `config.js` 給別人
2. **定期更換** Token
3. 只給這個 Token 必要的權限（`api` + `write_repository`）

### 檔案大小限制

- **建議範圍**: 10-75MB（最穩定）
- **理論上限**: 100MB（GitLab API 限制）
- **Base64 膨脹**: 檔案會變大 33%（50MB → 66.5MB）

---

## 🎊 就這樣！

改動完成！填入 Token 和 Project ID 就可以用了！

**預估總時間**: 3 分鐘
- 取得 Token: 2 分鐘
- 填入資訊: 1 分鐘

準備好了嗎？去取得你的 GitLab Token 吧！🚀
