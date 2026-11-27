import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, watch } from 'vue';

import * as messageApi from '@/services/message-api';
import { useAuthStore } from '@/stores/auth-store';

const IDLE_MS = 8000;

const SEND_INTERVAL_MS = 250;

export interface Typer {
  nickName: string;
  text: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDraft(text: string): string {
  return text.trimStart().startsWith('/') ? '' : text;
}

export const useTypingStore = defineStore('typing', () => {
  const auth = useAuthStore();

  const drafts = ref<Record<string, Record<string, string>>>({});
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function timerKey(channelName: string, nickName: string): string {
    return `${channelName}\n${nickName}`;
  }

  function typersIn(channelName: string): Typer[] {
    const channel = drafts.value[channelName] ?? {};
    return Object.entries(channel).map(([nickName, text]) => ({ nickName, text }));
  }

  function clear(channelName: string, nickName: string): void {
    const key = timerKey(channelName, nickName);
    clearTimeout(timers.get(key));
    timers.delete(key);

    const channel = drafts.value[channelName];
    if (channel === undefined || !(nickName in channel)) return;

    const rest = { ...channel };
    delete rest[nickName];
    drafts.value = { ...drafts.value, [channelName]: rest };
  }

  function clearAll(): void {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    drafts.value = {};
  }

  function receive(channelName: string, nickName: string, text: string): void {
    if (nickName === auth.profile?.nickName || auth.presence === 'offline') return;
    if (text === '') {
      clear(channelName, nickName);
      return;
    }

    drafts.value = {
      ...drafts.value,
      [channelName]: { ...drafts.value[channelName], [nickName]: text },
    };

    const key = timerKey(channelName, nickName);
    clearTimeout(timers.get(key));
    timers.set(
      key,
      setTimeout(() => clear(channelName, nickName), IDLE_MS),
    );
  }

  const outbox = new Map<string, string>();
  const sent = new Map<string, string>();
  let draftChannel = '';
  let flushing = false;

  async function flush(): Promise<void> {
    if (flushing) return;
    flushing = true;

    try {
      for (let next = outbox.entries().next(); !next.done; next = outbox.entries().next()) {
        const [channelName, text] = next.value;
        outbox.delete(channelName);
        if ((sent.get(channelName) ?? '') === text) continue;

        await messageApi.sendTyping(channelName, text);
        sent.set(channelName, text);
        if (text !== '') await wait(SEND_INTERVAL_MS);
      }
    } finally {
      flushing = false;
    }
  }

  function queue(channelName: string, text: string): void {
    outbox.set(channelName, text);
    void flush();
  }

  function report(channelName: string, text: string): void {
    if (channelName !== draftChannel) {
      if (draftChannel !== '') queue(draftChannel, '');
      draftChannel = channelName;
    }
    if (channelName === '' || auth.profile === null) return;

    queue(channelName, auth.presence === 'offline' ? '' : toDraft(text));
  }

  function reset(): void {
    clearAll();
    outbox.clear();
    sent.clear();
    draftChannel = '';
  }

  watch(
    () => auth.presence,
    (presence) => {
      if (presence !== 'offline') return;
      clearAll();
      if (draftChannel !== '') queue(draftChannel, '');
    },
  );

  watch(() => auth.profile?.nickName, reset);

  return { drafts, typersIn, receive, clear, report, reset };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTypingStore, import.meta.hot));
}
