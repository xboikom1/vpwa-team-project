import { AppVisibility } from 'quasar';

import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/types';
import { isMentioned } from '@/utils/format';

const PREVIEW_LENGTH = 80;

function isSupported(): boolean {
  return 'Notification' in window;
}

export function requestPermission(): void {
  if (isSupported() && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function notifyMessage(message: Message): void {
  const auth = useAuthStore();
  const me = auth.profile?.nickName;

  if (me === undefined || message.author === me) return;
  if (AppVisibility.appVisible) return;
  if (auth.presence !== 'online') return;
  if (auth.notificationFilter === 'mentions' && !isMentioned(message.text, me)) return;
  if (!isSupported() || Notification.permission !== 'granted') return;

  const preview =
    message.text.length > PREVIEW_LENGTH
      ? `${message.text.slice(0, PREVIEW_LENGTH)}…`
      : message.text;

  const notification = new Notification(`@${message.author} in #${message.channelName}`, {
    body: preview,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
