const CONFIG = {
  globalStyles: `
    .github-enhancer-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 50%;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .github-enhancer-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 35px rgba(0,0,0,0.4);
    }
    .github-enhancer-fab.pulse {
      animation: fabPulse 2s infinite;
    }
    @keyframes fabPulse {
      0% { box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6); }
      100% { box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
    }
    .github-enhancer-clipboard-manager {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.7);
      z-index: 20000;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .github-enhancer-clipboard-manager.show {
      display: block;
    }
    .github-enhancer-clipboard-header {
      background: linear-gradient(90deg, #238636 0%, #2ea043 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .github-enhancer-clipboard-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .github-enhancer-clipboard-close {
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      padding: 6px 10px;
      font-size: 12px;
    }
    .github-enhancer-clipboard-body {
      max-height: 300px;
      overflow-y: auto;
      padding: 0;
    }
    .github-enhancer-clipboard-item {
      padding: 12px 20px;
      border-bottom: 1px solid #30363d;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #e6edf3;
    }
    .github-enhancer-clipboard-item:hover {
      background: #21262d;
    }
    .github-enhancer-clipboard-text {
      flex: 1;
      font-size: 13px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 12px;
    }
    .github-enhancer-clipboard-actions {
      display: flex;
      gap: 8px;
    }
    .github-enhancer-clipboard-btn {
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .github-enhancer-clipboard-btn:hover {
      background: #4f46e5;
    }
    .github-enhancer-clipboard-btn.delete {
      background: #dc2626;
    }
    .github-enhancer-clipboard-btn.delete:hover {
      background: #b91c1c;
    }
    .github-enhancer-clipboard-empty {
      padding: 40px 20px;
      text-align: center;
      color: #7d8590;
      font-size: 14px;
    }
    .github-enhancer-paste-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(99, 102, 241, 0.9);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      z-index: 100;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }
    .github-enhancer-paste-btn:hover {
      background: rgba(79, 70, 229, 0.9);
      transform: scale(1.05);
    }
    .github-enhancer-panel {
      position: fixed;
      top: 0;
      right: -650px;
      width: 650px;
      height: 100vh;
      background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
      border-left: 1px solid #30363d;
      box-shadow: -5px 0 25px rgba(0,0,0,0.5);
      z-index: 10000;
      transition: right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .github-enhancer-panel.open {
      right: 0;
    }
    .github-enhancer-panel-header {
      background: linear-gradient(90deg, #238636 0%, #2ea043 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #30363d;
    }
    .github-enhancer-panel-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    .github-enhancer-close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      padding: 8px 12px;
      font-size: 14px;
      transition: background 0.2s;
    }
    .github-enhancer-close-btn:hover {
      background: rgba(255,255,255,0.3);
    }
    .github-enhancer-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .github-enhancer-tabs {
      display: flex;
      background: #21262d;
      border-bottom: 1px solid #30363d;
    }
    .github-enhancer-tab {
      flex: 1;
      background: none;
      border: none;
      color: #7d8590;
      padding: 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
    }
    .github-enhancer-tab.active {
      color: #f0f6fc;
      border-bottom-color: #2ea043;
      background: rgba(46, 160, 67, 0.1);
    }
    .github-enhancer-tab:hover {
      background: rgba(177, 186, 196, 0.12);
    }
    .github-enhancer-tab-content {
      padding: 24px;
      color: #e6edf3;
      line-height: 1.6;
      display: none;
    }
    .github-enhancer-tab-content.active {
      display: block;
    }
    .github-enhancer-section {
      margin-bottom: 32px;
    }
    .github-enhancer-section-title {
      font-size: 16px;
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .github-enhancer-content-area {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 16px;
      font-size: 14px;
      white-space: pre-wrap;
      max-height: 600px;
      overflow-y: auto;
    }
    .github-enhancer-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #7d8590;
    }
    .github-enhancer-error {
      background: #da3633;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .github-enhancer-success {
      background: #238636;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .github-enhancer-info {
      background: #1f6feb;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 16px 0;
      font-size: 13px;
    }
    .github-enhancer-code-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(35, 134, 54, 0.9);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      z-index: 100;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }
    .github-enhancer-code-btn:hover {
      background: rgba(46, 160, 67, 0.9);
      transform: scale(1.05);
    }
    @media (max-width: 768px) {
      .github-enhancer-panel {
        width: 100vw;
        right: -100vw;
      }
      .github-enhancer-fab {
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        font-size: 20px;
      }
      .github-enhancer-clipboard-manager {
        width: 90vw;
        max-width: 350px;
      }
    }
    .github-enhancer-panel ::-webkit-scrollbar {
      width: 8px;
    }
    .github-enhancer-panel ::-webkit-scrollbar-track {
      background: #21262d;
    }
    .github-enhancer-panel ::-webkit-scrollbar-thumb {
      background: #656d76;
      border-radius: 4px;
    }
    .github-enhancer-panel ::-webkit-scrollbar-thumb:hover {
      background: #7d8590;
    }
    .github-enhancer-progress {
      width: 100%;
      height: 4px;
      background: #30363d;
      border-radius: 2px;
      overflow: hidden;
      margin: 16px 0;
    }
    .github-enhancer-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #2ea043, #238636);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  `,
  panelHTML: `
    <div class="github-enhancer-panel-header">
      <h1 class="github-enhancer-panel-title">🧠 GitHub Code Analyzer</h1>
      <button class="github-enhancer-close-btn">閉じる</button>
    </div>
    <div class="github-enhancer-panel-content">
      <div class="github-enhancer-tabs">
        <button class="github-enhancer-tab active" data-tab="file-purpose">📄 ファイルの目的と責任</button>
        <button class="github-enhancer-tab" data-tab="surface-analysis">🔍 表面的解析</button>
        <button class="github-enhancer-tab" data-tab="structure">🏗️ 主要ディレクトリとファイル</button>
        <button class="github-enhancer-tab" data-tab="details">📊 重要なクラス、関数、メソッド</button>
        <button class="github-enhancer-tab" data-tab="study">📚 学習ポイント</button>
      </div>
      <div class="github-enhancer-tab-content active" id="file-purpose"></div>
      <div class="github-enhancer-tab-content" id="surface-analysis"></div>
      <div class="github-enhancer-tab-content" id="structure"></div>
      <div class="github-enhancer-tab-content" id="details"></div>
      <div class="github-enhancer-tab-content" id="study"></div>
    </div>
  `,
  selectors: {
    branchSelectors: [
      'span[data-content="main"]',
      '.octicon-git-branch + span',
      '[data-testid="anchor-content"]'
    ],
    codeBlocks: [
      'pre:not(.github-enhancer-processed)',
      '.highlight pre:not(.github-enhancer-processed)',
      'code:not(.github-enhancer-processed)'
    ],
    fileContent: [
      '.react-code-text',
      '.blob-code-inner',
      '.js-file-line'
    ],
    repositoryDescription: [
      'p[data-repository-hovercards-enabled]',
      '.repository-content .markdown-body p:first-child',
      '[data-pjax="#repo-content-pjax-container"] p'
    ],
    inputElements: [
      'input[type="text"]',
      'input[type="search"]',
      'textarea',
      '[contenteditable="true"]',
      '.CodeMirror',
      '.ace_editor'
    ]
  }
};
