import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

import * as mockChannels from '@/services/mock-channels';
import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/types';

export const useMessageStore = defineStore('messages', () => {
  const auth = useAuthStore();

  const messages = ref<Message[]>([]);

  function open(channelName: string): void {
    messages.value =
      auth.profile === null ? [] : mockChannels.listMessages(auth.profile.nickName, channelName);
  }

  function send(channelName: string, text: string): string | null {
    if (auth.profile === null) return 'Sign in to send messages.';

    const error = mockChannels.postMessage(auth.profile.nickName, channelName, text);
    open(channelName);
    return error;
  }

  return {
    messages,
    open,
    send,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot));
}
