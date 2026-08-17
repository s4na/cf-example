# cf-example

Cloudflare Workers上で動作する、軽量な個人ブログです。

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
