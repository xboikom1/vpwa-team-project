import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getToken } from '@/services/api';
import * as authApi from '@/services/auth-api';
import type {
  Account,
  AuthFailure,
  AuthResult,
  LoginInput,
  NotificationFilter,
  PresenceStatus,
  RegisterInput,
  UserProfile,
} from '@/types/types';

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null);
  const presence = ref<PresenceStatus>('online');
  const notificationFilter = ref<NotificationFilter>('all');

  const pending = ref(false);

  const isAuthenticated = computed(() => profile.value !== null);

  const handle = computed(() => (profile.value === null ? '' : `@${profile.value.nickName}`));

  const displayName = computed(() =>
    profile.value === null ? '' : `${profile.value.firstName} ${profile.value.lastName}`,
  );

  const initials = computed(() =>
    profile.value === null ? '' : profile.value.nickName.slice(0, 1).toUpperCase(),
  );

  function applyAccount(account: Account): void {
    profile.value = account.profile;
    notificationFilter.value = account.settings.notificationFilter;
  }

  function openSession(result: AuthResult): AuthFailure | null {
    if (!result.ok) return result.error;

    applyAccount(result);
    presence.value = 'online';
    return null;
  }

  async function register(input: RegisterInput): Promise<AuthFailure | null> {
    pending.value = true;
    try {
      return openSession(await authApi.register(input));
    } finally {
      pending.value = false;
    }
  }

  async function login(input: LoginInput): Promise<AuthFailure | null> {
    pending.value = true;
    try {
      return openSession(await authApi.login(input));
    } finally {
      pending.value = false;
    }
  }

  function clearSession(): void {
    profile.value = null;
    presence.value = 'online';
    notificationFilter.value = 'all';
  }

  async function logout(): Promise<void> {
    await authApi.logout();
    clearSession();
  }

  let restoring: Promise<void> | null = null;

  function restore(): Promise<void> {
    restoring ??= (async () => {
      if (getToken() === null) return;
      try {
        applyAccount(await authApi.fetchCurrentUser());
      } catch {
        profile.value = null;
      }
    })();
    return restoring;
  }

  function setPresence(next: PresenceStatus): void {
    presence.value = next;
  }

  async function setNotificationFilter(next: NotificationFilter): Promise<boolean> {
    const previous = notificationFilter.value;
    if (next === previous) return true;

    notificationFilter.value = next;
    try {
      await authApi.updateSettings({ notificationFilter: next });
      return true;
    } catch {
      if (notificationFilter.value === next) notificationFilter.value = previous;
      return false;
    }
  }

  return {
    profile,
    presence,
    notificationFilter,
    pending,
    isAuthenticated,
    handle,
    displayName,
    initials,
    register,
    login,
    logout,
    clearSession,
    restore,
    setPresence,
    setNotificationFilter,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
