<template>
  <div class="rl-field">
    <label class="rl-field__label" :for="fieldId">
      {{ label }}
      <span v-if="hint" class="rl-field__optional">{{ hint }}</span>
    </label>

    <div :class="['rl-field__box', { 'is-focus': focused, 'is-invalid': Boolean(error) }]">
      <span v-if="sigil" class="rl-field__sigil" aria-hidden="true">{{ sigil }}</span>

      <input
        :id="fieldId"
        ref="input"
        :class="['rl-field__input', { 'rl-field__input--mono': mono }]"
        :type="resolvedType"
        :value="modelValue"
        :name="name"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :autocapitalize="mono ? 'off' : 'sentences'"
        :spellcheck="mono ? false : undefined"
        :maxlength="maxlength"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? messageId : undefined"
        @input="onInput"
        @focus="focused = true"
        @blur="onBlur"
      />

      <button
        v-if="type === 'password'"
        class="rl-ico rl-field__reveal"
        type="button"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <AppIcon :name="revealed ? 'eye-off' : 'eye'" />
      </button>
    </div>

    <p :id="messageId" :class="['rl-field__msg', { 'is-invalid': error }]" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue';

import AppIcon from '@/components/common/AppIcon.vue';

const {
  modelValue,
  label,
  name,
  type = 'text',
  placeholder = '',
  autocomplete = 'off',
  hint = '',
  sigil = '',
  mono = false,
  disabled = false,
  maxlength,
  error = '',
} = defineProps<{
  modelValue: string;
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  autocomplete?: string;
  hint?: string;
  sigil?: string;
  mono?: boolean;
  disabled?: boolean;
  maxlength?: number;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [];
}>();

const fieldId = useId();
const messageId = `${fieldId}-msg`;

const focused = ref(false);
const revealed = ref(false);
const inputRef = useTemplateRef<HTMLInputElement>('input');

const resolvedType = computed(() => (type === 'password' && revealed.value ? 'text' : type));

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}

function onBlur(): void {
  focused.value = false;
  emit('blur');
}

function focus(): void {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>
