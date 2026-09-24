<template>
  <div class="rl-drawer__body rl-scroll">
    <template v-if="channels.invitations.length > 0">
      <div class="rl-sect">
        Invites <span class="rl-sect__count">{{ channels.invitations.length }}</span>
      </div>

      <div class="rl-invites">
        <InviteCard
          v-for="invitation in channels.invitations"
          :key="invitation.channelName"
          :invitation="invitation"
          :tap="tap"
          @accept="accept"
          @decline="decline"
        />
      </div>
    </template>

    <template v-for="section in sections" :key="section.title">
      <div class="rl-sect">
        {{ section.title }} <span class="rl-sect__count">{{ section.items.length }}</span>
      </div>

      <ChannelItem
        v-for="channel in section.items"
        :key="channel.name"
        :channel="channel"
        :active="channel.name === activeName"
        :tap="tap"
        @leave="confirmLeave"
        @delete="confirmDelete"
      />

      <p v-if="section.items.length === 0" class="rl-empty">
        {{ section.empty }} Type <span class="rl-code">{{ section.command }}</span
        >.
      </p>
    </template>

    <div class="rl-channels__new">
      <button
        :class="['rl-btn', 'rl-btn--outline', { 'rl-tap': tap }]"
        type="button"
        @click="openCreate"
      >
        <AppIcon name="plus" :size="14" />
        New channel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import ChannelItem from '@/components/channels/ChannelItem.vue';
import CreateChannelDialog from '@/components/channels/CreateChannelDialog.vue';
import InviteCard from '@/components/channels/InviteCard.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { useChannelStore } from '@/stores/channel-store';
import type { JoinedChannel, PendingInvitation } from '@/types/types';

const { activeName, tap = false } = defineProps<{
  activeName: string;
  tap?: boolean;
}>();

const $q = useQuasar();
const router = useRouter();
const channels = useChannelStore();

const sections = computed(() => [
  {
    title: 'Public channels',
    items: channels.publicChannels,
    empty: 'No channels yet.',
    command: '/join <channelName>',
  },
  {
    title: 'Private channels',
    items: channels.privateChannels,
    empty: 'No private channels.',
    command: '/join <channelName> private',
  },
]);

function openChannel(channelName: string): void {
  void router.push({ name: 'channel', params: { channelName } });
}

function showError(message: string): void {
  $q.dialog({
    component: ConfirmDialog,
    componentProps: { title: 'Action failed', message, confirmLabel: 'OK', hideCancel: true },
  });
}

function afterRemoval(channelName: string): void {
  if (channelName === activeName) void router.replace({ name: 'workspace' });
}

function openCreate(): void {
  $q.dialog({ component: CreateChannelDialog }).onOk((channelName: string) => {
    openChannel(channelName);
  });
}

function confirmLeave(channel: JoinedChannel): void {
  const message =
    channel.role === 'admin'
      ? `You are the admin of #${channel.name}, so leaving deletes it for every member.`
      : `#${channel.name} will disappear from your list.`;

  $q.dialog({
    component: ConfirmDialog,
    componentProps: {
      title: `Leave #${channel.name}?`,
      message,
      confirmLabel: 'Leave channel',
      danger: channel.role === 'admin',
    },
  }).onOk(() => {
    const error = channels.leave(channel.name);
    if (error !== null) return showError(error);
    afterRemoval(channel.name);
  });
}

function confirmDelete(channel: JoinedChannel): void {
  $q.dialog({
    component: ConfirmDialog,
    componentProps: {
      title: `Delete #${channel.name}?`,
      message: 'The channel and its history are removed for every member. This cannot be undone.',
      confirmLabel: 'Delete channel',
      danger: true,
    },
  }).onOk(() => {
    const error = channels.remove(channel.name);
    if (error !== null) return showError(error);
    afterRemoval(channel.name);
  });
}

function accept(invitation: PendingInvitation): void {
  const error = channels.acceptInvitation(invitation.channelName);
  if (error !== null) return showError(error);
  openChannel(invitation.channelName);
}

function decline(invitation: PendingInvitation): void {
  const error = channels.declineInvitation(invitation.channelName);
  if (error !== null) showError(error);
}
</script>
