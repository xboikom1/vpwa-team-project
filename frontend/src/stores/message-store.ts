import { AppVisibility } from 'quasar';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import * as messageApi from '@/services/message-api';
import type { MessagePage } from '@/services/message-api';
import { notifyMessage } from '@/services/notifications';
import { connectRealtime, disconnectRealtime } from '@/services/realtime';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';
import type { Message } from '@/types/types';

export const useMessageStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const channels = useChannelStore();
  const router = useRouter();

  const messages = ref<Message[]>([]);
  const hasMore = ref(false);
  const loaded = ref(false);

  let openChannel = '';

  function reset(): void {
    messages.value = [];
    hasMore.value = false;
    loaded.value = false;
  }

  function append(message: Message): void {
    if (message.channelName !== openChannel) return;
    if (messages.value.some((item) => item.id === message.id)) return;
    messages.value.push(message);
  }

  function applyLatestPage(page: MessagePage): void {
    const newestId = messages.value.at(-1)?.id ?? 0;
    const oldestInPage = page.messages[0]?.id;

    if (oldestInPage !== undefined && oldestInPage <= newestId) {
      messages.value.push(...page.messages.filter((message) => message.id > newestId));
      return;
    }

    messages.value = page.messages;
    hasMore.value = page.hasMore;
  }

  function markRead(channelName: string): void {
    channels.clearUnread(channelName);
    void messageApi.markChannelRead(channelName);
  }

  async function fetchLatest(channelName: string): Promise<void> {
    try {
      const page = await messageApi.fetchMessages(channelName);
      if (openChannel === channelName) applyLatestPage(page);
    } catch {
      return;
    } finally {
      if (openChannel === channelName) loaded.value = true;
    }
  }

  async function loadOlder(): Promise<boolean> {
    const channelName = openChannel;
    const oldestId = messages.value[0]?.id;
    if (!hasMore.value || oldestId === undefined) return false;

    const page = await messageApi.fetchMessages(channelName, oldestId);
    if (openChannel !== channelName || messages.value[0]?.id !== oldestId) return hasMore.value;

    messages.value = [...page.messages, ...messages.value];
    hasMore.value = page.hasMore;
    return page.hasMore;
  }

  async function open(channelName: string): Promise<void> {
    openChannel = channelName;
    reset();
    if (channelName === '' || auth.profile === null) return;

    await fetchLatest(channelName);
    if (openChannel === channelName) markRead(channelName);
  }

  function close(): void {
    openChannel = '';
    reset();
  }

  async function send(channelName: string, text: string): Promise<string | null> {
    if (auth.profile === null) return 'Sign in to send messages.';

    const result = await messageApi.sendMessage(channelName, text);
    if (!result.ok) return result.error;

    append(result.message);
    return null;
  }

  function showChannel(channelName: string): void {
    void router.push({ name: 'channel', params: { channelName } });
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

    notifyMessage(message, () => showChannel(message.channelName));
  }

  async function refresh(): Promise<void> {
    await channels.load();
    if (openChannel === '') return;

    await fetchLatest(openChannel);
    if (AppVisibility.appVisible) markRead(openChannel);
  }

  function start(): void {
    const nickName = auth.profile?.nickName;
    if (nickName === undefined) return;

    connectRealtime(nickName, {
      onMessage: receive,
      onInvitation: channels.receiveInvitation,
      onChannelRemoved: channels.receiveRemoval,
      onMembersChanged: channels.receiveMembersChanged,
      onReconnect: () => void refresh(),
    });
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
    hasMore,
    loaded,
    open,
    close,
    loadOlder,
    send,
    start,
    stop,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot));
}
