import { ToastProvider } from "./components/Toast";
import { DishListPage } from "./features/dishes/DishListPage";

export function App() {
  return (
    <ToastProvider>
      <DishListPage />
    </ToastProvider>
  );
}
