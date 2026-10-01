<template>
  <div v-if="typingUser" class="rl-typing" role="status" aria-live="polite">
    <span class="rl-typing__dots" aria-hidden="true"><i /><i /><i /></span>
    <button class="rl-typing__user" type="button" @click="previewOpen = true">
      @{{ typingUser }}
    </button>
    <span>is typing</span>
  </div>

  <q-dialog v-model="previewOpen">
    <q-card class="rl-typing-preview">
      <q-card-section class="rl-typing-preview__head">
        <span>@{{ typingUser }} is typing</span>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Close draft preview" />
      </q-card-section>

      <q-separator dark />

      <q-card-section class="rl-typing-preview__body">
        <span v-if="draft">{{ draft }}</span>
        <span v-else class="rl-typing-preview__empty">Waiting for text…</span>
        <span class="rl-typing-preview__caret" aria-hidden="true" />
      </q-card-section>

      <q-card-section class="rl-typing-preview__note"> Live draft </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';

const { channelName } = defineProps<{
  channelName: string;
}>();

const auth = useAuthStore();
const channels = useChannelStore();

const DRAFTS = [
  'Does anyone have time to review the latest changes?',
  'I am checking the channel notes and will share an update shortly.',
  'The new version looks good to me. I only found one small issue.',
  'Can we move tomorrow’s meeting to the afternoon?',
  'I have finished the task and I am preparing the summary now.',
] as const;

const typingUser = ref('');
const draft = ref('');
const previewOpen = ref(false);

let simulationIndex = 0;
let startTimer: ReturnType<typeof setTimeout> | undefined;
let endTimer: ReturnType<typeof setTimeout> | undefined;
let typingTimer: ReturnType<typeof setInterval> | undefined;

function clearTimers(): void {
  if (startTimer !== undefined) clearTimeout(startTimer);
  if (endTimer !== undefined) clearTimeout(endTimer);
  if (typingTimer !== undefined) clearInterval(typingTimer);
  startTimer = undefined;
  endTimer = undefined;
  typingTimer = undefined;
}

function resetTyping(): void {
  typingUser.value = '';
  draft.value = '';
  previewOpen.value = false;
}

function scheduleTyping(delay = 4_000): void {
  if (channelName === '') return;
  startTimer = setTimeout(startTyping, delay);
}

function startTyping(): void {
  const candidates = channels.members.filter(
    (member) => member.nickName !== auth.profile?.nickName,
  );

  if (candidates.length === 0) {
    scheduleTyping();
    return;
  }

  const member = candidates[simulationIndex % candidates.length];
  const message = DRAFTS[simulationIndex % DRAFTS.length];
  simulationIndex += 1;
  if (member === undefined || message === undefined) return;

  typingUser.value = member.nickName;
  draft.value = '';
  let characterIndex = 0;

  typingTimer = setInterval(() => {
    characterIndex += 1;
    draft.value = message.slice(0, characterIndex);

    if (characterIndex < message.length) return;
    if (typingTimer !== undefined) clearInterval(typingTimer);
    typingTimer = undefined;

    endTimer = setTimeout(() => {
      resetTyping();
      scheduleTyping(5_000);
    }, 2_500);
  }, 85);
}

watch(
  () => channelName,
  () => {
    clearTimers();
    resetTyping();
    scheduleTyping(1_200);
  },
  { immediate: true },
);

onBeforeUnmount(clearTimers);
</script>
