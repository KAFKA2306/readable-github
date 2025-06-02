class GitHubEnhancer {
    constructor() {
        this.apiKey = '';
        this.init();
    }

    async init() {
        // 初期化時にAPIキーを取得
        try {
            const result = await chrome.storage.sync.get('apiKey');
            this.apiKey = result.apiKey || '';
            console.log('APIキー取得:', this.apiKey ? '設定済み' : '未設定');
        } catch (e) {
            console.error('APIキー取得エラー:', e);
        }

        // ページの初期化
        this.setupCodeBlocks();
        this.observeChanges();

        // メッセージリスナー
        chrome.runtime.onMessage.addListener((req, sender, res) => {
            if (req.action === 'updateApiKey') {
                this.apiKey = req.apiKey;
                console.log('APIキーが更新されました');
                res({success: true});
            }
            return true; // 非同期レスポンスを有効化
        });
    }

    setupCodeBlocks() {
        // 既に処理済みのコードブロックを除外
        document.querySelectorAll('pre:not(.processed)').forEach(pre => {
            if (pre.textContent.trim().length > 20) {
                this.addButton(pre);
                pre.classList.add('processed');
            }
        });
    }

    observeChanges() {
        // DOM変更を監視
        const observer = new MutationObserver(() => {
            this.setupCodeBlocks();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    addButton(pre) {
        const btn = document.createElement('button');
        btn.textContent = '🤖 解説';
        btn.className = 'explain-btn';
        btn.onclick = () => this.explain(pre, btn);
        pre.style.position = 'relative';
        pre.appendChild(btn);
    }

    async explain(pre, btn) {
        const orig = btn.textContent;
        btn.textContent = '処理中...';
        btn.disabled = true;

        try {
            if (!this.apiKey) {
                throw new Error('APIキーが設定されていません。拡張機能のポップアップから設定してください。');
            }

            const code = pre.textContent.slice(0, 1000);
            const explanation = await this.callGemini(code);
            this.showResult(pre, explanation);
        } catch (e) {
            console.error('解説エラー:', e);
            this.showResult(pre, `エラー: ${e.message}`);
        } finally {
            btn.textContent = orig;
            btn.disabled = false;
        }
    }

    async callGemini(code) {
        const response = await fetch(
            // 正しいモデル名に変更
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `以下のコードを日本語で簡潔に解説してください:\n\n${code}`
                        }]
                    }]
                })
            }
        );
        // 以下は同じ


        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API エラー:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '解説を生成できませんでした';
    }


    showResult(pre, text) {
        // 既存の結果を削除
        const existing = pre.querySelector('.result');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'result';
        div.innerHTML = `
            <div class="result-header">
                🤖 コード解説
                <button onclick="this.closest('.result').remove()">✕</button>
            </div>
            <div class="result-content">${text}</div>
        `;
        pre.appendChild(div);
        
        // 解説が表示されたらスクロールして見やすくする
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

}

// ページロード後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GitHubEnhancer());
} else {
    new GitHubEnhancer();
}
