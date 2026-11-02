# SPEC.md — 4枚カードのあたり・はずれゲーム

## 1. 概要

幼児がスマートフォンのブラウザで遊ぶ、4枚のカードから1枚を選んで「あたり」または「はずれ」を表示するシンプルなゲームを実装する。

- 利用者: 主に開発者の子供1人
- 配信方式: 静的 HTML / CSS / JavaScript
- バックエンド、DB、ユーザー登録、課金、アクセス解析は不要
- GitHub でソースコードを管理し、Cloudflare Pages の GitHub 連携から静的サイトをデプロイ
- 既に所有している独自ドメインのサブドメインを利用可能
- 目標ランニングコスト: 月額0円（既存ドメインの維持費は除く）

## 2. 決定した技術方針

| 項目 | 方針 |
|---|---|
| 言語 | TypeScript（TypeScript 7 系のネイティブコンパイラ `tsc` を優先。利用時に安定版とパッケージ名を確認） |
| UI | Vanilla TypeScript + HTML + CSS（React 等のフレームワークなし） |
| ビルド | TypeScript コンパイル + HTML/CSS/画像/音声のコピー。Vite は初期導入しない |
| モジュール | ブラウザネイティブの ES Modules |
| ホスティング | Cloudflare Pages（静的ファイルのみ） |
| SCM | GitHub |
| CI/CD | Cloudflare Pages（GitHub 連携） |
| 認証・永続化 | なし |
| DNS/HTTPS | Route 53 + Cloudflare Pages + 所有ドメイン |

### 技術上の留意点

- TypeScript の `tsc` はバンドラーではない。相対 import にはブラウザから読み込める `.js` 拡張子を指定する（例: `import { draw } from './game.js'`）。
- 外部パッケージに依存する場合は、ブラウザから読み込める形式かを確認する。複雑になった場合のみ Vite 等の導入を再検討する。
- TypeScript 7 のパッケージ名、CLI、サポート状況は導入時点の公式情報に合わせる。プレビュー版しか利用できない場合は、安定性を優先して安定版 TypeScript へのフォールバックを認める。
- `npm ci` とコミット済み lockfile を利用し、依存バージョン・Node.js バージョンを固定する。

## 3. ゲーム仕様（MVP）

### 3.1 初期画面

- 画面中央に裏向きのカードを4枚表示する。
- カードはスマートフォンの縦画面で押しやすいよう、原則2列×2行で並べる。
- 見出しと短い案内文（例: 「あたりを みつけよう！」「カードを 1まい えらんでね」）を表示する。
- ラウンド開始時に4枚のうち1枚だけを「あたり」としてランダムに決める。選ぶ前に当たりは見えない。

### 3.2 カード選択

- 任意のカードを1回タップすると選択が確定する。
- 選択後は二重タップ・連打で複数回判定されないようにする。
- 選んだカードと内部で決めた当たりカードを比較する。
- 結果画面へ表示を切り替える。ブラウザの別 URL への遷移は不要。

### 3.3 結果画面

- 当たりなら「**あたり！**」、はずれなら「**ざんねん！**」を大きく表示する。
- 色だけに依存せず、テキスト・アイコンでも判別できるようにする。
- 「もういっかい！」ボタンを表示する。
- ボタンを押すと次のラウンドを開始し、当たり位置を再抽選してカード画面へ戻る。
- 結果に応じた簡単なイラストや視覚効果は任意。音声や凝ったアニメーションはMVP必須ではない。

### 3.4 状態管理

- 少なくとも `selecting` / `result` の2状態を持つ。
- ゲーム状態（当たりカードの index、選択カードの index、画面状態）はブラウザ内のメモリで管理する。
- 再読み込み時のスコア保存、アカウント、サーバー通信は不要。
- 仕様上、当たりは必ず1枚、はずれは3枚。

## 4. UI/UX とアクセシビリティ

- iOS Safari / Android Chrome のスマートフォン縦画面を優先する。
- 横幅320px程度から画面を横スクロールせずに操作できるようにする。
- ボタン・カードのタッチ領域を十分大きくする。カードは意味のあるラベルを持つ `button` 要素などで実装する。
- `meta viewport` を設定する。意図しないテキスト選択やタップ遅延を減らすが、必要なアクセシビリティ機能を一律に無効化しない。
- 当たり・はずれは文字と図形で判別可能にする。
- 効果音を追加する場合、ユーザー操作後に再生する。ブラウザの音声自動再生制限に依存しない。
- 広告、外部への誘導、個人情報入力欄は設けない。

## 5. 推奨ディレクトリ構成

```text
card-game/
├── src/
│   ├── main.ts       # DOM とイベント処理、画面表示
│   └── game.ts       # 抽選と当たり・はずれ判定の純粋ロジック
├── public/
│   ├── index.html
│   ├── style.css
│   └── images/       # 必要になった時点で追加
├── test/
│   └── game.test.*   # 使用するテスト実行方式に合わせる
├── package.json
├── package-lock.json
├── tsconfig.json
├── wrangler.jsonc
├── README.md
└── SPEC.md
```

- 出力先は `dist/`。HTML/CSS と静的アセットは `dist/` 直下、JS は `dist/js/` に配置する。
- `dist/` は生成物として `.gitignore` に追加する。
- `index.html` は `<script type="module" src="/js/main.js"></script>` で読み込む。
- ソースツリー、テスト設定、ビルドのコピーコマンドは OS 非依存性を重視して Codex が整合する形に仕上げる。CI は Pages の Linux 環境を利用する。

## 6. ビルドとローカル開発

- `npm run typecheck`: 型チェックのみ（`tsc --noEmit`）。
- `npm run build`: `dist/` をクリアし、TypeScript をコンパイルし、`public/` のファイルをコピーする。
- `npm test`: 当たり判定などの単体テストを実行する。
- `npm run dev`: 必要なら watch コンパイルとローカル HTTP サーバーを起動する。初期実装では簡潔さを優先する。
- ローカル確認は `wrangler dev` などで配信可能。`file://` からの直接起動は前提としない。

`wrangler.jsonc` の例:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "card-game",
  "compatibility_date": "2026-11-01",
  "pages_build_output_dir": "./dist"
}
```

このファイルには秘密情報を含めない。環境に応じて `name` を変更する。

## 7. CI/CD

- GitHub Actions / Workers Builds は使用せず、Cloudflare Pages の GitHub 連携を使用する。
- `main` への push は本番配信。それ以外の作業ブランチは Preview deployments を有効にして PR で確認する。
- Build command: `npm ci && npm run check`。型チェック → テスト → ビルドに成功した場合のみ `dist/` を配信する。
- Framework preset: None、Root directory: リポジトリ直下、Build output directory: `dist`。
- 本番・プレビュー両方の環境変数に `SKIP_DEPENDENCY_INSTALL=1` と `NODE_VERSION=24.22.2` を設定する。
- GitHub に Cloudflare API Token / Account ID を保存しない。
- `wrangler.jsonc` は `pages_build_output_dir: "./dist"` を設定し、ローカル開発は `wrangler pages dev dist` を使う。
- Pages に Workers の Deploy command / Preview command は設定しない。
- 旧 Worker の Git 連携は所有者が解除し、配信元を Pages に統一する。
- 必要なら GitHub の main 保護ルールで Cloudflare のチェックを必須にする。

## 8. Cloudflare Pages / ドメイン

- 本番 URL: `https://lucky-lottery.aky-lab.net/`。
- `aky-lab.net` の DNS は Route 53 で管理する。Cloudflare へのネームサーバー変更は不要。
- Pages の Custom domains にサブドメインを登録した後、Route 53 に Pages の実際の `.pages.dev` ホスト名を宛先とする CNAME を登録する。
- TLS/HTTPS は Cloudflare が終端する。
- 動的 Worker、Pages Functions、KV、D1、R2 は不要。
- 独自の長期キャッシュ制御は追加しない。
- URL を知っていれば誰でもアクセス可能である点を許容する。
- Cloudflare の無料枠を利用する。Pages Free のビルドは月500回（2026-11-02確認）。既存ドメイン・Route 53 の費用は別扱い。

## 9. テスト / 受け入れ条件

### 単体テスト

- ラウンドごとに当たりが1枚だけ存在する。
- 選んだカードが当たりなら正解、それ以外は不正解になる。
- どの位置（0〜3）も当たり候補になり得る。
- 再プレイ時には新たに抽選される（前回と同じ位置になることも許容）。

### E2E / 手動確認

- スマホで4枚のカードが見切れず、すべてタップできる。
- タップすると正しい結果が表示され、二重操作で壊れない。
- 「もういっかい！」で初期画面に戻り、再び遊べる。
- ブラウザ再読み込みで正常に開始できる。
- Cloudflare の PR チェックが通り、プレビュー URL で確認できる。
- main への push 後、Cloudflare の HTTPS URL から最新のゲームを利用できる。
- 開発者ツール上で重大な JavaScript エラーや静的アセットの 404 がない。

## 10. MVP 対象外 / 今後の拡張

以下はMVPでは実装しない（後から検討する）。

- カードをめくるアニメーション、紙吹雪、効果音
- PWA（`manifest.webmanifest`、ホーム画面アイコン、Service Worker / オフライン対応）
- スコア記録、連続正解記録、`localStorage` 永続化
- 複数のミニゲーム、難易度選択
- 分析、ユーザー管理、サーバー側の状態保存
- Vite、React、Next.js の導入
- Terraform による Cloudflare の IaC 管理

PWA を導入する場合は特に Service Worker のキャッシュ更新による古いバージョンの残存に注意する。

## 11. Codex への実装指示

この仕様書に従い、動作する最小構成のアプリケーションを実装すること。

1. 仕様のうち明示されていないデザインは、幼児向けの見やすく明るい UI を合理的なデフォルトとして決める。
2. 実装時点の TypeScript 7 の入手可能性を確認し、安定したパッケージを選ぶ（安定版が未提供ならその理由を README に記載する）。
3. フレームワークやバンドラーを無理に追加しない。
4. 抽選ロジックは DOM 操作から分離し、テスト可能にする。
5. Cloudflare Pages 向けの検証コマンドと配信設定を実装する。GitHub 連携・Pages・Route 53 のドメインなど、所有者側の設定手順を README に記載する。
6. 型チェック、テスト、ビルドを実行し、成功を確認する。
7. 作業の最後に変更ファイル、確認したコマンド、未設定の外部リソースを簡潔に報告する。

