import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import * as channelApi from '@/services/channel-api';
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

  async function load(): Promise<void> {
    const me = auth.profile?.nickName;
    if (me === undefined) {
      reset();
      return;
    }

    try {
      const [joined, pending] = await Promise.all([
        channelApi.fetchChannels(),
        channelApi.fetchInvitations(me),
      ]);

      if (auth.profile?.nickName !== me) return;
      channels.value = joined;
      invitations.value = pending;
    } catch {
      return;
    }

    refreshMembers();
  }

  function reset(): void {
    channels.value = [];
    invitations.value = [];
    members.value = [];
  }

  function loadMembers(channelName: string): void {
    membersOf = channelName;
    refreshMembers();
  }

  function findChannel(channelName: string): JoinedChannel | undefined {
    return channels.value.find((channel) => channel.name === channelName);
  }

  function incrementUnread(channelName: string): void {
    const channel = findChannel(channelName);
    if (channel !== undefined) channel.unread += 1;
  }

  function clearUnread(channelName: string): void {
    const channel = findChannel(channelName);
    if (channel !== undefined) channel.unread = 0;
  }

  async function runRemote(action: () => Promise<string | null>): Promise<string | null> {
    if (auth.profile === null) return 'Sign in to manage channels.';

    const error = await action();
    await load();
    return error;
  }

  function runMock(action: (nickName: string) => string | null): string | null {
    if (auth.profile === null) return 'Sign in to manage channels.';

    const error = action(auth.profile.nickName);
    refreshMembers();
    return error;
  }

  function create(channelName: string, visibility: ChannelVisibility): Promise<string | null> {
    return runRemote(() => channelApi.createChannel(channelName, visibility));
  }

  function join(channelName: string, visibility: ChannelVisibility): Promise<string | null> {
    return runRemote(() => channelApi.joinChannel(channelName, visibility));
  }

  function invite(channelName: string, target: string): string | null {
    return runMock((nickName) => mockChannels.inviteMember(nickName, channelName, target));
  }

  function revoke(channelName: string, target: string): string | null {
    return runMock((nickName) => mockChannels.revokeMember(nickName, channelName, target));
  }

  function kick(channelName: string, target: string): KickResult {
    if (auth.profile === null) return { ok: false, error: 'Sign in to manage channels.' };

    const result = mockChannels.kickMember(auth.profile.nickName, channelName, target);
    refreshMembers();
    return result;
  }

  function leave(channelName: string): Promise<string | null> {
    return runRemote(() => channelApi.leaveChannel(channelName));
  }

  function remove(channelName: string): Promise<string | null> {
    return runRemote(() => channelApi.deleteChannel(channelName));
  }

  function acceptInvitation(channelName: string): Promise<string | null> {
    return runRemote(() => channelApi.acceptInvitation(channelName));
  }

  function declineInvitation(channelName: string): Promise<string | null> {
    return runRemote(() => channelApi.declineInvitation(channelName));
  }

  watch(() => auth.profile?.nickName, reset);

  return {
    channels,
    invitations,
    members,
    publicChannels,
    privateChannels,
    load,
    loadMembers,
    findChannel,
    incrementUnread,
    clearUnread,
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
