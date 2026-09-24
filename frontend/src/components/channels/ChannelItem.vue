<template>
  <div :class="['rl-ch', { 'is-active': active, 'rl-ch--tap': tap }]">
    <router-link
      class="rl-ch__link"
      :to="{ name: 'channel', params: { channelName: channel.name } }"
      :aria-current="active ? 'page' : undefined"
    >
      <span class="rl-ch__sigil">
        <AppIcon v-if="channel.visibility === 'private'" name="lock" :size="12" />
        <template v-else>#</template>
      </span>
      <span class="rl-ch__name">{{ channel.name }}</span>
    </router-link>

    <span class="rl-ch__end">
      <span v-if="isAdmin" class="rl-badge rl-badge--owner">Admin</span>

      <span class="rl-ch__actions">
        <button
          class="rl-ico"
          type="button"
          title="Leave channel · /cancel"
          :aria-label="`Leave #${channel.name}`"
          @click="emit('leave', channel)"
        >
          <AppIcon name="log-out" />
        </button>

        <button
          v-if="isAdmin"
          class="rl-ico rl-ico--danger"
          type="button"
          title="Delete channel · /quit"
          :aria-label="`Delete #${channel.name}`"
          @click="emit('delete', channel)"
        >
          <AppIcon name="x" />
        </button>
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import AppIcon from '@/components/common/AppIcon.vue';
import type { JoinedChannel } from '@/types/types';

const {
  channel,
  active = false,
  tap = false,
} = defineProps<{
  channel: JoinedChannel;
  active?: boolean;
  tap?: boolean;
}>();

const emit = defineEmits<{
  leave: [channel: JoinedChannel];
  delete: [channel: JoinedChannel];
}>();

const isAdmin = computed(() => channel.role === 'admin');
</script>
