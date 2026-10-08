import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

import * as mockChannels from '@/services/mock-channels';
import { notifyMessage } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/types';

const SIMULATED_RECIPIENT = 'johndoe';

export const useMessageStore = defineStore('messages', () => {
  const auth = useAuthStore();

  const messages = ref<Message[]>([]);

  let openChannel = '';

  function open(channelName: string): void {
    openChannel = channelName;
    messages.value =
      auth.profile === null ? [] : mockChannels.listMessages(auth.profile.nickName, channelName);
  }

  function send(channelName: string, text: string): string | null {
    if (auth.profile === null) return 'Sign in to send messages.';

    const error = mockChannels.postMessage(auth.profile.nickName, channelName, text);
    open(channelName);
    return error;
  }

  function receive(message: Message): void {
    if (message.channelName === openChannel) messages.value.push(message);
    notifyMessage(message);
  }

  function receiveSimulated(): void {
    if (auth.profile?.nickName !== SIMULATED_RECIPIENT) return;

    const message = mockChannels.receiveSimulatedMessage(auth.profile.nickName, openChannel);
    if (message !== null) receive(message);
  }

  function receiveTyped(channelName: string, author: string, text: string): void {
    const message = mockChannels.receiveTypedMessage(author, channelName, text);
    if (message !== null) receive(message);
  }

  return {
    messages,
    open,
    send,
    receiveSimulated,
    receiveTyped,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot));
}
