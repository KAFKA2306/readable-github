# ReadableGitHub MVP ユーザーガイド

ReadableGitHub MVPをご利用いただきありがとうございます！この拡張機能は、GitHub上のコードをAIが自動で解説し、コード理解を深める手助けをします。

## 拡張機能の概要

ReadableGitHub MVPは、GitHubのコードブロックに「🤖 解説」ボタンを追加するChrome拡張機能です。このボタンをクリックすると、ChromeのBuilt-in AI (Gemini Nano) がコードの目的、重要ポイント、学習ヒントを日本語で簡潔に解説します。

## インストール方法

1.  **Chrome Canaryの利用を推奨**: Chrome Built-in AI機能は、現在Chrome Canary（開発者向けバージョン）で最も安定して動作します。
    *   [Chrome Canaryをダウンロード](https://www.google.com/chrome/canary/)
2.  **拡張機能のロード**:
    *   Chromeブラウザを開き、アドレスバーに `chrome://extensions` と入力してEnterキーを押します。
    *   右上の「デベロッパーモード」をオンにします。
    *   「パッケージ化されていない拡張機能を読み込む」ボタンをクリックします。
    *   ReadableGitHub MVPのソースコードが保存されているフォルダ（`manifest.json` が含まれるフォルダ）を選択します。
    *   拡張機能がChromeにロードされ、アイコンがツールバーに表示されます。

## 基本的な使い方

1.  **GitHubページを開く**: GitHub上の任意のコードリポジトリやファイルページを開きます。
2.  **「🤖 解説」ボタンをクリック**: コードブロックの右上に表示される「🤖 解説」ボタンをクリックします。
3.  **AI解説の表示**: ボタンの下にAIが生成したコードの解説が表示されます。解説は「目的」「重要ポイント」「学習ヒント」の3つのセクションに分かれています。
4.  **解説を閉じる**: 解説パネルの右上にある「×」ボタンをクリックすると、パネルを閉じることができます。

## 設定方法

1.  **ポップアップUIを開く**: ChromeツールバーのReadableGitHub MVPアイコンをクリックします。
2.  **解説レベルの調整**:
    *   ポップアップUIには「解説レベル」のオプションがあります。
    *   現在のバージョンでは、設定は保存されますが、AIのプロンプトには `intermediate` が固定で渡されます。今後のアップデートでこの設定がAIの解説に反映される予定です。
3.  **設定の保存**: 変更を行った場合は、「設定を保存」ボタンをクリックして設定を保存します。
4.  **設定のリセット**: 「設定をリセット」ボタンをクリックすると、すべての設定が初期値に戻ります。

## 注意点

*   **Chrome Built-in AIの利用**: 本拡張機能はChromeのBuilt-in AI (Gemini Nano) を利用しています。この機能はまだ開発段階であり、Chrome Canaryでの利用が推奨されます。
*   **AIの利用可能性**: Built-in AIが利用できない環境では、フォールバックとして「手動解説モード」で動作し、AIが利用できない旨のメッセージが表示されます。
*   **解説の精度**: AIによる解説は、コードの複雑さや内容によって精度が異なります。あくまで補助的なツールとしてご利用ください。
*   **インターネット接続**: AI解説の生成にはインターネット接続が必要です。
*   Gemini API Keyを使う

## トラブルシューティング

*   **「🤖 解説」ボタンが表示されない**:
    *   GitHubのページをリロードしてみてください。
    *   Chromeの「デベロッパーモード」がオンになっているか確認してください。
    *   拡張機能が正しくロードされているか `chrome://extensions` で確認してください。
*   **解説が生成されない、またはエラーが表示される**:
    *   Chrome Canaryを使用しているか確認してください。
    *   インターネット接続が安定しているか確認してください。
    *   GitHubのページをリロードしてみてください。
    *   Chromeのコンソール（F12で開く）にエラーメッセージが表示されていないか確認してください。
*   **ポップアップUIの設定が反映されない**:
    *   「設定を保存」ボタンをクリックしましたか？
    *   GitHubのページをリロードしてみてください。

ご不明な点がございましたら、お気軽にお問い合わせください。



## Chrome拡張機能へのGemini Nano組み込み方法

Chrome拡張機能にGemini Nanoを組み込むには、GoogleのPrompt APIを使用してローカルで動作するAI機能を実装できます[1]。

## 開発環境のセットアップ

**必要な環境**
- Chrome バージョン127以上（Chrome CanaryまたはChrome Dev推奨）[2][3]
- 以下のフラグを有効化する必要があります：

1. `chrome://flags/#prompt-api-for-gemini-nano` を **Enabled** に設定[2][5]
2. `chrome://flags/#optimization-guide-on-device-model` を **Enabled BypassPerfRequirement** に設定[2][3]
3. Chromeを再起動後、`chrome://components/`で「Optimization Guide On Device Model」をダウンロード[2]

## 拡張機能での実装方法

**基本的なAPI使用例**
```javascript
// テキストセッションの作成
const session = await window.ai.createTextSession();

// プロンプトの送信
const response = await session.prompt("質問内容");

// 要約API
const summarizer = await window.ai.summarizer.create();
const summary = await summarizer.summarize(text);

// アシスタントAPI
const assistant = await ai.assistant.create();
```

**拡張機能のマニフェスト設定**
manifest.jsonで適切な権限を設定し、background scriptやcontent scriptからAPIにアクセスできます[1]。

## 利用可能なAPI

**主要なタスクAPI**[4]
- **Summarizer API**: テキストの要約機能
- **Translator API**: 翻訳機能  
- **Prompt API**: 自然言語処理タスク（分類、言い換え、要約）
