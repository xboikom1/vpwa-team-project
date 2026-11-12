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

export interface UserSettings {
  notificationFilter: NotificationFilter;
}

export interface Account {
  profile: UserProfile;
  settings: UserSettings;
}

export type AuthResult = ({ ok: true } & Account) | { ok: false; error: AuthFailure };

export type ChannelVisibility = 'public' | 'private';

export type ChannelRole = 'admin' | 'member';

export interface Channel {
  name: string;
  visibility: ChannelVisibility;
  createdAt: string;
  lastActivityAt: string;
}

export interface ChannelMember {
  nickName: string;
  role: ChannelRole;
  joinedAt: string;
}

export interface JoinedChannel extends Channel {
  role: ChannelRole;
  unread: number;
}

export interface PendingInvitation {
  channelName: string;
  nickName: string;
  invitedBy: string;
  createdAt: string;
  visibility: ChannelVisibility;
}

export type ChannelRemovalReason = 'deleted' | 'revoked' | 'banned';

export type InviteResult = { ok: true; restored: boolean } | { ok: false; error: string };

export type KickResult =
  { ok: true; votes: number; required: number; banned: boolean } | { ok: false; error: string };

export interface Message {
  id: number;
  channelName: string;
  author: string;
  text: string;
  createdAt: string;
}

export type CommandInput =
  | { kind: 'message'; text: string }
  | { kind: 'join'; channelName: string; visibility: ChannelVisibility }
  | { kind: 'invite' | 'revoke' | 'kick'; nickName: string }
  | { kind: 'quit' | 'cancel' | 'list' }
  | { kind: 'error'; message: string };
