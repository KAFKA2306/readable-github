# ReadableGitHub

GitHubを離れず、読んでいるコードの文脈を保ったまま説明を参照するためのChrome拡張の試作です。

## 現在確認できる構成

- Manifest V3 (`manifest.json`)
- GitHubページへ `content-script.js` / `styles.css` を注入
- popupからAPI keyを保存
- repository / file / commit / pull requestのURL文脈を取得
- コード説明・repository概要等のprompt生成処理

現在のsourceにはGemini APIとGitHub APIへのcross-origin `fetch()` がcontent script内にあります。Chrome公式仕様ではcontent scriptのnetwork requestはsame-origin policyの対象なので、**AI説明機能を現在動作確認済みとは扱いません**。修正状況は [Issue #6](https://github.com/KAFKA2306/readable-github/issues/6) で管理します。

また、現在の実装はGoogleのhosted Gemini APIを呼び出しており、Gemini Nano / Chrome built-in AIを利用する実装ではありません。

## インストール

このrepositoryをcloneまたはdownloadし、`chrome://extensions` のデベロッパーモードから「パッケージ化されていない拡張機能を読み込む」でrepository rootを選択します。

特定のChrome最小versionやCanaryの利用は、現在のrepositoryでは実機検証していないため保証しません。

## データと権限

`manifest.json` が現在宣言している権限は次です。

- `storage`
- `activeTab`
- `https://github.com/*` のhost permission / content script match

API keyは現在 `chrome.storage.sync` に保存され、content scriptへ読み込まれます。Chrome公式はsensitive dataについて`storage.sync`ではなく`storage.session`を推奨しているため、この保存方式もIssue #6の修正対象です。

現在のAI requestが成立した場合、promptへ含めたコード・repository文脈はGoogle Gemini APIへ送信されます。private repositoryや機密コードでの利用は、Issue #6のprivacy/network boundaryが修正・実機検証されるまで推奨しません。

AIが生成する説明は読解補助であり、コードの正しさ、実行結果、security、repositoryの正式仕様を証明しません。原コードと実行証拠を優先してください。

## 開発時の静的確認

追加dependencyなしで、CIと同じ最小確認を実行できます。

```bash
node --check config.js && node --check content-script.js && node --check popup.js && node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))"
```

これはJavaScript構文とmanifest JSONの検査であり、Chrome上の実動作確認ではありません。

## 未検証

- GitHubの現在DOMでのbutton injection
- Gemini request / response表示
- GitHub APIからのrepository情報取得
- invalid API key / network failure時の実ブラウザ挙動
- Chrome Web Store公開
- onboarding pack機能（Issue #1）

## 一次資料

- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- Cross-origin network requests: https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- Chrome storage: https://developer.chrome.com/docs/extensions/reference/api/storage
- Gemini API: https://ai.google.dev/gemini-api/docs

## License

repository内にlicense fileを確認できないため、license条件は現時点ではREADMEで断定しません。
