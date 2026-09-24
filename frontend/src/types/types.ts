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

export type ChannelVisibility = 'public' | 'private';

export type ChannelRole = 'admin' | 'member';

export interface Channel {
  name: string;
  visibility: ChannelVisibility;
  createdAt: string;
  lastActivityAt: string;
}

export interface ChannelMember {
  channelName: string;
  nickName: string;
  role: ChannelRole;
  joinedAt: string;
}

export interface Invitation {
  channelName: string;
  nickName: string;
  invitedBy: string;
  createdAt: string;
}

export interface JoinedChannel extends Channel {
  role: ChannelRole;
}

export interface PendingInvitation extends Invitation {
  visibility: ChannelVisibility;
}
