# あたりを みつけよう！

幼児向けの4枚カードゲーム。4枚のうちあたりは1枚です。カードを選ぶと結果が表示され、「もういっかい！」で新しく抽選します。同じ位置が続けてあたりになることもあります。

Vanilla TypeScript / HTML / CSS の静的サイトです。バックエンド、外部通信、広告、音声、永続化はありません。

## 開発

Node.js **24.22.2** を使用します（`.node-version` / `.nvmrc` / Workers Builds で固定）。

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
- `npm run check`: 型チェック → 単体テスト → ビルド。Workers Builds 共通の検証コマンド。
- `wrangler.jsonc`: 実行用 Worker コードなしの Static Assets 設定。

## Cloudflare Workers Builds の初期設定（所有者が実施）

GitHub Actions は使わず、Cloudflare が GitHub からコードを取得し、検証後にプレビューまたは本番を配信します。GitHub Secrets の `CLOUDFLARE_API_TOKEN` と Variable `CLOUDFLARE_ACCOUNT_ID` は不要です。Cloudflare 内部では自動生成されるビルド用 API Token を使うため、認証情報が存在しなくなる方式ではありません。トークンを自分でコピー・保管する必要はありません。

### 1. GitHub と接続する

初期状態の `main` には SPEC.md しかないため、まずこの実装 PR をマージしてから接続すると初回ビルドが成功します。接続前の PR にはプレビューは作成されません。初回接続後、次の作業ブランチへの push から自動プレビューを利用できます。

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **GitHub** を選びます。Pages ではなく Worker を作成します。
2. GitHub の認可画面で Cloudflare GitHub App を連携し、対象リポジトリを **rakiyoshi/lucky-lottery のみ**許可します。既に連携済みなら対象リポジトリへのアクセスを追加します。
3. リポジトリ `rakiyoshi/lucky-lottery` を選び、Worker 名を **lucky-lottery** にします。`wrangler.jsonc` の `name` と一致させます。
4. 以下の設定を入力し、**Save and Deploy** を選びます。初期画面にない項目は作成後の **Settings → Builds**（画面によって Build）で設定して再ビルドしてください。

| 項目 | 値 |
|---|---|
| Production branch | `main` |
| Root directory | リポジトリ直下（空欄または `/`） |
| Build command | `npm ci && npm run check` |
| Deploy command | `npm run deploy` |
| Preview command | `npm run preview` |
| Enable Preview Builds | 有効 |
| Build variable: `SKIP_DEPENDENCY_INSTALL` | `1` |
| Build variable: `NODE_VERSION` | `24.22.2` |
| API token | Cloudflare の自動生成（既定） |

Build variables は **Settings → Builds → Build Variables and Secrets** に設定します。本番とプレビューの両方で適用してください。`SKIP_DEPENDENCY_INSTALL=1` で自動インストールを止め、Build command 冒頭の `npm ci` に統一します。Node.js はバージョンファイルでも固定済みです。

既存 Worker がある場合は、新規作成せず対象 Worker の **Settings → Builds → Connect** から同じリポジトリを接続します。旧方式のプレビューを使用している場合のみ **Set up Worker Previews** を実施します。この切り替えは元に戻せないため、新規作成時には不要です。

### 2. プレビューと本番を確認する

- 作業ブランチへの push: `npm ci` → 型チェック → 単体テスト → ビルド → `wrangler preview`。
- 本番 `main` への push: 同じ検証 → `wrangler deploy`。
- チェック失敗時は後続のデプロイを行いません。
- Cloudflare の **Deployments / Build history** でインストール・検証ログを確認します。
- GitHub の PR に Cloudflare のチェックとプレビュー URL が表示されます。同じブランチへの push でプレビューが更新されます。本番 URL は `main` の配信を維持します。
- `wrangler.jsonc` の `previews: {}` は、静的アセットのみを使うプレビューの明示設定です。プレビュー用の DB や Secrets は不要です。
- PR マージ前に検証成功を必須にしたい場合、最初のチェック実行後、GitHub の Settings → Rules → Rulesets で main に Cloudflare が報告した実際のチェック名を必須チェックとして設定します。

fork からの PR については同一リポジトリのブランチ push と同じ自動実行を前提にしません。個人開発ではこのリポジトリ内に作業ブランチを作成します。

### 3. 独自ドメインを設定する

1. 所有ドメインが同じ Cloudflare アカウントで有効になっていることを確認します。
2. 対象 Worker → **Settings → Domains & Routes → Add → Custom Domain** を選びます。
3. 希望のサブドメイン（例: `game.example.com`）を入力し、表示される DNS 設定を確認して追加します。実際のドメイン名は未設定です。
4. 証明書が有効になったら HTTPS URL を開き、ゲームが動くことを確認します。

初期確認は Cloudflare が発行する `workers.dev` URL でも行えます。独自ドメインは本番 Worker に設定します。

### 運用と料金

[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) の GitHub 連携のみを配信元にします。別の GitHub Actions デプロイや Deploy Hook は追加しません。古い GitHub Secrets / Variable を登録済みなら、他用途に使っていないことを確認して削除できます。

[無料プランのビルド枠](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)は月3,000分・同時実行1件（2026-11-02確認）です。今回の規模では無料枠内の運用を想定します。[Static Assets](https://developers.cloudflare.com/workers/static-assets/) で `dist/` を配信し、動的 Worker、KV、D1、R2 は作りません。独自の長期キャッシュは設定しません。URL を知っていれば誰でもアクセスできます。

設定根拠: [ビルド設定・自動生成トークン](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Node.js 固定・自動インストール無効化](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)、[プレビュー設定](https://developers.cloudflare.com/workers/previews/configuration/)。

## 受け入れ確認

- `npm run typecheck`、`npm test`、`npm run build` が成功する。
- 320px 幅と手元の iOS Safari / Android Chrome でカード4枚が見切れず、横スクロールしない。
- カードを選ぶと「あたり！」または「ざんねん！」と図形が表示され、連打しても判定が変わらない。
- 「もういっかい！」で再び選択でき、再読み込みでも正常に開始する。
- Tab / Enter / Space で操作でき、結果の見出しと再開後のカードにフォーカスが移る。ズームを無効化しない。
- 開発者ツールで JavaScript エラーやアセットの404がない。
- GitHub 連携 / Workers Builds / Custom Domain 設定後、PR チェックと main のデプロイが成功し、HTTPS URL が最新になる。

Cloudflare の GitHub 連携、Builds とドメイン設定、実機確認および実際のクラウドビルド実行は別途必要です。

## 今回の検証結果

- Node.js 24.22.2 で `npm ci`、`npm run typecheck`、`npm test`（4件）、`npm run build` が成功。
- `wrangler deploy --dry-run` で静的アセット設定の検証に成功。実際のアップロードは未実施。
- Chromium の320×568タッチ画面でカード4枚、横スクロールなし、当たり・はずれ、連打防止、再プレイ、キーボード、フォーカス、再読み込みを確認。JavaScript エラーと404なし。
- iOS Safari / Android Chrome の実機、Workers Builds と本番 HTTPS は未確認。WebKit のローカル実行はホストの共有ライブラリ不足により未実施。
