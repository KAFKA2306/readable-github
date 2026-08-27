const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent';
const MAX_PROMPT_CHARS = 20000;

async function lockSessionStorageToTrustedContexts() {
  if (chrome.storage.session.setAccessLevel) {
    await chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  }
}

async function migrateLegacyApiKey() {
  await lockSessionStorageToTrustedContexts();
  const legacy = await chrome.storage.sync.get('apiKey');
  if (legacy.apiKey) {
    await chrome.storage.session.set({ apiKey: legacy.apiKey });
    await chrome.storage.sync.remove('apiKey');
  }
}

chrome.runtime.onInstalled.addListener(() => {
  migrateLegacyApiKey().catch((error) => console.error('API key migration failed', error));
});

chrome.runtime.onStartup.addListener(() => {
  lockSessionStorageToTrustedContexts().catch((error) => console.error('Session storage policy failed', error));
});

function isExtensionPage(sender) {
  return sender.id === chrome.runtime.id && sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function isGitHubContentScript(sender) {
  if (sender.id !== chrome.runtime.id || !sender.tab?.url) return false;
  try {
    const url = new URL(sender.tab.url);
    return url.protocol === 'https:' && url.hostname === 'github.com';
  } catch {
    return false;
  }
}

async function generateWithGemini(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
    throw new Error('Prompt is empty or too large');
  }

  const { apiKey } = await chrome.storage.session.get('apiKey');
  if (!apiKey) throw new Error('Gemini API key is not configured for this browser session');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned no text response');
  return text;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const run = async () => {
    switch (request?.action) {
      case 'apiKey:getStatus': {
        const { apiKey } = await chrome.storage.session.get('apiKey');
        return { ok: true, configured: Boolean(apiKey) };
      }
      case 'apiKey:set': {
        if (!isExtensionPage(sender)) throw new Error('API key updates are only allowed from extension pages');
        const apiKey = String(request.apiKey || '').trim();
        if (!apiKey) throw new Error('API key is required');
        await lockSessionStorageToTrustedContexts();
        await chrome.storage.session.set({ apiKey });
        await chrome.storage.sync.remove('apiKey');
        return { ok: true, configured: true };
      }
      case 'apiKey:clear': {
        if (!isExtensionPage(sender)) throw new Error('API key updates are only allowed from extension pages');
        await chrome.storage.session.remove('apiKey');
        await chrome.storage.sync.remove('apiKey');
        return { ok: true, configured: false };
      }
      case 'gemini:generate': {
        if (!isGitHubContentScript(sender)) throw new Error('Gemini requests are only allowed from GitHub content scripts');
        return { ok: true, text: await generateWithGemini(request.prompt) };
      }
      default:
        throw new Error('Unsupported request');
    }
  };

  run()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
