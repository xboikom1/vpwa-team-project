<template>
  <div v-if="typers.length > 0" class="rl-typing" role="status" aria-live="polite">
    <span class="rl-typing__dots" aria-hidden="true"><i /><i /><i /></span>
    <template v-for="(typer, index) in shown" :key="typer.nickName">
      <span v-if="andBefore(index)">and</span>
      <span>
        <button
          class="rl-typing__user"
          type="button"
          :aria-label="`Show what @${typer.nickName} is typing`"
          @click="openPreview(typer.nickName)"
        >
          @{{ typer.nickName }}</button
        >{{ commaAfter(index) ? ',' : '' }}
      </span>
    </template>
    <span v-if="hidden > 0">and {{ hidden }} {{ hidden === 1 ? 'other' : 'others' }}</span>
    <span>{{ typers.length === 1 ? 'is typing' : 'are typing' }}</span>
  </div>

  <q-dialog v-model="previewOpen">
    <q-card class="rl-typing-preview">
      <q-card-section class="rl-typing-preview__head">
        <span>@{{ previewNick }} {{ previewTyper ? 'is typing' : 'stopped typing' }}</span>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Close draft preview" />
      </q-card-section>

      <q-separator dark />

      <q-card-section class="rl-typing-preview__body">
        <template v-if="previewTyper">
          <span>{{ previewTyper.text }}</span>
          <span class="rl-typing-preview__caret" aria-hidden="true" />
        </template>
        <span v-else class="rl-typing-preview__empty">
          The draft was sent or cleared, or @{{ previewNick }} paused typing.
        </span>
      </q-card-section>

      <q-card-section class="rl-typing-preview__note"> Live draft </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useChannelStore } from '@/stores/channel-store';
import { useTypingStore } from '@/stores/typing-store';

const MAX_SHOWN = 3;

const { channelName } = defineProps<{
  channelName: string;
}>();

const channels = useChannelStore();
const typing = useTypingStore();

const previewNick = ref('');
const previewOpen = ref(false);

const typers = computed(() =>
  channels.findChannel(channelName) === undefined ? [] : typing.typersIn(channelName),
);

const shown = computed(() =>
  typers.value.length > MAX_SHOWN ? typers.value.slice(0, MAX_SHOWN - 1) : typers.value,
);

const hidden = computed(() => typers.value.length - shown.value.length);

const previewTyper = computed(() =>
  typers.value.find((typer) => typer.nickName === previewNick.value),
);

function andBefore(index: number): boolean {
  return index > 0 && index === shown.value.length - 1 && hidden.value === 0;
}

function commaAfter(index: number): boolean {
  return index < shown.value.length - 1 && !andBefore(index + 1);
}

function openPreview(nickName: string): void {
  previewNick.value = nickName;
  previewOpen.value = true;
}

watch(
  () => channelName,
  () => {
    previewOpen.value = false;
    previewNick.value = '';
  },
);
</script>
