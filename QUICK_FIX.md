# 🎯 最小改動方案（只改 config.js）

## ✅ 超簡單！只需要 3 步驟

---

## 步驟 1: 取得 GitLab 資訊（2 分鐘）

### 1.1 取得 Token

1. 開啟 https://gitlab.com/-/user_settings/personal_access_tokens
2. 點擊 **Add new token**
3. 填寫：
   - Token name: `SWF Upload`
   - Scopes: 勾選 `api` 和 `write_repository`
4. 點擊 **Create personal access token**
5. **複製 Token**（只會顯示一次！）

### 1.2 取得 Project ID

1. 進入你的 GitLab 專案
2. 專案名稱下方有 **Project ID: XXXXX**
3. 複製這個數字

---

## 步驟 2: 修改 config.js（1 分鐘）

開啟 `d:\swf展示平台\js\config.js`

### 找到第 6 行，在下面加入：

```javascript
// Cloudflare Worker API URL
const SWF_API_URL = 'https://swf-api.lonlontwo0420.workers.dev';

// ⬇️ 加入這 5 行 ⬇️
// GitLab 配置（直接上傳）
const GITLAB_CONFIG = {
  token: 'YOUR_GITLAB_TOKEN',      // ← 貼上你的 Token
  projectId: 'YOUR_PROJECT_ID',    // ← 貼上你的 Project ID
  branch: 'main'
};
```

### 找到第 47-137 行的 `SWFAPI` 部分，整個替換成：

```javascript
const SWFAPI = {
  // 上傳 SWF 檔案（直接上傳到 GitLab）
  async uploadFile(file, filename, onProgress = null) {
    console.log(`📤 開始上傳: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      // 讀取檔案為 Base64
      if (onProgress) onProgress(10);
      const base64Content = await this.fileToBase64(file, (readProgress) => {
        if (onProgress) onProgress(10 + readProgress * 0.3);
      });
      
      if (onProgress) onProgress(40);
      
      // 上傳到 GitLab
      const gitlabUrl = `https://gitlab.com/api/v4/projects/${GITLAB_CONFIG.projectId}/repository/files/${encodeURIComponent(filename)}`;
      
      const response = await fetch(gitlabUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': GITLAB_CONFIG.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: GITLAB_CONFIG.branch,
          content: base64Content,
          commit_message: `Upload ${filename}`,
          encoding: 'base64'
        })
      });
      
      if (onProgress) onProgress(90);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitLab 上傳失敗: ${errorText}`);
      }
      
      if (onProgress) onProgress(100);
      console.log('✅ 上傳成功！');
      
      return `${SWF_API_URL}/${filename}`;
      
    } catch (error) {
      console.error('❌ 上傳失敗:', error);
      throw error;
    }
  },

  // 將檔案轉為 Base64
  async fileToBase64(file, onProgress = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100);
        }
      };
      
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = () => reject(new Error('檔案讀取失敗'));
      
      reader.readAsDataURL(file);
    });
  },

  // 刪除 SWF 檔案
  async deleteFile(filename) {
    try {
      const gitlabUrl = `https://gitlab.com/api/v4/projects/${GITLAB_CONFIG.projectId}/repository/files/${encodeURIComponent(filename)}`;
      
      const response = await fetch(gitlabUrl, {
        method: 'DELETE',
        headers: {
          'PRIVATE-TOKEN': GITLAB_CONFIG.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: GITLAB_CONFIG.branch,
          commit_message: `Delete ${filename}`
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('刪除失敗:', error);
      return false;
    }
  },

  // 取得檔案列表
  async listFiles() {
    try {
      const response = await fetch(SWF_API_URL);
      return response.json();
    } catch (error) {
      return { success: false, files: [] };
    }
  },

  // 取得檔案 URL
  getFileUrl(filename) {
    return `${SWF_API_URL}/${filename}`;
  }
};
```

---

## 步驟 3: 測試（1 分鐘）

1. 重新整理 `admin.html`
2. 上傳一個檔案
3. 完成！

---

## 📊 改動總結

| 檔案 | 改動 | 說明 |
|------|------|------|
| `js/config.js` | ✏️ 修改 | 加入 GITLAB_CONFIG + 替換 SWFAPI |
| `admin.html` | ✅ 不改 | 完全不用動 |
| `index.html` | ✅ 不改 | 完全不用動 |
| `player.html` | ✅ 不改 | 完全不用動 |
| Worker | ✅ 不改 | 完全不用動 |

**總共只改 1 個檔案！** 🎯

---

## ⏱️ 時間估算

- 取得 Token: 2 分鐘
- 修改 config.js: 1 分鐘
- 測試: 1 分鐘
- **總共: 4 分鐘**

---

## 🎊 完成後

- ✅ 可以上傳 50MB 檔案
- ✅ 穩定可靠
- ✅ 不用部署 Worker
- ✅ 其他功能完全不變

---

## ❓ 需要我幫你改嗎？

如果你想要，我可以直接幫你修改 `config.js`，你只需要：

1. 告訴我你的 GitLab Token
2. 告訴我你的 Project ID
3. 我幫你改好

或者你也可以自己改，很簡單！
