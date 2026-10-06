import { DISH_LIMITS } from "@dish-list/shared";
import { type FormEvent, type ReactNode, useState } from "react";
import { BottomSheet } from "../../components/BottomSheet";
import { Button } from "../../components/Button";
import { Field, TextInput } from "../../components/Field";
import { useToast } from "../../components/Toast";
import { InstallGuide } from "../onboarding/InstallGuide";
import { saveUserName, toValidUserName, useActor } from "../session/session";
import { requestManualSync, useSyncStatus } from "../sync/useSyncStatus";

/**
 * 設定のシート（REQUIREMENTS.md 9章、F-12、F-13）。
 * 利用者名の変更、同期の状態と手動同期、バージョン、ホーム画面への追加の案内。
 * 開くたびに key を変えて作り直し、入力を初期化する前提。
 */
export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const actor = useActor();
  const status = useSyncStatus();
  const showToast = useToast();
  const [name, setName] = useState(actor.userName);

  const validName = toValidUserName(name);
  const canSaveName = validName !== null && validName !== actor.userName;

  const handleSaveName = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSaveName) return;
    await saveUserName(name);
    showToast("名前を変更しました");
  };

  return (
    <BottomSheet
      open={open}
      title="設定"
      onClose={onClose}
      footer={
        <Button onClick={() => void requestManualSync()} disabled={status.kind === "syncing"}>
          {status.kind === "syncing" ? "同期中…" : "今すぐ同期"}
        </Button>
      }
    >
      <form onSubmit={handleSaveName}>
        <Field label="あなたの名前" htmlFor="settings-name">
          <div className="flex gap-2">
            <TextInput
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={DISH_LIMITS.userNameMaxLength}
              autoComplete="nickname"
            />
            <Button type="submit" variant="secondary" disabled={!canSaveName} className="flex-none">
              変更
            </Button>
          </div>
        </Field>
        <p className="mt-1.5 text-xs text-text-muted">これから登録・更新する料理に表示されます。</p>
      </form>

      <section className="mt-6">
        <h3 className="text-[13px] font-bold">同期</h3>
        <dl className="mt-2 grid gap-2 rounded-md bg-surface-muted px-3.5 py-3 text-[13px]">
          <InfoRow label="状態">{status.label}</InfoRow>
          <InfoRow label="未同期">{status.pendingCount}件</InfoRow>
          <InfoRow label="最終同期">{status.lastSyncedLabel ?? "まだ同期していません"}</InfoRow>
        </dl>
        {status.kind === "offline" && (
          <p className="mt-2 text-xs text-text-sub">
            iPhone の Tailscale がオンになっているか、自宅のPCが起動しているかを確認してください。
            接続できない間も、この端末で登録や編集はできます。
          </p>
        )}
      </section>

      <section className="mt-6">
        <InstallGuide />
      </section>

      <p className="mt-6 text-center text-[11px] text-text-muted">ごはんメモ v{__APP_VERSION__}</p>
    </BottomSheet>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-sub">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
