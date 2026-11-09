import { ApiError, request } from '@/services/api';
import type { Message } from '@/types/types';

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
}

export type SendResult = { ok: true; message: Message } | { ok: false; error: string };

interface ServerMessage {
  id: number;
  channelName: string;
  author: string;
  text: string;
  createdAt: string;
}

function toMessage(message: ServerMessage): Message {
  return {
    id: message.id,
    channelName: message.channelName,
    author: message.author,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export async function fetchMessages(channelName: string, before?: number): Promise<MessagePage> {
  const query = before === undefined ? '' : `?before=${before}`;
  const { data, meta } = await request<{ data: ServerMessage[]; meta: { hasMore: boolean } }>(
    `/channels/${encodeURIComponent(channelName)}/messages${query}`,
  );

  return { messages: data.map(toMessage), hasMore: meta.hasMore };
}

export async function sendMessage(channelName: string, text: string): Promise<SendResult> {
  try {
    const { data } = await request<{ data: ServerMessage }>(
      `/channels/${encodeURIComponent(channelName)}/messages`,
      { method: 'POST', body: { text } },
    );
    return { ok: true, message: toMessage(data) };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
    return { ok: false, error: message };
  }
}

export async function markChannelRead(channelName: string): Promise<void> {
  try {
    await request(`/channels/${encodeURIComponent(channelName)}/read`, { method: 'POST' });
  } catch {
    return;
  }
}
