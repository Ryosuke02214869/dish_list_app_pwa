/**
 * 最後に呼ばれてから waitMs ミリ秒たったら、1回だけ fn を実行する関数を返す。
 * cancel() で、待っている実行を取りやめる。
 */
export function debounce(fn: () => void, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(fn, waitMs);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
