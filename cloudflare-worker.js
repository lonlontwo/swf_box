// ================================
// SWF 檔案上傳 Worker (支援分塊上傳)
// ================================

// 環境變數需要設定：
// - GITLAB_TOKEN: GitLab Personal Access Token
// - GITLAB_PROJECT_ID: GitLab Project ID
// - GITLAB_BRANCH: 分支名稱 (預設: main)

// 臨時儲存分塊的 Map (使用 KV 或 Durable Objects 更好)
const uploadSessions = new Map();

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // 處理 OPTIONS 請求
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // 分塊上傳端點
            if (path === '/upload-chunk' && request.method === 'POST') {
                return await handleChunkUpload(request, env, corsHeaders);
            }

            // 一般上傳端點（小檔案）
            if (path === '/upload' && request.method === 'POST') {
                return await handleUpload(request, env, corsHeaders);
            }

            // 刪除檔案
            if (path.startsWith('/') && request.method === 'DELETE') {
                return await handleDelete(request, env, corsHeaders, path.slice(1));
            }

            // 取得檔案（代理 GitLab）
            if (path.startsWith('/') && request.method === 'GET') {
                return await handleGet(request, env, corsHeaders, path.slice(1));
            }

            // 列出檔案
            if (path === '/' && request.method === 'GET') {
                return await handleList(request, env, corsHeaders);
            }

            return new Response('Not Found', { status: 404, headers: corsHeaders });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// ================================
// 處理分塊上傳
// ================================
async function handleChunkUpload(request, env, corsHeaders) {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const chunkIndex = parseInt(formData.get('chunkIndex'));
    const totalChunks = parseInt(formData.get('totalChunks'));

    if (!file || !filename) {
        return new Response(JSON.stringify({ success: false, error: '缺少檔案或檔名' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 建立或取得上傳 session
    const sessionId = filename;
    if (!uploadSessions.has(sessionId)) {
        uploadSessions.set(sessionId, {
            chunks: new Array(totalChunks),
            receivedChunks: 0
        });
    }

    const session = uploadSessions.get(sessionId);

    // 儲存分塊
    const chunkBuffer = await file.arrayBuffer();
    session.chunks[chunkIndex] = new Uint8Array(chunkBuffer);
    session.receivedChunks++;

    console.log(`收到分塊 ${chunkIndex + 1}/${totalChunks} for ${filename}`);

    // 如果所有分塊都收到了，合併並上傳到 GitLab
    if (session.receivedChunks === totalChunks) {
        console.log(`所有分塊已收到，開始合併 ${filename}`);

        // 合併所有分塊
        const totalSize = session.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const mergedBuffer = new Uint8Array(totalSize);
        let offset = 0;

        for (const chunk of session.chunks) {
            mergedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // 上傳到 GitLab
        const base64Content = arrayBufferToBase64(mergedBuffer);
        const gitlabUrl = `https://gitlab.com/api/v4/projects/${env.GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(filename)}`;

        const gitlabResponse = await fetch(gitlabUrl, {
            method: 'POST',
            headers: {
                'PRIVATE-TOKEN': env.GITLAB_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                branch: env.GITLAB_BRANCH || 'main',
                content: base64Content,
                commit_message: `Upload ${filename}`,
                encoding: 'base64'
            })
        });

        // 清理 session
        uploadSessions.delete(sessionId);

        if (!gitlabResponse.ok) {
            const error = await gitlabResponse.text();
            throw new Error(`GitLab 上傳失敗: ${error}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: '檔案上傳完成',
            url: `${new URL(request.url).origin}/${filename}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 還有分塊未收到
    return new Response(JSON.stringify({
        success: true,
        message: `分塊 ${chunkIndex + 1}/${totalChunks} 已接收`
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// ================================
// 處理一般上傳（小檔案）
// ================================
async function handleUpload(request, env, corsHeaders) {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');

    if (!file || !filename) {
        return new Response(JSON.stringify({ success: false, error: '缺少檔案或檔名' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 讀取檔案內容
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = arrayBufferToBase64(arrayBuffer);

    // 上傳到 GitLab
    const gitlabUrl = `https://gitlab.com/api/v4/projects/${env.GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(filename)}`;

    const gitlabResponse = await fetch(gitlabUrl, {
        method: 'POST',
        headers: {
            'PRIVATE-TOKEN': env.GITLAB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            branch: env.GITLAB_BRANCH || 'main',
            content: base64Content,
            commit_message: `Upload ${filename}`,
            encoding: 'base64'
        })
    });

    if (!gitlabResponse.ok) {
        const error = await gitlabResponse.text();
        throw new Error(`GitLab 上傳失敗: ${error}`);
    }

    return new Response(JSON.stringify({
        success: true,
        url: `${new URL(request.url).origin}/${filename}`
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// ================================
// 處理刪除
// ================================
async function handleDelete(request, env, corsHeaders, filename) {
    const gitlabUrl = `https://gitlab.com/api/v4/projects/${env.GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(filename)}`;

    const gitlabResponse = await fetch(gitlabUrl, {
        method: 'DELETE',
        headers: {
            'PRIVATE-TOKEN': env.GITLAB_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            branch: env.GITLAB_BRANCH || 'main',
            commit_message: `Delete ${filename}`
        })
    });

    if (!gitlabResponse.ok) {
        return new Response(JSON.stringify({ success: false }), {
            status: gitlabResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// ================================
// 處理取得檔案（代理 GitLab）
// ================================
async function handleGet(request, env, corsHeaders, filename) {
    const gitlabUrl = `https://gitlab.com/api/v4/projects/${env.GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(filename)}/raw?ref=${env.GITLAB_BRANCH || 'main'}`;

    const gitlabResponse = await fetch(gitlabUrl, {
        headers: {
            'PRIVATE-TOKEN': env.GITLAB_TOKEN
        }
    });

    if (!gitlabResponse.ok) {
        return new Response('File not found', { status: 404, headers: corsHeaders });
    }

    // 代理回應
    const headers = new Headers(gitlabResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

    // 設定正確的 Content-Type
    if (filename.endsWith('.swf')) {
        headers.set('Content-Type', 'application/x-shockwave-flash');
    }

    return new Response(gitlabResponse.body, {
        status: gitlabResponse.status,
        headers
    });
}

// ================================
// 處理列出檔案
// ================================
async function handleList(request, env, corsHeaders) {
    const gitlabUrl = `https://gitlab.com/api/v4/projects/${env.GITLAB_PROJECT_ID}/repository/tree?ref=${env.GITLAB_BRANCH || 'main'}`;

    const gitlabResponse = await fetch(gitlabUrl, {
        headers: {
            'PRIVATE-TOKEN': env.GITLAB_TOKEN
        }
    });

    if (!gitlabResponse.ok) {
        throw new Error('無法取得檔案列表');
    }

    const files = await gitlabResponse.json();

    return new Response(JSON.stringify({
        success: true,
        files: files.filter(f => f.type === 'blob').map(f => f.name)
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// ================================
// 工具函數
// ================================
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
