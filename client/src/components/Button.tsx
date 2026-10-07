import type { ButtonHTMLAttributes } from "react";

/**
 * ボタン（DESIGN.md 5章 Button）。主ボタンは残りの幅いっぱいに広がる。
 * 枠の色や大きさは種類ごとに1つだけ指定する（同じ要素に2つ書くと、どちらが効くかがCSSの順番で決まるため）。
 * 大きさを変えたいときは className ではなく size を使う。
 */

type Variant = "primary" | "secondary" | "danger";
type Size = "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "flex-1 border-transparent bg-primary text-on-primary active:bg-primary-pressed disabled:opacity-40",
  secondary: "border-border bg-surface text-text",
  danger: "border-border bg-surface text-danger",
};

const SIZE_CLASSES: Record<Size, string> = {
  /** シートやダイアログの下部のボタン（高さ48px） */
  md: "h-12 px-5 text-[15px]",
  /** 一覧の行の中などの小さいボタン（高さ36px） */
  sm: "h-9 px-3 text-[13px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-sm border font-bold whitespace-nowrap ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
