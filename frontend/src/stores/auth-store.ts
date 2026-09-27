import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as mockAuth from '@/services/mock-auth';
import type {
  AuthFailure,
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

  function register(input: RegisterInput): AuthFailure | null {
    pending.value = true;
    try {
      const result = mockAuth.register(input);
      if (!result.ok) return result.error;

      profile.value = result.profile;
      presence.value = 'online';
      return null;
    } finally {
      pending.value = false;
    }
  }

  function login(input: LoginInput): AuthFailure | null {
    pending.value = true;
    try {
      const result = mockAuth.login(input);
      if (!result.ok) return result.error;

      profile.value = result.profile;
      presence.value = 'online';
      return null;
    } finally {
      pending.value = false;
    }
  }

  function logout(): void {
    profile.value = null;
    presence.value = 'online';
    notificationFilter.value = 'all';
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
    setPresence,
    setNotificationFilter,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
