import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

/**
 * 短い通知（DESIGN.md 5章 Toast）。画面下部の中央、FABの上に出して1.8秒で消す。
 * 「取り消す」などのボタンを付けたときは、押せるよう少し長く（4秒）出す。
 * 使い方：
 *   const showToast = useToast();
 *   showToast("保存しました");
 *   showToast("記録しました", { label: "取り消す", onClick: undo });
 */

const DISPLAY_MS = 1800;
const DISPLAY_WITH_ACTION_MS = 4000;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; action?: ToastAction }>({ message: "" });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const showToast = useCallback<ShowToast>(
    (message, action) => {
      setToast({ message, action });
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hide, action ? DISPLAY_WITH_ACTION_MS : DISPLAY_MS);
    },
    [hide],
  );

  return (
    <ToastContext value={showToast}>
      {children}
      <div
        role="status"
        className={`fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-full bg-text py-2.5 text-[13px] text-bg transition duration-200 ${toast.action ? "pr-2 pl-4" : "px-4"} ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"}`}
      >
        <span>{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              hide();
              toast.action?.onClick();
            }}
            // 反転色の上でもダークモードでも読めるよう、色は本文と同じにして太字と下線で示す
            className="h-8 flex-none rounded-full px-3 font-bold whitespace-nowrap underline underline-offset-2"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
