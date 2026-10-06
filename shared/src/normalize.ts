/**
 * 文字列の正規化（REQUIREMENTS.md 5.1）。
 *
 * 検索、タグの比較、料理名の重複判定のすべてで、この関数で作ったキーを比べる。
 * 戻り値は比較専用で、画面には表示しない（表示は元の文字列のまま）。
 */
export function normalize(text: string): string {
  return katakanaToHiragana(text.normalize("NFKC").toLowerCase().trim());
}

/** 2つの文字列が正規化後に同じかどうか */
export function isSameNormalized(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/**
 * カタカナをひらがなに変換する。
 * 「ァ〜ヶ」と踊り字「ヽヾ」は、ひらがなとの符号位置の差が一定（0x60）なのでずらして変換する。
 * 長音符「ー」など対応するひらがながない文字はそのまま残す。
 */
function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶヽヾ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - KATAKANA_TO_HIRAGANA_OFFSET),
  );
}

const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;
