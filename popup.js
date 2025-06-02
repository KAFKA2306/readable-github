class Popup {
    constructor() {
        this.input = document.getElementById('apiKey');
        this.save = document.getElementById('save');
        this.status = document.getElementById('status');
        this.init();
    }

    async init() {
        // APIキーを取得して表示
        const {apiKey} = await chrome.storage.sync.get('apiKey');
        this.input.value = apiKey || '';
        this.updateStatus(!!apiKey);
        this.save.onclick = () => this.saveKey();
    }

    async saveKey() {
        const apiKey = this.input.value.trim();
        if (!apiKey) {
            this.updateStatus(false, 'APIキーを入力してください');
            return;
        }

        try {
            // APIキーを保存
            await chrome.storage.sync.set({apiKey});
            
            // アクティブタブを取得
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // GitHubページかチェック
            if (tab && tab.url && tab.url.includes('github.com')) {
                // コンテンツスクリプトにメッセージ送信
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateApiKey', 
                        apiKey: apiKey
                    });
                    this.updateStatus(true, 'APIキーが保存され、ページに適用されました');
                } catch (e) {
                    console.log('コンテンツスクリプトにメッセージを送信できませんでした:', e);
                    this.updateStatus(true, 'APIキーが保存されました（ページを更新してください）');
                }
            } else {
                this.updateStatus(true, 'APIキーが保存されました');
            }
        } catch (e) {
            console.error('APIキー保存エラー:', e);
            this.updateStatus(false, 'エラーが発生しました');
        }
    }

    updateStatus(hasKey, message = null) {
        if (message) {
            this.status.textContent = message;
        } else {
            this.status.textContent = hasKey ? '設定済み' : '未設定';
        }
        this.status.className = hasKey ? 'active' : 'inactive';
    }
}

new Popup();
