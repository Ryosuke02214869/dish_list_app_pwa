import type { VitePWAOptions } from "vite-plugin-pwa";

/**
 * PWA の設定（REQUIREMENTS.md 10章「オフライン」、CLAUDE.md「PWA」）。
 * - Service Worker はアプリ本体（HTML/JS/CSS/アイコン）だけをプリキャッシュする
 * - /api/* はキャッシュしない（プリキャッシュにも実行時のキャッシュにも含めない）
 * - 新しいバージョンは勝手に適用せず、画面の「更新」ボタンで適用する（registerType: "prompt"）
 * - Web フォントは実行時にキャッシュする（REQUIREMENTS.md 16章）
 */

/** DESIGN.md 8章 */
const THEME_COLOR = "#F4F6F7";

export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: "prompt",
  // 登録は features/pwa/UpdatePrompt.tsx で行う
  injectRegister: false,
  // プリキャッシュの対象は workbox.globPatterns だけで決める（重複して登録しないため）
  includeManifestIcons: false,
  manifest: {
    name: "ごはんメモ",
    short_name: "ごはんメモ",
    description: "家族で「作れる料理」を共有するメモ",
    lang: "ja",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: THEME_COLOR,
    background_color: THEME_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    // manifest.webmanifest はプラグインが自動で加える
    globPatterns: ["**/*.{html,js,css,svg,png}"],
    // オフラインで画面を開いたときも index.html を返す。ただし /api は対象外
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
        handler: "StaleWhileRevalidate",
        options: { cacheName: "google-fonts-stylesheets" },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
};
