<template>
  <span :class="['rl-av-wrap', ringClass]">
    <span :class="['rl-av', sizeClass]">{{ nick.charAt(0) }}</span>
    <i v-if="presence" :class="['rl-dot', `rl-dot--${presence}`]" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { PresenceStatus } from '@/types/types';

const {
  nick,
  presence = null,
  size = 'md',
  on = 'surface',
} = defineProps<{
  nick: string;
  presence?: PresenceStatus | null;
  size?: 'sm' | 'md' | 'lg';
  on?: 'surface' | 'canvas' | 'raised';
}>();

const sizeClass = computed(() => (size === 'md' ? '' : `rl-av--${size}`));

const ringClass = computed(() => {
  if (on === 'canvas') return 'rl-av-wrap--on-canvas';
  if (on === 'raised') return 'rl-av-wrap--on-raised';
  return '';
});
</script>
