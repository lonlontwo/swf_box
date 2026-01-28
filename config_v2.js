// ================================
// SWF 展示平台 - 配置與數據 API
// ================================

// Cloudflare Worker API URL
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

const COLLECTION_NAME = 'swf_items';
let db = null;
let firebaseReady = false;

// 初始化 Firebase
async function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.warn('⚠️ Firebase SDK 未載入');
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    firebaseReady = true;
    console.log('✅ Firebase 已連接');
    return true;
  } catch (error) {
    console.error('❌ Firebase 失敗:', error);
    return false;
  }
}

// ================================
// 資料操作 API
// ================================

const DataAPI = {
  // 取得作品
  async getItems() {
    if (firebaseReady && db) {
      try {
        const snapshot = await db.collection(COLLECTION_NAME).orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        return JSON.parse(localStorage.getItem('swf_items') || '[]');
      }
    }
    return JSON.parse(localStorage.getItem('swf_items') || '[]');
  },

  // 新增作品
  async addItem(item) {
    const newItem = { ...item, createdAt: new Date().toISOString() };
    if (firebaseReady && db) {
      try {
        const docRef = await db.collection(COLLECTION_NAME).add(newItem);
        return { id: docRef.id, ...newItem };
      } catch (error) {
        console.error('儲存失敗');
      }
    }
    newItem.id = 'local_' + Date.now();
    return newItem;
  },

  // 更新作品
  async updateItem(id, updates) {
    if (firebaseReady && db && !id.startsWith('local_')) {
      await db.collection(COLLECTION_NAME).doc(id).update(updates);
      return { id, ...updates };
    }
    return null;
  },

  // 刪除作品
  async deleteItem(id) {
    if (firebaseReady && db && !id.startsWith('local_')) {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return true;
    }
    return false;
  },

  // ================================
  // 🔐 密碼驗證 (恢復原有模式)
  // ================================

  // 使用 SHA-256 生成雜湊值
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // 驗證管理員：改回使用 Firebase 中儲存的雜湊
  async verifyPassword(password) {
    if (firebaseReady && db) {
      try {
        const doc = await db.collection('system_config').doc('admin_password').get();
        if (doc.exists) {
          const storedHash = doc.data().passwordHash;
          const inputHash = await this.hashPassword(password);
          return inputHash === storedHash;
        } else {
          // 備援：如果 Firebase 沒設定，檢查是否為預設密碼
          const inputHash = await this.hashPassword(password);
          return inputHash === '5f4dcc3b5aa765d61d8327deb882cf99'; // 範例雜湊
        }
      } catch (error) {
        console.error('Firebase 驗證失敗');
        return false;
      }
    }
    return false;
  },

  // 更新管理員密碼
  async updatePassword(newPassword) {
    if (firebaseReady && db) {
      const newHash = await this.hashPassword(newPassword);
      await db.collection('system_config').doc('admin_password').set({
        passwordHash: newHash,
        updatedAt: new Date().toISOString()
      });
      alert('密碼已更新！');
      return true;
    }
    return false;
  }
};
