/**
 * 客服个人常用语（localStorage 持久化，per-user 隔离）
 *
 * 存储 key: `swan_quick_replies:${userId}` -> JSON string[]
 * 首次加载时如果空，会自动 prefill 1 条「标准开场白」
 *
 * 后续如果要跨设备同步：把 storageKey 换成后端 API（GET/POST/DELETE）即可，组件层无感。
 */
const STORAGE_PREFIX = 'swan_quick_replies:';

const DEFAULT_GREETING =
  '您好，我是天鹅到家金牌保姆推荐官xx，我的电话是xxxxxxxxx，很高兴为您服务。';

export const getStorageKey = (userId: string | undefined | null): string => {
  return `${STORAGE_PREFIX}${userId ?? 'anonymous'}`;
};

export const loadQuickReplies = (userId: string | undefined | null): string[] => {
  if (typeof window === 'undefined') return [DEFAULT_GREETING];
  try {
    const key = getStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      // 首次进入：写入默认开场白
      const seeded = [DEFAULT_GREETING];
      window.localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [DEFAULT_GREETING];
  } catch {
    return [DEFAULT_GREETING];
  }
};

export const saveQuickReplies = (
  userId: string | undefined | null,
  replies: string[],
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(replies));
  } catch {
    // 配额溢出 / 隐私模式 — 静默忽略
  }
};
