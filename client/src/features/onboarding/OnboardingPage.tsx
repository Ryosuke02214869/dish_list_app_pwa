import { DISH_LIMITS } from "@dish-list/shared";
import { type FormEvent, useState } from "react";
import { Button } from "../../components/Button";
import { Field, TextInput } from "../../components/Field";
import { BowlIcon } from "../../components/icons";
import { saveUserName, toValidUserName } from "../session/session";
import { InstallGuide } from "./InstallGuide";

/**
 * 初回起動の画面（REQUIREMENTS.md 9章、DESIGN.md 6章）。
 * 名前を保存すると、セッションが「準備完了」になり一覧画面へ切り替わる。
 */
export function OnboardingPage() {
  const [name, setName] = useState("");
  const canStart = toValidUserName(name) !== null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (canStart) await saveUserName(name);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-dvh max-w-app flex-col px-gutter pt-[calc(48px+env(safe-area-inset-top))]"
    >
      <div className="flex flex-col items-center text-center">
        <div className="grid size-20 place-items-center rounded-[24px] bg-primary text-on-primary shadow-float">
          <BowlIcon size={44} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">ごはんメモ</h1>
        <p className="mt-1 text-sm text-text-sub">
          家族で「作れる料理」を集めて、献立に迷ったときに見返せます。
        </p>
      </div>

      <Field label="あなたの名前" htmlFor="onboarding-name" required>
        <TextInput
          id="onboarding-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={DISH_LIMITS.userNameMaxLength}
          placeholder="例：ママ"
          autoComplete="nickname"
          enterKeyHint="done"
        />
      </Field>
      <p className="mt-1.5 text-xs text-text-muted">
        料理を登録・更新した人として表示されます。あとで設定から変えられます。
      </p>

      <div className="mt-6">
        <InstallGuide />
      </div>

      <div className="sticky bottom-0 mt-auto flex bg-bg pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={!canStart}>
          はじめる
        </Button>
      </div>
    </form>
  );
}
