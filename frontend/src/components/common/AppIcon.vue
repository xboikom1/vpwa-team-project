<template>
  <svg
    class="rl-svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, index) in glyph.paths" :key="`p${index}`" :d="d" />
    <circle
      v-for="(circle, index) in glyph.circles ?? []"
      :key="`c${index}`"
      :cx="circle[0]"
      :cy="circle[1]"
      :r="circle[2]"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type IconName =
  | 'alert-circle'
  | 'arrow-left'
  | 'check'
  | 'chevron-down'
  | 'eye'
  | 'eye-off'
  | 'hash'
  | 'lock'
  | 'log-out'
  | 'menu'
  | 'plus'
  | 'search'
  | 'users';

interface Glyph {
  paths: readonly string[];
  circles?: readonly (readonly [number, number, number])[];
}

const GLYPHS: Record<IconName, Glyph> = {
  'alert-circle': { paths: ['M12 8v4', 'M12 16h.01'], circles: [[12, 12, 10]] },
  'arrow-left': { paths: ['M19 12H5', 'm12 19-7-7 7-7'] },
  check: { paths: ['M20 6 9 17l-5-5'] },
  'chevron-down': { paths: ['m6 9 6 6 6-6'] },
  eye: { paths: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'], circles: [[12, 12, 3]] },
  'eye-off': {
    paths: [
      'M9.88 9.88a3 3 0 1 0 4.24 4.24',
      'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68',
      'M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61',
      'm2 2 20 20',
    ],
  },
  hash: { paths: ['M4 9h16', 'M4 15h16', 'M10 3 8 21', 'M16 3l-2 18'] },
  lock: {
    paths: [
      'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
      'M7 11V7a5 5 0 0 1 10 0v4',
    ],
  },
  'log-out': { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'] },
  menu: { paths: ['M4 6h16', 'M4 12h16', 'M4 18h16'] },
  plus: { paths: ['M5 12h14', 'M12 5v14'] },
  search: { paths: ['m21 21-4.3-4.3'], circles: [[11, 11, 8]] },
  users: {
    paths: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M22 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    circles: [[9, 7, 4]],
  },
};

const { name, size = 15 } = defineProps<{
  name: IconName;
  size?: number;
}>();

const glyph = computed<Glyph>(() => GLYPHS[name]);
</script>

<style lang="scss" scoped>
.rl-svg {
  display: block;
  flex: none;
}
</style>
