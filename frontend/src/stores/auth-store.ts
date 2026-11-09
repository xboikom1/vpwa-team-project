import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getToken } from '@/services/api';
import * as authApi from '@/services/auth-api';
import type {
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

  function openSession(result: AuthResult): AuthFailure | null {
    if (!result.ok) return result.error;

    profile.value = result.profile;
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
        profile.value = await authApi.fetchCurrentUser();
      } catch {
        profile.value = null;
      }
    })();
    return restoring;
  }

  function setPresence(next: PresenceStatus): void {
    presence.value = next;
  }

  function setNotificationFilter(next: NotificationFilter): void {
    notificationFilter.value = next;
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
