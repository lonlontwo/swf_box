# 🚀 開始設定（3 分鐘完成）

## ✅ 已完成

我已經幫你修改好 `js/config.js`，現在只需要填入你的 GitLab 資訊！

---

## 📝 接下來的步驟

### 方法 1: 使用設定工具（推薦）✨

1. **開啟設定工具**
   ```
   http://localhost:3000/setup-gitlab.html
   ```

2. **按照頁面指示操作**
   - 步驟 1: 取得 GitLab Token
   - 步驟 2: 輸入 Project ID
   - 步驟 3: 生成配置代碼

3. **複製代碼並貼到 config.js**
   - 開啟 `d:\swf展示平台\js\config.js`
   - 找到第 14-17 行
   - 貼上生成的代碼
   - 儲存

4. **測試**
   - 重新整理瀏覽器
   - 開啟 `admin.html`
   - 上傳檔案
   - 完成！

---

### 方法 2: 手動設定

#### 1. 取得 GitLab Token

開啟：https://gitlab.com/-/user_settings/personal_access_tokens

- 點擊 **Add new token**
- Token name: `SWF Upload`
- Scopes: 勾選 `api` 和 `write_repository`
- 點擊 **Create**
- **複製 Token**

#### 2. 取得 Project ID

進入你的 GitLab 專案，專案名稱下方有 **Project ID: XXXXX**

#### 3. 修改 config.js

開啟 `d:\swf展示平台\js\config.js`

找到第 14-17 行：

```javascript
const GITLAB_CONFIG = {
  token: 'YOUR_GITLAB_TOKEN',      // ← 貼上你的 Token
  projectId: 'YOUR_PROJECT_ID',    // ← 貼上你的 Project ID
  branch: 'main'
};
```

替換成你的資訊後儲存。

---

## 🧪 測試

1. 重新整理瀏覽器（Ctrl + F5）
2. 開啟 `http://localhost:3000/admin.html`
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

## ✅ 完成後

你就可以：
- ✅ 上傳 10-30MB 檔案
- ✅ 上傳 30-50MB 檔案
- ✅ 上傳 50-75MB 檔案
- ✅ 看到實時上傳進度
- ✅ 不用擔心檔案大小限制

---

## 🎯 快速連結

- **設定工具**: http://localhost:3000/setup-gitlab.html
- **後台管理**: http://localhost:3000/lonlontwo_swf_key.html
- **前台展示**: http://localhost:3000/index.html

---

## ❓ 遇到問題？

### Token 無效

- 確認 Scopes 有勾選 `api` 和 `write_repository`
- 確認 Token 沒有過期

### Project ID 錯誤

- 確認是數字，不是專案名稱
- 在 GitLab 專案頁面可以看到

### 上傳失敗

- 檢查瀏覽器 Console 的錯誤訊息
- 確認 Token 和 Project ID 正確
- 確認網路連線正常

---

## 🎊 準備好了嗎？

**現在就開啟設定工具開始吧！**

```
http://localhost:3000/setup-gitlab.html
```

**預估時間：3 分鐘** ⏱️
