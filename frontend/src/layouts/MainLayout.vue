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

      <ChannelHeader :channel="activeChannel" />

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

        <ChannelList :active-name="activeName" :tap="$q.screen.lt.md" />

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
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ChannelHeader from '@/components/channels/ChannelHeader.vue';
import ChannelList from '@/components/channels/ChannelList.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import UserCard from '@/components/common/UserCard.vue';
import { WORKSPACE_NAME } from '@/services/mock-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelStore } from '@/stores/channel-store';

const $q = useQuasar();
const route = useRoute();
const auth = useAuthStore();
const channels = useChannelStore();

const leftOpen = ref(false);

const activeName = computed(() => {
  const param = route.params.channelName;
  return typeof param === 'string' ? param : '';
});

const activeChannel = computed(() => channels.findChannel(activeName.value));

watch(activeName, () => {
  if ($q.screen.lt.md) leftOpen.value = false;
});

channels.load();
</script>
