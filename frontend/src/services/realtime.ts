import { Transmit } from '@adonisjs/transmit-client';

import { getToken } from '@/services/api';
import type { Message } from '@/types/types';

interface MessageCreatedEvent {
  type: 'message.created';
  message: Message;
}

export interface RealtimeHandlers {
  onMessage: (message: Message) => void;
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
  subscription.onMessage<MessageCreatedEvent>((event) => {
    if (event.type === 'message.created') handlers.onMessage(event.message);
  });
  void subscription.create().catch(() => undefined);
}

export function disconnectRealtime(): void {
  transmit?.close();
  transmit = null;
}
