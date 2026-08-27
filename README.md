# ReadableGitHub

GitHubを離れず、表示中のrepository / file / commit / pull requestの文脈を使ってコード読解を補助するChrome拡張の試作です。

## 現在の構成

- Chrome Extension Manifest V3
- `content-script.js`: GitHub DOMの文脈取得とUIのみ。外部APIへ直接通信しない
- `background.js`: Gemini APIへのcross-origin requestを担当するextension service worker
- `popup.js`: Gemini API keyを現在のbrowser sessionへ設定
- Gemini model: `gemini-3.7-flash`

Chrome公式のcross-origin request contractに合わせ、外部network authorityはservice workerへ限定しています。content scriptから任意URLを渡してfetchする汎用proxyはありません。

## インストール

このrepositoryをcloneまたはdownloadし、`chrome://extensions` のデベロッパーモードから「パッケージ化されていない拡張機能を読み込む」でrepository rootを選択します。

特定のChrome最小versionやCanary利用は、実機検証していないため保証しません。

## API keyとデータ送信

Gemini API keyは `chrome.storage.session` に保持します。browser restart、extension reload/update等でsession storageが消えるため、その後は再入力が必要です。旧版の `chrome.storage.sync` にAPI keyが残っている場合はextension update時にsession storageへ移してsync側から削除します。

GitHubページ上で「このページを解説」または「AI解説」を実行すると、その操作時に表示中のGitHubページから取得した可視テキストまたはコード抜粋をGoogle Gemini APIへ送信します。private repositoryや機密コードでは、送信してよい内容か利用者自身で確認してください。

AI生成結果は読解補助であり、コードの正しさ、実行結果、security、repositoryの正式仕様を証明しません。原コードと実行証拠を優先してください。

## 開発時の静的確認

追加dependencyなしでCIと同じ最小確認を実行できます。

```bash
node --check background.js && \
node --check content-script.js && \
node --check popup.js && \
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))"
```

CIではさらに、content scriptにGemini/GitHub API endpoint、API key storage、`this.apiKey` が再導入されていないことを確認します。

## 検証状態

Repository-level:

- JavaScript syntax / manifest JSON: CI対象
- content scriptのdirect cross-origin API request: 0をCIで検査
- content scriptのAPI key storage/保持: 0をCIで検査
- Gemini endpoint/model: `gemini-3.7-flash`

実Chrome runtimeは未検証です。次の項目は実機確認が完了するまでPASS扱いしません。

- GitHub current DOMでのUI injection
- popupでAPI key設定 → page explanation → response表示
- invalid API key / network failure時の表示
- browser restart後にAPI keyが保持されないこと
- Chrome Web Store公開

追跡: [Issue #6](https://github.com/KAFKA2306/readable-github/issues/6)

## 一次資料

- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- Cross-origin network requests: https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- Chrome storage: https://developer.chrome.com/docs/extensions/reference/api/storage
- Gemini API: https://ai.google.dev/gemini-api/docs

## License

repository内にlicense fileを確認できないため、license条件は現時点ではREADMEで断定しません。
