// ================================
// 後台管理邏輯
// ================================

let isLoggedIn = false;
let currentEditId = null;
let currentDeleteId = null;
let selectedFile = null;

// DOM 元素
const elements = {
    loginScreen: document.getElementById('login-screen'),
    adminPanel: document.getElementById('admin-panel'),
    passwordInput: document.getElementById('password-input'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    addBtn: document.getElementById('add-btn'),
    loading: document.getElementById('admin-loading'),
    empty: document.getElementById('admin-empty'),
    itemsList: document.getElementById('items-list'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    modalCancel: document.getElementById('modal-cancel'),
    modalSave: document.getElementById('modal-save'),
    itemTitle: document.getElementById('item-title'),
    itemUrl: document.getElementById('item-url'),
    itemThumbnail: document.getElementById('item-thumbnail'),
    deleteModal: document.getElementById('delete-modal'),
    deleteItemName: document.getElementById('delete-item-name'),
    deleteConfirm: document.getElementById('delete-confirm'),
    // 檔案上傳
    uploadSection: document.getElementById('upload-section'),
    fileInput: document.getElementById('file-input'),
    filePreview: document.getElementById('file-preview'),
    uploadProgress: document.getElementById('upload-progress'),
    uploadProgressBar: document.getElementById('upload-progress-bar')
};

// ================================
// 初始化
// ================================

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Firebase
    await initFirebase();

    // 檢查登入狀態
    checkLoginStatus();

    // 綁定事件
    bindEvents();
});

function checkLoginStatus() {
    const session = sessionStorage.getItem('admin_logged_in');
    if (session === 'true') {
        showAdminPanel();
    }
}

function bindEvents() {
    // 登入
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // 登出
    elements.logoutBtn.addEventListener('click', handleLogout);

    // 新增
    elements.addBtn.addEventListener('click', () => openModal());

    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalCancel.addEventListener('click', closeModal);
    elements.modalSave.addEventListener('click', handleSave);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // Delete Modal
    document.querySelectorAll('.delete-cancel').forEach(btn => {
        btn.addEventListener('click', closeDeleteModal);
    });
    elements.deleteConfirm.addEventListener('click', handleDelete);
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) closeDeleteModal();
    });

    // 檔案上傳
    bindFileUploadEvents();
}

// ================================
// 檔案上傳
// ================================

function bindFileUploadEvents() {
    // 選擇檔案
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelect(file);
    });

    // 拖曳
    elements.uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadSection.classList.add('dragover');
    });

    elements.uploadSection.addEventListener('dragleave', () => {
        elements.uploadSection.classList.remove('dragover');
    });

    elements.uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadSection.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.swf')) {
            handleFileSelect(file);
        } else {
            showToast('請選擇 .swf 檔案', 'error');
        }
    });
}

function handleFileSelect(file) {
    selectedFile = file;

    // 顯示預覽
    elements.filePreview.innerHTML = `
        <div class="file-preview">
            <div class="file-preview-icon">🎬</div>
            <div class="file-preview-info">
                <div class="file-preview-name">${file.name}</div>
                <div class="file-preview-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="file-preview-remove" onclick="removeSelectedFile()">✕</button>
        </div>
    `;
    elements.filePreview.style.display = 'block';

    // 自動填入標題（去掉副檔名）
    if (!elements.itemTitle.value) {
        elements.itemTitle.value = file.name.replace('.swf', '');
    }

    // 清空 URL 欄位
    elements.itemUrl.value = '';
}

function removeSelectedFile() {
    selectedFile = null;
    elements.filePreview.style.display = 'none';
    elements.filePreview.innerHTML = '';
    elements.fileInput.value = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ================================
// 登入/登出
// ================================

async function handleLogin() {
    const password = elements.passwordInput.value.trim();

    if (!password) {
        elements.loginError.textContent = '請輸入密碼';
        elements.loginError.style.display = 'block';
        return;
    }

    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = '驗證中...';

    const isValid = await DataAPI.verifyPassword(password);

    if (isValid) {
        sessionStorage.setItem('admin_logged_in', 'true');
        showAdminPanel();
    } else {
        elements.loginError.textContent = '密碼錯誤';
        elements.loginError.style.display = 'block';
        elements.passwordInput.value = '';
        elements.passwordInput.focus();
    }

    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = '登入';
}

function handleLogout() {
    sessionStorage.removeItem('admin_logged_in');
    isLoggedIn = false;
    elements.adminPanel.style.display = 'none';
    elements.loginScreen.style.display = 'flex';
    elements.passwordInput.value = '';
    elements.loginError.style.display = 'none';
}

async function showAdminPanel() {
    isLoggedIn = true;
    elements.loginScreen.style.display = 'none';
    elements.adminPanel.style.display = 'block';
    await loadItems();
}

// ================================
// 載入項目
// ================================

async function loadItems() {
    elements.loading.style.display = 'flex';
    elements.empty.style.display = 'none';
    elements.itemsList.style.display = 'none';

    try {
        const items = await DataAPI.getItems();

        elements.loading.style.display = 'none';

        if (items.length === 0) {
            elements.empty.style.display = 'block';
        } else {
            elements.itemsList.style.display = 'flex';
            renderItems(items);
        }
    } catch (error) {
        console.error('載入失敗:', error);
        elements.loading.innerHTML = '<p style="color: var(--error);">載入失敗</p>';
    }
}

function renderItems(items) {
    elements.itemsList.innerHTML = items.map(item => `
    <div class="admin-card" data-id="${item.id}">
      <div class="admin-card-thumb">
        ${item.thumbnail
            ? `<img src="${item.thumbnail}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">`
            : '🎬'
        }
      </div>
      <div class="admin-card-info">
        <div class="admin-card-title">${escapeHtml(item.title)}</div>
        <div class="admin-card-url">${item.swfUrl}</div>
        ${item.filename ? `<div style="font-size: 0.75rem; color: var(--primary);">📁 ${item.filename}</div>` : ''}
      </div>
      <div class="admin-card-actions">
        <button class="btn btn-secondary btn-icon" onclick="openPlayer('${encodeURIComponent(item.swfUrl)}', '${encodeURIComponent(item.title)}')" title="播放">
          ▶
        </button>
        <button class="btn btn-secondary btn-icon" onclick="downloadFile('${item.swfUrl}', '${escapeHtml(item.title)}')" title="下載">
          ⬇️
        </button>
        <button class="btn btn-secondary btn-icon" onclick="editItem('${item.id}')" title="編輯">
          ✏️
        </button>
        <button class="btn btn-secondary btn-icon" onclick="confirmDelete('${item.id}', '${escapeHtml(item.title)}', '${item.filename || ''}')" title="刪除">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

// ================================
// Modal 操作
// ================================

function openModal(editId = null) {
    currentEditId = editId;
    selectedFile = null;
    elements.filePreview.style.display = 'none';
    elements.fileInput.value = '';
    elements.uploadProgress.style.display = 'none';

    if (editId) {
        elements.modalTitle.textContent = '編輯作品';
        // 載入現有資料
        const items = DataAPI.getLocalItems();
        const item = items.find(i => i.id === editId);
        if (item) {
            elements.itemTitle.value = item.title;
            elements.itemUrl.value = item.swfUrl;
            elements.itemThumbnail.value = item.thumbnail || '';
        }
    } else {
        elements.modalTitle.textContent = '新增作品';
        elements.itemTitle.value = '';
        elements.itemUrl.value = '';
        elements.itemThumbnail.value = '';
    }

    elements.modal.classList.add('active');
    elements.itemTitle.focus();
}

function closeModal() {
    elements.modal.classList.remove('active');
    currentEditId = null;
    selectedFile = null;
}

async function handleSave() {
    const title = elements.itemTitle.value.trim();
    let swfUrl = elements.itemUrl.value.trim();
    const thumbnail = elements.itemThumbnail.value.trim();
    let filename = null;

    // 驗證
    if (!title) {
        showToast('請輸入作品標題', 'error');
        elements.itemTitle.focus();
        return;
    }

    // 如果有選擇檔案，先上傳
    if (selectedFile && !currentEditId) {
        elements.modalSave.disabled = true;
        elements.modalSave.textContent = '上傳中...';
        elements.uploadProgress.style.display = 'block';

        try {
            // 產生唯一檔名
            filename = `${Date.now()}_${selectedFile.name}`;

            // 模擬進度
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (progress <= 90) {
                    elements.uploadProgressBar.style.width = progress + '%';
                }
            }, 100);

            // 上傳到 GitLab
            swfUrl = await SWFAPI.uploadFile(selectedFile, filename);

            clearInterval(progressInterval);
            elements.uploadProgressBar.style.width = '100%';

            showToast('檔案上傳成功', 'success');
        } catch (error) {
            console.error('上傳失敗:', error);
            showToast('檔案上傳失敗: ' + error.message, 'error');
            elements.modalSave.disabled = false;
            elements.modalSave.textContent = '儲存';
            elements.uploadProgress.style.display = 'none';
            return;
        }
    }

    if (!swfUrl) {
        showToast('請選擇檔案或輸入 SWF 連結', 'error');
        return;
    }

    elements.modalSave.disabled = true;
    elements.modalSave.textContent = '儲存中...';

    try {
        if (currentEditId) {
            // 更新
            await DataAPI.updateItem(currentEditId, { title, swfUrl, thumbnail });
            showToast('作品已更新', 'success');
        } else {
            // 新增
            await DataAPI.addItem({ title, swfUrl, thumbnail, filename });
            showToast('作品已新增', 'success');
        }

        closeModal();
        await loadItems();
    } catch (error) {
        console.error('儲存失敗:', error);
        showToast('儲存失敗', 'error');
    }

    elements.modalSave.disabled = false;
    elements.modalSave.textContent = '儲存';
    elements.uploadProgress.style.display = 'none';
}

// ================================
// 編輯/刪除
// ================================

function editItem(id) {
    openModal(id);
}

function confirmDelete(id, title, filename = '') {
    currentDeleteId = id;
    window.currentDeleteFilename = filename;
    elements.deleteItemName.textContent = title;
    elements.deleteModal.classList.add('active');
}

function closeDeleteModal() {
    elements.deleteModal.classList.remove('active');
    currentDeleteId = null;
    window.currentDeleteFilename = null;
}

async function handleDelete() {
    if (!currentDeleteId) return;

    elements.deleteConfirm.disabled = true;
    elements.deleteConfirm.textContent = '刪除中...';

    try {
        // 如果有對應的 GitLab 檔案，也一起刪除
        if (window.currentDeleteFilename) {
            try {
                await SWFAPI.deleteFile(window.currentDeleteFilename);
            } catch (e) {
                console.warn('GitLab 檔案刪除失敗:', e);
            }
        }

        await DataAPI.deleteItem(currentDeleteId);
        showToast('作品已刪除', 'success');
        closeDeleteModal();
        await loadItems();
    } catch (error) {
        console.error('刪除失敗:', error);
        showToast('刪除失敗', 'error');
    }

    elements.deleteConfirm.disabled = false;
    elements.deleteConfirm.textContent = '刪除';
}

// ================================
// 下載檔案
// ================================

function downloadFile(url, title) {
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.swf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ================================
// 工具函數
// ================================

function openPlayer(swfUrl, title) {
    window.open(`player?url=${swfUrl}&title=${title}`, '_blank');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
