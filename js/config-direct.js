// ================================
// SWF 展示平台 - 改良版配置（直接上傳到 GitLab）
// ================================

// Cloudflare Worker API URL（只用於讀取檔案）
const SWF_API_URL = 'https://swf-api.lonlontwo0420.workers.dev';

// GitLab 配置（直接上傳）
const GITLAB_CONFIG = {
    token: 'YOUR_GITLAB_TOKEN', // ⚠️ 需要替換成你的 GitLab Token
    projectId: 'YOUR_PROJECT_ID', // ⚠️ 需要替換成你的 Project ID
    branch: 'main'
};

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
// SWF 檔案 API（改良版：直接上傳到 GitLab）
// ================================

const SWFAPI = {
    // 上傳 SWF 檔案（直接上傳到 GitLab，支援大檔案）
    async uploadFile(file, filename, onProgress = null) {
        console.log(`📤 開始上傳: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            // 步驟 1: 讀取檔案為 Base64（10-40%）
            if (onProgress) onProgress(10);
            console.log('📖 讀取檔案...');

            const base64Content = await this.fileToBase64(file, (readProgress) => {
                // 讀取進度佔 10-40%
                if (onProgress) onProgress(10 + readProgress * 0.3);
            });

            if (onProgress) onProgress(40);
            console.log('✓ 檔案讀取完成');

            // 步驟 2: 上傳到 GitLab（40-90%）
            console.log('📡 上傳到 GitLab...');
            const gitlabUrl = `https://gitlab.com/api/v4/projects/${GITLAB_CONFIG.projectId}/repository/files/${encodeURIComponent(filename)}`;

            if (onProgress) onProgress(50);

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
                let errorMsg = `GitLab 上傳失敗 (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg += `: ${errorJson.message || errorText}`;
                } catch {
                    errorMsg += `: ${errorText}`;
                }

                throw new Error(errorMsg);
            }

            if (onProgress) onProgress(100);
            console.log('✅ 上傳成功！');

            // 返回 Worker 代理 URL（用於播放）
            return `${SWF_API_URL}/${filename}`;

        } catch (error) {
            console.error('❌ 上傳失敗:', error);
            throw error;
        }
    },

    // 將檔案轉為 Base64（支援進度回調）
    async fileToBase64(file, onProgress = null) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = (e.loaded / e.total) * 100;
                    onProgress(progress);
                }
            };

            reader.onload = () => {
                // 移除 data:xxx;base64, 前綴
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };

            reader.onerror = () => {
                reject(new Error('檔案讀取失敗'));
            };

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
            console.error('取得列表失敗:', error);
            return { success: false, files: [] };
        }
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

    // 使用 SHA-256 生成雜湊值
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // 驗證管理員
    async verifyPassword(password) {
        if (firebaseReady && db) {
            try {
                const doc = await db.collection('system_config').doc('admin_password').get();
                if (doc.exists) {
                    const storedHash = doc.data().passwordHash;
                    const inputHash = await this.hashPassword(password);
                    return inputHash === storedHash;
                } else {
                    const inputHash = await this.hashPassword(password);
                    return inputHash === '5f4dcc3b5aa765d61d8327deb882cf99';
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
