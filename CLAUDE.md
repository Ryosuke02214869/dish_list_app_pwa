# CLAUDE.md

家族で料理名、メモ、タグを共有するローカルファーストのPWA。仕様の正は `REQUIREMENTS.md`。実装前に必ず読み、仕様と食い違う判断が必要な場合は実装前にユーザーに確認する。見た目は `DESIGN.md` と `design-sample.html` に従う（色・余白は直接書かず、DESIGN.md のトークンを使う）。

## 技術スタック

- 言語：TypeScript（strict）。npm workspacesのモノレポ
- `client/`：Vite、React、vite-plugin-pwa、Dexie（IndexedDB）、dexie-react-hooks、Tailwind CSS
- `server/`：Node.js 22、Hono（@hono/node-server）、better-sqlite3、zod
- `shared/`：zodスキーマ（Dish、同期のリクエストとレスポンス）、正規化関数。クライアントとサーバーの両方から使う
- テスト：Vitest（同期ロジックと正規化は必須）。E2Eは必要になったらPlaywright
- 配布：Dockerのマルチステージビルド。1つのコンテナで、`client/dist` の静的配信と `/api` を担当する

## ディレクトリ構成（目標）

```
/
├ client/        PWA本体
├ server/        API、静的配信、SQLite、バックアップ
├ shared/        スキーマ、型、正規化
├ Dockerfile
├ docker-compose.yml
├ REQUIREMENTS.md
└ README.md      セットアップ、Tailscale、バックアップと復元の手順
```

## コマンド（作成後に実際の内容へ更新すること）

- `npm install`
- `npm run dev`：clientとserverを同時に起動する（http://localhost:5173 。`/api` はViteのプロキシで http://127.0.0.1:8080 へ転送。データは `server/data/`）
- `npm test`：全ワークスペースのVitestを実行する
- `npm run typecheck`：全ワークスペースの型チェック
- `npm run lint` / `npm run format`（確認だけなら `npm run format:check`）
- `npm run build`：全ワークスペースのビルド
- 未作成：`docker compose up -d --build`

## コードの置き場所

- `shared/src/`：`dish.ts`（料理の定義）、`sync.ts`（同期APIの定義）、`api.ts`（パスとhealth）、`limits.ts`（上限値）、`normalize.ts`（正規化）、`tag.ts`（タグの整形と比較）。外からは `@dish-list/shared`（`index.ts`）経由でだけ使う
- `client/src/db/`：IndexedDBの定義とリポジトリ。テーブルを直接触るのはここだけ。料理の変更は `dishRecord.ts` の純粋関数を通して `dirty` と更新者を付ける
- `client/src/features/<機能>/`：画面と、その画面だけで使う部品・フック・ロジック（`dishes`、`onboarding`、`session`）。画面に依存しないロジックは `*Query.ts` などの純粋関数に分けてテストする
- `client/src/components/`：機能に依存しない共通部品（Button、BottomSheet、ConfirmDialog、Toast など）
- `server/src/`：`index.ts`（起動と組み立て）、`app.ts` と `routes/`（HTTPとzodの検証）、`sync/`（競合の判定 `resolveChange.ts` と同期処理 `syncService.ts`）、`db/`（SQLite、マイグレーション、行とDishの変換）。SQLは `db/` にだけ書く
- 料理に項目を追加するときのserver側は、`db/migrations.ts` の末尾にALTER TABLEを足し、`db/dishStore.ts` の変換に項目を加える
- `client/src/styles/index.css`：デザイントークン（`@theme`）。色や角丸はここのトークンのクラスだけを使う
- 料理に項目を追加するときは、`shared/src/dish.ts` の `dishContentSchema` から始める
- 上限値は `shared/src/limits.ts` にだけ書く。画面や検証に数値を直接書かない
- テストは対象ファイルと同じ場所に `*.test.ts` として置く

## 守るべきルール

### 同期（最重要）
- UIはローカルDB（Dexie）だけを読み書きする。UIからAPIを直接呼ばない
- 差分の取得は、サーバーが採番する `serverSeq` を基準にする。端末の時刻を取得の基準にしない
- 競合はレコード単位の後勝ちとする（REQUIREMENTS.md 6.3）。再送しても結果が変わらないように実装する
- 物理削除はせず、`deleted = true` の墓標を同期する
- Pullの結果で、ローカルの `dirty` なレコードを上書きしない
- 同期処理は同時に実行しない
- Background Sync APIに頼らない（iOSは非対応）。同期のタイミングはREQUIREMENTS.md 6.2に従う

### データとストレージ
- データはIndexedDBに保存する。localStorageはUIの好み（並び順など）にだけ使う
- 正規化（NFKC、小文字化、カタカナからひらがなへの変換）は `shared/` の1つの関数にまとめ、検索、タグ、重複判定のすべてで使う
- サーバーのSQLiteはnamed volumeの `/app/data` に置く。WALモードを使う

### PWA
- Service Workerは、アプリ本体だけをプリキャッシュする。`/api/*` はキャッシュしない
- 新しいバージョンを検知したら、更新ボタンを表示する（勝手に再読み込みしない。入力中のデータを守るため）
- iPhoneのSafari向けに、`apple-touch-icon`、`viewport-fit=cover`、セーフエリアのCSSを設定する

### サーバーとDocker
- コンテナのポートは `127.0.0.1:8080` だけに公開する
- APIの入力はすべてzodで検証する
- Pushの処理は1つのトランザクションで行う

### 全般
- UIの文言は日本語
- 写真の機能や認証の機能は追加しない（スコープ外）
- 変更したら関連するテストを追加し、`npm test` が通ることを確認してから完了とする

## 実装の順序

1. モノレポの雛形、shared のスキーマと正規化（テスト付き）
2. client：Dexieを使ったオフラインCRUD、一覧、検索、タグ絞り込み（サーバーなしで動く状態）
3. server：SQLite、`/api/health`、`/api/sync`（同期ロジックのテストを厚く書く）
4. client：同期エンジン、同期状態の表示、手動同期
5. PWA化：manifest、Service Worker、更新通知、初回起動の案内
6. Docker化、バックアップ、READMEにセットアップ手順（Windows、Tailscale Serve）を書く
7. iPhone実機で確認する（REQUIREMENTS.md 11章の各項目）
