/**
 * Centralized AsyncStorage key constants.
 * Always use these instead of inline string literals.
 */
export const STORAGE_KEYS = {
  /** Prefix for persisted per-user Leafy AI chat messages (JSON array) */
  LEAFY_MESSAGES: "leafy_messages",
  /** ISO date string of user's last login, used for streak tracking */
  LAST_LOGIN_DATE: "last_login_date",
  /** Streak count integer */
  LOGIN_STREAK: "login_streak",
  /** Total app open count integer */
  APP_OPEN_COUNT: "app_open_count",
  /** Whether the user has opened the app on a weekend */
  WEEKEND_VISIT: "weekend_visit_done",
  /** ISO date of first login (for "returned after break" tracking) */
  FIRST_LOGIN_DATE: "first_login_date",
  /** Whether the user returned after a 7-day break */
  RETURNED_AFTER_BREAK: "returned_after_break",
  /** Manual theme selection preference (light | dark | system) */
  THEME_MODE: "theme_mode",
  /** Order status notifications enabled toggle boolean */
  NOTIFS_ORDER: "settings_notifs_order",
  /** Social comments/likes notifications enabled toggle boolean */
  NOTIFS_SOCIAL: "settings_notifs_social",
  /** Prefix for per-user profile cover fallback URLs */
  PROFILE_COVER_URL_PREFIX: "profile_cover_url",
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
