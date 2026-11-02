# あたりを みつけよう！

幼児向けの4枚カードゲーム。4枚のうちあたりは1枚です。カードを選ぶと結果が表示され、「もういっかい！」で新しく抽選します。同じ位置が続けてあたりになることもあります。

Vanilla TypeScript / HTML / CSS の静的サイトです。バックエンド、外部通信、広告、音声、永続化はありません。

## 開発

Node.js **24.22.2** を使用します（`.node-version` / `.nvmrc` / CI で固定）。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

`npm run dev` が表示する HTTP URL を開いてください。初期実装では watch を行わないため、変更後は再起動します。`file://` からは起動しません。

ビルドは Node.js のファイル操作 API で `dist/` をクリアし、TypeScript を `dist/js/` に出力して `public/` をコピーします。シェル固有のコピーコマンドやバンドラーは使いません。単体テストは Node.js の標準テストランナーと TypeScript 型除去を使い、ソースの純粋ロジックを検証します。

### コンパイラ

2026-11-02 時点の[公式案内](https://www.typescriptlang.org/download/)と npm registry を確認し、安定版 `typescript@7.0.2` のネイティブコンパイラ `tsc` を採用しています。preview パッケージへの依存やフォールバックは不要でした。Wrangler を含む直接依存は完全なバージョンで固定し、`package-lock.json` をコミットしています。相対 import はブラウザの ES Modules に合わせた `.js` 拡張子です。

## 構成

- `src/game.ts`: 抽選、状態遷移、当たり判定。乱数を注入してテスト可能。
- `src/main.ts`: DOM、選択の確定、画面切り替え、フォーカスの移動。
- `public/`: 日本語画面とスマートフォン向け2列レイアウト。
- `scripts/build.mjs`: OS に依存しないビルド。
- `test/game.test.mjs`: 全位置、当たりが1枚、連打、再抽選、境界値。
- `.github/workflows/deploy.yml`: PR の検証と main のデプロイ。
- `wrangler.jsonc`: 実行用 Worker コードなしの Static Assets 設定。

## Cloudflare と GitHub の初期設定（所有者が実施）

1. Cloudflare のアカウント ID を確認します。必要なら `wrangler.jsonc` の Worker 名 `lucky-lottery` を変更します。
2. Cloudflare ダッシュボードで同名の Worker を初期作成します。ローカルで `npm run build` 後、`npx wrangler login` と `npm run deploy` で初回配信することもできます。この操作には所有者によるログインが必要です。
3. 対象アカウントに限定した API Token を作成します。CI には `Account / Workers Scripts / Edit` のデプロイ権限を付与します。DNS 編集権限は付与しません。
4. GitHub の Settings → Secrets and variables → Actions で、Secret `CLOUDFLARE_API_TOKEN` と Variable `CLOUDFLARE_ACCOUNT_ID` を設定します。トークンをファイルやコミットに保存しないでください。
5. Cloudflare 管理下の所有ドメインを用意し、Worker の Settings → Domains & Routes → Custom Domain に希望のサブドメインを追加します。実際のドメイン名は未設定です。Cloudflare の HTTPS 証明書が有効になったことを確認します。
6. main への push でチェック後にデプロイされます。GitHub Actions を配信元とし、Cloudflare 側の GitHub 自動ビルドは有効にしません。

PR（fork を含む）は `npm ci` → 型チェック → 単体テスト → ビルドのみで、デプロイの step は実行されず Cloudflare トークンも渡されません。Actions は commit SHA、Node.js と Wrangler はバージョンを固定しています。デプロイには lockfile のローカル Wrangler を使います。同じブランチの古い実行は concurrency でキャンセルします。

[Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/) を使い、動的 Worker、KV、D1、R2 は作りません。長期キャッシュの独自設定はありません。無料枠での運用を想定します。URL を知っていれば誰でもアクセスできます。

## 受け入れ確認

- `npm run typecheck`、`npm test`、`npm run build` が成功する。
- 320px 幅と手元の iOS Safari / Android Chrome でカード4枚が見切れず、横スクロールしない。
- カードを選ぶと「あたり！」または「ざんねん！」と図形が表示され、連打しても判定が変わらない。
- 「もういっかい！」で再び選択でき、再読み込みでも正常に開始する。
- Tab / Enter / Space で操作でき、結果の見出しと再開後のカードにフォーカスが移る。ズームを無効化しない。
- 開発者ツールで JavaScript エラーやアセットの404がない。
- Secrets / Variable / Custom Domain 設定後、PR チェックと main のデプロイが成功し、HTTPS URL が最新になる。

Cloudflare アカウント、Secrets / Variable、ドメイン設定、実機確認および実際の GitHub Actions 実行は別途必要です。

## 今回の検証結果

- Node.js 24.22.2 で `npm ci`、`npm run typecheck`、`npm test`（4件）、`npm run build` が成功。
- `wrangler deploy --dry-run` で静的アセット設定の検証に成功。実際のアップロードは未実施。
- Chromium の320×568タッチ画面でカード4枚、横スクロールなし、当たり・はずれ、連打防止、再プレイ、キーボード、フォーカス、再読み込みを確認。JavaScript エラーと404なし。
- iOS Safari / Android Chrome の実機、GitHub Actions と本番 HTTPS は未確認。WebKit のローカル実行はホストの共有ライブラリ不足により未実施。
