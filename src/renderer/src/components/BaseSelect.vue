<template>
	<select
		class="w-full bg-[var(--border-card)]/20 border border-transparent focus:border-[var(--shark-primary)] focus:bg-[var(--border-card)]/40 rounded-lg p-3 transition-all"
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
