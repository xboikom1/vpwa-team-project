import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as mockChannels from '@/services/mock-channels';
import { useAuthStore } from '@/stores/auth-store';
import type {
  ChannelMember,
  ChannelVisibility,
  JoinedChannel,
  KickResult,
  PendingInvitation,
} from '@/types/types';

export const useChannelStore = defineStore('channels', () => {
  const auth = useAuthStore();

  const channels = ref<JoinedChannel[]>([]);
  const invitations = ref<PendingInvitation[]>([]);
  const members = ref<ChannelMember[]>([]);

  let membersOf = '';

  const publicChannels = computed(() =>
    channels.value.filter((channel) => channel.visibility === 'public'),
  );

  const privateChannels = computed(() =>
    channels.value.filter((channel) => channel.visibility === 'private'),
  );

  function refreshMembers(): void {
    members.value =
      auth.profile === null || membersOf === ''
        ? []
        : mockChannels.listMembers(auth.profile.nickName, membersOf);
  }

  function load(): void {
    if (auth.profile === null) {
      channels.value = [];
      invitations.value = [];
      members.value = [];
      return;
    }

    channels.value = mockChannels.listChannels(auth.profile.nickName);
    invitations.value = mockChannels.listInvitations(auth.profile.nickName);
    refreshMembers();
  }

  function loadMembers(channelName: string): void {
    membersOf = channelName;
    refreshMembers();
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

  function join(channelName: string, visibility: ChannelVisibility): string | null {
    return runAsUser((nickName) => mockChannels.joinChannel(nickName, channelName, visibility));
  }

  function invite(channelName: string, target: string): string | null {
    return runAsUser((nickName) => mockChannels.inviteMember(nickName, channelName, target));
  }

  function revoke(channelName: string, target: string): string | null {
    return runAsUser((nickName) => mockChannels.revokeMember(nickName, channelName, target));
  }

  function kick(channelName: string, target: string): KickResult {
    if (auth.profile === null) return { ok: false, error: 'Sign in to manage channels.' };

    const result = mockChannels.kickMember(auth.profile.nickName, channelName, target);
    load();
    return result;
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
    members,
    publicChannels,
    privateChannels,
    load,
    loadMembers,
    findChannel,
    create,
    join,
    invite,
    revoke,
    kick,
    leave,
    remove,
    acceptInvitation,
    declineInvitation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelStore, import.meta.hot));
}
