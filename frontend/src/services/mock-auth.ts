import type { AuthResult, LoginInput, RegisterInput, UserProfile } from '@/types/types';

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

function seedAccounts(): StoredAccount[] {
  return SEED_ROSTER.map(([nick, first, last]) => ({
    firstName: first,
    lastName: last,
    nickName: nick,
    email: `${nick}@northwind.team`,
    digest: `${nick}::${DEMO_PASSWORD}::chatflow`,
  }));
}

let accounts = seedAccounts();

function toProfile(account: StoredAccount): UserProfile {
  return {
    firstName: account.firstName,
    lastName: account.lastName,
    nickName: account.nickName,
    email: account.email,
  };
}

export function hasAccount(nickName: string): boolean {
  return accounts.some((item) => item.nickName === nickName);
}

export function register(input: RegisterInput): AuthResult {
  const email = input.email.trim().toLowerCase();

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

  accounts = [...accounts, account];
  return { ok: true, profile: toProfile(account) };
}

export function login(input: LoginInput): AuthResult {
  const raw = input.identifier.trim();
  const nickName = raw.startsWith('@') ? raw.slice(1) : raw;
  const email = raw.toLowerCase();

  const account = accounts.find(
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
