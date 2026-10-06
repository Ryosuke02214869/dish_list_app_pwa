# ごはんメモ

家族で「作れる料理」の名前・メモ・タグを共有する、ローカルファーストの PWA です。
iPhone のホーム画面に追加して使い、オフラインでも閲覧・登録・編集ができます。
自宅の Windows PC をサーバーにして、Tailscale 経由で接続できたときにデータを同期します。

- 仕様：[REQUIREMENTS.md](REQUIREMENTS.md)
- 見た目：[DESIGN.md](DESIGN.md)、[design-sample.html](design-sample.html)
- 開発のルール：[CLAUDE.md](CLAUDE.md)

```
iPhone（PWA・IndexedDB）──HTTPS（Tailscale）──▶ Windows PC
                                                 ├ Tailscale Serve  https://<PC名>.<tailnet名>.ts.net
                                                 │      └▶ http://127.0.0.1:8080
                                                 └ Docker Desktop
                                                    └ dish-list-app コンテナ（画面の配信 + /api + SQLite）
```

## 目次

1. [開発](#1-開発)
2. [自宅PCでの運用（Windows）](#2-自宅pcでの運用windows)
3. [Tailscale で iPhone から使う](#3-tailscale-で-iphone-から使う)
4. [アプリの更新](#4-アプリの更新)
5. [バックアップと復元](#5-バックアップと復元)
6. [困ったとき](#6-困ったとき)

---

## 1. 開発

必要なもの：Node.js 22 以上、npm 11 以上

```powershell
npm install
npm run dev        # http://localhost:5173 （server は http://127.0.0.1:8080、データは server/data/）
npm test           # すべてのテスト
npm run typecheck  # 型チェック
npm run lint       # ESLint
npm run format     # Prettier で整形
npm run build      # client と server のビルド
```

| フォルダー | 内容 |
|---|---|
| `shared/` | 料理と同期APIの定義（zod）、上限値、文字列の正規化。client と server の両方が使う |
| `client/` | PWA本体（React、Dexie、Tailwind CSS、vite-plugin-pwa） |
| `server/` | API（Hono）、SQLite（better-sqlite3）、画面の配信、バックアップ |

コードの置き場所の詳細は [CLAUDE.md](CLAUDE.md) の「コードの置き場所」を見てください。

> `.npmrc` で `ignore-scripts=true` にしています。better-sqlite3 は各OS用のビルド済みファイルを同梱していますが、
> `npm ci` がソースからのビルド（Python と C++ コンパイラが必要）を始めて失敗するのを防ぐためです。

---

## 2. 自宅PCでの運用（Windows）

### 2.1 Docker Desktop

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) をインストールする（WSL2 を使う設定のまま）
2. Docker Desktop の **Settings → General → Start Docker Desktop when you sign in to your computer** をオンにする
   （PCにサインインしたら Docker とアプリのコンテナが自動で起動します）

### 2.2 アプリを起動する

このリポジトリを PC に置き、そのフォルダーで実行します。

```powershell
git clone https://github.com/Ryosuke02214869/dish_list_app_pwa.git
cd dish_list_app_pwa
docker compose up -d --build
```

確認：ブラウザで http://127.0.0.1:8080 を開くと画面が出ます。http://127.0.0.1:8080/api/health は `{"ok":true,"version":"…"}` を返します。

| 項目 | 内容 |
|---|---|
| 公開範囲 | `127.0.0.1:8080` だけ（このPCからだけ）。家族の端末からは Tailscale Serve 経由で接続します |
| データ | Docker の named volume `dish-list-data`（コンテナの `/app/data/dish-list.db`） |
| バックアップ | このフォルダーの `backups/` に毎日1回 |
| 自動起動 | `restart: unless-stopped`（Docker Desktop の起動時にコンテナも起動。手動で止めた場合は止まったまま） |

よく使うコマンド：

```powershell
docker compose ps         # 状態（STATUS が healthy なら正常）
docker compose logs -f    # ログ
docker compose stop       # 停止
docker compose start      # 再開
```

### 2.3 電源の設定

PC がスリープしている間は同期できません（各端末ではそのまま使えます）。
いつでも同期したい場合は、Windows の **設定 → システム → 電源** でスリープを「なし」にしてください。

---

## 3. Tailscale で iPhone から使う

PWA のオフライン機能には HTTPS が必要です。Tailscale Serve を使うと、ドメインを取らずに正規の証明書付き HTTPS で接続できます。
インターネットには公開しません（Tailnet に参加した端末だけが接続できます）。

### 3.1 PC 側

1. [Tailscale](https://tailscale.com/download/windows) をインストールし、ログインする
2. [管理画面の DNS 設定](https://login.tailscale.com/admin/dns) で **MagicDNS** と **HTTPS Certificates** を有効にする
3. PowerShell で実行する（設定は再起動後も残ります）

   ```powershell
   tailscale serve --bg --https=443 http://127.0.0.1:8080
   tailscale serve status   # 公開中のURL（https://<PC名>.<tailnet名>.ts.net）を確認する
   ```

   初回のアクセス時に証明書が発行されるため、最初だけ数十秒かかることがあります。

> 外部公開の機能（Tailscale Funnel）は使いません。

### 3.2 家族の iPhone 側

1. App Store で **Tailscale** をインストールし、同じ Tailnet に参加する
   - 方法は次のどちらか（REQUIREMENTS.md 4章。どちらにするかは未決）
     - (a) 家族全員の端末を同じ Tailscale アカウントでログインさせる
     - (b) 管理画面から家族を Tailnet に招待する（無料プランで最大6ユーザー）
2. Tailscale アプリをオンにした状態で、Safari で `https://<PC名>.<tailnet名>.ts.net` を開く
3. 名前を入力して「はじめる」
4. **共有ボタン → ホーム画面に追加 → 追加**（Chrome でもアドレスバー右の共有ボタンから追加できます）
5. 以後は **ホーム画面のアイコンから開く**

iPhone での注意（REQUIREMENTS.md 11章）：

- Safari のタブ、Chrome のタブ、ホーム画面のアプリは、**それぞれ別にデータを保存**します。ふだんはホーム画面のアプリを使ってください
- ホーム画面に追加していないサイトのデータは、Safari がしばらく使わないと消すことがあります
- 同期するには iPhone の Tailscale がオンになっている必要があります。オフでも「接続できません」と出るだけで、アプリはそのまま使えます
- 同期は、アプリを開いたとき・画面に戻ったとき・保存の2秒後・同期ボタンを押したときに行います（バックグラウンドでは同期しません）

---

## 4. アプリの更新

PC で最新のコードを取り込み、コンテナを作り直します。データ（named volume）はそのまま残ります。

```powershell
git pull
docker compose up -d --build
```

各端末では、次にアプリを開いたとき（または画面に戻ったとき）に「新しいバージョンがあります」と出ます。
**「更新」を押すと切り替わります**（入力中のデータを守るため、勝手には再読み込みしません）。

---

## 5. バックアップと復元

### 5.1 バックアップ

- サーバーが動いている間、**1日1回** `backups/dish-list-YYYYMMDD-HHMMSS.db` を作ります（日本時間）
  - 起動時と1時間ごとに「今日のバックアップがまだないか」を確かめて作るので、夜に PC が止まっていても1日1回は作られます
- **14世代**を残し、古いものから自動で消します
- 1ファイルで完結した SQLite のデータベースです。別の場所（クラウドストレージや外付けディスク）にもコピーしておくと安心です

### 5.2 復元

1. 戻したいファイルを `backups/` の中から選ぶ（例：`dish-list-20261006-031500.db`）
2. アプリを止め、今のデータを念のため退避してから、選んだファイルで置き換える

   ```powershell
   docker compose stop app
   # 今のデータを backups/before-restore/ に退避する
   docker compose run --rm app sh -c "mkdir -p /app/backups/before-restore && cp /app/data/dish-list.db* /app/backups/before-restore/"
   # バックアップで置き換える（ファイル名は選んだものに変える）
   docker compose run --rm app sh -c "rm -f /app/data/dish-list.db-wal /app/data/dish-list.db-shm && cp /app/backups/dish-list-20261006-031500.db /app/data/dish-list.db"
   docker compose start app
   ```

3. http://127.0.0.1:8080/api/health が応答することを確認する

復元後、各端末は次の同期でサーバーの内容を最初から受け取り直します。

> **注意**：バックアップの時刻より後にサーバーへ届いていた変更は、サーバーからは消えます。
> その変更は各端末には残っていますが、同期済みの扱いのため、自動では送り直されません。
> 復元は「サーバーのデータが壊れた」ときなどに限り、必要ならその変更を端末で入力し直してください。

---

## 6. 困ったとき

| 症状 | 確認すること |
|---|---|
| 「接続できません」と出る | iPhone の Tailscale がオンか／PC が起動していてスリープしていないか／`docker compose ps` で healthy か／`tailscale serve status` に設定が残っているか |
| 「同期できませんでした」と出る | `docker compose logs app` でエラーを確認する |
| 新しいバージョンにならない | アプリを一度閉じて開き直し、「更新」ボタンが出たら押す |
| `docker compose up` でポートが使われていると出る | 8080 を使っている別のアプリを止めるか、`docker-compose.yml` の `127.0.0.1:8080:8080` の左側の番号を変え、`tailscale serve` の転送先も同じ番号にする |
| 別の端末にデータが出ない | 両方の端末で同期済みになっているか、設定画面の「未同期」の件数を確認する（Safari とホーム画面のアプリは別のデータです） |
