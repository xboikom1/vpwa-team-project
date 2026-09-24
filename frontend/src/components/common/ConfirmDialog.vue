<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div class="rl-dialog" role="alertdialog" :aria-label="title">
      <h2 class="rl-dialog__title">{{ title }}</h2>
      <p class="rl-dialog__text">{{ message }}</p>

      <div class="rl-dialog__actions">
        <button v-if="!hideCancel" class="rl-btn" type="button" @click="onDialogCancel">
          Cancel
        </button>
        <button
          :class="['rl-btn', danger ? 'rl-btn--danger' : 'rl-btn--primary']"
          type="button"
          @click="onDialogOK"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

const { danger = false, hideCancel = false } = defineProps<{
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  hideCancel?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>
