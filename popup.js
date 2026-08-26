class Popup {
  constructor() {
    this.input = document.getElementById('apiKey');
    this.save = document.getElementById('save');
    this.status = document.getElementById('status');
    this.init();
  }

  async init() {
    const status = await chrome.runtime.sendMessage({ action: 'apiKey:getStatus' });
    this.input.value = '';
    this.input.placeholder = status?.configured ? 'このセッションでは設定済み' : 'AIzaSy...';
    this.updateStatus(Boolean(status?.configured));
    this.save.onclick = () => this.saveKey();
  }

  async saveKey() {
    const apiKey = this.input.value.trim();
    if (!apiKey) {
      this.updateStatus(false, 'APIキーを入力してください');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({ action: 'apiKey:set', apiKey });
      if (!response?.ok) throw new Error(response?.error || '保存に失敗しました');
      this.input.value = '';
      this.input.placeholder = 'このセッションでは設定済み';
      this.updateStatus(true, 'このブラウザセッションに設定しました');
    } catch (error) {
      console.error('APIキー保存エラー:', error);
      this.updateStatus(false, error.message);
    }
  }

  updateStatus(hasKey, message = null) {
    this.status.textContent = message || (hasKey ? '設定済み（セッションのみ）' : '未設定');
    this.status.className = hasKey ? 'active' : 'inactive';
  }
}

new Popup();
