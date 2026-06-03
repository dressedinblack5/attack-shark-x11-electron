<template>
	<select
		class="w-full bg-[var(--border-card)]/50 border border-transparent hover:bg-[var(--border-card)]/80 focus:border-[var(--shark-primary)] focus:bg-[var(--border-card)]/100 rounded-lg p-3 transition-all"
		v-bind="$attrs"
		:value="modelValue"
		@change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
	>
		<slot />
	</select>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string | number;
}>();

defineEmits(['update:modelValue']);
</script>
