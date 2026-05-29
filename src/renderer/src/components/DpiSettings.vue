<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Zap, Target, Sliders } from 'lucide-vue-next';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import BaseSelect from './BaseSelect.vue';
import BaseSlider from './BaseSlider.vue';

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
			<BaseButton
				@click="applyDpi"
				:disabled="!isConnected || isSaving"
				variant="green"
			>
				{{ isSaving ? 'Applying...' : 'Save DPI' }}
			</BaseButton>
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
				<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)]">
					<h3 class="text-lg font-semibold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
						<Sliders class="w-6 h-6" /> Sensor Options
					</h3>

					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium">Angle Snapping</div>
								<div class="text-xs text-[var(--text-primary)] opacity-50">Corrects mouse movement to straight lines</div>
							</div>
							<button
								@click="dpiConfig.angleSnap = !dpiConfig.angleSnap"
								:class="[
									'w-12 h-6 rounded-full p-1 transition-colors',
									dpiConfig.angleSnap ? 'bg-shark-primary' : 'bg-[var(--border-card)]',
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
								<div class="text-xs text-[var(--text-primary)] opacity-50">Smooths out jitter at high DPI levels</div>
							</div>
							<button
								@click="dpiConfig.ripplerControl = !dpiConfig.ripplerControl"
								:class="[
									'w-12 h-6 rounded-full p-1 transition-colors',
									dpiConfig.ripplerControl ? 'bg-shark-primary' : 'bg-[var(--border-card)]',
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

				<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)]">
					<h3 class="text-lg font-semibold mb-4 text-[var(--text-primary)]">Active Stage</h3>
					<BaseSelect v-model.number="dpiConfig.activeStage">
						<option v-for="i in 6" :key="i" :value="i">Stage {{ i }}</option>
					</BaseSelect>
					<p class="text-xs text-[var(--text-primary)] opacity-50 mt-4 text-center">
						Selected stage is active immediately after saving.
					</p>
				</div>
			</div>

			<!-- DPI Stages -->
			<div class="lg:col-span-2 bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-card)]">
				<h3 class="text-xl font-bold mb-8 flex items-center gap-3">
					<Zap class="w-6 h-6 text-shark-primary" />
					Sensitivity Stages (1-6)
				</h3>

				<div class="space-y-6 overflow-y-auto pr-2" style="min-height: 400px">
					<div
						v-for="i in 6"
						:key="i"
						class="p-4 rounded-xl bg-[var(--border-card)]/30 border border-[var(--border-card)] space-y-3"
					>
						<div class="flex justify-between items-center">
							<label class="font-medium text-sm text-[var(--text-primary)] opacity-70 mb-2 flex items-center gap-3">
								<span
									:class="[
										'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all',
										dpiConfig.activeStage === i
											? 'bg-shark-primary text-white shadow-lg shadow-shark-primary/50 font-bold ring-2 ring-shark-primary ring-offset-2 ring-offset-[var(--bg-card)]'
											: 'bg-[var(--border-card)] text-[var(--text-primary)] opacity-50',
									]"
								>
									{{ i }}
								</span>
								Stage {{ i }}
							</label>
							<BaseInput
								type="number"
								v-model.number="dpiConfig.dpiValues[i - 1]"
								:min="dpiMin"
								:max="dpiMax"
								:step="dpiStep"
								class="w-24"
							/>
						</div>

						<div class="relative">
							<BaseSlider
								v-model="dpiConfig.dpiValues[i - 1]"
								:min="dpiMin"
								:max="dpiMax"
								:step="dpiStep"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
