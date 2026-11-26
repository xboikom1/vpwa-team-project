<template>
  <div class="rl-msgs-pane">
    <div ref="root" class="rl-msgs rl-scroll" @scroll="onScroll">
      <div v-if="!messages.loaded" class="rl-msgs__loading">
        <q-spinner-dots size="24px" />
      </div>

      <div v-else-if="messages.messages.length === 0" class="rl-empty rl-empty--pane">
        <p class="rl-empty__title">#{{ channelName }}</p>
        <p class="rl-empty__body">No messages in #{{ channelName }} yet.</p>
      </div>

      <q-infinite-scroll
        v-else
        ref="history"
        class="rl-msgs__list"
        reverse
        :offset="LOAD_OFFSET"
        :scroll-target="rootRef ?? undefined"
        @load="loadOlder"
      >
        <template #loading>
          <div class="rl-msgs__loading">
            <q-spinner-dots size="24px" />
          </div>
        </template>

        <q-chat-message
          v-for="message in messages.messages"
          :key="message.id"
          :class="{ 'rl-msg--mention': mentionsMe(message) }"
          :name="`@${message.author}`"
          :text="[message.text]"
          :stamp="formatTimeAgo(message.createdAt)"
          :sent="message.author === me"
        />
      </q-infinite-scroll>
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
import { type QInfiniteScroll, useQuasar } from 'quasar';
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';

import { useAuthStore } from '@/stores/auth-store';
import { useMessageStore } from '@/stores/message-store';
import type { Message } from '@/types/types';
import { formatTimeAgo, isMentioned } from '@/utils/format';

const { channelName } = defineProps<{
  channelName: string;
}>();

const $q = useQuasar();
const auth = useAuthStore();
const messages = useMessageStore();

const LOAD_OFFSET = 300;

const rootRef = useTemplateRef<HTMLElement>('root');
const historyRef = useTemplateRef<QInfiniteScroll>('history');
const lastSeenId = ref(0);
const isScrolledUp = ref(false);

const me = computed(() => auth.profile?.nickName ?? '');
const newMessageCount = computed(() => {
  const list = messages.messages;
  return list.length - 1 - list.findLastIndex((message) => message.id <= lastSeenId.value);
});

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
  await messages.open(name);
  if (channelName !== name) return;
  await nextTick();
  if (channelName !== name) return;
  scrollToBottom();
}

async function loadOlder(_index: number, done: (stop?: boolean) => void): Promise<void> {
  try {
    const more = await messages.loadOlder();
    done(!more);
  } catch {
    $q.notify({ type: 'negative', message: 'Could not load older messages.' });
    done(true);
  }
}

function onScroll(): void {
  const root = rootRef.value;
  if (root === null) return;

  isScrolledUp.value = root.scrollHeight - root.clientHeight - root.scrollTop > 2;
  if (!isScrolledUp.value) markLatestSeen();
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
  () => messages.hasMore,
  (hasMore) => {
    if (hasMore) historyRef.value?.resume();
  },
);

watch(
  () => channelName,
  (name) => void openChannel(name),
  { immediate: true },
);

onBeforeUnmount(() => messages.close());
</script>
