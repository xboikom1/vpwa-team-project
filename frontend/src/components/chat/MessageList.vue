<template>
  <div ref="root" class="rl-msgs">
    <div v-if="messages.messages.length === 0" class="rl-empty rl-empty--pane">
      <p class="rl-empty__title">#{{ channelName }}</p>
      <p class="rl-empty__body">No messages in #{{ channelName }} yet.</p>
    </div>

    <q-chat-message
      v-for="message in messages.messages"
      :key="message.id"
      :class="{ 'rl-msg--mention': mentionsMe(message) }"
      :name="`@${message.author}`"
      :text="[message.text]"
      :stamp="formatTimeAgo(message.createdAt)"
      :sent="message.author === me"
    />
  </div>
</template>

<script setup lang="ts">
import { scroll } from 'quasar';
import { computed, onMounted, useTemplateRef, watch } from 'vue';

import { useAuthStore } from '@/stores/auth-store';
import { useMessageStore } from '@/stores/message-store';
import type { Message } from '@/types/types';
import { formatTimeAgo, isMentioned } from '@/utils/format';

const { channelName } = defineProps<{
  channelName: string;
}>();

const auth = useAuthStore();
const messages = useMessageStore();

const rootRef = useTemplateRef<HTMLElement>('root');

const me = computed(() => auth.profile?.nickName ?? '');

function mentionsMe(message: Message): boolean {
  return message.author !== me.value && isMentioned(message.text, me.value);
}

function scrollToBottom(): void {
  if (rootRef.value === null) return;

  const target = scroll.getScrollTarget(rootRef.value);
  scroll.setVerticalScrollPosition(target, scroll.getScrollHeight(target), 0);
}

watch(
  () => channelName,
  (name) => messages.open(name),
  { immediate: true },
);

watch(() => messages.messages, scrollToBottom, { flush: 'post' });

onMounted(scrollToBottom);
</script>
