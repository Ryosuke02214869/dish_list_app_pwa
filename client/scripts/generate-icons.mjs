// アプリのアイコンを作る（DESIGN.md 8章：primary の背景に白いお椀のマーク）。
// マークを変えたときに `npm run icons -w client` で作り直し、できた画像をコミットする。
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve(import.meta.dirname, "../public/icons");
const PRIMARY = "#1BA3A6";

/** design-sample.html の brand-mark と同じお椀（24×24 の座標） */
const BOWL_PATHS = `
  <path d="M3 11h18a9 9 0 0 1-18 0Z"/>
  <path d="M7 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M17 7c0-1.5 1-2 1-3.5"/>`;

/**
 * アイコンのSVG。
 * @param markRatio  アイコンの幅に対するマークの大きさ（maskable は端が切られるので小さめにする）
 * @param radius     角の丸み（0 なら四角。iOS やランチャーが自分で角を丸める用途は 0 にする）
 */
function iconSvg({ size, markRatio, radius }) {
  const mark = size * markRatio;
  const offset = (size - mark) / 2;
  const scale = mark / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${PRIMARY}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#FFFFFF"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${BOWL_PATHS}</g>
</svg>`;
}

const ICONS = [
  // manifest（purpose: any）。角はランチャーに任せず少し丸める
  { file: "icon-192.png", size: 192, markRatio: 0.6, radius: 40 },
  { file: "icon-512.png", size: 512, markRatio: 0.6, radius: 108 },
  // manifest（purpose: maskable）。中央80%の安全領域に収まるよう、マークを小さめに
  { file: "icon-maskable-512.png", size: 512, markRatio: 0.46, radius: 0 },
  // iPhone のホーム画面。iOS が角を丸めるので四角のまま
  { file: "apple-touch-icon.png", size: 180, markRatio: 0.6, radius: 0 },
];

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const icon of ICONS) {
  await sharp(Buffer.from(iconSvg(icon)))
    .png()
    .toFile(path.join(OUT_DIR, icon.file));
  console.log(`作成：public/icons/${icon.file}`);
}
fs.writeFileSync(
  path.join(OUT_DIR, "favicon.svg"),
  iconSvg({ size: 64, markRatio: 0.66, radius: 14 }),
);
console.log("作成：public/icons/favicon.svg");
