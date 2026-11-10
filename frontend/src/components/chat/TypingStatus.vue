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
import { ref, watch } from 'vue';

const { channelName } = defineProps<{
  channelName: string;
}>();

const typingUser = ref('');
const draft = ref('');
const previewOpen = ref(false);

function resetTyping(): void {
  typingUser.value = '';
  draft.value = '';
  previewOpen.value = false;
}

watch(() => channelName, resetTyping);
</script>
