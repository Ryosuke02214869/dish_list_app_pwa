import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** 開発時に /api を転送するサーバー（server/ を起動したときのアドレス） */
const API_SERVER = "http://127.0.0.1:8080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { "/api": API_SERVER },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
  },
});
