<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue';
import { Info, Palette, Cpu, Database, Settings, AlertTriangle, RotateCcw } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import BaseSelect from './BaseSelect.vue';
import BaseSlider from './BaseSlider.vue';
import Card from './Card.vue';
import StatusMessage from './StatusMessage.vue';
import { useDebounce } from '../composables/useDebounce';

export interface UserPreferences {
	lightMode: number;
	ledSpeed: number;
	keyResponse: number;
	pollingRate: number;
	sleepTime: number;
	deepSleepTime: number;
	rgb: { r: number; g: number; b: number };
}

const { t } = useI18n();

const DEFAULT_PREFS: UserPreferences = {
	lightMode: 0x20,
	ledSpeed: 2,
	keyResponse: 4,
	pollingRate: 1000,
	sleepTime: 2,
	deepSleepTime: 10,
	rgb: { r: 255, g: 0, b: 255 },
};

const props = defineProps<{
	isConnected: boolean;
	modelValue: UserPreferences;
	deviceModel?: 'X11' | 'X11SE' | 'R1';
	connectionMode?: string | null;
}>();

const isWired = computed(() => props.connectionMode === 'Wired');

const emit = defineEmits(['update:modelValue', 'resetComplete']);

const form = reactive<UserPreferences>({ ...DEFAULT_PREFS, ...props.modelValue });

watch(
	() => props.modelValue,
	(newVal) => {
		Object.assign(form, newVal);
	},
	{ deep: true },
);

const debouncedApplyPreferences = useDebounce(async () => {
	await applyPreferences(false);
}, 300);

// Watch form changes to sync with parent and auto-apply
watch(
	form,
	(newVal) => {
		emit('update:modelValue', { ...newVal });
		if (props.isConnected) {
			debouncedApplyPreferences();
		}
	},
	{ deep: true },
);

const pollingRates = [
	{ label: '125Hz (Power Saving)', value: 125 },
	{ label: '250Hz (Office)', value: 250 },
	{ label: '500Hz (Gaming)', value: 500 },
	{ label: '1000Hz (eSports)', value: 1000 },
];

const rgb = computed(() => form.rgb);

const lightModes = computed(() => [
	{ label: t('preferences.lightModes.off'), value: 0x00 },
	{ label: t('preferences.lightModes.static'), value: 0x10 },
	{ label: t('preferences.lightModes.breathing'), value: 0x20 },
	{ label: t('preferences.lightModes.neon'), value: 0x30 },
	{ label: t('preferences.lightModes.colorBreathing'), value: 0x40 },
	{ label: t('preferences.lightModes.staticDpi'), value: 0x50 },
	{ label: t('preferences.lightModes.breathingDpi'), value: 0x60 },
]);

const keyResponses = Array.from({ length: 24 }, (_, i) => 4 + i * 2);

const statusMessage = ref('');
const isError = ref(false);
const isSaving = ref(false);
const statusType = computed(() => (isError.value ? 'error' : 'success'));
const profiles = ref<string[]>([]);
const newProfileName = ref('');

const loadProfilesList = async () => {
	profiles.value = await window.api.listProfiles();
};

const saveNewProfile = async () => {
	if (!newProfileName.value) return;
	const plainPrefs = {
		lightMode: form.lightMode,
		ledSpeed: form.ledSpeed,
		keyResponse: form.keyResponse,
		pollingRate: form.pollingRate,
		sleepTime: form.sleepTime,
		deepSleepTime: form.deepSleepTime,
		rgb: { ...form.rgb },
	};
	await window.api.saveProfile(newProfileName.value, plainPrefs);
	newProfileName.value = '';
	await loadProfilesList();
};

const applyProfile = async (name: string) => {
	const data = await window.api.loadProfile(name);
	if (data) {
		const prefs = data as UserPreferences;
		Object.assign(form, prefs);
		await applyPreferences();
	}
};

const deleteProfile = async (name: string) => {
	await window.api.deleteProfile(name);
	await loadProfilesList();
};

loadProfilesList();

const isResetting = ref(false);

const resetDevice = async () => {
	if (!confirm(t('reset.confirm'))) return;
	isResetting.value = true;
	statusMessage.value = '';
	try {
		await window.api.resetDevice();
		alert(t('reset.success'));
		emit('resetComplete');
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		statusMessage.value = `${t('reset.failed')}: ${error.message}`;
	} finally {
		isResetting.value = false;
	}
};

async function applyPreferences(showUi = true) {
	if (!props.isConnected) return;

	if (showUi) {
		isSaving.value = true;
		isError.value = false;
		statusMessage.value = 'Applying settings...';
	}

	try {
		// Strip lighting data in wired mode — firmware doesn't accept it
		const plainPrefs = isWired.value
			? {
					keyResponse: form.keyResponse,
					sleepTime: form.sleepTime,
					deepSleepTime: form.deepSleepTime,
				}
			: {
					lightMode: form.lightMode,
					ledSpeed: form.ledSpeed,
					keyResponse: form.keyResponse,
					sleepTime: form.sleepTime,
					deepSleepTime: form.deepSleepTime,
					rgb: {
						r: form.rgb.r,
						g: form.rgb.g,
						b: form.rgb.b,
					},
				};

		await window.api.setUserPreferences(plainPrefs);
		await window.api.setPollingRate(form.pollingRate);

		if (showUi) {
			statusMessage.value = 'Settings applied successfully!';
			setTimeout(() => {
				statusMessage.value = '';
			}, 3000);
		}
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		isError.value = true;
		if (showUi) {
			statusMessage.value = `Error: ${error.message}`;
		} else {
			console.error('Auto-save failed:', error);
		}
	} finally {
		if (showUi) {
			isSaving.value = false;
		}
	}
}
</script>

<template>
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
				<Settings class="w-8 h-8 text-shark-primary" />
				{{ $t('preferences.title') }}
			</h2>
			<div class="flex items-center gap-2">
				<BaseInput
					v-model="newProfileName"
					:placeholder="$t('preferences.newProfilePlaceholder')"
					class="w-48"
				/>
				<BaseButton @click="saveNewProfile"> {{ $t('preferences.saveProfile') }} </BaseButton>
			</div>
		</div>

		<Card>
			<template #title>
				<Database class="w-6 h-6 text-shark-primary" />
				{{ $t('preferences.storedProfiles') }}
			</template>
			<div class="flex flex-wrap gap-2">
				<div
					v-for="profile in profiles"
					:key="profile"
					class="bg-[var(--bg-primary)] p-2 rounded-lg flex items-center gap-2 border border-[var(--border-card)]"
				>
					<span>{{ profile }}</span>
					<button
						@click="applyProfile(profile)"
						class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-all"
					>
						{{ $t('preferences.applyAction') }}
					</button>
					<button @click="deleteProfile(profile)" class="text-red-400 hover:text-red-300">
						{{ $t('preferences.deleteAction') }}
					</button>
				</div>
			</div>
		</Card>

		<StatusMessage :message="statusMessage" :type="statusType" />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card v-if="deviceModel !== 'R1'">
				<template #title>
					<Palette class="w-6 h-6 text-shark-primary" :class="isWired ? 'opacity-40' : ''" />
					<span :class="isWired ? 'opacity-40' : ''">{{ $t('preferences.lighting') }}</span>
				</template>

				<div
					v-if="isWired"
					class="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4"
				>
					<Info class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
					<p class="text-sm text-amber-300 leading-relaxed">
						Lighting is not available in wired mode. Connect via the wireless adapter to configure RGB.
					</p>
				</div>

				<div class="space-y-4" :class="isWired ? 'pointer-events-none opacity-40' : ''">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('preferences.effectMode')
						}}</label>
						<BaseSelect v-model="form.lightMode">
							<option v-for="mode in lightModes" :key="mode.value" :value="mode.value">
								{{ mode.label }}
							</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.ledSpeed') }} ({{ form.ledSpeed }})</label
						>
						<BaseSlider v-model="form.ledSpeed" min="1" max="5" step="1" />
						<div class="flex justify-between text-xs text-[var(--text-primary)] opacity-50 mt-1">
							<span>{{ $t('preferences.slow') }}</span>
							<span>{{ $t('preferences.fast') }}</span>
						</div>
					</div>

					<div class="flex items-center gap-4 mb-4">
						<div
							class="relative w-10 h-10 rounded-full flex-shrink-0 transition-all duration-500"
							:style="{
								backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
								boxShadow: `0 0 20px rgb(${rgb.r}, ${rgb.g}, ${rgb.b})66, 0 0 40px rgb(${rgb.r}, ${rgb.g}, ${rgb.b})33`,
							}"
						>
							<div
								class="absolute inset-1 rounded-full border"
								:class="
									rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 < 128
										? 'border-white/20'
										: 'border-black/10'
								"
							/>
						</div>
						<input
							type="color"
							:value="`#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`"
							@input="
								(e: Event) => {
									const target = e.target as HTMLInputElement;
									const hex = target.value;
									form.rgb.r = parseInt(hex.slice(1, 3), 16);
									form.rgb.g = parseInt(hex.slice(3, 5), 16);
									form.rgb.b = parseInt(hex.slice(5, 7), 16);
								}
							"
							class="w-12 h-[46px] bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-lg cursor-pointer p-1 transition-all"
						/>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<div>
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.red')
							}}</label>
							<BaseInput type="number" v-model.number="rgb.r" min="0" max="255" />
						</div>
						<div>
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.green')
							}}</label>
							<BaseInput type="number" v-model.number="rgb.g" min="0" max="255" />
						</div>
						<div>
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.blue')
							}}</label>
							<BaseInput type="number" v-model.number="rgb.b" min="0" max="255" />
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<template #title>
					<Cpu class="w-6 h-6 text-shark-primary" />
					{{ $t('preferences.deviceBehavior') }}
				</template>

				<div class="space-y-4">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('preferences.pollingRate')
						}}</label>
						<BaseSelect v-model="form.pollingRate">
							<option v-for="rate in pollingRates" :key="rate.value" :value="rate.value">
								{{ rate.label }}
							</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.keyResponse') }} ({{ form.keyResponse }}ms)</label
						>
						<BaseSelect v-model="form.keyResponse">
							<option v-for="ms in keyResponses" :key="ms" :value="ms">{{ ms }}ms</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.sleepTimer') }} ({{ form.sleepTime }} min)</label
						>
						<BaseSlider v-model="form.sleepTime" min="0.5" max="30" step="0.5" />
					</div>
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.deepSleepTimer') }} ({{ form.deepSleepTime }} min)</label
						>
						<BaseSlider v-model="form.deepSleepTime" min="1" max="60" step="1" />
					</div>
				</div>
			</Card>
		</div>

		<!-- Danger Zone -->
		<Card class="border-red-500/40 bg-red-500/[0.03] hover:border-red-500/60 shadow-red-500/5">
			<template #title>
				<AlertTriangle class="w-6 h-6 text-red-400" />
				{{ $t('reset.dangerZone') }}
			</template>
			<div class="space-y-4">
				<div class="flex items-start gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15">
					<AlertTriangle class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
					<p class="text-sm text-[var(--text-secondary)] leading-relaxed">
						{{ $t('reset.dangerZoneDesc') }}
					</p>
				</div>
				<BaseButton @click="resetDevice" :disabled="!isConnected || isResetting" variant="red">
					<RotateCcw class="w-4 h-4" />
					{{ isResetting ? $t('reset.resetting') : $t('reset.button') }}
				</BaseButton>
			</div>
		</Card>
	</div>
</template>
