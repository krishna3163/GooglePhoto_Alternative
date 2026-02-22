/**
 * Credential & preference persistence: localStorage + cookies for fast load.
 * Cookies are used so the app can show "signed in" state quickly (optional server-side read).
 */

const CONFIG_KEY = 'telegram_config';
const USER_NAME_KEY = 'user_name';
const PHOTOS_KEY = 'uploaded_photos';
const LAYOUT_KEY = 'telegram_layout';
const COOKIE_CONFIG_FLAG = 'telegram_configured';
const COOKIE_MAX_AGE_DAYS = 365;

export type LayoutMode = 'grid' | 'list';

export function getStoredConfig(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CONFIG_KEY);
}

export function getStoredUserName(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function getStoredPhotos(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(PHOTOS_KEY);
}

export function getStoredLayout(): LayoutMode {
  if (typeof localStorage === 'undefined') return 'grid';
  const v = localStorage.getItem(LAYOUT_KEY);
  return (v === 'list' || v === 'grid') ? v : 'grid';
}

export function setStoredLayout(mode: LayoutMode): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAYOUT_KEY, mode);
}

/** Set a cookie so credentials are "remembered" and can be read fast (e.g. first paint). */
export function setCredentialsCookie(hasConfig: boolean): void {
  if (typeof document === 'undefined' || !document.cookie) return;
  const value = hasConfig ? '1' : '0';
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_CONFIG_FLAG}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function hasCredentialsCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(s => s.trim().startsWith(COOKIE_CONFIG_FLAG + '=1'));
}
