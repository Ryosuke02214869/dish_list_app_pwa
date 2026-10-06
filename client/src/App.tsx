import { ToastProvider } from "./components/Toast";
import { DishListPage } from "./features/dishes/DishListPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { ActorProvider, useSession } from "./features/session/session";

/** 利用者名が未登録なら初回起動の画面、登録済みなら一覧画面を出す */
export function App() {
  const session = useSession();

  return (
    <ToastProvider>
      {session.status === "needsUserName" && <OnboardingPage />}
      {session.status === "ready" && (
        <ActorProvider actor={session.actor}>
          <DishListPage />
        </ActorProvider>
      )}
    </ToastProvider>
  );
}
