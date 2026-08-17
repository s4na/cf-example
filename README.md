# cf-example

Cloudflare Workers上で動作する、軽量な個人ブログです。

- 公開画面はHonoによるSSRで、JavaScriptを配信しません
- 管理画面ではMarkdownの編集とプレビューができます
- ドラッグ＆ドロップ、貼り付け、ファイル選択でR2へ画像を保存できます
- 記事はD1へ保存し、下書きと公開を切り替えられます

## 構成

- `application/`: 公開画面、管理画面、API、テスト
- `infrastructure/`: Cloudflareへの配置とリソース設定

公開画面はJavaScriptへの依存を抑え、管理画面にだけPreactを使用します。APIはHono、入力検証はValibotで実装します。

## 開発

Node.jsとpnpmはmiseで管理します。

```bash
mise install
mise run install
mise run dev
```

ビルドは次のコマンドで確認できます。

```bash
mise run build
```

lint、型チェック、テスト、ビルドは一括で実行できます。

```bash
mise run check
```

管理画面から記事を作成し、画像を追加して公開する一連の動作はE2Eテストで確認できます。

```bash
pnpm --dir application exec playwright install chromium
mise run test-e2e
```
