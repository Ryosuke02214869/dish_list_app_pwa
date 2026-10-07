/**
 * 日時を、端末の日付で数えた相対的な日にちにする。
 * 今日／昨日／n日前（30日未満）／それより前は「10/4」（年が違えば「2025/10/4」）
 */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / ONE_DAY_MS);

  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
  return date.getFullYear() === now.getFullYear() ? monthDay : `${date.getFullYear()}/${monthDay}`;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** その日の0時（端末の時刻）。夏時間のずれは Math.round で吸収する */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
