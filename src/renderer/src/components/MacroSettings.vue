<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Keyboard, Mouse, Plus, Trash2, Save, Play, Clock, } from 'lucide-vue-next';

const props = defineProps<{
	isConnected: boolean;
}>();

const statusMessage = ref('');
const isSaving = ref(false);

const buttons = [
	{ label: 'Left Button', value: 0 },
	{ label: 'Right Button', value: 1 },
	{ label: 'Middle Button', value: 2 },
	{ label: 'Forward Button', value: 3 },
	{ label: 'Backward Button', value: 4 },
	{ label: 'DPI Button', value: 5 },
];

const selectedButton = ref(3); // Default to Forward Button

// Simplified KeyCodes for the UI
const keyCodes = [
	{ label: 'None', value: 0x00 },
	{ label: 'A', value: 0x04 },
	{ label: 'B', value: 0x05 },
	{ label: 'C', value: 0x06 },
	{ label: 'D', value: 0x07 },
	{ label: 'E', value: 0x08 },
	{ label: 'F', value: 0x09 },
	{ label: 'G', value: 0x0a },
	{ label: 'H', value: 0x0b },
	{ label: 'I', value: 0x0c },
	{ label: 'J', value: 0x0d },
	{ label: 'K', value: 0x0e },
	{ label: 'L', value: 0x0f },
	{ label: 'M', value: 0x10 },
	{ label: 'N', value: 0x11 },
	{ label: 'O', value: 0x12 },
	{ label: 'P', value: 0x13 },
	{ label: 'Q', value: 0x14 },
	{ label: 'R', value: 0x15 },
	{ label: 'S', value: 0x16 },
	{ label: 'T', value: 0x17 },
	{ label: 'U', value: 0x18 },
	{ label: 'V', value: 0x19 },
	{ label: 'W', value: 0x1a },
	{ label: 'X', value: 0x1b },
	{ label: 'Y', value: 0x1c },
	{ label: 'Z', value: 0x1d },
	{ label: 'Enter', value: 0x28 },
	{ label: 'Space', value: 0x2c },
	{ label: 'Esc', value: 0x29 },
	{ label: 'F1', value: 0x3a },
	{ label: 'F2', value: 0x3b },
	{ label: 'F3', value: 0x3c },
	{ label: 'F4', value: 0x3d },
	{ label: 'F5', value: 0x3e },
];

const macroEvents = reactive<any[]>([
	{ key: 0x04, delay: 20, isRelease: false },
	{ key: 0x04, delay: 20, isRelease: true },
]);

const playMode = ref(0); // THE_NUMBER_OF_TIME_TO_PLAY
const repeatTimes = ref(1);

const addEvent = () => {
	macroEvents.push({ key: 0x00, delay: 20, isRelease: false });
};

const removeEvent = (index: number) => {
	macroEvents.splice(index, 1);
};

const saveMacro = async () => {
	if (!props.isConnected) return;
	isSaving.value = true;
	statusMessage.value = 'Saving custom macro...';

	try {
		await window.api.setCustomMacro({
			targetButton: selectedButton.value,
			playOptions: {
				mode: playMode.value,
				times: repeatTimes.value,
			},
			events: macroEvents.map((e) => ({ ...e })),
		});
		statusMessage.value = 'Macro saved and assigned!';
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
				Macro Editor
			</h2>
			<button
				@click="saveMacro"
				:disabled="!isConnected || isSaving || macroEvents.length === 0"
				class="bg-green-600 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold transition-all shadow-blue-500/20 flex items-center gap-2"
			>
				<Save class="w-4 h-4" />
				{{ isSaving ? 'Saving...' : 'Save & Assign' }}
			</button>
			<p v-if="macroEvents.length === 0" class="text-xs text-red-400 mt-2">
				Add at least one event to save this macro.
			</p>
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

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Macro Config -->
			<div class="lg:col-span-1 space-y-6">
				<div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
					<h3 class="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
						<Mouse class="w-5 h-5" /> Target Button
					</h3>
					<select
						v-model="selectedButton"
						class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-shark-primary outline-none"
					>
						<option v-for="btn in buttons" :key="btn.value" :value="btn.value">{{ btn.label }}</option>
					</select>
					<p class="text-xs text-slate-500 mt-3">The macro will be triggered when you press this button.</p>
				</div>

				<div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
					<h3 class="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
						<Play class="w-5 h-5" /> Playback Options
					</h3>
					<div class="space-y-4">
						<div>
							<label class="block text-sm text-slate-400 mb-2">Execution Mode</label>
							<select
								v-model="playMode"
								class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none"
							>
								<option :value="0">Play N times</option>
								<option :value="1">Play until any key press</option>
								<option :value="2">Play while held</option>
							</select>
						</div>
						<div v-if="playMode === 0">
							<label class="block text-sm text-slate-400 mb-2">Repeat Count (1-255)</label>
							<input
								type="number"
								v-model.number="repeatTimes"
								min="1"
								max="255"
								class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Event List -->
			<div class="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col min-h-[500px]">
				<div class="flex items-center justify-between mb-8">
					<h3 class="text-xl font-bold flex items-center gap-2">
						<Keyboard class="w-6 h-6 text-shark-primary" />
						Macro Sequence
					</h3>
					<button
						@click="addEvent"
						class="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-shark-primary transition-colors flex items-center gap-1 text-sm font-bold"
					>
						<Plus class="w-4 h-4" /> Add Event
					</button>
				</div>

				<div class="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
					<div
						v-for="(event, index) in macroEvents"
						:key="index"
						class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 group"
					>
						<div
							class="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500"
						>
							{{ index + 1 }}
						</div>

						<div class="flex-1 grid grid-cols-3 gap-4">
							<div>
								<label class="block text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold"
									>Action</label
								>
								<select
									v-model="event.key"
									class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm text-slate-200 outline-none"
								>
									<option v-for="key in keyCodes" :key="key.value" :value="key.value">
										{{ key.label }}
									</option>
								</select>
							</div>

							<div>
								<label class="block text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold"
									>Type</label
								>
								<select
									v-model="event.isRelease"
									class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm text-slate-200 outline-none"
								>
									<option :value="false">Press</option>
									<option :value="true">Release</option>
								</select>
							</div>

							<div>
								<label class="block text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold"
									>Delay (ms)</label
								>
								<div class="flex items-center gap-2">
									<Clock class="w-4 h-4 text-slate-600" />
									<input
										type="number"
										v-model.number="event.delay"
										min="10"
										step="10"
										class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm text-slate-200 outline-none"
									/>
								</div>
							</div>
						</div>

						<button
							@click="removeEvent(index)"
							class="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
						>
							<Trash2 class="w-5 h-5" />
						</button>
					</div>

					<div
						v-if="macroEvents.length === 0"
						class="h-40 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl"
					>
						<Plus class="w-10 h-10 mb-2 opacity-20" />
						<p>Add events to start building your macro</p>
					</div>
				</div>

				<p class="text-xs text-slate-500 mt-6 italic">Max 47 events per custom macro.</p>
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
