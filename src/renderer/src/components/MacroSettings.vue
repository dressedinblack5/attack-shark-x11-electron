<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Keyboard } from 'lucide-vue-next';
import { macroTemplates, MacroName, type MacroTuple } from '../../../shared/macro-templates.js';
import { useDebounce } from '../composables/useDebounce';
import BaseSelect from './BaseSelect.vue';
import Card from './Card.vue';
import StatusMessage from './StatusMessage.vue';
import CustomMacroEditor from './CustomMacroEditor.vue';

const props = defineProps<{
	isConnected: boolean;
	deviceModel?: 'X11' | 'X11SE' | 'R1';
}>();

const { t } = useI18n();

const templateOptions = Object.keys(macroTemplates).map((name) => ({
	label: name.replace(/-/g, ' ').toUpperCase(),
	value: name as MacroName,
}));

const statusMessage = ref('');
const isError = ref(false);
const isSaving = ref(false);
const statusType = computed(() => (isError.value ? 'error' : 'success'));
const selectedTemplate = ref<MacroName>(templateOptions[0].value);

const buttons = computed(() => [
	{ label: t('macros.buttons.left'), value: 0 },
	{ label: t('macros.buttons.right'), value: 1 },
	{ label: t('macros.buttons.middle'), value: 2 },
	{ label: t('macros.buttons.forward'), value: 3 },
	{ label: t('macros.buttons.backward'), value: 4 },
	{ label: t('macros.buttons.dpi'), value: 5 },
]);

const selectedButton = ref(3);

const activeTab = ref<'templates' | 'custom'>('templates');

const applyMacro = async () => {
	if (!props.isConnected) return;
	isSaving.value = true;
	statusMessage.value = t('macros.applying');

	try {
		const macroConfig: Record<string, MacroTuple> = {};

		const buttonMap: Record<number, string> = {
			0: 'left',
			1: 'right',
			2: 'middle',
			3: 'forward',
			4: 'backward',
			5: 'dpi',
		};

		const buttonKey = buttonMap[selectedButton.value];
		macroConfig[buttonKey] = macroTemplates[selectedTemplate.value];

		await window.api.setMacro(macroConfig);
		statusMessage.value = t('macros.macroAssigned');
		setTimeout(() => (statusMessage.value = ''), 3000);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		isError.value = true;
		statusMessage.value = `${t('macros.errorPrefix')}${error.message}`;
	} finally {
		isSaving.value = false;
	}
};

const debouncedApplyMacro = useDebounce(applyMacro, 300);

watch([selectedTemplate, selectedButton], () => debouncedApplyMacro());
</script>

<template>
	<div v-if="deviceModel === 'R1'" class="flex items-center justify-center h-64">
		<p class="text-[var(--text-secondary)] text-lg">{{ $t('capabilities.notSupported') }}</p>
	</div>
	<div v-else class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
				<Keyboard class="w-8 h-8 text-shark-primary" />
				{{ $t('macros.title') }}
			</h2>
		</div>

		<!-- Tab Navigation -->
		<div class="flex gap-2 bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border-card)]">
			<button
				@click="activeTab = 'templates'"
				:class="[
					'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
					activeTab === 'templates'
						? 'bg-shark-primary text-white shadow-sm'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
				]"
			>
				{{ $t('macros.macroTemplate') }}
			</button>
			<button
				@click="activeTab = 'custom'"
				:class="[
					'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
					activeTab === 'custom'
						? 'bg-shark-primary text-white shadow-sm'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
				]"
			>
				{{ $t('macros.customMacro') }}
			</button>
		</div>

		<StatusMessage :message="statusMessage" :type="statusType" />

		<!-- Template Macros Tab -->
		<div v-if="activeTab === 'templates'">
			<Card>
				<template #title>
					<Keyboard class="w-6 h-6 text-shark-primary" />
					{{ $t('macros.configTitle') }}
				</template>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('macros.targetButton')
						}}</label>
						<BaseSelect v-model="selectedButton">
							<option v-for="btn in buttons" :key="btn.value" :value="btn.value">{{ btn.label }}</option>
						</BaseSelect>
					</div>
					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('macros.macroTemplate')
						}}</label>
						<BaseSelect v-model="selectedTemplate">
							<option v-for="opt in templateOptions" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</BaseSelect>
					</div>
				</div>
			</Card>
		</div>

		<!-- Custom Macro Tab -->
		<div v-else>
			<CustomMacroEditor :isConnected="props.isConnected" />
		</div>
	</div>
</template>
