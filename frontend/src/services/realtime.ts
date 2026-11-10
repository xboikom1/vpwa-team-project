import { Transmit } from '@adonisjs/transmit-client';

import { getToken } from '@/services/api';
import { type ServerInvitation, toInvitation } from '@/services/channel-api';
import type { ChannelRemovalReason, Message, PendingInvitation } from '@/types/types';

type RealtimeEvent =
  | { type: 'message.created'; message: Message }
  | { type: 'invitation.created'; invitation: ServerInvitation }
  | { type: 'channel.removed'; channelName: string; reason: ChannelRemovalReason }
  | { type: 'members.changed'; channelName: string };

export interface RealtimeHandlers {
  onMessage: (message: Message) => void;
  onInvitation: (invitation: PendingInvitation) => void;
  onChannelRemoved: (channelName: string, reason: ChannelRemovalReason) => void;
  onMembersChanged: (channelName: string) => void;
  onReconnect: () => void;
}

let transmit: Transmit | null = null;

export function connectRealtime(nickName: string, handlers: RealtimeHandlers): void {
  disconnectRealtime();

  const client = new Transmit({
    baseUrl: new URL(import.meta.env.API_URL).origin,
    beforeSubscribe: (request) => {
      const token = getToken();
      if (token !== null) request.headers.set('Authorization', `Bearer ${token}`);
    },
  });
  transmit = client;

  let connectedBefore = false;
  client.on('connected', () => {
    if (connectedBefore) handlers.onReconnect();
    connectedBefore = true;
  });

  const subscription = client.subscription(`users/${nickName}`);
  subscription.onMessage<RealtimeEvent>((event) => {
    switch (event.type) {
      case 'message.created':
        handlers.onMessage(event.message);
        break;
      case 'invitation.created':
        handlers.onInvitation(toInvitation(event.invitation, nickName));
        break;
      case 'channel.removed':
        handlers.onChannelRemoved(event.channelName, event.reason);
        break;
      case 'members.changed':
        handlers.onMembersChanged(event.channelName);
        break;
    }
  });
  void subscription.create().catch(() => undefined);
}

export function disconnectRealtime(): void {
  transmit?.close();
  transmit = null;
}
