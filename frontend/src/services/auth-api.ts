import { ApiError, clearToken, request, setToken } from '@/services/api';
import type {
  Account,
  AuthField,
  AuthFailure,
  AuthResult,
  LoginInput,
  RegisterInput,
  UserProfile,
  UserSettings,
} from '@/types/types';

interface ServerUser extends UserProfile {
  id: number;
  notifyMentionsOnly: boolean;
}

interface SessionPayload {
  data: { user: ServerUser; token: string };
}

interface MePayload {
  data: ServerUser;
}

const AUTH_FIELDS: readonly string[] = [
  'firstName',
  'lastName',
  'nickName',
  'email',
  'password',
  'identifier',
] satisfies AuthField[];

function toProfile(user: ServerUser): UserProfile {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    nickName: user.nickName,
    email: user.email,
  };
}

function toSettings(user: ServerUser): UserSettings {
  return { notificationFilter: user.notifyMentionsOnly ? 'mentions' : 'all' };
}

function toAccount(user: ServerUser): Account {
  return { profile: toProfile(user), settings: toSettings(user) };
}

function toFailure(error: unknown, invalidCredentialsMessage?: string): AuthFailure {
  if (!(error instanceof ApiError)) {
    return { field: 'form', message: 'Something went wrong. Try again.' };
  }

  if (error.status === 422) {
    const item = error.items.find((entry) => entry.field && AUTH_FIELDS.includes(entry.field));
    if (item?.field !== undefined) return { field: item.field as AuthField, message: item.message };
  }

  if (error.status === 429) {
    return { field: 'form', message: 'Too many attempts. Wait a moment and try again.' };
  }

  if (error.status === 400 && invalidCredentialsMessage !== undefined) {
    return { field: 'form', message: invalidCredentialsMessage };
  }

  return { field: 'form', message: error.message };
}

async function openSession(path: string, body: unknown, rejection?: string): Promise<AuthResult> {
  try {
    const { data } = await request<SessionPayload>(path, { method: 'POST', body });
    setToken(data.token);
    return { ok: true, ...toAccount(data.user) };
  } catch (error) {
    return { ok: false, error: toFailure(error, rejection) };
  }
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return openSession('/auth/register', input);
}

export function login(input: LoginInput): Promise<AuthResult> {
  return openSession('/auth/login', input, 'Those credentials do not match an account.');
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST', handleUnauthorized: false });
  } catch {
    return;
  } finally {
    clearToken();
  }
}

export async function fetchCurrentUser(): Promise<Account> {
  try {
    const { data } = await request<MePayload>('/auth/me', { handleUnauthorized: false });
    return toAccount(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearToken();
    throw error;
  }
}

export async function updateSettings(settings: UserSettings): Promise<UserSettings> {
  const { data } = await request<MePayload>('/auth/me', {
    method: 'PATCH',
    body: { notifyMentionsOnly: settings.notificationFilter === 'mentions' },
  });
  return toSettings(data);
}
