// ================================
// SWF 展示平台 - 配置與數據 API
// ================================

// 後台預設密碼
const DEFAULT_ADMIN_PASSWORD = 'csmcsm46';

// GitLab Worker API (Cloudflare)
const SWF_API_URL = 'https://swf-api.lonlontwo0420.workers.dev';

// Firebase 配置
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCILWtkLbjaZ2L-s1saPQdwMlgQG66iKrA",
  authDomain: "lonlontwo-1d9de.firebaseapp.com",
  projectId: "lonlontwo-1d9de",
  storageBucket: "lonlontwo-1d9de.firebasestorage.app",
  messagingSenderId: "268283503569",
  appId: "1:268283503569:web:cdadc8f6a2d5c0d8d236f0",
  measurementId: "G-JBK7XXCFPG"
};

// Firestore collection 名稱
const COLLECTION_NAME = 'swf_items';

// Firebase 狀態
let db = null;
let firebaseReady = false;

// 初始化 Firebase
async function initFirebase() {
  try {
    // 檢查 Firebase SDK 是否已載入
    if (typeof firebase === 'undefined') {
      console.warn('⚠️ Firebase SDK 未載入，使用本地存儲');
      return false;
    }

    // 初始化 Firebase App
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    // 初始化 Firestore
    db = firebase.firestore();
    firebaseReady = true;
    console.log('✅ Firebase 已連接 - Collection:', COLLECTION_NAME);
    return true;
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
    firebaseReady = false;
    return false;
  }
}

// ================================
// SWF 檔案 API (GitLab + Cloudflare Worker)
// ================================

const SWFAPI = {
  // 上傳 SWF 檔案
  async uploadFile(file, filename) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    const response = await fetch(`${SWF_API_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '上傳失敗');
    }
    // 直接返回 Worker 代理 URL
    return `${SWF_API_URL}/${filename}`;
  },

  // 刪除 SWF 檔案
  async deleteFile(filename) {
    const response = await fetch(`${SWF_API_URL}/${filename}`, {
      method: 'DELETE'
    });
    return response.ok;
  },

  // 取得檔案列表
  async listFiles() {
    const response = await fetch(SWF_API_URL);
    return response.json();
  },

  // 取得檔案 URL
  getFileUrl(filename) {
    return `${SWF_API_URL}/${filename}`;
  }
};

// ================================
// 資料操作 API
// ================================

const DataAPI = {
  // 取得所有 SWF 項目
  async getItems() {
    if (firebaseReady && db) {
      try {
        const snapshot = await db.collection(COLLECTION_NAME)
          .orderBy('createdAt', 'desc')
          .get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Firebase 讀取失敗，使用本地資料:', error);
        return this.getLocalItems();
      }
    }
    return this.getLocalItems();
  },

  // 本地資料
  getLocalItems() {
    try {
      return JSON.parse(localStorage.getItem('swf_items') || '[]');
    } catch {
      return [];
    }
  },

  // 新增項目
  async addItem(item) {
    const newItem = {
      ...item,
      createdAt: new Date().toISOString()
    };

    if (firebaseReady && db) {
      try {
        const docRef = await db.collection(COLLECTION_NAME).add(newItem);
        console.log('✅ 已儲存至 Firebase:', docRef.id);
        return { id: docRef.id, ...newItem };
      } catch (error) {
        console.error('Firebase 寫入失敗，儲存至本地:', error);
      }
    }

    // 備援：儲存到本地
    newItem.id = 'local_' + Date.now();
    const items = this.getLocalItems();
    items.unshift(newItem);
    localStorage.setItem('swf_items', JSON.stringify(items));
    return newItem;
  },

  // 更新項目
  async updateItem(id, updates) {
    if (firebaseReady && db && !id.startsWith('local_')) {
      try {
        await db.collection(COLLECTION_NAME).doc(id).update(updates);
        console.log('✅ Firebase 更新成功');
        return { id, ...updates };
      } catch (error) {
        console.error('Firebase 更新失敗:', error);
      }
    }

    // 本地更新
    const items = this.getLocalItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      localStorage.setItem('swf_items', JSON.stringify(items));
      return items[index];
    }
    return null;
  },

  // 刪除項目
  async deleteItem(id) {
    if (firebaseReady && db && !id.startsWith('local_')) {
      try {
        await db.collection(COLLECTION_NAME).doc(id);
        await db.collection(COLLECTION_NAME).doc(id).delete();
        console.log('✅ Firebase 刪除成功');
        return true;
      } catch (error) {
        console.error('Firebase 刪除失敗:', error);
      }
    }

    // 本地刪除
    const items = this.getLocalItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem('swf_items', JSON.stringify(filtered));
    return true;
  },

  // 驗證密碼
  async verifyPassword(password) {
    if (firebaseReady && db) {
      try {
        const doc = await db.collection('system_config').doc('admin_password').get();
        if (doc.exists) {
          return password === doc.data().password;
        }
      } catch (error) {
        console.error('Firebase 密碼讀取失敗:', error);
      }
    }
    // 備援：使用預設密碼
    return password === DEFAULT_ADMIN_PASSWORD;
  },

  // 更新密碼
  async updatePassword(newPassword) {
    if (firebaseReady && db) {
      try {
        await db.collection('system_config').doc('admin_password').set({
          password: newPassword,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ 密碼已儲存至 Firebase');
        return true;
      } catch (error) {
        console.error('Firebase 密碼更新失敗:', error);
        throw error;
      }
    }
    throw new Error('Firebase 未連接');
  },

  // 同步本地資料到 Firebase
  async syncLocalToFirebase() {
    if (!firebaseReady || !db) return;

    const localItems = this.getLocalItems();
    if (localItems.length === 0) return;

    console.log('🔄 同步本地資料到 Firebase...');
    for (const item of localItems) {
      if (item.id.startsWith('local_')) {
        const { id, ...data } = item;
        await db.collection(COLLECTION_NAME).add(data);
      }
    }
    localStorage.removeItem('swf_items');
    console.log('✅ 同步完成');
  }
};

// ================================
// 工具函數
// ================================

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
