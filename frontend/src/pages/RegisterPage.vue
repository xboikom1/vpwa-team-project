<template>
  <q-page class="rl-auth-page">
    <AuthCard title="Create your account" subtitle="Your nickname is how Chatflow addresses you.">
      <form class="rl-auth__form" novalidate @submit.prevent="submit">
        <div v-if="formError" class="rl-auth__alert" role="alert">
          <AppIcon name="alert-circle" />
          <span>{{ formError }}</span>
        </div>

        <div class="rl-auth__row">
          <AppField
            ref="firstField"
            :model-value="form.firstName"
            label="First name"
            name="firstName"
            autocomplete="given-name"
            :maxlength="40"
            :error="errors.firstName"
            @update:model-value="update('firstName', $event)"
          />

          <AppField
            :model-value="form.lastName"
            label="Last name"
            name="lastName"
            autocomplete="family-name"
            :maxlength="40"
            :error="errors.lastName"
            @update:model-value="update('lastName', $event)"
          />
        </div>

        <AppField
          :model-value="form.nickName"
          label="Nickname"
          hint="a-z, 0-9, _"
          name="nickName"
          autocomplete="username"
          sigil="@"
          mono
          placeholder="nickname"
          :maxlength="20"
          :error="errors.nickName"
          @update:model-value="(nickName) => update('nickName', nickName.trim())"
        />

        <AppField
          :model-value="form.email"
          label="Email"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="example@gmail.com"
          :error="errors.email"
          @update:model-value="update('email', $event)"
        />

        <AppField
          :model-value="form.password"
          label="Password"
          name="password"
          type="password"
          autocomplete="new-password"
          :error="errors.password"
          @update:model-value="update('password', $event)"
        />

        <button class="rl-btn rl-btn--primary rl-btn--block" type="submit" :disabled="auth.pending">
          <template v-if="auth.pending">
            <span class="rl-dots" aria-hidden="true"><i /><i /><i /></span>
            Creating account
          </template>
          <template v-else>Create account</template>
        </button>
      </form>

      <template #footer>
        Already have an account?
        <router-link class="rl-auth__link" to="/login">Sign in</router-link>
      </template>
    </AuthCard>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import AuthCard from '@/components/auth/AuthCard.vue';
import AppField from '@/components/common/AppField.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthField } from '@/types/types';
import {
  validateEmail,
  validateName,
  validateNickName,
  validatePassword,
} from '@/utils/validation';

type Field = 'firstName' | 'lastName' | 'nickName' | 'email' | 'password';

const auth = useAuthStore();
const router = useRouter();

const form = reactive<Record<Field, string>>({
  firstName: '',
  lastName: '',
  nickName: '',
  email: '',
  password: '',
});

const submitted = ref(false);
const formError = ref('');

const taken = reactive<Partial<Record<Field, string>>>({});

const firstFieldRef = useTemplateRef<InstanceType<typeof AppField>>('firstField');

const rules: Record<Field, (value: string) => string | null> = {
  firstName: (value) => validateName(value, 'First name'),
  lastName: (value) => validateName(value, 'Last name'),
  nickName: validateNickName,
  email: validateEmail,
  password: validatePassword,
};

function messageFor(field: Field): string {
  const conflict = taken[field];
  if (conflict !== undefined) return conflict;
  if (!submitted.value) return '';
  return rules[field](form[field]) ?? '';
}

const errors = computed<Record<Field, string>>(() => ({
  firstName: messageFor('firstName'),
  lastName: messageFor('lastName'),
  nickName: messageFor('nickName'),
  email: messageFor('email'),
  password: messageFor('password'),
}));

function update(field: Field, value: string): void {
  form[field] = value;
  delete taken[field];
  formError.value = '';
}

function applyFailure(field: AuthField | 'form', message: string): void {
  if (field === 'nickName' || field === 'email') {
    taken[field] = message;
    return;
  }
  formError.value = message;
}

function submit(): void {
  submitted.value = true;
  if (auth.pending) return;
  if (Object.values(errors.value).some((message) => message !== '')) return;

  const failure = auth.register({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    nickName: form.nickName,
    email: form.email.trim(),
    password: form.password,
  });

  if (failure !== null) {
    applyFailure(failure.field, failure.message);
    return;
  }

  void router.replace('/');
}

onMounted(() => {
  firstFieldRef.value?.focus();
});
</script>
