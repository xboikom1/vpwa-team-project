import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, watch } from 'vue';

import * as mockChannels from '@/services/mock-channels';
import { notifyMessage } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';
import type { Message } from '@/types/types';

const SIMULATED_RECIPIENT = 'johndoe';

export const useMessageStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const channels = useChannelStore();

  const messages = ref<Message[]>([]);
  const unread = ref<Record<string, number>>({});

  let openChannel = '';
  let offlineSince: string | null = null;

  function refreshUnread(): void {
    const me = auth.profile?.nickName;
    if (me === undefined) {
      unread.value = {};
      return;
    }

    mockChannels.markRead(me, openChannel, offlineSince ?? new Date().toISOString());
    unread.value = mockChannels.countUnread(me, offlineSince);
  }

  function open(channelName: string): void {
    openChannel = channelName;

    const me = auth.profile?.nickName;
    if (me === undefined) {
      messages.value = [];
      return;
    }

    const since = offlineSince;
    const all = mockChannels.listMessages(me, channelName);
    messages.value =
      since === null
        ? all
        : all.filter((message) => message.author === me || message.createdAt <= since);

    refreshUnread();
  }

  function send(channelName: string, text: string): string | null {
    if (auth.profile === null) return 'Sign in to send messages.';

    const error = mockChannels.postMessage(auth.profile.nickName, channelName, text);
    open(channelName);
    return error;
  }

  function receive(message: Message): void {
    if (auth.presence === 'offline') return;

    if (message.channelName === openChannel) messages.value.push(message);
    refreshUnread();
    notifyMessage(message);
  }

  function receiveSimulated(): void {
    if (auth.profile?.nickName !== SIMULATED_RECIPIENT) return;

    const message = mockChannels.receiveSimulatedMessage(
      auth.profile.nickName,
      openChannel,
      auth.presence === 'offline',
    );
    if (message !== null) receive(message);
  }

  function receiveTyped(channelName: string, author: string, text: string): void {
    const message = mockChannels.receiveTypedMessage(author, channelName, text);
    if (message !== null) receive(message);
  }

  watch(
    () => auth.presence,
    (presence, previous) => {
      if (presence === 'offline') {
        offlineSince = new Date().toISOString();
        return;
      }
      if (previous !== 'offline') return;

      offlineSince = null;
      open(openChannel);
      channels.load();
    },
  );

  watch(() => auth.profile?.nickName, refreshUnread, { immediate: true });

  return {
    messages,
    unread,
    open,
    send,
    receiveSimulated,
    receiveTyped,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot));
}
