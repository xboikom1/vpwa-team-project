import { AppVisibility } from 'quasar';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, watch } from 'vue';

import * as messageApi from '@/services/message-api';
import { notifyMessage } from '@/services/notifications';
import { connectRealtime, disconnectRealtime } from '@/services/realtime';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';
import type { Message } from '@/types/types';

export const useMessageStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const channels = useChannelStore();

  const messages = ref<Message[]>([]);

  let openChannel = '';

  function append(message: Message): void {
    if (message.channelName !== openChannel) return;
    if (messages.value.some((item) => item.id === message.id)) return;
    messages.value.push(message);
  }

  function markRead(channelName: string): void {
    channels.clearUnread(channelName);
    void messageApi.markChannelRead(channelName);
  }

  async function fetchOpen(channelName: string): Promise<void> {
    try {
      const page = await messageApi.fetchMessages(channelName);
      if (openChannel !== channelName) return;
      messages.value = page.messages;
    } catch {
      if (openChannel === channelName) messages.value = [];
    }
  }

  async function open(channelName: string): Promise<void> {
    openChannel = channelName;
    messages.value = [];
    if (channelName === '' || auth.profile === null) return;

    await fetchOpen(channelName);
    if (openChannel === channelName) markRead(channelName);
  }

  function close(): void {
    openChannel = '';
    messages.value = [];
  }

  async function send(channelName: string, text: string): Promise<string | null> {
    if (auth.profile === null) return 'Sign in to send messages.';

    const result = await messageApi.sendMessage(channelName, text);
    if (!result.ok) return result.error;

    append(result.message);
    return null;
  }

  function receive(message: Message): void {
    if (auth.presence === 'offline') return;

    const mine = message.author === auth.profile?.nickName;
    const viewing = message.channelName === openChannel;

    if (viewing) append(message);
    if (mine) return;

    if (channels.findChannel(message.channelName) === undefined) void channels.load();
    if (viewing && AppVisibility.appVisible) markRead(message.channelName);
    else channels.incrementUnread(message.channelName);

    notifyMessage(message);
  }

  async function refresh(): Promise<void> {
    await channels.load();
    if (openChannel === '') return;

    await fetchOpen(openChannel);
    if (AppVisibility.appVisible) markRead(openChannel);
  }

  function start(): void {
    const nickName = auth.profile?.nickName;
    if (nickName === undefined) return;

    connectRealtime(nickName, { onMessage: receive, onReconnect: () => void refresh() });
  }

  function stop(): void {
    disconnectRealtime();
    close();
  }

  watch(
    () => auth.presence,
    (presence, previous) => {
      if (previous === 'offline' && presence !== 'offline') void refresh();
    },
  );

  watch(
    () => AppVisibility.appVisible,
    (visible) => {
      if (visible && openChannel !== '' && auth.presence !== 'offline') markRead(openChannel);
    },
  );

  return {
    messages,
    open,
    close,
    send,
    start,
    stop,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot));
}
