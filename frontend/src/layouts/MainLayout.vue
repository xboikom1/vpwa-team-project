<template>
  <q-layout view="lHh LpR lFf">
    <q-header class="rl-hdr">
      <q-btn
        v-if="$q.screen.lt.md"
        class="rl-ico"
        flat
        dense
        aria-label="Channels"
        @click="leftOpen = !leftOpen"
      >
        <AppIcon name="menu" />
      </q-btn>

      <span class="rl-hdr__title">No channel</span>
      <span class="rl-hdr__sep" />
      <span class="rl-hdr__meta">{{ WORKSPACE_NAME }}</span>

      <span class="rl-hdr__end" />
    </q-header>

    <q-drawer
      v-model="leftOpen"
      show-if-above
      side="left"
      bordered
      :width="$q.screen.lt.md ? 300 : 260"
      class="rl-drawer-host"
    >
      <div class="rl-drawer">
        <div class="rl-drawer__head">
          <span class="rl-mark rl-mark--md">
            <span class="rl-mark__sigil">#</span>
            <span class="rl-mark__name">{{ WORKSPACE_NAME }}</span>
          </span>
        </div>

        <div class="rl-drawer__body rl-scroll">
          <div class="rl-sect">Public channels</div>
          <p class="rl-empty">
            No public channels yet. Type
            <span class="rl-code">/join &lt;channelName&gt;</span>.
          </p>

          <div class="rl-sect">Private channels</div>
          <p class="rl-empty">
            No private channels. Type
            <span class="rl-code">/join &lt;channelName&gt; private</span>.
          </p>
        </div>

        <div class="rl-drawer__foot">
          <UserCard v-if="auth.profile" :profile="auth.profile" :tap="$q.screen.lt.md" />
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import AppIcon from '@/components/common/AppIcon.vue';
import UserCard from '@/components/common/UserCard.vue';
import { WORKSPACE_NAME } from '@/services/mock-auth';
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();

const leftOpen = ref(false);
</script>
