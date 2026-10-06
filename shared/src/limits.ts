/**
 * 入力と通信の上限値。画面の入力制限、zodの検証、同期の分割のすべてがここを参照する。
 * 値を変えるときはこのファイルだけを直す。
 */
export const DISH_LIMITS = {
  /** 料理名の最大文字数（F-01） */
  nameMaxLength: 100,
  /** メモの最大文字数（F-01） */
  memoMaxLength: 2000,
  /** 1つの料理に付けられるタグの数（F-01） */
  tagsMaxCount: 10,
  /** 1つのタグの最大文字数（REQUIREMENTS.md 16章） */
  tagMaxLength: 20,
  /** 利用者名の最大文字数 */
  userNameMaxLength: 30,
} as const;

export const SYNC_LIMITS = {
  /** 1回のPushで送る最大件数（8章） */
  pushMaxCount: 200,
  /** 1回のPullで返す最大件数（6.3） */
  pullMaxCount: 500,
} as const;
