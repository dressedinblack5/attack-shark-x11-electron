<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Zap, Target, Sliders } from 'lucide-vue-next';
import BaseInput from './BaseInput.vue';
import BaseSlider from './BaseSlider.vue';
import BaseToggle from './BaseToggle.vue';
import Card from './Card.vue';
import StatusMessage from './StatusMessage.vue';
import { useDebounce } from '../composables/useDebounce';

const { t } = useI18n();

const props = defineProps<{
	isConnected: boolean;
	deviceModel?: 'X11' | 'X11SE' | 'R1';
}>();

const R1_DEFAULTS = [800, 1600, 3200, 4000, 5000, 12000] as [number, number, number, number, number, number];
const X11_DEFAULTS = [800, 1600, 2400, 3200, 5000, 22000] as [number, number, number, number, number, number];

const dpiConfig = reactive({
	activeStage: 2,
	angleSnap: false,
	ripplerControl: true,
	dpiValues: (props.deviceModel === 'R1' ? R1_DEFAULTS : X11_DEFAULTS).slice() as [
		number,
		number,
		number,
		number,
		number,
		number,
	],
});

onMounted(async () => {
	const settings = await window.api.getSettings();
	if (settings && settings.dpiConfig) {
		Object.assign(dpiConfig, settings.dpiConfig);
		// Clamp DPI values to model range
		const max = props.deviceModel === 'R1' ? 18000 : 22000;
		const min = props.deviceModel === 'R1' ? 100 : 50;
		dpiConfig.dpiValues = dpiConfig.dpiValues.map((v) => Math.max(min, Math.min(max, v))) as [
			number,
			number,
			number,
			number,
			number,
			number,
		];
	}

	// Set up watcher after initial load so it doesn't fire on mount
	watch(
		dpiConfig,
		async () => {
			const s = await window.api.getSettings();
			await window.api.saveSettings({
				...s,
				dpiConfig: {
					activeStage: dpiConfig.activeStage,
					angleSnap: dpiConfig.angleSnap,
					ripplerControl: dpiConfig.ripplerControl,
					dpiValues: [...dpiConfig.dpiValues],
				},
			});
			if (props.isConnected) {
				debouncedApplyDpi();
			}
		},
		{ deep: true },
	);
});

const statusMessage = ref('');
const isError = ref(false);
const isSaving = ref(false);
const statusType = computed(() => (isError.value ? 'error' : 'success'));

const debouncedApplyDpi = useDebounce(async () => {
	if (!props.isConnected) return;
	try {
		const config = {
			activeStage: dpiConfig.activeStage,
			angleSnap: dpiConfig.angleSnap,
			ripplerControl: dpiConfig.ripplerControl,
			dpiValues: [...dpiConfig.dpiValues],
		};
		await window.api.setDpi(config);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Auto-save DPI failed:', error);
	}
}, 300);

const applyDpi = async () => {
	if (!props.isConnected) return;

	isSaving.value = true;
	statusMessage.value = t('dpi.updating');

	try {
		const config = {
			activeStage: dpiConfig.activeStage,
			angleSnap: dpiConfig.angleSnap,
			ripplerControl: dpiConfig.ripplerControl,
			dpiValues: [...dpiConfig.dpiValues],
		};

		await window.api.setDpi(config);
		statusMessage.value = t('dpi.applied');
		setTimeout(() => {
			statusMessage.value = '';
		}, 3000);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		isError.value = true;
		statusMessage.value = `${t('dpi.error')}: ${error.message}`;
	} finally {
		isSaving.value = false;
	}
};

// DPI range depends on device model
const dpiMin = computed(() => (props.deviceModel === 'R1' ? 100 : 50));
const dpiMax = computed(() => (props.deviceModel === 'R1' ? 18000 : 22000));
const dpiStep = computed(() => (props.deviceModel === 'R1' ? 100 : 50));
</script>

<template>
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
				<Target class="w-8 h-8 text-shark-primary" />
				{{ $t('dpi.title') }}
			</h2>
		</div>

		<StatusMessage :message="statusMessage" :type="statusType" />

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Sensor Settings -->
			<div class="lg:col-span-1 space-y-6">
				<Card>
					<template #title>
						<Sliders class="w-6 h-6 text-shark-primary" /> {{ $t('dpi.sensorOptions') }}
					</template>

					<div class="space-y-6">
						<BaseToggle
							v-model="dpiConfig.angleSnap"
							:label="$t('dpi.angleSnap')"
							:description="$t('dpi.angleSnapDesc')"
						/>
						<BaseToggle
							v-model="dpiConfig.ripplerControl"
							:label="$t('dpi.rippleControl')"
							:description="$t('dpi.rippleControlDesc')"
						/>
					</div>
				</Card>

				<Card>
					<template #title>
						<Target class="w-6 h-6 text-shark-primary" /> {{ $t('dpi.activeStage') }}
					</template>
					<div class="grid grid-cols-6 gap-2">
						<button
							v-for="i in 6"
							:key="i"
							:class="[
								'py-2 rounded-lg text-sm font-medium transition-all',
								dpiConfig.activeStage === i
									? 'bg-shark-primary text-white shadow-sm font-bold'
									: 'bg-[var(--border-card)]/50 text-[var(--text-primary)] opacity-70 hover:opacity-100',
							]"
							@click="dpiConfig.activeStage = i"
						>
							{{ i }}
						</button>
					</div>
					<p class="text-xs text-[var(--text-primary)] opacity-50 mt-4 text-center">
						{{ $t('dpi.activeImmediately') }}
					</p>
				</Card>
			</div>

			<!-- DPI Stages -->
			<Card class="lg:col-span-2">
				<template #title>
					<Zap class="w-6 h-6 text-shark-primary" />
					{{ $t('dpi.sensitivityStages') }}
				</template>

				<div class="mt-6 space-y-3 overflow-y-auto pr-2" style="min-height: 400px">
					<div
						v-for="i in 6"
						:key="i"
						class="p-4 rounded-xl bg-[var(--border-card)]/30 border border-[var(--border-card)] space-y-3"
					>
						<div class="flex justify-between items-center">
							<label
								class="font-medium text-sm text-[var(--text-primary)] opacity-70 mb-2 flex items-center gap-3"
							>
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
							</label>
							<div class="flex items-center gap-2">
								<BaseInput
									type="number"
									v-model.number="dpiConfig.dpiValues[i - 1]"
									:min="dpiMin"
									:max="dpiMax"
									:step="dpiStep"
									class="w-24"
								/>
								<span class="text-xs text-[var(--text-primary)] opacity-50 font-medium">{{
									$t('dpi.dpiUnit')
								}}</span>
							</div>
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
			</Card>
		</div>
	</div>
</template>
