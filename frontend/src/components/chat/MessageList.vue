<template>
  <div class="rl-msgs-pane">
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

    <q-btn
      v-if="isScrolledUp && newMessageCount > 0"
      class="rl-msgs-pane__new"
      rounded
      unelevated
      no-caps
      icon="arrow_downward"
      :label="`${newMessageCount} new ${newMessageCount === 1 ? 'message' : 'messages'}`"
      aria-label="Scroll to new messages"
      @click="showNewMessages"
    />
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
const lastSeenId = ref(0);
const isScrolledUp = ref(false);

const me = computed(() => auth.profile?.nickName ?? '');
const visibleMessages = computed(() => messages.messages.slice(visibleStart.value));
const newMessageCount = computed(
  () => messages.messages.filter((message) => message.id > lastSeenId.value).length,
);

function markLatestSeen(): void {
  lastSeenId.value = messages.messages.at(-1)?.id ?? 0;
}

function showNewMessages(): void {
  scrollToBottom();
  markLatestSeen();
}

function mentionsMe(message: Message): boolean {
  return message.author !== me.value && isMentioned(message.text, me.value);
}

function scrollToBottom(): void {
  const root = rootRef.value;
  if (root === null) return;

  root.scrollTop = root.scrollHeight;
  isScrolledUp.value = false;
  markLatestSeen();
}

async function openChannel(name: string): Promise<void> {
  messages.open(name);
  markLatestSeen();
  visibleStart.value = Math.max(0, messages.messages.length - PAGE_SIZE);
  await nextTick();
  if (channelName !== name) return;
  scrollToBottom();
}

async function loadOlder(): Promise<void> {
  const root = rootRef.value;
  if (root === null || loadingOlder.value || visibleStart.value === 0) return;

  loadingOlder.value = true;
  const previousHeight = root.scrollHeight;
  const previousTop = root.scrollTop;
  visibleStart.value = Math.max(0, visibleStart.value - PAGE_SIZE);

  await nextTick();
  root.scrollTop = previousTop + root.scrollHeight - previousHeight;
  loadingOlder.value = false;
}

function onScroll(): void {
  const root = rootRef.value;
  if (root === null || loadingOlder.value) return;

  isScrolledUp.value = root.scrollHeight - root.clientHeight - root.scrollTop > 2;
  if (!isScrolledUp.value) markLatestSeen();
  if (root.scrollTop <= LOAD_THRESHOLD) void loadOlder();
}

watch(
  () => messages.messages.at(-1)?.id,
  async () => {
    if (isScrolledUp.value) return;

    await nextTick();
    if (!isScrolledUp.value) scrollToBottom();
  },
);

watch(
  () => channelName,
  (name) => void openChannel(name),
  { immediate: true },
);

onMounted(scrollToBottom);
</script>
