<template>
  <q-page :class="channel ? 'rl-chat' : 'rl-empty rl-empty--pane'" :style-fn="pageStyle">
    <MessageList v-if="channel" :channel-name="channel.name" />

    <template v-else>
      <p class="rl-empty__title">You are not in #{{ channelName }}</p>
      <p class="rl-empty__body">
        Pick a channel from the list, or join a public one with
        <span class="rl-code">/join &lt;channelName&gt;</span>.
      </p>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

import MessageList from '@/components/chat/MessageList.vue';
import { useChannelStore } from '@/stores/channel-store';

const { channelName } = defineProps<{
  channelName: string;
}>();

const channels = useChannelStore();

function pageStyle(offset: number, height: number): CSSProperties {
  const availableHeight = `${height - offset}px`;
  return { height: availableHeight, minHeight: availableHeight };
}

const channel = computed(() => channels.findChannel(channelName));
</script>
