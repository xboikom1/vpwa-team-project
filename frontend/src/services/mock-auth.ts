import type { AuthResult, LoginInput, RegisterInput, UserProfile } from '@/types/types';

const ACCOUNTS_KEY = 'chatflow.accounts.v3';
const SESSION_KEY = 'chatflow.session.v1';

interface StoredAccount extends UserProfile {
  digest: string;
}

const DEMO_PASSWORD = 'chatflow123';

export const WORKSPACE_NAME = 'Northwind';

const SEED_ROSTER: readonly (readonly [nick: string, first: string, last: string])[] = [
  ['johndoe', 'John', 'Doe'],
  ['alex', 'Alex', 'Novák'],
  ['ed', 'Ed', 'Bartoš'],
  ['maya', 'Maya', 'Ferreira'],
  ['priya', 'Priya', 'Raman'],
  ['tomas', 'Tomáš', 'Gajdoš'],
  ['lucia', 'Lucia', 'Bíla'],
  ['kai', 'Kai', 'Lindberg'],
  ['rosa', 'Rosa', 'Iglesias'],
  ['john', 'John', 'Petrisko'],
  ['marek', 'Marek', 'Dvořák'],
  ['sara', 'Sara', 'Lindqvist'],
  ['viktor', 'Viktor', 'Šimko'],
  ['jana', 'Jana', 'Kovaľová'],
];

const memoryFallback = new Map<string, string>();
let storageChecked = false;
let storageWorks = false;

function storage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (!storageChecked) {
    storageChecked = true;

    try {
      const probe = '__chatflow_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      storageWorks = true;
    } catch {
      storageWorks = false;
    }
  }

  if (storageWorks) return window.localStorage;

  return {
    getItem: (key) => memoryFallback.get(key) ?? null,
    setItem: (key, value) => void memoryFallback.set(key, value),
    removeItem: (key) => void memoryFallback.delete(key),
  };
}

function readJson<T>(key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function seedAccounts(): StoredAccount[] {
  return SEED_ROSTER.map(([nick, first, last]) => ({
    firstName: first,
    lastName: last,
    nickName: nick,
    email: `${nick}@northwind.team`,
    digest: `${nick}::${DEMO_PASSWORD}::chatflow`,
  }));
}

function loadAccounts(): StoredAccount[] {
  const stored = readJson<StoredAccount[]>(ACCOUNTS_KEY);
  if (Array.isArray(stored) && stored.length > 0) return stored;

  const seeded = seedAccounts();
  writeJson(ACCOUNTS_KEY, seeded);
  return seeded;
}

function toProfile(account: StoredAccount): UserProfile {
  return {
    firstName: account.firstName,
    lastName: account.lastName,
    nickName: account.nickName,
    email: account.email,
  };
}

export function loadSession(): UserProfile | null {
  const stored = readJson<UserProfile>(SESSION_KEY);
  if (stored === null || typeof stored.nickName !== 'string') return null;

  const account = loadAccounts().find((item) => item.nickName === stored.nickName);
  return account === undefined ? null : toProfile(account);
}

export function saveSession(profile: UserProfile): void {
  writeJson(SESSION_KEY, profile);
}

export function clearSession(): void {
  try {
    storage().removeItem(SESSION_KEY);
  } catch {
    return;
  }
}

export function register(input: RegisterInput): AuthResult {
  const email = input.email.trim().toLowerCase();
  const accounts = loadAccounts();

  if (accounts.some((item) => item.nickName === input.nickName)) {
    return {
      ok: false,
      error: { field: 'nickName', message: `@${input.nickName} is taken. Pick another nickname.` },
    };
  }

  if (accounts.some((item) => item.email.toLowerCase() === email)) {
    return {
      ok: false,
      error: { field: 'email', message: 'That email already has an account. Sign in instead.' },
    };
  }

  const account: StoredAccount = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    nickName: input.nickName,
    email,
    digest: `${input.nickName}::${input.password}::chatflow`,
  };

  writeJson(ACCOUNTS_KEY, [...accounts, account]);
  return { ok: true, profile: toProfile(account) };
}

export function login(input: LoginInput): AuthResult {
  const raw = input.identifier.trim();
  const nickName = raw.startsWith('@') ? raw.slice(1) : raw;
  const email = raw.toLowerCase();

  const account = loadAccounts().find(
    (item) => item.nickName === nickName || item.email.toLowerCase() === email,
  );

  const rejection: AuthResult = {
    ok: false,
    error: { field: 'form', message: 'Those credentials do not match an account.' },
  };

  if (account === undefined) return rejection;
  if (account.digest !== `${account.nickName}::${input.password}::chatflow`) return rejection;

  return { ok: true, profile: toProfile(account) };
}

export function resetRegistry(): void {
  memoryFallback.clear();
  try {
    storage().removeItem(ACCOUNTS_KEY);
    storage().removeItem(SESSION_KEY);
  } catch {
    return;
  }
}
