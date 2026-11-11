import { Notify } from 'quasar';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import * as channelApi from '@/services/channel-api';
import { useAuthStore } from '@/stores/auth-store';
import type {
  ChannelMember,
  ChannelRemovalReason,
  ChannelVisibility,
  InviteResult,
  JoinedChannel,
  KickResult,
  PendingInvitation,
} from '@/types/types';

const SIGN_IN = 'Sign in to manage channels.';

const REMOVAL_MESSAGES: Record<ChannelRemovalReason, (channelName: string) => string> = {
  deleted: (channelName) => `#${channelName} was deleted by its admin.`,
  revoked: (channelName) => `You were removed from #${channelName}.`,
  banned: (channelName) => `You were banned from #${channelName}.`,
};

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

  async function refreshMembers(): Promise<void> {
    const channelName = membersOf;
    if (auth.profile === null || findChannel(channelName) === undefined) {
      members.value = [];
      return;
    }

    try {
      const list = await channelApi.fetchMembers(channelName);
      if (membersOf === channelName) members.value = list;
    } catch {
      if (membersOf === channelName) members.value = [];
    }
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

    await refreshMembers();
  }

  function reset(): void {
    channels.value = [];
    invitations.value = [];
    members.value = [];
  }

  function loadMembers(channelName: string): Promise<void> {
    membersOf = channelName;
    return refreshMembers();
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
    if (auth.profile === null) return SIGN_IN;

    const error = await action();
    await load();
    return error;
  }

  function create(channelName: string, visibility: ChannelVisibility): Promise<string | null> {
    return runRemote(() => channelApi.createChannel(channelName, visibility));
  }

  function join(channelName: string, visibility: ChannelVisibility): Promise<string | null> {
    return runRemote(() => channelApi.joinChannel(channelName, visibility));
  }

  async function invite(channelName: string, target: string): Promise<InviteResult> {
    if (auth.profile === null) return { ok: false, error: SIGN_IN };
    return channelApi.inviteMember(channelName, target);
  }

  async function revoke(channelName: string, target: string): Promise<string | null> {
    if (auth.profile === null) return SIGN_IN;

    const error = await channelApi.revokeMember(channelName, target);
    if (error === null && membersOf === channelName) await refreshMembers();
    return error;
  }

  async function kick(channelName: string, target: string): Promise<KickResult> {
    if (auth.profile === null) return { ok: false, error: SIGN_IN };

    const result = await channelApi.kickMember(channelName, target);
    if (result.ok && result.banned && membersOf === channelName) await refreshMembers();
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

  /**
   * Live event: someone invited the user. The invite is pinned to the top of the list.
   */
  function receiveInvitation(invitation: PendingInvitation): void {
    invitations.value = [
      invitation,
      ...invitations.value.filter((item) => item.channelName !== invitation.channelName),
    ];

    Notify.create({
      type: 'info',
      message: `@${invitation.invitedBy} invited you to #${invitation.channelName}.`,
    });
  }

  /**
   * Live event: the user lost access to a channel (deleted, revoked or banned).
   */
  function receiveRemoval(channelName: string, reason: ChannelRemovalReason): void {
    const wasMember = findChannel(channelName) !== undefined;
    const wasInvited = invitations.value.some((item) => item.channelName === channelName);
    if (!wasMember && !wasInvited) return;

    channels.value = channels.value.filter((channel) => channel.name !== channelName);
    invitations.value = invitations.value.filter((item) => item.channelName !== channelName);
    if (membersOf === channelName) members.value = [];

    Notify.create({
      type: 'warning',
      message: wasMember
        ? REMOVAL_MESSAGES[reason](channelName)
        : `Your invitation to #${channelName} was withdrawn.`,
    });
  }

  /**
   * Live event: someone joined or left a channel the user is in.
   */
  function receiveMembersChanged(channelName: string): void {
    if (channelName === membersOf) void refreshMembers();
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
    receiveInvitation,
    receiveRemoval,
    receiveMembersChanged,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelStore, import.meta.hot));
}
