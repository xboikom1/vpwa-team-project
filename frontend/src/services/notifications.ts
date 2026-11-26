import { AppVisibility } from 'quasar';

import { useAuthStore } from '@/stores/auth-store';
import type { Message } from '@/types/types';
import { isMentioned } from '@/utils/format';

const PREVIEW_LENGTH = 80;

function isSupported(): boolean {
  return 'Notification' in window;
}

function preview(text: string): string {
  const characters = Array.from(text);
  if (characters.length <= PREVIEW_LENGTH) return text;
  return `${characters.slice(0, PREVIEW_LENGTH).join('')}…`;
}

function shouldNotify(message: Message): boolean {
  const auth = useAuthStore();
  const me = auth.profile?.nickName;

  if (me === undefined || message.author === me) return false;
  if (AppVisibility.appVisible) return false;
  if (auth.presence !== 'online') return false;
  if (auth.notificationFilter === 'mentions' && !isMentioned(message.text, me)) return false;

  return isSupported() && Notification.permission === 'granted';
}

export function requestPermission(): void {
  if (isSupported() && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function notifyMessage(message: Message, onOpen: () => void): void {
  if (!shouldNotify(message)) return;

  let notification: Notification;
  try {
    notification = new Notification(`@${message.author} in #${message.channelName}`, {
      body: preview(message.text),
    });
  } catch {
    return;
  }

  notification.onclick = () => {
    window.focus();
    onOpen();
    notification.close();
  };
}
