<template>
  <div class="rl-auth">
    <header class="rl-auth__head">
      <span class="rl-mark rl-mark--lg">
        <span class="rl-mark__sigil">#</span>
        <span class="rl-mark__name">Chatflow</span>
      </span>
      <p class="rl-auth__tag">IRC-style team chat, installable anywhere.</p>
    </header>

    <section class="rl-auth__card">
      <div>
        <h1 class="rl-auth__title">{{ title }}</h1>
        <p class="rl-auth__sub">{{ subtitle }}</p>
      </div>

      <slot />
    </section>

    <footer class="rl-auth__foot">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();
</script>
