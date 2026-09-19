<template>
  <div class="rl-user">
    <div class="rl-user__id">
      <AppAvatar :nick="profile.nickName" :presence="auth.presence" on="raised" />
      <span class="rl-user__ident">
        <span class="rl-user__name">{{ auth.displayName }}</span>
        <span class="rl-user__handle">{{ auth.handle }}</span>
      </span>
    </div>

    <button class="rl-select" type="button" :class="{ 'rl-tap': tap }">
      <i :class="['rl-dot', `rl-dot--${auth.presence}`]" />
      {{ PRESENCE_LABEL[auth.presence] }}
      <span class="rl-select__caret"><AppIcon name="chevron-down" :size="13" /></span>

      <q-menu class="rl-popover" anchor="bottom start" self="top start" :offset="[0, 4]">
        <div class="rl-menu" style="width: 232px">
          <button
            v-for="option in PRESENCE_OPTIONS"
            :key="option.value"
            v-close-popup
            class="rl-menu__item"
            :class="{ 'is-sel': option.value === auth.presence }"
            type="button"
            @click="auth.setPresence(option.value)"
          >
            <i :class="['rl-dot', `rl-dot--${option.value}`]" />
            <span>
              <span class="rl-menu__name">{{ option.label }}</span>
              <span class="rl-menu__hint">{{ option.hint }}</span>
            </span>
          </button>
        </div>
      </q-menu>
    </button>

    <div class="rl-seg" role="group" aria-label="Notification filter">
      <button
        class="rl-seg__opt"
        :class="{ 'is-on': auth.notificationFilter === 'all' }"
        type="button"
        :aria-pressed="auth.notificationFilter === 'all'"
        @click="auth.setNotificationFilter('all')"
      >
        All messages
      </button>
      <button
        class="rl-seg__opt"
        :class="{ 'is-on': auth.notificationFilter === 'mentions' }"
        type="button"
        :aria-pressed="auth.notificationFilter === 'mentions'"
        @click="auth.setNotificationFilter('mentions')"
      >
        Mentions only ({{ auth.handle }})
      </button>
    </div>

    <button class="rl-btn rl-btn--start" :class="{ 'rl-tap': tap }" type="button" @click="signOut">
      <AppIcon name="log-out" />
      Sign out
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import AppAvatar from '@/components/common/AppAvatar.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useAuthStore } from '@/stores/auth-store';
import type { PresenceStatus, UserProfile } from '@/types/types';

const { profile, tap = false } = defineProps<{
  profile: UserProfile;
  tap?: boolean;
}>();

const auth = useAuthStore();
const router = useRouter();

const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: 'Online',
  dnd: 'DND',
  offline: 'Offline',
};

const PRESENCE_OPTIONS: readonly { value: PresenceStatus; label: string; hint: string }[] = [
  { value: 'online', label: 'Online', hint: 'Notifications follow your preference' },
  { value: 'dnd', label: 'DND', hint: 'Silences everything, mentions included' },
  { value: 'offline', label: 'Offline', hint: 'Appear offline, stay connected' },
];

function signOut(): void {
  auth.logout();
  void router.replace('/login');
}
</script>
