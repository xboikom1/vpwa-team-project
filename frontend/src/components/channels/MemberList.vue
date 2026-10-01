<template>
  <q-list class="rl-members" dense>
    <q-item v-for="member in channels.members" :key="member.nickName">
      <q-item-section avatar>
        <AppAvatar :nick="member.nickName" :presence="presenceFor(member.nickName)" size="sm" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="rl-members__nick">@{{ member.nickName }}</q-item-label>
        <q-item-label v-if="member.nickName === auth.profile?.nickName" caption>you</q-item-label>
      </q-item-section>

      <q-item-section v-if="member.role === 'admin'" side>
        <q-badge outline color="primary" label="Admin" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import AppAvatar from '@/components/common/AppAvatar.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';
import type { PresenceStatus } from '@/types/types';

const auth = useAuthStore();
const channels = useChannelStore();

const SIMULATED_PRESENCE: Record<string, PresenceStatus> = {
  alex: 'online',
  ed: 'dnd',
  jana: 'offline',
  john: 'offline',
  johndoe: 'online',
  kai: 'online',
  lucia: 'online',
  marek: 'offline',
  maya: 'online',
  priya: 'online',
  rosa: 'dnd',
  sara: 'offline',
  tomas: 'dnd',
  viktor: 'offline',
};

function presenceFor(nickName: string): PresenceStatus {
  if (nickName === auth.profile?.nickName) return auth.presence;
  return SIMULATED_PRESENCE[nickName] ?? 'offline';
}
</script>
