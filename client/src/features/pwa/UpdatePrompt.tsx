import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Service Worker の登録と、アプリの更新の通知（F-14）。
 * 新しいバージョンを見つけても勝手に再読み込みしない（入力中のデータを守るため）。
 * 「更新」を押したときだけ、新しいバージョンに切り替えて再読み込みする。
 */

/** 開いたままでも新しいバージョンに気づけるよう、確認する間隔 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const checkForUpdate = () => void registration.update().catch(() => {});
      // iPhone のPWAはなかなか再起動されないので、画面を表示したときにも確認する
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[448px] -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-text py-2.5 pr-2.5 pl-4 text-[13px] text-bg shadow-card"
    >
      <span>新しいバージョンがあります</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="h-9 flex-none rounded-sm bg-primary px-4 text-[15px] font-bold text-on-primary active:bg-primary-pressed"
      >
        更新
      </button>
    </div>
  );
}
