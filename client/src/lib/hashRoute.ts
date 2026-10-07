import { useSyncExternalStore } from "react";

/**
 * 画面の切り替え。画面が少ないので、ライブラリを使わず URL のハッシュ（#/tags など）で表す。
 * ハッシュを使うのでブラウザの「戻る」が効き、サーバーや Service Worker の設定も要らない。
 * 画面を増やすときは ROUTES に加える。
 */

const ROUTES = {
  home: "",
  tags: "#/tags",
} as const;

export type Route = keyof typeof ROUTES;

function currentRoute(): Route {
  const hash = window.location.hash;
  const found = (Object.keys(ROUTES) as Route[]).find((route) => ROUTES[route] === hash);
  return found ?? "home";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** 今の画面 */
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, currentRoute);
}

/** 画面を移る（ブラウザの履歴に残る） */
export function navigate(route: Route): void {
  const hash = ROUTES[route];
  if (hash === "") {
    // ハッシュを消して一覧に戻る。履歴に # だけが残らないよう、URL から取り除く
    history.pushState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
}
