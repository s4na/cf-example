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

## 管理画面の認証

Cloudflare Accessで`/admin*`と`/api/admin/*`を保護し、次のWorker変数を設定します。

- `CF_ACCESS_TEAM_DOMAIN`: `https://<team>.cloudflareaccess.com`
- `CF_ACCESS_AUD`: Access ApplicationのAudience Tag

Workerでも`Cf-Access-Jwt-Assertion`の署名、issuer、audienceを検証します。`ADMIN_AUTH_BYPASS`はテストランタイムだけに注入し、Wrangler設定や本番環境には設定しません。

## R2

`MEDIA` BindingもWranglerの自動プロビジョニング対象です。本文画像は5MB以下のJPEG、PNG、GIF、WebPに限定し、ファイル内容を検査してからR2へ保存します。

## デプロイ

GitHub ActionsにはCloudflare認証情報を保存しません。CIと同じ検証を行った後、操作する本人がWranglerへログインしてデプロイします。

```bash
pnpm --dir application exec wrangler login
pnpm --dir application exec wrangler whoami
mise run check
pnpm --dir application exec wrangler deploy --dry-run \
  --assets ./dist/client \
  --config ../infrastructure/cloudflare/wrangler.jsonc
pnpm --dir application exec wrangler d1 migrations apply cf-example \
  --remote \
  --config ../infrastructure/cloudflare/wrangler.jsonc
pnpm --dir application exec vite build
pnpm --dir application exec wrangler deploy \
  --assets ./dist/client \
  --config ../infrastructure/cloudflare/wrangler.jsonc
curl --fail --show-error https://cf-example.<workers-subdomain>.workers.dev/api/health
```

初回だけはD1とR2を自動作成するため、先に`wrangler deploy`を一度実行してからマイグレーションと通常デプロイを実行します。

## ロールバック

```bash
pnpm --dir application exec wrangler deployments list \
  --config ../infrastructure/cloudflare/wrangler.jsonc
pnpm --dir application exec wrangler rollback \
  --config ../infrastructure/cloudflare/wrangler.jsonc
curl --fail --show-error https://cf-example.<workers-subdomain>.workers.dev/api/health
```

D1マイグレーションはロールバックされません。スキーマ変更は旧版と新版の両方が動く追加的な変更として先に適用します。

## 削除

データを失う操作です。対象アカウントとリソース名を`wrangler whoami`、`d1 list`、`r2 bucket list`で確認し、必要なら先にD1をエクスポートします。

```bash
pnpm --dir application exec wrangler whoami
pnpm --dir application exec wrangler d1 list
pnpm --dir application exec wrangler r2 bucket list
pnpm --dir application exec wrangler d1 export cf-example \
  --remote \
  --output ./cf-example-backup.sql
pnpm --dir application exec wrangler delete --name cf-example \
  --config ../infrastructure/cloudflare/wrangler.jsonc
```

関連するD1とR2が残っている場合は、一覧で確認した正確な名前を指定して個別に削除します。
