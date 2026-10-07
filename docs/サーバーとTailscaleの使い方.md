# サーバーと Tailscale の使い方

ごはんメモを自宅の Windows PC で動かすときの、日々の操作をまとめた手順書です。
コマンドはすべて **PowerShell** で、**このリポジトリのフォルダー**（例：`C:\dev\dish_list_app`）で実行します。

```powershell
cd C:\dev\dish_list_app
```

初めて準備するときの手順（Docker Desktop や Tailscale のインストール）は [README.md](../README.md) の2章・3章を見てください。

---

## 目次

1. [全体の仕組み](#1-全体の仕組み)
2. [サーバーの起動と停止](#2-サーバーの起動と停止)
3. [Tailscale の使い方](#3-tailscale-の使い方)
4. [困ったとき](#4-困ったとき)
5. [コマンドの早見表](#5-コマンドの早見表)

---

## 1. 全体の仕組み

```
家族の iPhone ──（Tailscale の暗号化された通信）──▶ 自宅の Windows PC
                                                     ├ Tailscale Serve
                                                     │   https://<PC名>.<tailnet名>.ts.net
                                                     │        │ 転送
                                                     │        ▼
                                                     └ Docker のコンテナ「dish-list-app」
                                                         http://127.0.0.1:8080（このPCからだけ）
```

| 部品 | 役割 |
|---|---|
| Docker のコンテナ `dish-list-app` | アプリの画面と、データを保存するサーバー。PC の中だけで動く |
| Tailscale | 家族の端末と PC を、インターネットに公開せずにつなぐ |
| Tailscale Serve | PC の中のサーバーを、HTTPS のアドレスで家族の端末に見せる |

- **サーバーが止まっていても、各端末のアプリはそのまま使えます。** 同期だけができなくなり、サーバーが動き出すと自動で同期されます。
- データは Docker のボリューム `dish-list-data` に保存され、コンテナを止めたり作り直したりしても消えません。

### ポートの使い分け

| ポート | 用途 |
|---|---|
| 8080 | **本番**（家族が使うコンテナ）。Tailscale Serve の転送先 |
| 8787 / 5173 | 開発用（`npm run dev`）。本番とは別のデータを使う |

---

## 2. サーバーの起動と停止

### 2.1 状態を確かめる

```powershell
docker compose ps
```

| 表示（STATUS） | 意味 |
|---|---|
| `Up 3 hours (healthy)` | 正常に動いている |
| `Up 10 seconds (health: starting)` | 起動中。数十秒待つ |
| `Up ... (unhealthy)` | 動いているが応答がない。[4章](#4-困ったとき) を見る |
| 何も表示されない | 止まっている（コンテナがない） |

ブラウザで http://127.0.0.1:8080/api/health を開き、`{"ok":true,"version":"0.3.0"}` のように表示されれば正常です。

### 2.2 起動する

```powershell
docker compose up -d
```

- `-d` を付けると、バックグラウンドで動き続けます（PowerShell を閉じても止まりません）。
- 停止していたコンテナを再開するだけなら `docker compose start` でもかまいません。

### 2.3 停止する

```powershell
docker compose stop
```

- コンテナを止めるだけで、データはそのまま残ります。
- 手動で止めた場合は、**PC を再起動しても自動では起動しません**。再開するときは `docker compose start` を実行してください。

### 2.4 再起動する

```powershell
docker compose restart
```

### 2.5 アプリを新しいバージョンにする

コードを更新したあと（`git pull` のあとなど）に実行します。

```powershell
docker compose up -d --build
```

- イメージを作り直してコンテナを入れ替えます。データは残ります。
- 各端末では、アプリを開き直すと「新しいバージョンがあります」と出るので、「更新」を押してもらいます。

### 2.6 ログを見る

```powershell
docker compose logs -f app
```

- `-f` で新しいログを流し続けます。終了するには `Ctrl + C`（コンテナは止まりません）。
- 直近だけ見るなら `docker compose logs --tail 50 app`。

### 2.7 PC の起動時に自動で動かす

次の2つがそろっていれば、PC にサインインすると自動でサーバーが動きます。

1. Docker Desktop の **Settings → General → Start Docker Desktop when you sign in to your computer** がオン
2. コンテナを `docker compose stop` で止めたままにしていない（`restart: unless-stopped` の設定のため）

### 2.8 してはいけないこと

| コマンド | 理由 |
|---|---|
| `docker compose down -v` | **`-v` を付けるとデータ（ボリューム）が消えます。** 付けずに `docker compose down` ならデータは残ります |
| `docker volume rm dish-list-data` | データが消えます。初期化したいときだけ使います |
| Docker Desktop のアンインストール、「Clean / Purge data」 | データが消えることがあります。先に `backups` フォルダーのバックアップを別の場所にコピーしてください |

---

## 3. Tailscale の使い方

### 3.1 PC 側：公開の設定（最初に1回だけ）

```powershell
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

- この設定は PC を再起動しても残ります。毎回実行する必要はありません。
- 前提：Tailscale の[管理画面の DNS 設定](https://login.tailscale.com/admin/dns)で **MagicDNS** と **HTTPS Certificates** が有効になっていること。

### 3.2 PC 側：公開の状態を確かめる

```powershell
tailscale serve status
```

次のように表示されれば公開中です。表示された `https://...ts.net` が、家族の端末で開くアドレスです。

```
https://<PC名>.<tailnet名>.ts.net (tailnet only)
|-- / proxy http://127.0.0.1:8080
```

`(tailnet only)` は「Tailnet に参加した端末からだけ見える」という意味です。インターネットには公開されていません。

### 3.3 PC 側：公開をやめる・やり直す

```powershell
tailscale serve --https=443 off   # 公開をやめる
tailscale serve reset             # Serve の設定をすべて消す（やり直すとき）
```

やめたあとで再び公開するときは、[3.1](#31-pc-側公開の設定最初に1回だけ) のコマンドを実行します。

### 3.4 PC 側：つながっている端末を確かめる

```powershell
tailscale status
```

Tailnet に参加している端末の一覧と、それぞれがオンラインかどうかが表示されます。
管理画面の [Machines](https://login.tailscale.com/admin/machines) でも確認できます。

### 3.5 iPhone 側：ふだんの使い方

1. **Tailscale アプリを開き、スイッチをオン**にする（VPN の表示が出ます）
2. ホーム画面の「ごはんメモ」を開く
3. 右上が「同期済み」になれば同期できています

- 外出先でも、Tailscale がオンで、自宅の PC が動いていれば同期できます。
- Tailscale がオフでもアプリは使えます。右上に「接続できません」と出るだけで、オンに戻せば自動で同期されます。
- 電池が気になる場合は、ふだんはオフにしておき、同期したいときだけオンにしても問題ありません。

### 3.6 家族の端末を追加する

家族の端末を Tailnet に参加させる方法は、次のどちらかです（REQUIREMENTS.md 4章。**どちらにするかは保留中**）。

| 方法 | 手順 | 特徴 |
|---|---|---|
| (a) 同じアカウントでログイン | 家族の iPhone の Tailscale アプリで、PC と同じアカウントでログインする | 最も簡単。全端末が1つのアカウントにまとまる |
| (b) 家族を招待する | 管理画面の [Users](https://login.tailscale.com/admin/users) から招待し、家族は自分のアカウントで参加する | 無料プランで最大6ユーザー。誰の端末かが分かれる |

参加後、家族の iPhone で `https://<PC名>.<tailnet名>.ts.net` を開き、ホーム画面に追加してもらいます（README.md 3.2）。

### 3.7 注意

- **Tailscale Funnel（インターネットへの公開）は使いません。** `tailscale funnel` は実行しないでください。
- PC の名前を変えると、アドレス（`https://<PC名>...`）も変わります。各端末でホーム画面に追加し直す必要があるので、変えないでください。

---

## 4. 困ったとき

上から順に確かめてください。

| 症状 | 確かめること・対処 |
|---|---|
| iPhone で「接続できません」 | ① iPhone の Tailscale がオンか ② PC が起動していてスリープしていないか ③ PC の Tailscale がログイン済み（タスクトレイのアイコン）か ④ `docker compose ps` が healthy か ⑤ `tailscale serve status` に設定が残っているか |
| `docker compose ps` に何も出ない | `docker compose up -d` で起動する |
| `docker` のコマンドがエラーになる | Docker Desktop が起動していない。スタートメニューから Docker Desktop を起動し、1分ほど待つ |
| unhealthy のまま | `docker compose logs --tail 50 app` でエラーを確かめ、`docker compose restart` を試す |
| http://127.0.0.1:8080 は開くが、iPhone から開けない | Tailscale 側の問題。`tailscale serve status` と、iPhone の Tailscale アプリで PC がオンラインかを確かめる |
| https のアドレスを開くと証明書のエラー | 初回は証明書の発行に数十秒かかる。少し待ってから開き直す。続く場合は管理画面で HTTPS Certificates が有効か確かめる |
| ポート 8080 が使われていて起動できない | 8080 を使っているほかのアプリを止める。どうしても変える場合は README.md の「困ったとき」を見る |
| 新しいバージョンにならない | PC で `docker compose up -d --build` を実行したか確かめ、iPhone でアプリを閉じて開き直し「更新」を押す |

データのバックアップと復元は [README.md 5章](../README.md#5-バックアップと復元) を見てください。

---

## 5. コマンドの早見表

### サーバー（このリポジトリのフォルダーで実行）

| やりたいこと | コマンド |
|---|---|
| 状態を見る | `docker compose ps` |
| 起動する | `docker compose up -d` |
| 停止する | `docker compose stop` |
| 停止から再開する | `docker compose start` |
| 再起動する | `docker compose restart` |
| 新しいバージョンにする | `docker compose up -d --build` |
| ログを見る | `docker compose logs -f app` |
| 動作確認 | ブラウザで http://127.0.0.1:8080/api/health |

### Tailscale

| やりたいこと | コマンド |
|---|---|
| 公開する（最初に1回） | `tailscale serve --bg --https=443 http://127.0.0.1:8080` |
| 公開の状態を見る | `tailscale serve status` |
| 公開をやめる | `tailscale serve --https=443 off` |
| Serve の設定を消す | `tailscale serve reset` |
| つながっている端末を見る | `tailscale status` |
