<template>
	<button
		class="bg-transparent border border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--border-card)]/50 hover:border-transparent transition-all rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
		v-bind="$attrs"
	>
		<slot />
	</button>
</template>
