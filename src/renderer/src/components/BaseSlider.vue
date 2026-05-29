<template>
  <input
    type="range"
    class="w-full h-2 bg-[var(--text-primary)]/50 rounded-lg appearance-none cursor-pointer accent-shark-primary"
    v-bind="$attrs"
    :value="modelValue"
    @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | number;
}>();

defineEmits(['update:modelValue']);
</script>
