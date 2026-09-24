<template>
  <div class="rl-invite">
    <span class="rl-invite__top">
      <span class="rl-ch__sigil">
        <AppIcon v-if="invitation.visibility === 'private'" name="lock" :size="12" />
        <template v-else>#</template>
      </span>
      <span class="rl-ch__name">{{ invitation.channelName }}</span>
      <span class="rl-badge rl-badge--soft">Invited</span>
    </span>

    <span class="rl-invite__sub">
      Invited by <span class="rl-invite__by">@{{ invitation.invitedBy }}</span> ·
      {{ formatTimeAgo(invitation.createdAt) }}
    </span>

    <span class="rl-invite__actions">
      <button
        :class="['rl-btn', 'rl-btn--primary', 'rl-btn--sm', { 'rl-tap': tap }]"
        type="button"
        @click="emit('accept', invitation)"
      >
        Accept
      </button>
      <button
        :class="['rl-btn', 'rl-btn--sm', { 'rl-tap': tap }]"
        type="button"
        @click="emit('decline', invitation)"
      >
        Decline
      </button>
    </span>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue';
import type { PendingInvitation } from '@/types/types';
import { formatTimeAgo } from '@/utils/format';

const { invitation, tap = false } = defineProps<{
  invitation: PendingInvitation;
  tap?: boolean;
}>();

const emit = defineEmits<{
  accept: [invitation: PendingInvitation];
  decline: [invitation: PendingInvitation];
}>();
</script>
