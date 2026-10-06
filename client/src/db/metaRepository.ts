import { db, type MetaKey, type MetaRow, type MetaValues } from "./database";

/** 端末のメタ情報の読み書き */

export async function getMeta<K extends MetaKey>(key: K): Promise<MetaValues[K] | undefined> {
  const row = await db.meta.get(key);
  return row?.value as MetaValues[K] | undefined;
}

export async function setMeta<K extends MetaKey>(key: K, value: MetaValues[K]): Promise<void> {
  // ジェネリックの K からはキーと値の組を絞り込めないため、行の型に変換して渡す
  await db.meta.put({ key, value } as MetaRow);
}

/**
 * 端末のIDを返す。まだなければ発行して保存する（REQUIREMENTS.md 4章）。
 * 同時に呼ばれても1つしか発行しないよう、トランザクションの中で確認する。
 */
export async function ensureClientId(): Promise<string> {
  return db.transaction("rw", db.meta, async () => {
    const existing = await getMeta("clientId");
    if (existing) return existing;
    const clientId = crypto.randomUUID();
    await setMeta("clientId", clientId);
    return clientId;
  });
}
