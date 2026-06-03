<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { Palette, Cpu, Database, Settings } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import BaseSelect from './BaseSelect.vue';
import BaseSlider from './BaseSlider.vue';
import Card from './Card.vue';
import AppInput from './AppInput.vue';
import { useDebounce } from '../composables/useDebounce';

const { t } = useI18n();

const props = defineProps<{
	isConnected: boolean;
	preferences: {
		lightMode: number;
		ledSpeed: number;
		keyResponse: number;
		pollingRate: number;
		sleepTime: number;
		deepSleepTime: number;
		rgb: { r: number; g: number; b: number };
	};
}>();

const debouncedApplyPreferences = useDebounce(async () => {
	await applyPreferences(false);
}, 300);

watch(
	() => props.preferences,
	() => {
		debouncedApplyPreferences();
	},
	{ deep: true },
);

const pollingRates = [
	{ label: '125Hz (Power Saving)', value: 125 },
	{ label: '250Hz (Office)', value: 250 },
	{ label: '500Hz (Gaming)', value: 500 },
	{ label: '1000Hz (eSports)', value: 1000 },
];

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
const isSaving = ref(false);
const profiles = ref<string[]>([]);
const newProfileName = ref('');

const loadProfilesList = async () => {
	profiles.value = await window.api.listProfiles();
};

const saveNewProfile = async () => {
	if (!newProfileName.value) return;
	const plainPrefs = {
		lightMode: props.preferences.lightMode,
		ledSpeed: props.preferences.ledSpeed,
		keyResponse: props.preferences.keyResponse,
		pollingRate: props.preferences.pollingRate,
		sleepTime: props.preferences.sleepTime,
		deepSleepTime: props.preferences.deepSleepTime,
		rgb: { ...props.preferences.rgb },
	};
	await window.api.saveProfile(newProfileName.value, plainPrefs);
	newProfileName.value = '';
	await loadProfilesList();
};

const applyProfile = async (name: string) => {
	const data = await window.api.loadProfile(name);
	if (data) {
		props.preferences.lightMode = data.lightMode;
		props.preferences.ledSpeed = data.ledSpeed;
		props.preferences.keyResponse = data.keyResponse;
		props.preferences.pollingRate = data.pollingRate;
		props.preferences.sleepTime = data.sleepTime;
		props.preferences.deepSleepTime = data.deepSleepTime;
		props.preferences.rgb.r = data.rgb.r;
		props.preferences.rgb.g = data.rgb.g;
		props.preferences.rgb.b = data.rgb.b;

		await applyPreferences();
	}
};

const deleteProfile = async (name: string) => {
	await window.api.deleteProfile(name);
	await loadProfilesList();
};

loadProfilesList();

async function applyPreferences(showUi = true) {
	if (!props.isConnected) return;

	if (showUi) {
		isSaving.value = true;
		statusMessage.value = 'Applying settings...';
	}

	try {
		const plainPrefs = {
			lightMode: props.preferences.lightMode,
			ledSpeed: props.preferences.ledSpeed,
			keyResponse: props.preferences.keyResponse,
			sleepTime: props.preferences.sleepTime,
			deepSleepTime: props.preferences.deepSleepTime,
			rgb: {
				r: props.preferences.rgb.r,
				g: props.preferences.rgb.g,
				b: props.preferences.rgb.b,
			},
		};

		await window.api.setUserPreferences(plainPrefs);
		await window.api.setPollingRate(props.preferences.pollingRate);

		if (showUi) {
			statusMessage.value = 'Settings applied successfully!';
			setTimeout(() => {
				statusMessage.value = '';
			}, 3000);
		}
	} catch (err: any) {
		if (showUi) {
			statusMessage.value = `Error: ${err.message}`;
		} else {
			console.error('Auto-save failed:', err);
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
				<BaseButton @click="applyPreferences" :disabled="!isConnected || isSaving" variant="green">
					{{ isSaving ? $t('preferences.saving') : $t('preferences.applyAction') }}
				</BaseButton>
			</div>
		</div>

		<Card>
			<h3
				class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider flex items-center gap-3 mb-4"
			>
				<Database class="w-6 h-6 text-[var(--color-accent)]" />
				{{ $t('preferences.storedProfiles') }}
			</h3>
			<div class="flex flex-wrap gap-2">
				<div
					v-for="profile in profiles"
					:key="profile"
					class="bg-[var(--bg-primary)] p-2 rounded-lg flex items-center gap-2 border border-[var(--border-card)]"
				>
					<span>{{ profile }}</span>
					<button @click="applyProfile(profile)" class="text-[var(--color-accent)] hover:brightness-125">
						{{ $t('preferences.applyAction') }}
					</button>
					<button @click="deleteProfile(profile)" class="text-red-400 hover:text-red-300">
						{{ $t('preferences.deleteAction') }}
					</button>
				</div>
			</div>
		</Card>

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

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card>
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider flex items-center gap-3 mb-4"
				>
					<Palette class="w-6 h-6 text-[var(--color-accent)]" />
					{{ $t('preferences.lighting') }}
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('preferences.effectMode')
						}}</label>
						<BaseSelect v-model="props.preferences.lightMode">
							<option v-for="mode in lightModes" :key="mode.value" :value="mode.value">
								{{ mode.label }}
							</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.ledSpeed') }} ({{ props.preferences.ledSpeed }})</label
						>
						<BaseSlider v-model="props.preferences.ledSpeed" min="1" max="5" step="1" />

						<div class="flex justify-between text-xs text-[var(--text-primary)] opacity-50 mt-1">
							<span>{{ $t('preferences.slow') }}</span>
							<span>{{ $t('preferences.fast') }}</span>
						</div>
					</div>

					<div class="grid grid-cols-4 gap-2">
						<div class="col-span-1">
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.color')
							}}</label>
							<input
								type="color"
								:value="`#${props.preferences.rgb.r.toString(16).padStart(2, '0')}${props.preferences.rgb.g.toString(16).padStart(2, '0')}${props.preferences.rgb.b.toString(16).padStart(2, '0')}`"
								@input="
									(e: Event) => {
										const target = e.target as HTMLInputElement;
										const hex = target.value;
										props.preferences.rgb.r = parseInt(hex.slice(1, 3), 16);
										props.preferences.rgb.g = parseInt(hex.slice(3, 5), 16);
										props.preferences.rgb.b = parseInt(hex.slice(5, 7), 16);
									}
								"
								class="w-full h-[46px] bg-[var(--bg-primary)] border border-[var(--border-card)] rounded-lg cursor-pointer p-1 transition-all"
							/>
						</div>
						<div class="col-span-1">
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.red')
							}}</label>
							<AppInput type="number" v-model.number="props.preferences.rgb.r" min="0" max="255" />
						</div>
						<div class="col-span-1">
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.green')
							}}</label>
							<AppInput type="number" v-model.number="props.preferences.rgb.g" min="0" max="255" />
						</div>
						<div class="col-span-1">
							<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2">{{
								$t('preferences.blue')
							}}</label>
							<AppInput type="number" v-model.number="props.preferences.rgb.b" min="0" max="255" />
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider flex items-center gap-3 mb-4"
				>
					<Cpu class="w-6 h-6 text-[var(--color-accent)]" />
					{{ $t('preferences.deviceBehavior') }}
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">{{
							$t('preferences.pollingRate')
						}}</label>
						<BaseSelect v-model="props.preferences.pollingRate">
							<option v-for="rate in pollingRates" :key="rate.value" :value="rate.value">
								{{ rate.label }}
							</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.keyResponse') }} ({{ props.preferences.keyResponse }}ms)</label
						>
						<BaseSelect v-model="props.preferences.keyResponse">
							<option v-for="ms in keyResponses" :key="ms" :value="ms">{{ ms }}ms</option>
						</BaseSelect>
					</div>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.sleepTimer') }} ({{ props.preferences.sleepTime }} min)</label
						>
						<BaseSlider v-model="props.preferences.sleepTime" min="0.5" max="30" step="0.5" />
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>{{ $t('preferences.deepSleepTimer') }} ({{ props.preferences.deepSleepTime }} min)</label
						>
						<BaseSlider v-model="props.preferences.deepSleepTime" min="1" max="60" step="1" />
					</div>
				</div>
			</Card>
		</div>
	</div>
</template>

