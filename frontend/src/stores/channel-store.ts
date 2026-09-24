import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as mockChannels from '@/services/mock-channels';
import { useAuthStore } from '@/stores/auth-store';
import type { ChannelVisibility, JoinedChannel, PendingInvitation } from '@/types/types';

export const useChannelStore = defineStore('channels', () => {
  const auth = useAuthStore();

  const channels = ref<JoinedChannel[]>([]);
  const invitations = ref<PendingInvitation[]>([]);

  const publicChannels = computed(() =>
    channels.value.filter((channel) => channel.visibility === 'public'),
  );

  const privateChannels = computed(() =>
    channels.value.filter((channel) => channel.visibility === 'private'),
  );

  function load(): void {
    if (auth.profile === null) {
      channels.value = [];
      invitations.value = [];
      return;
    }

    channels.value = mockChannels.listChannels(auth.profile.nickName);
    invitations.value = mockChannels.listInvitations(auth.profile.nickName);
  }

  function findChannel(channelName: string): JoinedChannel | undefined {
    return channels.value.find((channel) => channel.name === channelName);
  }

  function runAsUser(action: (nickName: string) => string | null): string | null {
    if (auth.profile === null) return 'Sign in to manage channels.';

    const error = action(auth.profile.nickName);
    load();
    return error;
  }

  function create(channelName: string, visibility: ChannelVisibility): string | null {
    return runAsUser((nickName) => mockChannels.createChannel(nickName, channelName, visibility));
  }

  function leave(channelName: string): string | null {
    return runAsUser((nickName) => mockChannels.leaveChannel(nickName, channelName));
  }

  function remove(channelName: string): string | null {
    return runAsUser((nickName) => mockChannels.deleteChannel(nickName, channelName));
  }

  function acceptInvitation(channelName: string): string | null {
    return runAsUser((nickName) => mockChannels.acceptInvitation(nickName, channelName));
  }

  function declineInvitation(channelName: string): string | null {
    return runAsUser((nickName) => mockChannels.declineInvitation(nickName, channelName));
  }

  return {
    channels,
    invitations,
    publicChannels,
    privateChannels,
    load,
    findChannel,
    create,
    leave,
    remove,
    acceptInvitation,
    declineInvitation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelStore, import.meta.hot));
}
