import { SearchIcon } from "../../components/icons";

/** キーワード検索の入力欄（F-05、DESIGN.md 5章 SearchBar）。入力に合わせて即座に絞り込む */
export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative mt-3">
      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="料理名・メモで検索"
        aria-label="料理名・メモで検索"
        autoComplete="off"
        enterKeyHint="search"
        className="h-[46px] w-full rounded-md border border-border bg-surface pr-4 pl-[42px] text-base transition outline-none placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-primary-soft"
      />
    </div>
  );
}
