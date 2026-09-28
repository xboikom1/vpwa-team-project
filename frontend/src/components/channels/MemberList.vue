<template>
  <q-list class="rl-members" dense>
    <q-item v-for="member in channels.members" :key="member.nickName">
      <q-item-section avatar>
        <q-avatar rounded size="28px" font-size="12px" color="grey-9" text-color="white">
          {{ member.nickName.charAt(0) }}
        </q-avatar>
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
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';

const auth = useAuthStore();
const channels = useChannelStore();
</script>
