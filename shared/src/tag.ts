import { DISH_LIMITS } from "./limits";
import { normalize } from "./normalize";

/**
 * 入力されたタグを、保存する表示用の文字列に整える（REQUIREMENTS.md 16章）。
 * NFKC、前後の空白除去、先頭の `#` の除去だけを行い、ひらがな化や小文字化はしない。
 * 空になった場合は空文字を返す。
 */
export function toTagLabel(raw: string): string {
  return raw.normalize("NFKC").trim().replace(/^#+/, "").trim().slice(0, DISH_LIMITS.tagMaxLength);
}

/** タグの一覧に、正規化後に同じタグが含まれているか */
export function includesTag(tags: readonly string[], label: string): boolean {
  const key = normalize(label);
  return tags.some((tag) => normalize(tag) === key);
}

/**
 * タグの一覧に新しいタグを加えた配列を返す（元の配列は変更しない）。
 * 空のタグ、重複したタグ、上限を超えるタグは加えない。
 */
export function addTag(tags: readonly string[], raw: string): string[] {
  const label = toTagLabel(raw);
  if (label === "" || includesTag(tags, label) || tags.length >= DISH_LIMITS.tagsMaxCount) {
    return [...tags];
  }
  return [...tags, label];
}

/**
 * タグの名前を変えた一覧を返す（REQUIREMENTS.md 19.1 F-23、F-24）。
 * fromKey（正規化したキー）に当たるタグを、表記ゆれも含めてすべて newLabel にする。
 * 変更の結果、同じタグが2つになったら1つにする（統合）。元の配列は変更しない。
 */
export function renameTagInList(
  tags: readonly string[],
  fromKey: string,
  newLabel: string,
): string[] {
  const label = toTagLabel(newLabel);
  if (label === "") return [...tags];
  return tags
    .map((tag) => (normalize(tag) === fromKey ? label : tag))
    .reduce<string[]>((result, tag) => (includesTag(result, tag) ? result : [...result, tag]), []);
}

/** fromKey（正規化したキー）に当たるタグを、表記ゆれも含めて外した一覧を返す（F-25） */
export function removeTagFromList(tags: readonly string[], key: string): string[] {
  return tags.filter((tag) => normalize(tag) !== key);
}
