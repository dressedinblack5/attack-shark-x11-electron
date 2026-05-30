<template>
	<input
		type="range"
		class="w-full h-2 bg-[var(--text-primary)]/10 rounded-lg appearance-none cursor-pointer accent-shark-primary"
		v-bind="$attrs"
		v-model="internalValue"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string | number;
}>();

const emit = defineEmits(['update:modelValue']);

const internalValue = computed({
	get: () => props.modelValue,
	set: (val) => emit('update:modelValue', Number(val)),
});
</script>
