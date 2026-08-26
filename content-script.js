const MAX_CONTEXT_CHARS = 12000;
const PANEL_ID = 'readable-github-panel';
const FAB_ID = 'github-enhancer-fab';

function getPageContext() {
  const parts = location.pathname.split('/').filter(Boolean);
  const owner = parts[0] || null;
  const repo = parts[1] || null;
  const markerIndex = parts.findIndex((part) => part === 'blob' || part === 'tree');
  return {
    owner,
    repo,
    type: location.pathname.includes('/pull/')
      ? 'pull_request'
      : location.pathname.includes('/commit/')
        ? 'commit'
        : location.pathname.includes('/blob/')
          ? 'file'
          : location.pathname.includes('/tree/')
            ? 'directory'
            : owner && repo
              ? 'repository'
              : 'other',
    ref: markerIndex >= 0 ? parts[markerIndex + 1] || null : null,
    filePath: markerIndex >= 0 ? parts.slice(markerIndex + 2).join('/') || null : null,
    url: location.href
  };
}

function visibleContext() {
  const main = document.querySelector('main') || document.body;
  return (main.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, MAX_CONTEXT_CHARS);
}

async function runtimeRequest(action, payload = {}) {
  const response = await chrome.runtime.sendMessage({ action, ...payload });
  if (!response?.ok) throw new Error(response?.error || 'Extension request failed');
  return response;
}

async function hasApiKey() {
  const response = await runtimeRequest('apiKey:getStatus');
  return Boolean(response.configured);
}

function buildPagePrompt(context) {
  return [
    'あなたはGitHub上のコード読解を補助するソフトウェアエンジニアです。',
    '以下はユーザーが現在表示しているGitHubページの可視テキストです。',
    '原コードやrepositoryの正式仕様ではなく、読解補助として扱ってください。',
    '観測できない実行結果・security・挙動を断定しないでください。',
    '',
    `Repository: ${context.owner || 'unknown'}/${context.repo || 'unknown'}`,
    `Page type: ${context.type}`,
    `Ref: ${context.ref || 'unknown'}`,
    `File: ${context.filePath || 'none'}`,
    `URL: ${context.url}`,
    '',
    '次の順で簡潔に説明してください:',
    '1. このページ/ファイルの役割',
    '2. 重要な処理・依存関係',
    '3. 読むときに確認すべき点',
    '4. 不明・未検証な点',
    '',
    'Visible page content:',
    visibleContext()
  ].join('\n').slice(0, 20000);
}

function buildCodePrompt(code, context) {
  return [
    'あなたはコード読解を補助するソフトウェアエンジニアです。',
    '以下のコードを、原コードを優先しながら簡潔に説明してください。',
    '実行していない挙動や正しさを断定しないでください。',
    '',
    `Repository: ${context.owner || 'unknown'}/${context.repo || 'unknown'}`,
    `File: ${context.filePath || 'unknown'}`,
    `URL: ${context.url}`,
    '',
    '説明項目:',
    '1. 目的',
    '2. 処理の流れ',
    '3. 重要なAPI/依存関係',
    '4. 注意点・未検証事項',
    '',
    'Code:',
    code.slice(0, 6000)
  ].join('\n').slice(0, 20000);
}

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.className = 'github-enhancer-panel';

  const header = document.createElement('div');
  header.className = 'github-enhancer-panel-header';

  const title = document.createElement('h2');
  title.className = 'github-enhancer-panel-title';
  title.textContent = 'ReadableGitHub';

  const close = document.createElement('button');
  close.className = 'github-enhancer-close-btn';
  close.type = 'button';
  close.textContent = '閉じる';
  close.addEventListener('click', () => panel.classList.remove('open'));

  header.append(title, close);

  const content = document.createElement('div');
  content.className = 'github-enhancer-panel-content';

  const body = document.createElement('div');
  body.className = 'github-enhancer-tab-content active';
  body.dataset.role = 'result';

  const notice = document.createElement('p');
  notice.className = 'github-enhancer-info';
  notice.textContent = '実行すると、現在表示中のGitHubページから取得した可視テキストをGoogle Gemini APIへ送信します。';

  const run = document.createElement('button');
  run.type = 'button';
  run.className = 'github-enhancer-code-btn';
  run.style.position = 'static';
  run.textContent = 'このページを解説';
  run.addEventListener('click', () => explainCurrentPage(body));

  body.append(notice, run);
  content.append(body);
  panel.append(header, content);
  document.body.append(panel);
  return panel;
}

function setResult(container, state, text) {
  let result = container.querySelector('[data-role="output"]');
  if (!result) {
    result = document.createElement('div');
    result.dataset.role = 'output';
    result.className = 'github-enhancer-content-area';
    container.append(result);
  }
  result.className = state === 'error' ? 'github-enhancer-error' : 'github-enhancer-content-area';
  result.textContent = text;
}

async function explainCurrentPage(container) {
  try {
    if (!(await hasApiKey())) {
      setResult(container, 'error', 'Gemini APIキーが未設定です。拡張機能のポップアップで設定してください。');
      return;
    }
    setResult(container, 'loading', 'Geminiで解析中…');
    const response = await runtimeRequest('gemini:generate', { prompt: buildPagePrompt(getPageContext()) });
    setResult(container, 'success', response.text);
  } catch (error) {
    setResult(container, 'error', `解説生成に失敗しました: ${error.message}`);
  }
}

async function explainCode(pre, button) {
  const existing = pre.parentElement?.querySelector(':scope > .github-enhancer-explanation');
  if (existing) existing.remove();

  const output = document.createElement('div');
  output.className = 'github-enhancer-explanation github-enhancer-content-area';
  output.textContent = 'Geminiで解析中…';
  (pre.parentElement || pre).append(output);

  try {
    if (!(await hasApiKey())) throw new Error('Gemini APIキーが未設定です');
    button.disabled = true;
    const response = await runtimeRequest('gemini:generate', {
      prompt: buildCodePrompt(pre.innerText || pre.textContent || '', getPageContext())
    });
    output.textContent = response.text;
  } catch (error) {
    output.className = 'github-enhancer-explanation github-enhancer-error';
    output.textContent = `解説生成に失敗しました: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

function enhanceCodeBlocks() {
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre.dataset.readableGithubEnhanced === 'true') return;
    pre.dataset.readableGithubEnhanced = 'true';

    const wrapper = pre.parentElement;
    if (wrapper && getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'github-enhancer-code-btn';
    button.textContent = 'AI解説';
    button.addEventListener('click', () => explainCode(pre, button));
    (wrapper || pre).append(button);
  });
}

function ensureFab() {
  if (document.getElementById(FAB_ID)) return;
  const fab = document.createElement('button');
  fab.id = FAB_ID;
  fab.type = 'button';
  fab.className = 'github-enhancer-fab';
  fab.textContent = 'AI';
  fab.title = 'ReadableGitHubを開く';
  fab.addEventListener('click', () => ensurePanel().classList.toggle('open'));
  document.body.append(fab);
}

let lastUrl = location.href;
function enhance() {
  ensureFab();
  enhanceCodeBlocks();
}

enhance();

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    document.getElementById(PANEL_ID)?.remove();
  }
  enhance();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
