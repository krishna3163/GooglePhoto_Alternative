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

const PIN_KEY = 'telegphoto_app_pin_hash';
const ENCRYPTION_KEY = 'telegphoto_master_enc_key';
const VAULTS_KEY = 'telegphoto_vaults';

export interface StoredPinData {
  hash: string;
  salt: string;
}

export async function hashPin(pin: string, customSalt?: string): Promise<StoredPinData> {
  const enc = new TextEncoder();
  const salt = customSalt || Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const data = enc.encode(salt + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

export async function verifyPin(inputPin: string, stored: StoredPinData): Promise<boolean> {
  if (!stored || !stored.hash || !stored.salt) return false;
  const computed = await hashPin(inputPin, stored.salt);
  return computed.hash === stored.hash;
}

export function getStoredPinData(): StoredPinData | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(PIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredPinData(pinData: StoredPinData | null): void {
  if (typeof localStorage === 'undefined') return;
  if (pinData) {
    localStorage.setItem(PIN_KEY, JSON.stringify(pinData));
  } else {
    localStorage.removeItem(PIN_KEY);
  }
}

export function getStoredEncryptionKey(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ENCRYPTION_KEY);
}

export function setStoredEncryptionKey(key: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (key) {
    localStorage.setItem(ENCRYPTION_KEY, key);
  } else {
    localStorage.removeItem(ENCRYPTION_KEY);
  }
}

export function getStoredVaults(): any[] {
  if (typeof localStorage === 'undefined') return [];
  const s = localStorage.getItem(VAULTS_KEY);
  try {
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setStoredVaults(vaults: any[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(VAULTS_KEY, JSON.stringify(vaults));
}
