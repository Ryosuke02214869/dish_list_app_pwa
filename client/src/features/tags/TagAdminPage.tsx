import { DISH_LIMITS } from "@dish-list/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PromptDialog } from "../../components/PromptDialog";
import { useToast } from "../../components/Toast";
import { listActiveDishes } from "../../db/dishRepository";
import { removeTag, renameTag } from "../../db/tagRepository";
import { navigate } from "../../lib/hashRoute";
import { summarizeTags, type TagSummary } from "../dishes/dishListQuery";
import { useActor } from "../session/session";
import { TagAdminRow } from "./TagAdminRow";
import { findMergeTarget, validateNewTagName } from "./tagAdminRules";

/**
 * タグの管理のページ（REQUIREMENTS.md 19.1、DESIGN.md 6章）。設定の「タグの管理」から開く。
 * 名前の変更・統合・削除は、そのタグが付いたすべての料理に反映する。
 */

/** 開いているダイアログ */
type Dialog =
  | { kind: "rename"; tag: TagSummary; key: number }
  | { kind: "merge"; tag: TagSummary; newLabel: string; target: TagSummary }
  | { kind: "delete"; tag: TagSummary };

export function TagAdminPage() {
  const dishes = useLiveQuery(listActiveDishes);
  const tags = useMemo(() => summarizeTags(dishes ?? []), [dishes]);
  const actor = useActor();
  const showToast = useToast();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const rename = async (tag: TagSummary, newLabel: string) => {
    close();
    try {
      const count = await renameTag(tag.key, newLabel, actor);
      showToast(`${count}件の料理のタグを変えました`);
    } catch {
      showToast("タグを変えられませんでした");
    }
  };

  const confirmRename = (tag: TagSummary, newLabel: string) => {
    const target = findMergeTarget(newLabel, tag, tags);
    if (target) setDialog({ kind: "merge", tag, newLabel, target });
    else void rename(tag, newLabel);
  };

  const remove = async (tag: TagSummary) => {
    close();
    try {
      const count = await removeTag(tag.key, actor);
      showToast(`${count}件の料理からタグを外しました`);
    } catch {
      showToast("タグを削除できませんでした");
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-app px-gutter pt-[calc(12px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))] md:max-w-wide">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("home")}
          className="-ml-2 h-11 rounded-sm px-2 text-[15px] font-bold text-primary-strong"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">タグの管理</h1>
      </header>
      <p className="mt-2 text-[13px] text-text-sub">
        名前を変えたり削除したりすると、そのタグが付いたすべての料理に反映されます。
        ほかのタグと同じ名前にすると、1つにまとまります。
      </p>

      {dishes === undefined ? null : tags.length === 0 ? (
        <p className="mt-8 rounded-lg bg-surface px-4 py-8 text-center text-sm text-text-sub">
          タグはまだありません。
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {tags.map((tag) => (
            <li key={tag.key}>
              <TagAdminRow
                tag={tag}
                onRename={(target) => setDialog({ kind: "rename", tag: target, key: Date.now() })}
                onDelete={(target) => setDialog({ kind: "delete", tag: target })}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog?.kind === "rename" && (
        <PromptDialog
          key={dialog.key}
          open
          title={`タグ「${dialog.tag.label}」の名前を変える`}
          message={`${dialog.tag.count}件の料理で変わります。`}
          label="新しい名前"
          initialValue={dialog.tag.label}
          maxLength={DISH_LIMITS.tagMaxLength}
          confirmLabel="変える"
          validate={(value) => validateNewTagName(value, dialog.tag)}
          onConfirm={(value) => confirmRename(dialog.tag, value)}
          onCancel={close}
        />
      )}
      {dialog?.kind === "merge" && (
        <ConfirmDialog
          open
          title={`「${dialog.tag.label}」を「${dialog.target.label}」にまとめますか？`}
          message={`「${dialog.tag.label}」が付いた${dialog.tag.count}件の料理が「${dialog.target.label}」になります。元には戻せません。`}
          confirmLabel="まとめる"
          onConfirm={() => void rename(dialog.tag, dialog.newLabel)}
          onCancel={close}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          title={`タグ「${dialog.tag.label}」を削除しますか？`}
          message={`${dialog.tag.count}件の料理からこのタグを外します。料理は消えません。`}
          confirmLabel="削除する"
          danger
          onConfirm={() => void remove(dialog.tag)}
          onCancel={close}
        />
      )}
    </div>
  );
}
