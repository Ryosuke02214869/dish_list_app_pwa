import type { ReactNode } from "react";

/** アイコン（design-sample.html のSVGと同じ形）。色は文字色（currentColor）に合わせる */

interface IconProps {
  size?: number;
}

function Icon({
  size,
  strokeWidth,
  children,
}: {
  size: number;
  strokeWidth: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** アプリのマーク（湯気の立つお椀） */
export function BowlIcon({ size = 20 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M7 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M17 7c0-1.5 1-2 1-3.5" />
    </Icon>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function PlusIcon({ size = 22 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.5}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}
