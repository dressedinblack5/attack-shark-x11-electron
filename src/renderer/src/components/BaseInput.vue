<template>
	<input
		class="w-full h-[46px] bg-[var(--border-card)]/20 border border-transparent focus:border-[var(--shark-primary)] focus:bg-[var(--border-card)]/40 rounded-lg p-3 transition-all"
		v-bind="$attrs"
		:value="modelValue"
		@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
	/>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string | number;
}>();

defineEmits(['update:modelValue']);
</script>
