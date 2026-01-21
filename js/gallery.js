// ================================
// SWF 展示平台 - 前台邏輯
// ================================

document.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();
  loadGallery();
});

async function loadGallery() {
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const gallery = document.getElementById('gallery');

  try {
    const items = await DataAPI.getItems();

    loading.style.display = 'none';

    if (items.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    gallery.style.display = 'grid';
    renderGallery(items);
  } catch (error) {
    console.error('載入失敗:', error);
    loading.innerHTML = '<p style="color: #ef4444;">載入失敗，請重新整理頁面</p>';
  }
}

function renderGallery(items) {
  const gallery = document.getElementById('gallery');

  gallery.innerHTML = items.map(item => `
    <div class="card" onclick="openPlayer('${encodeURIComponent(item.swfUrl)}', '${encodeURIComponent(item.title)}')">
      <div class="card-icon">
        ${item.thumbnail
      ? `<img src="${item.thumbnail}" alt="${item.title}">`
      : `<div class="card-icon-placeholder">🎬</div>`
    }
      </div>
      <div class="card-title">${escapeHtml(item.title)}</div>
    </div>
  `).join('');
}

function openPlayer(swfUrl, title) {
  window.location.href = `player?url=${swfUrl}&title=${title}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
