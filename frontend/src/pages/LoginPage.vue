<template>
  <q-page class="rl-auth-page">
    <AuthCard title="Sign in" subtitle="Pick up where the channel left off.">
      <form class="rl-auth__form" novalidate @submit.prevent="submit">
        <div v-if="formError" class="rl-auth__alert" role="alert">
          <AppIcon name="alert-circle" />
          <span>{{ formError }}</span>
        </div>

        <AppField
          ref="firstField"
          :model-value="form.identifier"
          label="Nickname or email"
          name="identifier"
          autocomplete="username"
          placeholder="example@gmail.com"
          :error="errors.identifier"
          @update:model-value="update('identifier', $event)"
        />

        <AppField
          :model-value="form.password"
          label="Password"
          name="password"
          type="password"
          autocomplete="current-password"
          :error="errors.password"
          @update:model-value="update('password', $event)"
        />

        <button class="rl-btn rl-btn--primary rl-btn--block" type="submit" :disabled="auth.pending">
          <template v-if="auth.pending">
            <span class="rl-dots" aria-hidden="true"><i /><i /><i /></span>
            Signing in
          </template>
          <template v-else>Sign in</template>
        </button>
      </form>

      <template #footer>
        No account yet?
        <router-link class="rl-auth__link" to="/register">Create one</router-link>
      </template>
    </AuthCard>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AuthCard from '@/components/auth/AuthCard.vue';
import AppField from '@/components/common/AppField.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { useAuthStore } from '@/stores/auth-store';
import { validateIdentifier } from '@/utils/validation';

type Field = 'identifier' | 'password';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ identifier: '', password: '' });
const submitted = ref(false);
const formError = ref('');

const firstFieldRef = useTemplateRef<InstanceType<typeof AppField>>('firstField');

const rules: Record<Field, (value: string) => string | null> = {
  identifier: validateIdentifier,
  password: (value) => (value.length === 0 ? 'Password is required.' : null),
};

function messageFor(field: Field): string {
  if (!submitted.value) return '';
  return rules[field](form[field]) ?? '';
}

const errors = computed<Record<Field, string>>(() => ({
  identifier: messageFor('identifier'),
  password: messageFor('password'),
}));

function update(field: Field, value: string): void {
  form[field] = value;
  formError.value = '';
}

function submit(): void {
  submitted.value = true;
  if (auth.pending) return;
  if (Object.values(errors.value).some((message) => message !== '')) return;

  const failure = auth.login({ identifier: form.identifier, password: form.password });

  if (failure !== null) {
    formError.value = failure.message;
    return;
  }

  const redirect = route.query.redirect;
  const target = typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/';
  void router.replace(target);
}

onMounted(() => {
  firstFieldRef.value?.focus();
});
</script>
