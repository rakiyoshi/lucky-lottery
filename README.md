# あたりを みつけよう！

幼児向けの4枚カードゲーム。4枚のうちあたりは1枚です。カードを選ぶと結果が表示され、「もういっかい！」で新しく抽選します。同じ位置が続けてあたりになることもあります。

Vanilla TypeScript / HTML / CSS の静的サイトです。バックエンド、外部通信、広告、音声、永続化はありません。

## 開発

Node.js **24.22.2** を使用します（`.node-version` / `.nvmrc` / Pages で固定）。

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
- `npm run check`: 型チェック → 単体テスト → ビルド。Pages 共通の検証コマンド。
- `wrangler.jsonc`: Pages の出力先とローカル開発設定。

## 配信構成: Cloudflare Pages + Route 53

本番: **https://lucky-lottery.aky-lab.net/**

GitHub の `main` への push で Pages が検証・ビルドし、本番へ自動配信します。作業ブランチは Pages のプレビュー配信を使い、PR で確認します。GitHub Actions、Workers Builds、Pages Functions は使用しません。GitHub に Cloudflare の API Token / Account ID を保存する必要はありません。

### Pages の設定

新規作成する場合は Workers & Pages → Create application → Pages（画面によっては Looking to deploy Pages? → Get started）→ Connect to Git で `rakiyoshi/lucky-lottery` を接続します。既存プロジェクトは Settings の Builds & deployments で設定を確認します。

| 項目 | 値 |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | リポジトリ直下（空欄） |
| Build command | `npm ci && npm run check` |
| Build output directory | `dist` |
| 環境変数 `NODE_VERSION` | `24.22.2` |
| 環境変数 `SKIP_DEPENDENCY_INSTALL` | `1` |
| Preview deployments | 作業ブランチで有効 |

環境変数は Production / Preview の両方に設定します。`SKIP_DEPENDENCY_INSTALL=1` は自動インストールを停止し、Build command 冒頭の `npm ci` で lockfile に合わせます。`check` は型チェック → テスト → ビルドを順に実行し、失敗すると配信されません。Pages に Workers 用の Deploy command / Preview command は設定しません。

`wrangler.jsonc` は Pages 用の `pages_build_output_dir` を指定しています。ローカルでは `npm run dev` がビルド後に `wrangler pages dev dist` を起動します。ソース変更後は再起動してください。クラウドの設定・ドメイン・環境変数は管理画面で管理します。

### Route 53 のサブドメインと HTTPS

`aky-lab.net` の DNS は Route 53 で管理します。Cloudflare へのネームサーバー移行やドメイン購入は不要です。

1. Pages プロジェクト → Custom domains → Set up a domain で `lucky-lottery.aky-lab.net` を登録します（現在は設定済み）。
2. Route 53 の `aky-lab.net` パブリックホストゾーンに CNAME を作成します。

| 項目 | 値 |
|---|---|
| レコード名 | `lucky-lottery.aky-lab.net` |
| 種類 | `CNAME` |
| 宛先 | Pages 管理画面に表示された実際の `<プロジェクト名>.pages.dev` |
| TTL | 例: `300` |

3. Pages でドメインと証明書が有効になったら本番 HTTPS URL を確認します。

Pages 側でのドメイン登録を先に実施してください。CNAME だけでは正しく配信されません。上記の宛先はプレースホルダーであり、Pages の実際のホスト名を使います。既に配信できている DNS を変更する必要はありません。

### 日常の更新

- 作業ブランチへの push → 検証・ビルド → Pages のプレビュー URL。
- PR の Cloudflare チェックとプレビューで動作確認 → main にマージ → 本番を更新。
- 検証ログは Pages の Deployments で確認します。必要なら GitHub の main 保護ルールで Cloudflare の実際のチェック名を必須にします。
- 古い Worker の自動ビルド連携が残っている場合は、その Worker の Settings → Builds で接続を解除して二重配信を避けます。旧 Worker の削除は任意で、Pages に影響しないことを確認して所有者が行います。
- URL を知っていれば誰でもアクセス可能です。音声、広告、外部通信、永続化、独自の長期キャッシュ設定はありません。

### 料金

2026-11-02 の公式情報では、Pages / Workers Static Assets ともに静的アセットへのリクエストは無料・無制限です。今回のアプリは静的ファイルのみなので Cloudflare の無料枠で運用できます。Pages Free のビルドは月500回・同時1件、Workers Builds Free は月3,000分・同時1件と、ビルド枠の数え方が異なります。Functions や動的 Worker を追加した場合は別途 Workers の実行料金・制限が適用されます。既存ドメインの維持費・Route 53 の料金はこの比較に含みません。

公式資料: [Pages の Git 連携](https://developers.cloudflare.com/pages/get-started/git-integration/)、[ビルド環境](https://developers.cloudflare.com/pages/configuration/build-image/)、[外部 DNS のサブドメイン](https://developers.cloudflare.com/pages/configuration/custom-domains/)、[Pages の料金](https://developers.cloudflare.com/pages/functions/pricing/)、[Pages の無料枠](https://developers.cloudflare.com/pages/platform/limits/)、[Workers Static Assets の料金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)、[Workers Builds の無料枠](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)。

## 受け入れ確認

- `npm run typecheck`、`npm test`、`npm run build` が成功する。
- 320px 幅と手元の iOS Safari / Android Chrome でカード4枚が見切れず、横スクロールしない。
- カードを選ぶと「あたり！」または「ざんねん！」と図形が表示され、連打しても判定が変わらない。
- 「もういっかい！」で再び選択でき、再読み込みでも正常に開始する。
- Tab / Enter / Space で操作でき、結果の見出しと再開後のカードにフォーカスが移る。ズームを無効化しない。
- 開発者ツールで JavaScript エラーやアセットの404がない。
- GitHub 連携 / Pages / Custom Domain 設定後、PR チェックと main のデプロイが成功し、HTTPS URL が最新になる。

Pages と Route 53 のドメイン設定は所有者が実施済みです。管理画面のビルド設定とスマホ実機は別途確認してください。

## 今回の検証結果

- Node.js 24.22.2 で `npm ci`、`npm run typecheck`、`npm test`（4件）、`npm run build` が成功。
- Pages 移行後も `npm ci` と `npm run check` が成功。
- 本番 `https://lucky-lottery.aky-lab.net/` を Chromium の320×568タッチ画面で検証。カード4枚、横スクロールなし、当たり・はずれ、連打防止、再プレイ、キーボード、フォーカス、再読み込みを確認。JavaScript エラーと404なし。当たり・はずれの確認ではブラウザ内の乱数を固定し、サーバーや配信ファイルは変更していません。
- iOS Safari / Android Chrome の実機、Pages の管理画面設定は未確認。WebKit のローカル実行はホストの共有ライブラリ不足により未実施。
