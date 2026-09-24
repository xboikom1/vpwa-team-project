<template>
  <template v-if="channel">
    <span class="rl-hdr__title"><span class="rl-hash">#</span>{{ channel.name }}</span>

    <span class="rl-chip">
      <AppIcon :name="channel.visibility === 'private' ? 'lock' : 'hash'" :size="11" />
      {{ channel.visibility === 'private' ? 'Private' : 'Public' }}
    </span>

    <span class="rl-hdr__sep" />

    <span :class="['rl-chip', { 'rl-chip--accent': channel.role === 'admin' }]">
      {{ channel.role === 'admin' ? 'Admin' : 'Member' }}
    </span>
  </template>

  <template v-else>
    <span class="rl-hdr__title">No channel</span>
    <span class="rl-hdr__sep" />
    <span class="rl-hdr__meta">{{ WORKSPACE_NAME }}</span>
  </template>
</template>

<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue';
import { WORKSPACE_NAME } from '@/services/mock-auth';
import type { JoinedChannel } from '@/types/types';

defineProps<{
  channel: JoinedChannel | undefined;
}>();
</script>
