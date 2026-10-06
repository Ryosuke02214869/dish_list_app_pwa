import type { ReactNode } from "react";
import { ShareIcon } from "../../components/icons";

/**
 * 「ホーム画面に追加」の案内（REQUIREMENTS.md 11章 1〜3）。
 * 初回起動の画面と設定画面で使う。ホーム画面から開いているときは出さない。
 */

/** ホーム画面に追加したアプリとして開いているか */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallGuide() {
  if (isStandalone()) return null;
  return (
    <section className="rounded-lg bg-surface p-4 text-left shadow-card">
      <h2 className="text-[15px] font-bold">ホーム画面に追加してください</h2>
      <p className="mt-1 text-[13px] text-text-sub">
        ホーム画面から開くと、オフラインでも使え、データが消えにくくなります。
      </p>
      <ol className="mt-3 grid gap-2 text-[13px]">
        <Step number={1}>
          画面の共有ボタン
          <span
            className="mx-0.5 inline-block align-[-3px] text-primary-strong"
            role="img"
            aria-label="共有"
          >
            <ShareIcon />
          </span>
          をタップ（Safariは下、Chromeはアドレスバーの右）
        </Step>
        <Step number={2}>「ホーム画面に追加」を選ぶ</Step>
        <Step number={3}>右上の「追加」をタップ</Step>
      </ol>
      <p className="mt-3 rounded-md bg-surface-muted px-3.5 py-3 text-xs text-text-sub">
        Safari、Chrome、ホーム画面のアプリは、それぞれ別にデータを保存します。
        ふだんはホーム画面のアプリを使ってください。
      </p>
    </section>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="grid size-5 flex-none place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-strong">
        {number}
      </span>
      {/* アイコンを文中に置けるよう、flex にせず普通の文章として並べる */}
      <span>{children}</span>
    </li>
  );
}
