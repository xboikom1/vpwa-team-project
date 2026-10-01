<template>
  <div ref="root" class="rl-msgs rl-scroll" @scroll="onScroll">
    <div v-if="messages.messages.length === 0" class="rl-empty rl-empty--pane">
      <p class="rl-empty__title">#{{ channelName }}</p>
      <p class="rl-empty__body">No messages in #{{ channelName }} yet.</p>
    </div>

    <div v-else class="rl-msgs__list">
      <q-chat-message
        v-for="message in visibleMessages"
        :key="message.id"
        :class="{ 'rl-msg--mention': mentionsMe(message) }"
        :name="`@${message.author}`"
        :text="[message.text]"
        :stamp="formatTimeAgo(message.createdAt)"
        :sent="message.author === me"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useAuthStore } from '@/stores/auth-store';
import { useMessageStore } from '@/stores/message-store';
import type { Message } from '@/types/types';
import { formatTimeAgo, isMentioned } from '@/utils/format';

const { channelName } = defineProps<{
  channelName: string;
}>();

const auth = useAuthStore();
const messages = useMessageStore();

const PAGE_SIZE = 30;
const LOAD_THRESHOLD = 32;

const rootRef = useTemplateRef<HTMLElement>('root');
const visibleStart = ref(0);
const loadingOlder = ref(false);

const me = computed(() => auth.profile?.nickName ?? '');
const visibleMessages = computed(() => messages.messages.slice(visibleStart.value));

function mentionsMe(message: Message): boolean {
  return message.author !== me.value && isMentioned(message.text, me.value);
}

function scrollToBottom(): void {
  const root = rootRef.value;
  if (root === null) return;

  root.scrollTop = root.scrollHeight;
}

async function openChannel(name: string): Promise<void> {
  messages.open(name);
  visibleStart.value = Math.max(0, messages.messages.length - PAGE_SIZE);
  await nextTick();
  scrollToBottom();
}

async function loadOlder(): Promise<void> {
  const root = rootRef.value;
  if (root === null || loadingOlder.value || visibleStart.value === 0) return;

  loadingOlder.value = true;
  const previousHeight = root.scrollHeight;
  visibleStart.value = Math.max(0, visibleStart.value - PAGE_SIZE);

  await nextTick();
  root.scrollTop = root.scrollHeight - previousHeight;
  loadingOlder.value = false;
}

function onScroll(): void {
  const root = rootRef.value;
  if (root !== null && root.scrollTop <= LOAD_THRESHOLD) void loadOlder();
}

watch(
  () => channelName,
  (name) => void openChannel(name),
  { immediate: true },
);

watch(
  () => messages.messages.length,
  (length, previousLength) => {
    if (length > previousLength && !loadingOlder.value) void nextTick(scrollToBottom);
  },
);

onMounted(scrollToBottom);
</script>
