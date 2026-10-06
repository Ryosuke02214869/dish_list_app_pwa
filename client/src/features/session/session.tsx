import { DISH_LIMITS } from "@dish-list/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { Actor } from "../../db/dishRecord";
import { getMeta, setMeta } from "../../db/metaRepository";

/**
 * 利用者（名前と端末ID）の状態。名前が未登録なら初回起動の画面を出す（REQUIREMENTS.md 4章）。
 * 端末IDは起動時（main.tsx）に発行済みであることを前提にする。
 */

export type Session =
  { status: "loading" } | { status: "needsUserName" } | { status: "ready"; actor: Actor };

export function useSession(): Session {
  const meta = useLiveQuery(async () => {
    const [clientId, userName] = await Promise.all([getMeta("clientId"), getMeta("userName")]);
    return { clientId, userName };
  });
  const clientId = meta?.clientId;
  const userName = meta?.userName;

  return useMemo<Session>(() => {
    if (!clientId) return { status: "loading" };
    if (!userName) return { status: "needsUserName" };
    return { status: "ready", actor: { clientId, userName } };
  }, [clientId, userName]);
}

/** 利用者名として使える形に整える。使えない場合は null */
export function toValidUserName(input: string): string | null {
  const name = input.trim();
  if (name === "" || name.length > DISH_LIMITS.userNameMaxLength) return null;
  return name;
}

/** 利用者名を保存する（初回起動と設定画面から使う） */
export async function saveUserName(input: string): Promise<void> {
  const name = toValidUserName(input);
  if (name === null) throw new Error("利用者名が正しくありません");
  await setMeta("userName", name);
}

const ActorContext = createContext<Actor | null>(null);

export function ActorProvider({ actor, children }: { actor: Actor; children: ReactNode }) {
  return <ActorContext value={actor}>{children}</ActorContext>;
}

/** 料理を変更するときの「誰が・どの端末で」。ActorProvider の内側でだけ使える */
export function useActor(): Actor {
  const actor = useContext(ActorContext);
  if (!actor) throw new Error("useActor は ActorProvider の内側で使う");
  return actor;
}
