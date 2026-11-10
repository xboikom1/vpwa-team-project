import { ApiError, request } from '@/services/api';
import type {
  ChannelMember,
  ChannelRole,
  ChannelVisibility,
  InviteResult,
  JoinedChannel,
  KickResult,
  PendingInvitation,
} from '@/types/types';

interface ServerChannel {
  name: string;
  type: ChannelVisibility;
  createdAt: string;
  lastMessageAt: string;
  role: ChannelRole;
  unread: number;
}

export interface ServerInvitation {
  channelName: string;
  type: ChannelVisibility;
  invitedBy: string;
  createdAt: string;
}

interface ServerMember {
  nickName: string;
  role: ChannelRole;
  joinedAt: string;
}

interface ServerKick {
  votes: number;
  required: number;
  banned: boolean;
}

function toChannel(channel: ServerChannel): JoinedChannel {
  return {
    name: channel.name,
    visibility: channel.type,
    createdAt: channel.createdAt,
    lastActivityAt: channel.lastMessageAt,
    role: channel.role,
    unread: channel.unread,
  };
}

export function toInvitation(invitation: ServerInvitation, nickName: string): PendingInvitation {
  return {
    channelName: invitation.channelName,
    nickName,
    invitedBy: invitation.invitedBy,
    createdAt: invitation.createdAt,
    visibility: invitation.type,
  };
}

function channelPath(name: string, suffix = ''): string {
  return `/channels/${encodeURIComponent(name)}${suffix}`;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
}

async function attempt(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return errorMessage(error);
  }
}

export async function fetchChannels(): Promise<JoinedChannel[]> {
  const { data } = await request<{ data: ServerChannel[] }>('/channels');
  return data.map(toChannel);
}

export async function fetchInvitations(nickName: string): Promise<PendingInvitation[]> {
  const { data } = await request<{ data: ServerInvitation[] }>('/invitations');
  return data.map((invitation) => toInvitation(invitation, nickName));
}

export async function fetchMembers(name: string): Promise<ChannelMember[]> {
  const { data } = await request<{ data: ServerMember[] }>(channelPath(name, '/members'));

  return data.map((member) => ({
    nickName: member.nickName,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
}

export function createChannel(name: string, visibility: ChannelVisibility): Promise<string | null> {
  return attempt(() => request('/channels', { method: 'POST', body: { name, type: visibility } }));
}

export function joinChannel(name: string, visibility: ChannelVisibility): Promise<string | null> {
  return attempt(() =>
    request('/channels/join', { method: 'POST', body: { name, type: visibility } }),
  );
}

export function leaveChannel(name: string): Promise<string | null> {
  return attempt(() => request(channelPath(name, '/membership'), { method: 'DELETE' }));
}

export function deleteChannel(name: string): Promise<string | null> {
  return attempt(() => request(channelPath(name), { method: 'DELETE' }));
}

export async function inviteMember(name: string, nickName: string): Promise<InviteResult> {
  try {
    const { data } = await request<{ data: { restored: boolean } }>(
      channelPath(name, '/invitations'),
      { method: 'POST', body: { nickName } },
    );
    return { ok: true, restored: data.restored };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export function revokeMember(name: string, nickName: string): Promise<string | null> {
  return attempt(() =>
    request(channelPath(name, `/members/${encodeURIComponent(nickName)}`), { method: 'DELETE' }),
  );
}

export async function kickMember(name: string, nickName: string): Promise<KickResult> {
  try {
    const { data } = await request<{ data: ServerKick }>(channelPath(name, '/kicks'), {
      method: 'POST',
      body: { nickName },
    });
    return { ok: true, votes: data.votes, required: data.required, banned: data.banned };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export function acceptInvitation(name: string): Promise<string | null> {
  return attempt(() =>
    request(`/invitations/${encodeURIComponent(name)}/accept`, { method: 'POST' }),
  );
}

export function declineInvitation(name: string): Promise<string | null> {
  return attempt(() => request(`/invitations/${encodeURIComponent(name)}`, { method: 'DELETE' }));
}
