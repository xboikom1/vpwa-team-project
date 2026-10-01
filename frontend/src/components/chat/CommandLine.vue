<template>
  <form class="rl-cmd" novalidate autocomplete="off" @submit.prevent="submit">
    <div
      v-if="suggestions.length > 0"
      id="command-suggestions"
      class="rl-cmd__suggestions rl-menu"
      role="listbox"
      aria-label="Command suggestions"
    >
      <button
        v-for="(suggestion, index) in suggestions"
        :id="`command-suggestion-${index}`"
        :key="suggestion.name"
        ref="suggestionItems"
        type="button"
        :class="['rl-menu__item', { 'is-sel': index === selectedIndex }]"
        role="option"
        :aria-selected="index === selectedIndex"
        @mousedown.prevent="selectSuggestion(suggestion.name)"
        @mousemove="selectedIndex = index"
      >
        <q-icon name="terminal" size="18px" aria-hidden="true" />
        <span>
          <span class="rl-menu__name">{{ suggestion.usage }}</span>
          <span class="rl-menu__hint">{{ suggestion.description }}</span>
        </span>
      </button>
    </div>

    <q-input
      ref="input"
      :model-value="text"
      outlined
      dense
      autofocus
      :placeholder="placeholder"
      :maxlength="1000"
      name="chat-command"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Message or command"
      :aria-controls="suggestions.length > 0 ? 'command-suggestions' : undefined"
      :aria-expanded="suggestions.length > 0"
      :aria-activedescendant="
        suggestions.length > 0 ? `command-suggestion-${selectedIndex}` : undefined
      "
      @update:model-value="update"
      @keydown="onKeydown"
    >
      <template #prepend>
        <q-icon :name="icon" size="18px" />
      </template>

      <template #append>
        <q-btn
          round
          flat
          dense
          icon="send"
          aria-label="Send"
          :disable="text.trim() === ''"
          @click="submit"
        />
      </template>
    </q-input>
  </form>
</template>

<script setup lang="ts">
import type { QInput } from 'quasar';
import { useQuasar } from 'quasar';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import { KICK_VOTES_TO_BAN } from '@/services/mock-channels';
import { useChannelStore } from '@/stores/channel-store';
import { useMessageStore } from '@/stores/message-store';
import type { ChannelVisibility, CommandInput, JoinedChannel } from '@/types/types';
import { COMMAND_SUGGESTIONS, parseInput } from '@/utils/commands';

const { channelName } = defineProps<{
  channelName: string;
}>();

const emit = defineEmits<{
  list: [];
}>();

const $q = useQuasar();
const router = useRouter();
const channels = useChannelStore();
const messages = useMessageStore();

const text = ref('');
const selectedIndex = ref(0);
const suggestionsDismissed = ref(false);
const inputRef = useTemplateRef<QInput>('input');
const suggestionItemsRef = useTemplateRef<HTMLButtonElement[]>('suggestionItems');

const channel = computed(() => channels.findChannel(channelName));

const placeholder = computed(() => {
  if (channel.value !== undefined) return `Message #${channel.value.name} or type a /command`;
  if (channelName !== '') return `Type /join ${channelName} to join`;
  return 'Type /join <channelName> to start';
});

const icon = computed(() => {
  if (channel.value === undefined) return 'chevron_right';
  return channel.value.visibility === 'private' ? 'lock' : 'tag';
});

const suggestions = computed(() => {
  const query = text.value.toLowerCase();
  if (suggestionsDismissed.value || !query.startsWith('/') || query.includes(' ')) return [];
  return COMMAND_SUGGESTIONS.filter((command) => command.name.startsWith(query));
});

watch(suggestions, () => {
  selectedIndex.value = 0;
});

watch(selectedIndex, (index) => {
  void nextTick(() => {
    suggestionItemsRef.value?.[index]?.scrollIntoView({ block: 'nearest' });
  });
});

watch(
  () => channelName,
  () => {
    void nextTick(() => inputRef.value?.focus());
  },
);

function update(value: string | number | null): void {
  text.value = value === null ? '' : String(value);
  suggestionsDismissed.value = false;
}

function selectSuggestion(name: string): boolean {
  const command = COMMAND_SUGGESTIONS.find((item) => item.name === name);
  if (command === undefined) return false;

  text.value = command.usage === command.name ? command.name : `${command.name} `;
  suggestionsDismissed.value = true;
  void nextTick(() => inputRef.value?.focus());
  return command.usage === command.name;
}

function onKeydown(event: KeyboardEvent): void {
  if (suggestions.value.length === 0) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length;
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedIndex.value =
      (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    text.value = '';
    return;
  }

  if (event.key === 'Enter' || event.key === 'Tab') {
    const suggestion = suggestions.value[selectedIndex.value];
    if (suggestion === undefined) return;
    event.preventDefault();
    const canRunImmediately = selectSuggestion(suggestion.name);
    if (event.key === 'Enter' && canRunImmediately) submit();
  }
}

function fail(message: string): false {
  $q.notify({ type: 'negative', message });
  return false;
}

function done(message: string): true {
  $q.notify({ type: 'positive', message });
  return true;
}

function report(error: string | null, success: string): boolean {
  return error === null ? done(success) : fail(error);
}

function exit(error: string | null, success: string): boolean {
  if (error === null) void router.replace({ name: 'workspace' });
  return report(error, success);
}

function join(name: string, visibility: ChannelVisibility): boolean {
  const wasMember = channels.findChannel(name) !== undefined;
  const error = channels.join(name, visibility);
  if (error !== null) return fail(error);

  void router.push({ name: 'channel', params: { channelName: name } });
  if (wasMember) return true;

  const created = channels.findChannel(name)?.role === 'admin';
  return done(created ? `Created #${name}.` : `Joined #${name}.`);
}

function kick(current: JoinedChannel, nickName: string): boolean {
  const result = channels.kick(current.name, nickName);
  if (!result.ok) return fail(result.error);
  if (result.banned) return done(`@${nickName} is now banned from #${current.name}.`);

  return done(`Kick vote for @${nickName} counted (${result.votes}/${KICK_VOTES_TO_BAN}).`);
}

function run(input: CommandInput): boolean {
  if (input.kind === 'error') return fail(input.message);
  if (input.kind === 'join') return join(input.channelName, input.visibility);

  const current = channel.value;
  if (current === undefined) {
    return fail(channelName === '' ? 'Open a channel first.' : `Join #${channelName} first.`);
  }

  switch (input.kind) {
    case 'message': {
      const error = messages.send(current.name, input.text);
      return error === null ? true : fail(error);
    }

    case 'invite':
      return report(
        channels.invite(current.name, input.nickName),
        `Invited @${input.nickName} to #${current.name}.`,
      );

    case 'revoke':
      return report(
        channels.revoke(current.name, input.nickName),
        `Removed @${input.nickName} from #${current.name}.`,
      );

    case 'kick':
      return kick(current, input.nickName);

    case 'quit':
      return exit(channels.remove(current.name), `Deleted #${current.name}.`);

    case 'cancel':
      return exit(
        channels.leave(current.name),
        current.role === 'admin' ? `Left and deleted #${current.name}.` : `Left #${current.name}.`,
      );

    case 'list':
      emit('list');
      return true;
  }
}

function submit(): void {
  const input = parseInput(text.value);
  if (input.kind === 'message' && input.text === '') return;

  if (run(input)) text.value = '';
  inputRef.value?.focus();
}
</script>
