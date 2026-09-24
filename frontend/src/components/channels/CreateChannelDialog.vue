<template>
  <q-dialog ref="dialogRef" @show="nameFieldRef?.focus()" @hide="onDialogHide">
    <form class="rl-dialog" novalidate aria-label="New channel" @submit.prevent="submit">
      <div>
        <h2 class="rl-dialog__title">New channel</h2>
        <p class="rl-dialog__text">
          Same as typing <span class="rl-code">/join &lt;channelName&gt; [private]</span>.
        </p>
      </div>

      <AppField
        ref="nameField"
        :model-value="name"
        label="Channel name"
        hint="a-z, 0-9, - and _"
        name="channelName"
        sigil="#"
        mono
        placeholder="design-review"
        :maxlength="30"
        :error="error"
        @update:model-value="update"
        @blur="touched = true"
      />

      <div class="rl-field">
        <span class="rl-field__label">Visibility</span>

        <div class="rl-seg" role="group" aria-label="Visibility">
          <button
            class="rl-seg__opt"
            :class="{ 'is-on': visibility === 'public' }"
            type="button"
            :aria-pressed="visibility === 'public'"
            @click="visibility = 'public'"
          >
            Public
          </button>
          <button
            class="rl-seg__opt"
            :class="{ 'is-on': visibility === 'private' }"
            type="button"
            :aria-pressed="visibility === 'private'"
            @click="visibility = 'private'"
          >
            Private
          </button>
        </div>

        <p class="rl-field__msg">
          {{
            visibility === 'public'
              ? 'Anyone can join with /join.'
              : 'Only people you invite can join.'
          }}
        </p>
      </div>

      <div class="rl-dialog__actions">
        <button class="rl-btn" type="button" @click="onDialogCancel">Cancel</button>
        <button class="rl-btn rl-btn--primary" type="submit">Create channel</button>
      </div>
    </form>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, ref, useTemplateRef } from 'vue';

import AppField from '@/components/common/AppField.vue';
import { useChannelStore } from '@/stores/channel-store';
import type { ChannelVisibility } from '@/types/types';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const channels = useChannelStore();

const name = ref('');
const visibility = ref<ChannelVisibility>('public');
const touched = ref(false);
const submitted = ref(false);
const conflict = ref('');

const nameFieldRef = useTemplateRef<InstanceType<typeof AppField>>('nameField');

const error = computed(() => {
  if (conflict.value !== '') return conflict.value;
  if (!touched.value && !submitted.value) return '';
  return name.value;
});

function update(value: string): void {
  name.value = value.trim().toLowerCase();
  conflict.value = '';
}

function submit(): void {
  submitted.value = true;
  if (error.value !== '') return;

  const failure = channels.create(name.value, visibility.value);

  if (failure !== null) {
    conflict.value = failure;
    return;
  }

  onDialogOK(name.value);
}
</script>
