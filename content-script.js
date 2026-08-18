class AdvancedGitHubEnhancer {
    constructor() {
        this.apiKey = '';
        this.projectData = null;
        this.activePanel = null;
        this.isInitialized = false;
        this.cache = new CacheManager();
        this.githubAPI = new GitHubAPIClient();
        this.promptEngine = new PromptEngine();
        this.init();
    }

    async init() {
        try {
            const result = await chrome.storage.sync.get('apiKey');
            this.apiKey = result.apiKey || '';
            console.log('🚀 GitHub Enhancer v2.0 初期化:', this.apiKey ? '✅ APIキー設定済み' : '❌ APIキー未設定');
        } catch (e) {
            console.error('❌ 初期化エラー:', e);
            return;
        }

        await this.detectPageContext();
        this.setupGlobalUI();
        this.observePageChanges();
        this.setupMessageListener();
        this.isInitialized = true;
        
        // ページ読み込み完了後に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhance());
        } else {
            this.enhance();
        }
    }

    async detectPageContext() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        this.pageContext = {
            type: this.getPageType(path),
            owner: this.getRepoOwner(path),
            repo: this.getRepoName(path),
            branch: this.getBranch(),
            filePath: this.getFilePath(path),
            url: url,
            cacheKey: this.generateCacheKey(path)
        };

        console.log('📍 ページコンテキスト:', this.pageContext);
    }

    getPageType(path) {
        if (path.includes('/blob/')) return 'file';
        if (path.includes('/tree/')) return 'directory';
        if (path.match(/^\/[^\/]+\/[^\/]+\/?$/)) return 'repository';
        if (path.includes('/commit/')) return 'commit';
        if (path.includes('/pull/')) return 'pull_request';
        return 'other';
    }

    getRepoOwner(path) {
        const parts = path.split('/').filter(p => p);
        return parts[0] || null;
    }

    getRepoName(path) {
        const parts = path.split('/').filter(p => p);
        return parts[1] || null;
    }

    getBranch() {
        // より確実なブランチ検出
        const branchSelectors = [
            '[data-hotkey="w"] span',
            '.octicon-git-branch + span',
            '.branch-select-menu summary span',
            '[aria-label*="branch"] span'
        ];
        
        for (const selector of branchSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        // URLからブランチを推測
        const pathParts = window.location.pathname.split('/');
        if (pathParts.includes('blob') || pathParts.includes('tree')) {
            const branchIndex = pathParts.findIndex(part => part === 'blob' || part === 'tree') + 1;
            if (pathParts[branchIndex]) {
                return pathParts[branchIndex];
            }
        }
        
        return 'main'; // デフォルト
    }

    getFilePath(path) {
        const parts = path.split('/').filter(p => p);
        if (parts.length > 4 && (parts[2] === 'blob' || parts[2] === 'tree')) {
            return parts.slice(4).join('/');
        }
        return null;
    }

    generateCacheKey(path) {
        return `${this.pageContext?.owner || 'unknown'}_${this.pageContext?.repo || 'unknown'}_${this.getBranch()}_${Date.now()}`;
    }

    setupGlobalUI() {
        this.injectGlobalStyles();
        this.createFloatingActionButton();
    }

    injectGlobalStyles() {
        if (document.getElementById('github-enhancer-styles')) return;

        const style = document.createElement('style');
        style.id = 'github-enhancer-styles';
        style.textContent = `
            /* グローバルスタイル */
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

            /* パネルスタイル */
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

            /* コードブロック強化 */
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

            /* レスポンシブ対応 */
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
            }

            /* スクロールバーカスタマイズ */
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

            /* プログレスバー */
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
        `;
        document.head.appendChild(style);
    }

    createFloatingActionButton() {
        if (document.getElementById('github-enhancer-fab')) return;

        const fab = document.createElement('button');
        fab.id = 'github-enhancer-fab';
        fab.className = 'github-enhancer-fab';
        fab.innerHTML = '🧠';
        fab.title = 'GitHubコード解説を開く (Ctrl+Shift+E)';
        
        fab.addEventListener('click', () => this.togglePanel());
        document.body.appendChild(fab);

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.togglePanel();
            }
        });

        // APIキーが未設定の場合はパルスアニメーション
        if (!this.apiKey) {
            fab.classList.add('pulse');
        }
    }

    async enhance() {
        if (!this.isInitialized) return;

        // ページタイプに応じた機能追加
        switch (this.pageContext.type) {
            case 'repository':
                await this.enhanceRepositoryPage();
                break;
            case 'file':
                await this.enhanceFilePage();
                break;
            case 'directory':
                await this.enhanceDirectoryPage();
                break;
        }

        // コードブロックの強化
        this.enhanceCodeBlocks();
    }

    async enhanceRepositoryPage() {
        // プロジェクト情報の収集
        await this.collectProjectData();
    }

    async enhanceFilePage() {
        // ファイル解析ボタンの追加
        this.addFileAnalysisButtons();
    }

    async enhanceDirectoryPage() {
        // ディレクトリ構造の解析
        await this.analyzeDirectoryStructure();
    }

    enhanceCodeBlocks() {
        const codeBlocks = document.querySelectorAll('pre:not(.github-enhancer-processed)');
        
        codeBlocks.forEach(pre => {
            if (pre.textContent.trim().length > 50) {
                this.addCodeBlockButton(pre);
                pre.classList.add('github-enhancer-processed');
            }
        });
    }

    addCodeBlockButton(pre) {
        const btn = document.createElement('button');
        btn.className = 'github-enhancer-code-btn';
        btn.innerHTML = '🤖 解説';
        btn.onclick = (e) => {
            e.stopPropagation();
            this.explainCodeBlock(pre);
        };
        
        pre.style.position = 'relative';
        pre.appendChild(btn);
    }

    async collectProjectData() {
        const cacheKey = `project_${this.pageContext.cacheKey}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            this.projectData = cached;
            console.log('✅ プロジェクトデータをキャッシュから取得');
            return;
        }

        try {
            this.projectData = {
                name: this.pageContext.repo,
                owner: this.pageContext.owner,
                branch: this.pageContext.branch,
                description: this.getRepositoryDescription(),
                readme: await this.githubAPI.getReadmeContent(this.pageContext.owner, this.pageContext.repo),
                fileStructure: await this.githubAPI.getRepositoryTree(this.pageContext.owner, this.pageContext.repo, this.pageContext.branch),
                languages: await this.githubAPI.getLanguages(this.pageContext.owner, this.pageContext.repo),
                topics: this.getTopics(),
                packageJson: await this.githubAPI.getFileContent(this.pageContext.owner, this.pageContext.repo, 'package.json', this.pageContext.branch),
                metadata: await this.githubAPI.getRepositoryInfo(this.pageContext.owner, this.pageContext.repo)
            };

            this.cache.set(cacheKey, this.projectData, 30 * 60 * 1000); // 30分キャッシュ
            console.log('📊 プロジェクトデータ収集完了:', this.projectData);
        } catch (error) {
            console.error('❌ プロジェクトデータ収集エラー:', error);
            this.projectData = { error: error.message };
        }
    }

    getRepositoryDescription() {
        const descSelectors = [
            '[data-testid="repository-description-text"]',
            '.BorderGrid-cell p',
            'span[title][class*="color-fg-muted"]',
            '.f4.my-3'
        ];

        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '';
    }

    getTopics() {
        const topicElements = document.querySelectorAll('a[data-ga-click*="topic"], .topic-tag');
        return Array.from(topicElements).map(el => el.textContent.trim()).filter(t => t);
    }

    async getCurrentFileContent() {
        if (this.pageContext.type !== 'file') return null;

        const cacheKey = `file_${this.pageContext.cacheKey}_${this.pageContext.filePath}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            console.log('✅ ファイル内容をキャッシュから取得');
            return cached;
        }

        // DOM から取得を試行
        const domContent = this.extractFileContentFromDOM();
        if (domContent) {
            this.cache.set(cacheKey, domContent, 15 * 60 * 1000); // 15分キャッシュ
            return domContent;
        }

        // GitHub API から取得
        try {
            const apiContent = await this.githubAPI.getFileContent(
                this.pageContext.owner,
                this.pageContext.repo,
                this.pageContext.filePath,
                this.pageContext.branch
            );
            
            if (apiContent) {
                this.cache.set(cacheKey, apiContent, 15 * 60 * 1000);
                console.log('✅ GitHub API経由でファイル内容取得成功');
                return apiContent;
            }
        } catch (error) {
            console.error('❌ GitHub API経由でのファイル内容取得失敗:', error);
        }

        return null;
    }

    extractFileContentFromDOM() {
        // より確実なファイル内容取得
        const contentSelectors = [
            '.js-file-line-container .js-file-line',
            '.blob-wrapper table tbody tr td.blob-code-inner',
            '.highlight table tbody tr td:last-child',
            'table.highlight tbody tr td.blob-code',
            '.Box-body .blob-code',
            '.blob-code-inner'
        ];

        for (const selector of contentSelectors) {
            const lines = document.querySelectorAll(selector);
            if (lines.length > 0) {
                const content = Array.from(lines).map(line => {
                    // より正確なテキスト抽出
                    return line.textContent || line.innerText || '';
                }).join('\n');
                
                if (content.trim().length > 10) {
                    console.log('✅ DOM経由でファイル内容取得成功:', selector, `${lines.length}行`);
                    return content.trim();
                }
            }
        }

        return null;
    }

    togglePanel() {
        if (!this.activePanel) {
            this.createPanel();
        }
        
        const panel = this.activePanel;
        const isOpen = panel.classList.contains('open');
        
        if (isOpen) {
            panel.classList.remove('open');
        } else {
            panel.classList.add('open');
            this.loadPanelContent();
        }
    }

    createPanel() {
        if (document.getElementById('github-enhancer-panel')) {
            this.activePanel = document.getElementById('github-enhancer-panel');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'github-enhancer-panel';
        panel.className = 'github-enhancer-panel';
        
        panel.innerHTML = `
            <div class="github-enhancer-panel-header">
                <h2 class="github-enhancer-panel-title">🧠 AI コード解説 v2.0</h2>
                <button class="github-enhancer-close-btn" onclick="this.closest('.github-enhancer-panel').classList.remove('open')">
                    ✕ 閉じる
                </button>
            </div>
            <div class="github-enhancer-tabs">
                <button class="github-enhancer-tab active" data-tab="overview">📋 概要</button>
                <button class="github-enhancer-tab" data-tab="structure">🏗️ 構造</button>
                <button class="github-enhancer-tab" data-tab="analysis">🔍 詳細</button>
                <button class="github-enhancer-tab" data-tab="learning">📚 学習</button>
            </div>
            <div class="github-enhancer-panel-content">
                <div class="github-enhancer-tab-content active" data-content="overview">
                    <div class="github-enhancer-loading">読み込み中...</div>
                </div>
                <div class="github-enhancer-tab-content" data-content="structure">
                    <div class="github-enhancer-loading">読み込み中...</div>
                </div>
                <div class="github-enhancer-tab-content" data-content="analysis">
                    <div class="github-enhancer-loading">読み込み中...</div>
                </div>
                <div class="github-enhancer-tab-content" data-content="learning">
                    <div class="github-enhancer-loading">読み込み中...</div>
                </div>
            </div>
        `;

        // タブ切り替えの設定
        panel.querySelectorAll('.github-enhancer-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.body.appendChild(panel);
        this.activePanel = panel;
    }

    switchTab(tabName) {
        // タブの状態更新
        this.activePanel.querySelectorAll('.github-enhancer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // コンテンツの状態更新
        this.activePanel.querySelectorAll('.github-enhancer-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });

        // タブ固有のコンテンツ読み込み
        this.loadTabContent(tabName);
    }

    async loadPanelContent() {
        if (!this.apiKey) {
            this.showApiKeyError();
            return;
        }

        // プロジェクトデータが未収集の場合は収集
        if (!this.projectData) {
            await this.collectProjectData();
        }

        this.loadTabContent('overview');
    }

    async loadTabContent(tabName) {
        const content = this.activePanel.querySelector(`[data-content="${tabName}"]`);
        if (!content) return;

        // 既にロード済みかチェック（キャッシュ確認）
        const cacheKey = `tab_${tabName}_${this.pageContext.cacheKey}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            content.innerHTML = `
                <div class="github-enhancer-section">
                    <div class="github-enhancer-content-area">${cached}</div>
                </div>
            `;
            return;
        }

        content.innerHTML = '<div class="github-enhancer-loading">🤖 AI解析中...</div>';

        try {
            let analysisResult;
            
            switch (tabName) {
                case 'overview':
                    analysisResult = await this.generateProjectOverview();
                    break;
                case 'structure':
                    analysisResult = await this.generateStructureAnalysis();
                    break;
                case 'analysis':
                    analysisResult = await this.generateDetailedAnalysis();
                    break;
                case 'learning':
                    analysisResult = await this.generateLearningGuide();
                    break;
                default:
                    analysisResult = 'コンテンツが見つかりません。';
            }

            content.innerHTML = `
                <div class="github-enhancer-section">
                    <div class="github-enhancer-content-area">${analysisResult}</div>
                </div>
            `;

            // 結果をキャッシュ
            this.cache.set(cacheKey, analysisResult, 60 * 60 * 1000); // 1時間キャッシュ

        } catch (error) {
            console.error(`❌ ${tabName}タブの読み込みエラー:`, error);
            content.innerHTML = `
                <div class="github-enhancer-error">
                    エラーが発生しました: ${error.message}
                </div>
            `;
        }
    }

    async generateProjectOverview() {
        const prompt = this.promptEngine.createOverviewPrompt({
            projectData: this.projectData,
            pageContext: this.pageContext,
            currentFile: this.pageContext.type === 'file' ? await this.getCurrentFileContent() : null
        });

        return await this.callGemini(prompt);
    }

    async generateStructureAnalysis() {
        const prompt = this.promptEngine.createStructurePrompt({
            projectData: this.projectData,
            pageContext: this.pageContext,
            fileStructure: this.projectData?.fileStructure || []
        });

        return await this.callGemini(prompt);
    }

    async generateDetailedAnalysis() {
        const prompt = this.promptEngine.createDetailedPrompt({
            projectData: this.projectData,
            pageContext: this.pageContext,
            currentFile: this.pageContext.type === 'file' ? await this.getCurrentFileContent() : null,
            fileName: this.pageContext.filePath
        });

        return await this.callGemini(prompt);
    }

    async generateLearningGuide() {
        const prompt = this.promptEngine.createLearningPrompt({
            projectData: this.projectData,
            pageContext: this.pageContext,
            userLevel: 'intermediate' // 今後設定可能にする
        });

        return await this.callGemini(prompt);
    }

    async explainCodeBlock(pre) {
        if (!this.apiKey) {
            alert('APIキーが設定されていません。右下のボタンから設定してください。');
            return;
        }

        const code = pre.textContent.slice(0, 3000);
        const prompt = this.promptEngine.createCodeBlockPrompt({
            code: code,
            language: this.detectCodeLanguage(pre),
            context: this.pageContext
        });

        try {
            const explanation = await this.callGemini(prompt);
            this.showCodeExplanation(pre, explanation);
        } catch (error) {
            console.error('❌ コード解説エラー:', error);
            alert(`解説生成エラー: ${error.message}`);
        }
    }

    detectCodeLanguage(pre) {
        // コード言語の検出
        const classNames = pre.className + ' ' + (pre.querySelector('code')?.className || '');
        
        const languageMap = {
            'javascript': ['js', 'javascript', 'es6'],
            'typescript': ['ts', 'typescript'],
            'python': ['py', 'python'],
            'java': ['java'],
            'cpp': ['cpp', 'c++', 'cxx'],
            'c': ['c'],
            'html': ['html', 'htm'],
            'css': ['css'],
            'json': ['json'],
            'yaml': ['yaml', 'yml'],
            'markdown': ['md', 'markdown'],
            'bash': ['bash', 'sh', 'shell']
        };

        for (const [lang, patterns] of Object.entries(languageMap)) {
            if (patterns.some(pattern => classNames.toLowerCase().includes(pattern))) {
                return lang;
            }
        }

        // ファイル拡張子から推測
        if (this.pageContext.filePath) {
            const ext = this.pageContext.filePath.split('.').pop()?.toLowerCase();
            for (const [lang, patterns] of Object.entries(languageMap)) {
                if (patterns.includes(ext)) {
                    return lang;
                }
            }
        }

        return 'unknown';
    }

    showCodeExplanation(pre, explanation) {
        // 既存の説明を削除
        const existing = pre.querySelector('.github-enhancer-explanation');
        if (existing) existing.remove();

        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'github-enhancer-explanation';
        explanationDiv.style.cssText = `
            margin-top: 16px;
            background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px;
            color: #e6edf3;
            font-size: 14px;
            line-height: 1.6;
            position: relative;
        `;

        explanationDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #30363d;">
                <strong style="color: #2ea043;">🤖 AI解説</strong>
                <button onclick="this.closest('.github-enhancer-explanation').remove()" 
                        style="background: #da3633; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">
                    ✕
                </button>
            </div>
            <div style="white-space: pre-wrap;">${explanation}</div>
        `;

        pre.appendChild(explanationDiv);
        explanationDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async callGemini(prompt) {
        if (!this.apiKey) {
            throw new Error('APIキーが設定されていません');
        }

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 4096
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Gemini API エラー:', errorData);
            throw new Error(`API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '解説を生成できませんでした';
    }

    showApiKeyError() {
        const content = this.activePanel.querySelector('.github-enhancer-tab-content.active');
        content.innerHTML = `
            <div class="github-enhancer-section">
                <div class="github-enhancer-error">
                    ❌ Gemini APIキーが設定されていません。
                </div>
                <div class="github-enhancer-info">
                    <strong>設定手順:</strong><br>
                    1. <a href="https://aistudio.google.com/" target="_blank" style="color: #58a6ff;">Google AI Studio</a>でAPIキーを取得<br>
                    2. Chrome拡張機能のアイコンをクリック<br>
                    3. APIキーを入力して保存<br>
                    4. このパネルを再度開く
                </div>
            </div>
        `;
    }

    observePageChanges() {
        let lastUrl = location.href;
        
        const observer = new MutationObserver(async () => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log('📍 ページ変更検出:', lastUrl);
                
                // ページ情報を更新
                await this.detectPageContext();
                
                // 少し待ってから強化処理を実行
                setTimeout(() => this.enhance(), 1500);
            } else {
                // DOM変更によるコードブロック追加をチェック
                this.enhanceCodeBlocks();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateApiKey') {
                this.apiKey = request.apiKey;
                console.log('✅ APIキー更新:', this.apiKey ? '設定済み' : '削除');
                
                // FABのパルスアニメーション制御
                const fab = document.getElementById('github-enhancer-fab');
                if (fab) {
                    fab.classList.toggle('pulse', !this.apiKey);
                }
                
                // キャッシュクリア（新しいAPIキーでの再生成のため）
                this.cache.clear();
                
                sendResponse({ success: true });
            }
            return true;
        });
    }
}

// キャッシュマネージャークラス
class CacheManager {
    constructor() {
        this.storage = new Map();
        this.maxSize = 50; // 最大50エントリ
        this.cleanupInterval = 5 * 60 * 1000; // 5分ごとにクリーンアップ
        
        this.startCleanup();
    }

    set(key, value, ttl = 60 * 60 * 1000) { // デフォルト1時間
        const expiry = Date.now() + ttl;
        
        // サイズ制限チェック
        if (this.storage.size >= this.maxSize) {
            this.evictOldest();
        }
        
        this.storage.set(key, {
            value: value,
            expiry: expiry,
            accessed: Date.now()
        });
    }

    get(key) {
        const item = this.storage.get(key);
        
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.storage.delete(key);
            return null;
        }
        
        item.accessed = Date.now();
        return item.value;
    }

    delete(key) {
        return this.storage.delete(key);
    }

    clear() {
        this.storage.clear();
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.storage.entries()) {
            if (item.accessed < oldestTime) {
                oldestTime = item.accessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.storage.delete(oldestKey);
        }
    }

    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            const expired = [];
            
            for (const [key, item] of this.storage.entries()) {
                if (now > item.expiry) {
                    expired.push(key);
                }
            }
            
            expired.forEach(key => this.storage.delete(key));
            
            if (expired.length > 0) {
                console.log(`🧹 キャッシュクリーンアップ: ${expired.length}件の期限切れエントリを削除`);
            }
        }, this.cleanupInterval);
    }
}

// GitHub API クライアントクラス
class GitHubAPIClient {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.cache = new Map();
    }

    async makeRequest(endpoint) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHub-Enhancer-Extension'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API request failed:', error);
            throw error;
        }
    }

    async getRepositoryInfo(owner, repo) {
        try {
            return await this.makeRequest(`/repos/${owner}/${repo}`);
        } catch (error) {
            console.error('リポジトリ情報の取得に失敗:', error);
            return null;
        }
    }

    async getReadmeContent(owner, repo) {
        try {
            const response = await this.makeRequest(`/repos/${owner}/${repo}/readme`);
            return atob(response.content);
        } catch (error) {
            console.error('README取得に失敗:', error);
            return null;
        }
    }

    async getFileContent(owner, repo, path, branch = 'main') {
        try {
            const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            if (response.content) {
                return atob(response.content);
            }
            return null;
        } catch (error) {
            console.error(`ファイル取得に失敗 (${path}):`, error);
            return null;
        }
    }

    async getRepositoryTree(owner, repo, branch = 'main') {
        try {
            const response = await this.makeRequest(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
            return response.tree || [];
        } catch (error) {
            console.error('リポジトリツリー取得に失敗:', error);
            return [];
        }
    }

    async getLanguages(owner, repo) {
        try {
            const response = await this.makeRequest(`/repos/${owner}/${repo}/languages`);
            return Object.keys(response);
        } catch (error) {
            console.error('言語情報取得に失敗:', error);
            return [];
        }
    }
}

// プロンプトエンジニアリングクラス
class PromptEngine {
    createOverviewPrompt({ projectData, pageContext, currentFile }) {
        const contextInfo = this.buildContextInfo(projectData, pageContext);
        
        return `
# プロジェクト概要解析タスク

あなたは経験豊富なソフトウェアアーキテクトとして、GitHubプロジェクトの概要を解析してください。

## 解析対象プロジェクト
${contextInfo}

## 出力要求
以下の構造で日本語で解析結果を提供してください：

### 🎯 プロジェクトの目的と価値
- このプロジェクトが解決しようとしている問題
- ターゲットユーザーとユースケース

### 💻 技術スタックと選択理由
- 使用している主要技術とその理由
- アーキテクチャの特徴と設計思想
- 技術的な強みと課題

### 🚀 学習価値とポイント
- このプロジェクトから学べる主要な技術要素
- 実務での応用可能性

回答は具体的で実用的な内容にしてください。推測部分は明確に示してください。
        `.trim();
    }

    createStructurePrompt({ projectData, pageContext, fileStructure }) {
        const contextInfo = this.buildContextInfo(projectData, pageContext);
        const structureTree = this.buildFileStructureTree(fileStructure);
        
        return `
# プロジェクト構造解析タスク

あなたは経験豊富なソフトウェアアーキテクトとして、プロジェクトの構造を詳細に解析してください。

## 解析対象プロジェクト
${contextInfo}

## ファイル構造
\`\`\`
${structureTree}
\`\`\`

## 出力要求
以下の構造で日本語で解析結果を提供してください：

### 🏗️ アーキテクチャパターンの識別
- ディレクトリ構成から読み取れる設計思想
- 責任分散とモジュール化の状況

### 📁 主要ディレクトリとファイルの役割
- 各ディレクトリの目的と責任範囲
- 重要なファイルの機能と依存関係
- 設定ファイルとその意味

### 🔄 データフローとプロセス
- データの流れと処理の順序
- 主要なエントリーポイントと実行パス
- API設計とインターフェース構造

### 📈 学習の進め方
- 理解すべきファイルの優先順位

回答は具体的で、実際のファイル名を参照しながら説明してください。
        `.trim();
    }

    createDetailedPrompt({ projectData, pageContext, currentFile, fileName }) {
        const contextInfo = this.buildContextInfo(projectData, pageContext);
        
        if (pageContext.type === 'file' && currentFile) {
            return `
# ファイル詳細解析タスク

あなたは経験豊富なソフトウェアエンジニアとして、特定のファイルを詳細に解析してください。

## プロジェクトコンテキスト
${contextInfo}

## 解析対象ファイル
**ファイル名**: ${fileName}

**ファイル内容**:
\`\`\`
${currentFile.slice(0, 8000)}
${currentFile.length > 8000 ? '\n... (省略) ...' : ''}
\`\`\`

## 出力要求
以下の構造で日本語で解析結果を提供してください：

### 🎯 ファイルの目的と責任
- このファイルの主要な役割と機能
- プロジェクト全体での位置づけ
- 他のファイルとの関係性

### 🔧 実装の詳細解析
- 主要なクラス、関数、メソッドの説明
- 使用されているデザインパターンとアルゴリズム
- 重要なロジックと処理フロー

回答は具体的なコード例を参照しながら説明してください。
            `.trim();
        } else {
            return `
# プロジェクト技術詳細解析タスク

あなたは経験豊富なシニアエンジニアとして、プロジェクトの技術的詳細を解析してください。

## 解析対象プロジェクト
${contextInfo}

## 出力要求
以下の構造で日本語で解析結果を提供してください：

### 🔧 技術実装の深掘り
- 使用されている技術やライブラリ
- カスタム実装とその理由


### 📈 スケーラビリティと保守性
- 拡張性を考慮した設計
- 保守性を高める工夫

回答は技術的に深く、実用的な内容にしてください。
            `.trim();
        }
    }

    createLearningPrompt({ projectData, pageContext, userLevel }) {
        const contextInfo = this.buildContextInfo(projectData, pageContext);
        
        return `
# 学習ガイド作成タスク

あなたは経験豊富な技術教育者として、このプロジェクトの包括的な学習ガイドを作成してください。

## 対象プロジェクト
${contextInfo}

## 学習者レベル
- 対象: ${userLevel === 'beginner' ? '初心者' : userLevel === 'intermediate' ? '中級者' : '上級者'}

## 出力要求
以下の構造で日本語で学習ガイドを提供してください：

### 📚 前提知識と準備
- 必要な基礎知識とスキル
- 推奨する事前学習リソース
- 開発環境のセットアップ手順

### 🎯 段階別学習パス
#### 第1段階：基礎理解
- 最初に理解すべき概念とファイル
- 基本的な動作原理の把握
- 簡単な動作確認方法

#### 第2段階：構造理解
- アーキテクチャとモジュール関係
- 主要な処理フローの追跡
- デバッグとログの活用


### 📖 関連リソースと参考資料
- 公式ドキュメントとチュートリアル
- 関連技術の学習リソース

回答は実践的で、具体的なアクションプランを含めてください。
        `.trim();
    }

    createCodeBlockPrompt({ code, language, context }) {
        return `
# コードスニペット解説タスク

あなたは経験豊富なプログラミング講師として、以下のコードを初心者にも分かりやすく解説してください。

## コンテキスト
- プロジェクト: ${context.owner}/${context.repo}
- ファイル: ${context.filePath || '不明'}
- 言語: ${language}

## 解析対象コード
\`\`\`${language}
${code}
\`\`\`

## 出力要求
以下の構造で日本語で解説してください：

### 🎯 このコードの目的
- 何をするコードなのか
- なぜこの実装が必要なのか

### 🔧 処理の流れ
- 行ごとの処理内容
- 重要なロジックの説明
- 使用されているAPIやメソッド

### 💡 技術的なポイント
- 注目すべき実装テクニック
- よく使われるパターン
- 初心者が理解すべき概念

### 🚀 応用と発展
- 類似の実装例
- 改善や最適化のアイデア
- 関連する学習トピック

回答は簡潔で分かりやすく、専門用語には適切な説明を付けてください。
        `.trim();
    }

    buildContextInfo(projectData, pageContext) {
        if (!projectData || projectData.error) {
            return `
**プロジェクト**: ${pageContext.owner}/${pageContext.repo}
**ブランチ**: ${pageContext.branch}
**ページタイプ**: ${pageContext.type}
**注意**: プロジェクトデータの取得に失敗しました。URLと可視情報のみで解析します。
            `.trim();
        }

        const packageInfo = projectData.packageJson ? this.parsePackageJson(projectData.packageJson) : null;
        
        return `
**プロジェクト名**: ${projectData.name}
**所有者**: ${projectData.owner}
**ブランチ**: ${projectData.branch}
**説明**: ${projectData.description || '（説明なし）'}
**主要言語**: ${projectData.languages?.join(', ') || '不明'}
**トピック**: ${projectData.topics?.join(', ') || 'なし'}
${packageInfo ? `**パッケージ情報**: ${packageInfo}` : ''}
**メタデータ**: ${projectData.metadata ? `⭐${projectData.metadata.stargazers_count || 0} | 🍴${projectData.metadata.forks_count || 0} | 📅${projectData.metadata.updated_at?.slice(0, 10) || '不明'}` : '不明'}
        `.trim();
    }

    parsePackageJson(packageJson) {
        try {
            const pkg = JSON.parse(packageJson);
            const dependencies = Object.keys(pkg.dependencies || {}).slice(0, 5);
            const devDependencies = Object.keys(pkg.devDependencies || {}).slice(0, 3);
            return `${pkg.name || 'unknown'}@${pkg.version || 'unknown'}, 依存: [${dependencies.join(', ')}], 開発: [${devDependencies.join(', ')}]`;
        } catch (error) {
            return 'package.json解析エラー';
        }
    }

    buildFileStructureTree(fileStructure) {
        if (!fileStructure || fileStructure.length === 0) {
            return 'ファイル構造情報なし';
        }

        // ファイル構造をツリー形式で表示（最大100ファイル）
        return fileStructure
            .slice(0, 100)
            .map(file => {
                const indent = '  '.repeat((file.path?.split('/').length || 1) - 1);
                const icon = file.type === 'tree' ? '📁' : '📄';
                return `${indent}${icon} ${file.path || file.name || 'unknown'}`;
            })
            .join('\n');
    }
}

// 初期化
new AdvancedGitHubEnhancer();
