# syntax=docker/dockerfile:1
#
# ごはんメモ：1つのコンテナで PWA本体（client/dist）の配信と /api を担当する。
#   build   ：依存をインストールし、client と server をビルドする
#   runtime ：ビルド結果と、ネイティブモジュール（better-sqlite3）だけを持つ小さなイメージ

FROM node:22-bookworm-slim AS build
WORKDIR /app

# 手元と同じ npm 11 を使う（package-lock.json を作ったバージョンにそろえる）
RUN npm install -g npm@11.6.2

# 依存のインストールは、package.json が変わったときだけやり直す（ビルドのキャッシュを効かせる）
# .npmrc：インストール時スクリプトを実行しない設定（理由は .npmrc に記載）
COPY package.json package-lock.json .npmrc ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY tsconfig.base.json ./
COPY shared shared
COPY client client
COPY server server
RUN npm run build -w client && npm run build -w server


FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/app/data \
    STATIC_DIR=/app/public \
    BACKUP_DIR=/app/backups \
    BACKUP_KEEP=14 \
    BACKUP_TIME_ZONE=Asia/Tokyo

# server は esbuild で1ファイルにまとめてあるので、node_modules は better-sqlite3 だけでよい
# （better-sqlite3 は各OS用のビルド済みファイルを同梱している）
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/client/dist ./public

# データとバックアップの置き場所。root ではなく node ユーザーで動かす
RUN mkdir -p /app/data /app/backups && chown node:node /app/data /app/backups
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/index.js"]
