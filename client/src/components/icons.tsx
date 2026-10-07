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

/** 共有ボタン（iOSの「ホーム画面に追加」の案内に使う） */
export function ShareIcon({ size = 16 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </Icon>
  );
}

export function SettingsIcon({ size = 18 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Icon>
  );
}

/** お気に入り。filled なら塗りつぶし */
export function StarIcon({ size = 16, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8Z" />
    </svg>
  );
}

export function LinkIcon({ size = 14 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  );
}

export function CheckIcon({ size = 16 }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.5}>
      <path d="m5 12 5 5 9-10" />
    </Icon>
  );
}
