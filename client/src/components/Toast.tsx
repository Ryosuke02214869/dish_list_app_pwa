import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

/**
 * 短い通知（DESIGN.md 5章 Toast）。画面下部の中央、FABの上に出して1.8秒で消す。
 * 使い方：const showToast = useToast(); showToast("保存しました");
 */

const DISPLAY_MS = 1800;

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((text: string) => {
    setMessage(text);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), DISPLAY_MS);
  }, []);

  return (
    <ToastContext value={showToast}>
      {children}
      <div
        role="status"
        className={`pointer-events-none fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-text px-4 py-2.5 text-[13px] text-bg transition duration-200 ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
      >
        {message}
      </div>
    </ToastContext>
  );
}

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}
