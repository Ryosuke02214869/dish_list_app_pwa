import { describe, expect, it } from "vitest";
import { isSameNormalized, normalize } from "./normalize";

describe("normalize", () => {
  it("全角英数字を半角にする", () => {
    expect(normalize("ＡＢＣ１２３")).toBe("abc123");
  });

  it("英字を小文字にする", () => {
    expect(normalize("Curry")).toBe("curry");
  });

  it("半角カナを全角にしてから、ひらがなにする", () => {
    expect(normalize("ｶﾚｰ")).toBe("かれー");
  });

  it("カタカナをひらがなにする（長音符はそのまま）", () => {
    expect(normalize("カレーウドン")).toBe("かれーうどん");
  });

  it("小書き文字、ヴ、ヵヶ、踊り字も変換する", () => {
    expect(normalize("ァィゥェォッャュョヮ")).toBe("ぁぃぅぇぉっゃゅょゎ");
    expect(normalize("ヴヵヶ")).toBe("ゔゕゖ");
    expect(normalize("ヽヾ")).toBe("ゝゞ");
  });

  it("前後の空白（全角を含む）を除去し、間の空白は残す", () => {
    expect(normalize("　 肉 じゃが \n")).toBe("肉 じゃが");
  });

  it("漢字とひらがなは変えない", () => {
    expect(normalize("肉じゃが")).toBe("肉じゃが");
  });

  it("「カレー」で検索すると「かれーうどん」に部分一致する（5.1の例）", () => {
    expect(normalize("かれーうどん").includes(normalize("カレー"))).toBe(true);
  });
});

describe("isSameNormalized", () => {
  it("表記ゆれを同じとみなす", () => {
    expect(isSameNormalized("ハンバーグ", " はんばーぐ")).toBe(true);
    expect(isSameNormalized("ＢＢＱ", "bbq")).toBe(true);
  });

  it("違う文字列は違うとみなす", () => {
    expect(isSameNormalized("肉じゃが", "肉じゃがカレー")).toBe(false);
  });
});
