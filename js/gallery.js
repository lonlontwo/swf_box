// ================================
// 前台 - SWF 展示庫邏輯
// ================================

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化 Firebase
  await initFirebase();

  // 載入作品
  await loadGallery();
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
      gallery.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      gallery.style.display = 'grid';
      renderGallery(items);
    }
  } catch (error) {
    console.error('載入失敗:', error);
    loading.innerHTML = '<p style="color: var(--error);">載入失敗，請重新整理頁面</p>';
  }
}

function renderGallery(items) {
  const gallery = document.getElementById('gallery');

  gallery.innerHTML = items.map(item => `
    <article class="swf-card">
      <div class="swf-card-thumbnail" onclick="openPlayer('${encodeURIComponent(item.swfUrl)}', '${encodeURIComponent(item.title)}')">
        ${item.thumbnail
      ? `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">`
      : `<span class="placeholder-icon">🎮</span>`
    }
        <div class="swf-card-play">
          <div class="play-icon">▶</div>
        </div>
      </div>
      <div class="swf-card-info">
        <h3 class="swf-card-title">${escapeHtml(item.title)}</h3>
        <div class="swf-card-actions">
          <button class="card-action-btn" onclick="openPlayer('${encodeURIComponent(item.swfUrl)}', '${encodeURIComponent(item.title)}')" title="播放">
            ▶️ 播放
          </button>
          <button class="card-action-btn download" onclick="downloadFile('${item.swfUrl}', '${escapeHtml(item.title)}')" title="下載">
            ⬇️ 下載
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function openPlayer(swfUrl, title) {
  // 使用不帶 .html 的路徑，避免 serve 重定向時丟失 query parameters
  window.location.href = `player?url=${swfUrl}&title=${title}`;
}

function downloadFile(url, title) {
  const a = document.createElement('a');
  a.href = url;
  a.download = title + '.swf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
