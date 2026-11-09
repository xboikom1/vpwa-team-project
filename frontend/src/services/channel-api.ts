import { ApiError, request } from '@/services/api';
import type {
  ChannelRole,
  ChannelVisibility,
  JoinedChannel,
  PendingInvitation,
} from '@/types/types';

interface ServerChannel {
  name: string;
  type: ChannelVisibility;
  createdAt: string;
  lastMessageAt: string;
  role: ChannelRole;
}

interface ServerInvitation {
  channelName: string;
  type: ChannelVisibility;
  invitedBy: string;
  createdAt: string;
}

function toChannel(channel: ServerChannel): JoinedChannel {
  return {
    name: channel.name,
    visibility: channel.type,
    createdAt: channel.createdAt,
    lastActivityAt: channel.lastMessageAt,
    role: channel.role,
  };
}

async function attempt(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
  }
}

export async function fetchChannels(): Promise<JoinedChannel[]> {
  const { data } = await request<{ data: ServerChannel[] }>('/channels');
  return data.map(toChannel);
}

export async function fetchInvitations(nickName: string): Promise<PendingInvitation[]> {
  const { data } = await request<{ data: ServerInvitation[] }>('/invitations');

  return data.map((invitation) => ({
    channelName: invitation.channelName,
    nickName,
    invitedBy: invitation.invitedBy,
    createdAt: invitation.createdAt,
    visibility: invitation.type,
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
  return attempt(() =>
    request(`/channels/${encodeURIComponent(name)}/membership`, { method: 'DELETE' }),
  );
}

export function deleteChannel(name: string): Promise<string | null> {
  return attempt(() => request(`/channels/${encodeURIComponent(name)}`, { method: 'DELETE' }));
}

export function acceptInvitation(name: string): Promise<string | null> {
  return attempt(() =>
    request(`/invitations/${encodeURIComponent(name)}/accept`, { method: 'POST' }),
  );
}

export function declineInvitation(name: string): Promise<string | null> {
  return attempt(() => request(`/invitations/${encodeURIComponent(name)}`, { method: 'DELETE' }));
}
