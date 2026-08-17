# Cloudflare

`wrangler.jsonc`はWorker、Static Assets、Bindingsの正本です。アプリケーションコードから分離しつつ、Viteの`configPath`で明示的に参照します。

## 認証なしの検証

次のコマンドはWorkerとStatic Assetsを本番用にビルドし、Wranglerでデプロイ内容を検証します。Cloudflareへのアップロードは行いません。

```bash
mise run cloudflare-check
```

`wrangler deploy --temporary`は一時アカウントのClaim URLを出力するため、公開リポジトリのCIでは使用しません。
