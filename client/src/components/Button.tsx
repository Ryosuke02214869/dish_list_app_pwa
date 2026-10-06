import type { ButtonHTMLAttributes } from "react";

/**
 * ボタン（DESIGN.md 5章 Button）。主ボタンは残りの幅いっぱいに広がる。
 * 枠の色は種類ごとに1つだけ指定する（同じ要素に2つ書くと、どちらが効くかがCSSの順番で決まるため）
 */

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "flex-1 border-transparent bg-primary text-on-primary active:bg-primary-pressed disabled:opacity-40",
  secondary: "border-border bg-surface text-text",
  danger: "border-border bg-surface text-danger",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`h-12 rounded-sm border px-5 text-[15px] font-bold ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
