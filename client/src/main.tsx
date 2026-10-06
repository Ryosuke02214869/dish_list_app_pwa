import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureClientId } from "./db/metaRepository";
import { requestPersistentStorage } from "./db/persistentStorage";
import "./styles/index.css";

async function start() {
  // 画面を出す前に端末IDを用意する（変更の記録に必ず使うため）
  await ensureClientId();
  void requestPersistentStorage();

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("#root が見つかりません");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
