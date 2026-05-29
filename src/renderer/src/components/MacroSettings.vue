<script setup lang="ts">
import { ref } from 'vue';
import { Keyboard, Mouse, Save, } from 'lucide-vue-next';
import { macroTemplates, MacroName } from '../../../main/driver/protocols/MacrosBuilder';

const props = defineProps<{
	isConnected: boolean;
}>();

const templateOptions = Object.keys(macroTemplates).map((name) => ({
	label: name.replace(/-/g, ' ').toUpperCase(),
	value: name as MacroName,
}));

const statusMessage = ref('');
const isSaving = ref(false);
const selectedTemplate = ref<MacroName>(templateOptions[0].value);

const buttons = [
	{ label: 'Left Button', value: 0 },
	{ label: 'Right Button', value: 1 },
	{ label: 'Middle Button', value: 2 },
	{ label: 'Forward Button', value: 3 },
	{ label: 'Backward Button', value: 4 },
	{ label: 'DPI Button', value: 5 },
];

const selectedButton = ref(3); // Default to Forward Button

const applyMacro = async () => {
	if (!props.isConnected) return;
	isSaving.value = true;
	statusMessage.value = 'Applying macro...';

	try {
		// Map the selected button to the template macro
		const macroConfig: Record<string, any> = {};
		
		// Button mapping: 0=LEFT, 1=RIGHT, 2=MIDDLE, 3=FORWARD, 4=BACKWARD, 5=DPI
		// The MacroBuilderOptions expects keys like 'left', 'right', 'forward', 'backward'
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
		statusMessage.value = 'Macro assigned!';
		setTimeout(() => (statusMessage.value = ''), 3000);
	} catch (err: any) {
		statusMessage.value = `Error: ${err.message}`;
	} finally {
		isSaving.value = false;
	}
};
</script>

<template>
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3">
				<Keyboard class="w-8 h-8 text-shark-primary" />
				Macro Selector
			</h2>
			<button
				@click="applyMacro"
				:disabled="!isConnected || isSaving"
				class="bg-green-600 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold transition-all shadow-blue-500/20 flex items-center gap-2"
			>
				<Save class="w-4 h-4" />
				{{ isSaving ? 'Applying...' : 'Apply Macro' }}
			</button>
		</div>

		<div
			v-if="statusMessage"
			:class="[
				'p-3 rounded-lg text-sm border',
				statusMessage.includes('Error')
					? 'bg-red-500/10 border-red-500/20 text-red-400'
					: 'bg-shark-accent/10 border-shark-accent/20 text-shark-accent',
			]"
		>
			{{ statusMessage }}
		</div>

		<div class="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label class="block text-sm font-medium text-slate-400 mb-2">Target Button</label>
					<select
						v-model="selectedButton"
						class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-shark-primary outline-none"
					>
						<option v-for="btn in buttons" :key="btn.value" :value="btn.value">{{ btn.label }}</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-400 mb-2">Macro Template</label>
					<select
						v-model="selectedTemplate"
						class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-shark-primary outline-none"
					>
						<option v-for="opt in templateOptions" :key="opt.value" :value="opt.value">
							{{ opt.label }}
						</option>
					</select>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #1e293b;
	border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #334155;
}
</style>
