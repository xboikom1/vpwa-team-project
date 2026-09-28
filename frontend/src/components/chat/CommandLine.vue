<template>
  <form class="rl-cmd" novalidate @submit.prevent="submit">
    <q-input
      ref="input"
      :model-value="text"
      outlined
      dense
      autofocus
      :placeholder="placeholder"
      :maxlength="1000"
      aria-label="Message or command"
      @update:model-value="update"
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
import { computed, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { KICK_VOTES_TO_BAN } from '@/services/mock-channels';
import { useChannelStore } from '@/stores/channel-store';
import { useMessageStore } from '@/stores/message-store';
import type { ChannelVisibility, CommandInput, JoinedChannel } from '@/types/types';
import { parseInput } from '@/utils/commands';

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
const inputRef = useTemplateRef<QInput>('input');

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

function update(value: string | number | null): void {
  text.value = value === null ? '' : String(value);
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
