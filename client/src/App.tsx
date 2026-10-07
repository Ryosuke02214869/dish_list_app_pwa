import type { ComponentType } from "react";
import { ToastProvider } from "./components/Toast";
import { DishListPage } from "./features/dishes/DishListPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { UpdatePrompt } from "./features/pwa/UpdatePrompt";
import { ActorProvider, useSession } from "./features/session/session";
import { TagAdminPage } from "./features/tags/TagAdminPage";
import { type Route, useRoute } from "./lib/hashRoute";

/**
 * 利用者名が未登録なら初回起動の画面、登録済みなら URL のハッシュに応じた画面を出す。
 * アプリの更新の通知は、どの画面でも出す。
 */

/** 画面と、そのコンポーネントの対応。画面を増やすときは lib/hashRoute.ts とここに加える */
const PAGES: Record<Route, ComponentType> = {
  home: DishListPage,
  tags: TagAdminPage,
};

export function App() {
  const session = useSession();
  const route = useRoute();
  const Page = PAGES[route];

  return (
    <ToastProvider>
      {session.status === "needsUserName" && <OnboardingPage />}
      {session.status === "ready" && (
        <ActorProvider actor={session.actor}>
          <Page />
        </ActorProvider>
      )}
      <UpdatePrompt />
    </ToastProvider>
  );
}
