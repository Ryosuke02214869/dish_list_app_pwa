# DESIGN.md — ごはんメモ デザイン仕様

見た目の正は `design-sample.html`（このファイルと同じ場所に置く）。実装時はブラウザでサンプルを開き、モバイル幅（390px）で見比べながら作ること。サンプルの CSS 変数名は本書のトークン名と一致している。

## 1. コンセプト

- **清潔・明るい・やさしい**：白いカードとごく淡いグレーの背景に、ティール（青緑）1色をアクセントとして使う
- アクセント色は「押せるもの」と「選ばれているもの」だけに使い、使いすぎない
- 角は大きめの丸み、影は弱く広く。線（ボーダー）は最小限
- スマホ片手操作が前提。主要アクションは画面下部（FAB、シート下部のボタン）

## 2. カラートークン

### ライト（基本）

| トークン | 値 | 用途 |
|---|---|---|
| `primary` | `#1BA3A6` | 主ボタン背景、選択中チップ、FAB、フォーカスリング |
| `primary-pressed` | `#168A8D` | 主ボタン押下時 |
| `primary-strong` | `#0F7F82` | 白背景上のティール文字（リンク、タグ文字、並び替え）。コントラスト 4.5:1 以上 |
| `primary-soft` | `#E5F5F5` | タグ背景、フォーカスリングの外側 |
| `primary-border` | `#BFE6E7` | タグ候補の点線枠 |
| `on-primary` | `#FFFFFF` | primary 上の文字 |
| `bg` | `#F4F6F7` | 画面背景 |
| `surface` | `#FFFFFF` | カード、シート、検索欄 |
| `surface-muted` | `#F2F4F5` | 入力欄の背景、補足情報ボックス |
| `border` | `#E3E7EA` | 区切り線、入力欄の枠、副ボタンの枠 |
| `text` | `#1F2427` | 本文、見出し |
| `text-sub` | `#5F6B71` | メモ、補助テキスト |
| `text-muted` | `#8A959B` | プレースホルダー、日時 |
| `danger` | `#D64545` | 削除 |
| `warning` | `#E08A1E` | 未同期、重複警告 |
| `success` | `#1BA3A6` | 同期済みのドット |

### ダーク（`prefers-color-scheme: dark`）

| トークン | 値 |
|---|---|
| `primary` / `primary-pressed` / `primary-strong` | `#33BEC1` / `#2AA6A9` / `#5FD3D6` |
| `primary-soft` / `primary-border` | `#16353A` / `#22545A` |
| `on-primary` | `#072325`（明るいティールの上は濃い文字） |
| `bg` / `surface` / `surface-muted` / `border` | `#111517` / `#1B2124` / `#232A2E` / `#2D363A` |
| `text` / `text-sub` / `text-muted` | `#E8ECEE` / `#A9B4B9` / `#7C888E` |
| `danger` | `#F07070` |

> 白文字×`primary` のコントラストは約3:1。ボタン文字は必ず **太字・15px以上** にする。

## 3. タイポグラフィ

- フォント：`"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`（Google Fonts の Noto Sans JP 400/500/700。オフライン時はシステムフォントに落ちてよい。Service Worker で Web フォントもキャッシュする）
- 本文の基準は 15px、行間 1.6

| 用途 | サイズ / ウェイト |
|---|---|
| アプリ名 | 20px / 700 |
| シート見出し | 18px / 700 |
| カードの料理名 | 17px / 700 |
| 本文・ボタン | 15px / 400・700 |
| ラベル | 13px / 700 |
| メモ抜粋・件数・チップ | 13px / 400 |
| タグ・補足 | 12px / 500 |
| 日時・メタ | 11px / 400 |

- **入力欄は必ず 16px 以上**（iOS Safari がフォーカス時に自動ズームするのを防ぐ）

## 4. 形・余白・影

| トークン | 値 | 用途 |
|---|---|---|
| `radius-sm` | 8px | ボタン |
| `radius-md` | 12px | 入力欄、検索欄、補足ボックス |
| `radius-lg` | 16px | カード |
| `radius-xl` | 24px | ボトムシートの上角 |
| `radius-full` | 999px | チップ、タグ、FAB、同期ピル |
| `gutter` | 16px | 画面左右の余白 |
| `shadow-card` | `0 1px 2px rgba(16,24,28,.04), 0 4px 16px rgba(16,24,28,.06)` | カード |
| `shadow-float` | `0 6px 20px rgba(15,127,130,.28)` | FAB（ティールがかった影） |
| `shadow-sheet` | `0 -8px 32px rgba(16,24,28,.14)` | ボトムシート |

- 余白は 4 の倍数（4 / 8 / 12 / 16 / 24 / 32）
- コンテンツ最大幅 480px、PC では中央寄せ
- タップ領域は最小 44×44px（チップは高さ 32px だが左右の余白で確保）
- セーフエリア：上部バーに `env(safe-area-inset-top)`、FAB・シート下部に `env(safe-area-inset-bottom)` を加える。`viewport-fit=cover` を指定

## 5. コンポーネント

| コンポーネント | 仕様 |
|---|---|
| **AppBar** | sticky。背景は `bg` 92%＋背景ぼかし。左にアプリアイコン（34px・角丸10px・primary）とアプリ名、右に SyncPill。下に SearchBar と TagChips を含む |
| **SyncPill** | 高さ32px・pill・`surface`＋`border`。8px のドット＋文言。状態：同期済み（success）／未同期 n件（warning）／接続できません（text-muted）／同期中…（点滅）。タップで手動同期 |
| **SearchBar** | 高さ46px、左に虫眼鏡。フォーカスで枠 `primary`＋外側 3px の `primary-soft` リング |
| **TagChip**（絞り込み） | 横スクロール（スクロールバー非表示、左右は画面端まで）。未選択：`surface`＋`border`＋`text-sub`。選択：`primary` 塗り＋`on-primary` 太字。使用数を小さく併記。`aria-pressed` で状態を表す |
| **DishCard** | `surface`・`radius-lg`・`shadow-card`・padding 16px。料理名 → メモ1行（省略記号）→ Tag 群 → 「更新者・日時」。押下で 0.985 に縮む |
| **Tag**（表示用） | `primary-soft` 背景＋`primary-strong` 文字・pill・12px。`#` を前置 |
| **FAB** | 右下固定・高さ56px・pill・`primary`・「＋ 追加」・`shadow-float` |
| **Button** | 高さ48px・`radius-sm`・太字。Primary：`primary` 塗りで残り幅いっぱい（flex:1）。Secondary：白＋`border`。Danger：白＋`border`＋`danger` 文字。下部に「副ボタン（左・小）＋主ボタン（右・広）」の組み合わせで並べる |
| **BottomSheet** | 新規・編集画面はページ遷移せずボトムシートで出す。上角 24px、ハンドル（40×4px）、見出し＋閉じるボタン、スクロールする本文、固定フッター（区切り線の上にボタン）。最大高さ 92dvh。背景は 40% の黒スクリム。スクリム・Esc・閉じるで閉じる |
| **Input / Textarea** | 背景 `surface-muted`、フォーカスで `surface`＋枠 `primary`。ラベルは上に 13px 太字、必須は「必須」を `primary-strong` で小さく |
| **TagEditor** | 入力欄の中に選択済みタグ（×付き）を並べ、Enter で確定（IME 変換中の Enter は無視：`isComposing`）、空欄で Backspace なら最後のタグを外す。下に既存タグの候補（点線枠の pill）を最大8個 |
| **MetaBox** | `surface-muted`・`radius-md`・12px。「最終更新：○○（10/4 20:15）」 |
| **Toast** | 下部中央、FAB の上。反転色（`text` 背景／`bg` 文字）、1.8秒で消える |
| **EmptyState** | `surface` カードに中央寄せの案内文 |

## 6. 画面との対応（REQUIREMENTS.md 9章）

- **一覧（ホーム）**：サンプルの通り。AppBar（検索・タグ）→ 件数と並び替え → カードリスト → FAB
- **詳細・編集／新規**：BottomSheet。新規時は削除ボタンと MetaBox を出さず、料理名にフォーカス
- **設定**：AppBar 右上の SyncPill の隣に設定アイコン（またはピル長押し）から BottomSheet で開く。中身は利用者名の Input、同期状態、手動同期ボタン（Primary）、最終同期時刻、バージョン
- **初回起動**：全画面。中央に大きめのアプリアイコンとアプリ名、短い説明、名前入力、下部に Primary ボタン「はじめる」。続けて「ホーム画面に追加」の手順（Safari：共有 → ホーム画面に追加）を図解したカード

## 7. 動き

- 時間は 0.1〜0.25秒。シートは `cubic-bezier(.2,.8,.2,1)` で下からスライド
- `prefers-reduced-motion: reduce` のときはアニメーションを無効化

## 8. 実装メモ（Tailwind）

`tailwind.config` の `theme.extend` に本書のトークンを CSS 変数として登録し、ダーク切り替えは CSS 変数側で行う（`dark:` クラスを多用しない）。

```js
colors: {
  primary: { DEFAULT: "var(--color-primary)", pressed: "var(--color-primary-pressed)", strong: "var(--color-primary-strong)", soft: "var(--color-primary-soft)", border: "var(--color-primary-border)" },
  "on-primary": "var(--color-on-primary)",
  bg: "var(--color-bg)", surface: { DEFAULT: "var(--color-surface)", muted: "var(--color-surface-muted)" },
  border: "var(--color-border)",
  text: { DEFAULT: "var(--color-text)", sub: "var(--color-text-sub)", muted: "var(--color-text-muted)" },
  danger: "var(--color-danger)", warning: "var(--color-warning)", success: "var(--color-success)",
},
borderRadius: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
boxShadow: { card: "var(--shadow-card)", float: "var(--shadow-float)", sheet: "var(--shadow-sheet)" },
fontFamily: { sans: ["Noto Sans JP", "-apple-system", "BlinkMacSystemFont", "Hiragino Sans", "sans-serif"] },
```

- PWA の `manifest`：`theme_color: "#F4F6F7"`、`background_color: "#F4F6F7"`、アイコンは primary 背景に白いお椀のマーク（サンプルの `brand-mark` の SVG を元に作成）
- サンプルの JavaScript は見た目確認用のモック。データ処理は REQUIREMENTS.md と CLAUDE.md に従って実装し直すこと
