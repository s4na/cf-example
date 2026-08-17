# Cloudflare

`wrangler.jsonc`はWorker、Static Assets、Bindingsの正本です。アプリケーションコードから分離しつつ、Viteの`configPath`で明示的に参照します。

## 認証なしの検証

次のコマンドはWorkerとStatic Assetsを本番用にビルドし、Wranglerでデプロイ内容を検証します。Cloudflareへのアップロードは行いません。

```bash
mise run cloudflare-check
```

`wrangler deploy --temporary`は一時アカウントのClaim URLを出力するため、公開リポジトリのCIでは使用しません。

## D1

BindingにはWranglerの自動プロビジョニングを使用します。初回の認証済みデプロイで`cf-example`データベースが作成され、IDが設定ファイルへ書き戻されます。

ローカルDBへマイグレーションを適用する場合は次を実行します。

```bash
pnpm --dir application exec wrangler d1 migrations apply cf-example \
  --local \
  --config ../infrastructure/cloudflare/wrangler.jsonc
```

初回デプロイでデータベースを作成した後、本番DBにもマイグレーションを適用します。

```bash
pnpm --dir application exec wrangler d1 migrations apply cf-example \
  --remote \
  --config ../infrastructure/cloudflare/wrangler.jsonc
```

## 管理画面の認証

Cloudflare Accessで`/admin*`と`/api/admin/*`を保護し、次のWorker変数を設定します。

- `CF_ACCESS_TEAM_DOMAIN`: `https://<team>.cloudflareaccess.com`
- `CF_ACCESS_AUD`: Access ApplicationのAudience Tag

Workerでも`Cf-Access-Jwt-Assertion`の署名、issuer、audienceを検証します。`ADMIN_AUTH_BYPASS`はテストランタイムだけに注入し、Wrangler設定や本番環境には設定しません。

## R2

`MEDIA` BindingもWranglerの自動プロビジョニング対象です。本文画像は5MB以下のJPEG、PNG、GIF、WebPに限定し、ファイル内容を検査してからR2へ保存します。
