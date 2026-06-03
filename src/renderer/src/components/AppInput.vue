<script setup lang="ts">
defineProps<{
	label?: string;
	modelValue?: string | number;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
	<div class="flex flex-col gap-1 w-full">
		<label
			v-if="label"
			class="text-xs text-[var(--text-primary)] opacity-60 uppercase tracking-wider font-semibold"
		>
			{{ label }}
		</label>
		<input
			v-bind="$attrs"
			:value="modelValue"
			@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			class="bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-lg p-2.5 text-[var(--text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
		/>
	</div>
</template>
