<template>
  <q-page class="rl-empty rl-empty--pane">
    <p class="rl-empty__title">Welcome, {{ auth.handle }}</p>

    <p class="rl-empty__body">
      Pick a channel to start reading — or create the first one with
      <span class="rl-code">/join &lt;channelName&gt;</span>.
    </p>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();
</script>
