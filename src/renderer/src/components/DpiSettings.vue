<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Zap, Target, Sliders } from 'lucide-vue-next';

const props = defineProps<{
	isConnected: boolean;
}>();

const dpiConfig = reactive({
	activeStage: 2,
	angleSnap: false,
	ripplerControl: true,
	dpiValues: [800, 1600, 2400, 3200, 5000, 22000] as [number, number, number, number, number, number],
});

// Removed watch(...) and REVERSE_DPI_MAP logic

const statusMessage = ref('');
const isSaving = ref(false);

const applyDpi = async () => {
	if (!props.isConnected) return;

	isSaving.value = true;
	statusMessage.value = 'Updating DPI configuration...';

	try {
		// Ensure we send a plain object and valid stage index
		const config = {
			activeStage: dpiConfig.activeStage,
			angleSnap: dpiConfig.angleSnap,
			ripplerControl: dpiConfig.ripplerControl,
			dpiValues: [...dpiConfig.dpiValues],
		};

		await window.api.setDpi(config);
		statusMessage.value = 'DPI settings applied!';
		setTimeout(() => {
			statusMessage.value = '';
		}, 3000);
	} catch (err: any) {
		statusMessage.value = `Error: ${err.message}`;
	} finally {
		isSaving.value = false;
	}
};

// DPI Steps are generally 50 or 100
const dpiMin = 50;
const dpiMax = 22000;
const dpiStep = 50;
</script>

<template>
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3">
				<Target class="w-8 h-8 text-shark-primary" />
				DPI Configuration
			</h2>
			<button
				@click="applyDpi"
				:disabled="!isConnected || isSaving"
				class="bg-shark-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
			>
				{{ isSaving ? 'Applying...' : 'Save DPI' }}
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

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Sensor Settings -->
			<div class="lg:col-span-1 space-y-6">
				<div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
					<h3 class="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
						<Sliders class="w-5 h-5" /> Sensor Options
					</h3>

					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium">Angle Snapping</div>
								<div class="text-xs text-slate-500">Corrects mouse movement to straight lines</div>
							</div>
							<button
								@click="dpiConfig.angleSnap = !dpiConfig.angleSnap"
								:class="[
									'w-12 h-6 rounded-full p-1 transition-colors',
									dpiConfig.angleSnap ? 'bg-shark-primary' : 'bg-slate-700',
								]"
							>
								<div
									:class="[
										'w-4 h-4 bg-white rounded-full transition-transform',
										dpiConfig.angleSnap ? 'translate-x-6' : 'translate-x-0',
									]"
								></div>
							</button>
						</div>

						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium">Ripple Control</div>
								<div class="text-xs text-slate-500">Smooths out jitter at high DPI levels</div>
							</div>
							<button
								@click="dpiConfig.ripplerControl = !dpiConfig.ripplerControl"
								:class="[
									'w-12 h-6 rounded-full p-1 transition-colors',
									dpiConfig.ripplerControl ? 'bg-shark-primary' : 'bg-slate-700',
								]"
							>
								<div
									:class="[
										'w-4 h-4 bg-white rounded-full transition-transform',
										dpiConfig.ripplerControl ? 'translate-x-6' : 'translate-x-0',
									]"
								></div>
							</button>
						</div>
					</div>
				</div>

				<div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
					<h3 class="text-lg font-semibold mb-4 text-slate-300">Active Stage</h3>
					<div class="grid grid-cols-3 gap-2">
						<button
							v-for="i in 6"
							:key="i"
							@click="dpiConfig.activeStage = i"
							:class="[
								'py-2 rounded-lg font-bold border transition-all',
								dpiConfig.activeStage === i
									? 'bg-shark-primary border-shark-primary text-white'
									: 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500',
							]"
						>
							{{ i }}
						</button>
					</div>
					<p class="text-xs text-slate-500 mt-4 text-center">
						Selected stage is active immediately after saving.
					</p>
				</div>
			</div>

			<!-- DPI Stages -->
			<div class="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800">
				<h3 class="text-xl font-bold mb-8 flex items-center gap-2">
					<Zap class="w-6 h-6 text-shark-primary" />
					Sensitivity Stages (1-6)
				</h3>

				<div class="space-y-10">
					<div v-for="i in 6" :key="i" class="space-y-2">
						<div class="flex justify-between items-end">
							<label class="font-bold text-slate-300 flex items-center gap-2">
								<span
									:class="[
										'w-6 h-6 flex items-center justify-center rounded text-xs',
										dpiConfig.activeStage === i
											? 'bg-shark-primary text-white'
											: 'bg-slate-800 text-slate-500',
									]"
								>
									{{ i }}
								</span>
								Stage {{ i }}
							</label>
							<div class="text-2xl font-black text-shark-primary">
								{{ dpiConfig.dpiValues[i - 1] }}
								<span class="text-xs font-normal text-slate-500">DPI</span>
							</div>
						</div>

						<div class="relative pt-1">
							<input
								type="range"
								v-model.number="dpiConfig.dpiValues[i - 1]"
								:min="dpiMin"
								:max="dpiMax"
								:step="dpiStep"
								class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-shark-primary"
							/>
							<div
								class="flex justify-between text-[10px] text-slate-600 mt-2 uppercase tracking-widest font-bold"
							>
								<span>{{ dpiMin }} DPI</span>
								<span>{{ dpiMax }} DPI</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 18px;
	height: 18px;
	background: white;
	border: 4px solid #3b82f6;
	border-radius: 50%;
	cursor: pointer;
	box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

input[type='range']::-moz-range-thumb {
	width: 18px;
	height: 18px;
	background: white;
	border: 4px solid #3b82f6;
	border-radius: 50%;
	cursor: pointer;
	box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}
</style>
