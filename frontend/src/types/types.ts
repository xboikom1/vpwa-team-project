export type PresenceStatus = 'online' | 'dnd' | 'offline';

export type NotificationFilter = 'all' | 'mentions';

export interface UserProfile {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
}

export type AuthField = 'firstName' | 'lastName' | 'nickName' | 'email' | 'password' | 'identifier';

export interface RegisterInput extends UserProfile {
  password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface AuthFailure {
  field: AuthField | 'form';
  message: string;
}

export type AuthResult = { ok: true; profile: UserProfile } | { ok: false; error: AuthFailure };
