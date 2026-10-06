import { useState } from "react";

/**
 * シートの開閉と、開いている対象を管理する。
 * - 開くたびに key を変える。シートに key として渡すと、入力が毎回初期化される
 * - 閉じるアニメーションの間も中身を表示しておくため、閉じても対象は残す
 */
export function useSheet<T = undefined>() {
  const [state, setState] = useState<{ key: number; open: boolean; target: T | undefined }>({
    key: 0,
    open: false,
    target: undefined,
  });

  return {
    ...state,
    openWith: (target: T) => setState((prev) => ({ key: prev.key + 1, open: true, target })),
    close: () => setState((prev) => ({ ...prev, open: false })),
  };
}
