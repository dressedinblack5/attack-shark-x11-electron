<script setup lang="ts">
import { ref, watch } from 'vue';

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

let debounceTimer: ReturnType<typeof setTimeout>;

const sendLightingUpdate = async () => {
	if (!props.isConnected) return;

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
	} catch (err) {
		console.error('Live update failed:', err);
	}
};

watch(
	[
		() => props.preferences.lightMode,
		() => props.preferences.rgb.r,
		() => props.preferences.rgb.g,
		() => props.preferences.rgb.b,
		() => props.preferences.ledSpeed,
	],
	() => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(sendLightingUpdate, 300);
	},
);

const pollingRates = [
	{ label: '125Hz (Power Saving)', value: 125 },
	{ label: '250Hz (Office)', value: 250 },
	{ label: '500Hz (Gaming)', value: 500 },
	{ label: '1000Hz (eSports)', value: 1000 },
];

const lightModes = [
	{ label: 'Off', value: 0x00 },
	{ label: 'Static', value: 0x10 },
	{ label: 'Breathing', value: 0x20 },
	{ label: 'Neon', value: 0x30 },
	{ label: 'Color Breathing', value: 0x40 },
	{ label: 'Static DPI', value: 0x50 },
	{ label: 'Breathing DPI', value: 0x60 },
];

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

const applyPreferences = async () => {
	if (!props.isConnected) return;

	isSaving.value = true;
	statusMessage.value = 'Applying settings...';

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

		statusMessage.value = 'Settings applied successfully!';
		setTimeout(() => {
			statusMessage.value = '';
		}, 3000);
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
			<h2 class="text-3xl font-bold">User Preferences</h2>
			<div class="flex gap-2">
				<input
					v-model="newProfileName"
					placeholder="New profile name"
					class="bg-slate-800 border border-slate-700 rounded-lg p-2"
				/>
				<button
					@click="saveNewProfile"
					class="bg-green-600 hover:bg-blue-600 px-4 py-2 rounded-lg font-bold transition-all"
				>
					Save
				</button>
				<button
					@click="applyPreferences"
					:disabled="!isConnected || isSaving"
					class="bg-green-600 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold transition-all shadow-blue-500/20"
				>
					{{ isSaving ? 'Saving...' : 'Apply Settings' }}
				</button>
			</div>
		</div>

		<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] space-y-4">
			<h3 class="text-lg font-semibold text-[var(--text-primary)] opacity-70">Stored Profiles</h3>
			<div class="flex flex-wrap gap-2">
				<div
					v-for="profile in profiles"
					:key="profile"
					class="bg-[var(--border-card)] p-2 rounded-lg flex items-center gap-2 border border-[var(--border-card)]"
				>
					<span>{{ profile }}</span>
					<button @click="applyProfile(profile)" class="text-blue-400 hover:text-blue-300">Apply</button>
					<button @click="deleteProfile(profile)" class="text-red-400 hover:text-red-300">Delete</button>
				</div>
			</div>
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

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] space-y-6">
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider"
				>
					Lighting
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">Effect Mode</label>
						<select
							v-model="props.preferences.lightMode"
							class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 focus:outline-none focus:border-shark-primary"
						>
							<option v-for="mode in lightModes" :key="mode.value" :value="mode.value">
								{{ mode.label }}
							</option>
						</select>
					</div>

					<div>

						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>LED Speed ({{ props.preferences.ledSpeed }})</label
						>
						<input
							type="range"
							v-model.number="props.preferences.ledSpeed"
							min="1"
							max="5"
							step="1"
							class="w-full accent-shark-primary"
						/>

						<div class="flex justify-between text-xs text-[var(--text-primary)] opacity-50 mt-1">
							<span>Slow</span>
							<span>Fast</span>
						</div>
					</div>

					<div class="grid grid-cols-4 gap-2">
						<div class="col-span-1">
							<label class="block text-xs text-[var(--text-primary)] opacity-50 mb-1">Color</label>
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
								class="w-full h-9 bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg cursor-pointer p-0.5"
							/>
						</div>
						<div class="col-span-1">
							<label class="block text-xs text-[var(--text-primary)] opacity-50 mb-1">Red</label>
							<input
								type="number"
								v-model.number="props.preferences.rgb.r"
								min="0"
								max="255"
								class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 text-sm"
							/>
						</div>
						<div class="col-span-1">
							<label class="block text-xs text-[var(--text-primary)] opacity-50 mb-1">Green</label>
							<input
								type="number"
								v-model.number="props.preferences.rgb.g"
								min="0"
								max="255"
								class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 text-sm"
							/>
						</div>
						<div class="col-span-1">
							<label class="block text-xs text-[var(--text-primary)] opacity-50 mb-1">Blue</label>
							<input
								type="number"
								v-model.number="props.preferences.rgb.b"
								min="0"
								max="255"
								class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 text-sm"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] space-y-6">
				<h3
					class="text-lg font-semibold border-b border-[var(--border-card)] pb-2 text-[var(--text-primary)] opacity-70 uppercase tracking-wider"
				>
					Device Behavior
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2">Polling Rate</label>
						<select
							v-model="props.preferences.pollingRate"
							class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 focus:outline-none focus:border-shark-primary"
						>
							<option v-for="rate in pollingRates" :key="rate.value" :value="rate.value">
								{{ rate.label }}
							</option>
						</select>
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>Key Response ({{ props.preferences.keyResponse }}ms)</label
						>
						<select
							v-model="props.preferences.keyResponse"
							class="w-full bg-[var(--border-card)] border border-[var(--border-card)] rounded-lg p-2 focus:outline-none focus:border-shark-primary"
						>
							<option v-for="ms in keyResponses" :key="ms" :value="ms">{{ ms }}ms</option>
						</select>
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>Sleep Timer ({{ props.preferences.sleepTime }} min)</label
						>
						<input
							type="range"
							v-model.number="props.preferences.sleepTime"
							min="0.5"
							max="30"
							step="0.5"
							class="w-full accent-shark-primary"
						/>
					</div>

					<div>
						<label class="block text-sm text-[var(--text-primary)] opacity-70 mb-2"
							>Deep Sleep Timer ({{ props.preferences.deepSleepTime }} min)</label
						>
						<input
							type="range"
							v-model.number="props.preferences.deepSleepTime"
							min="1"
							max="60"
							step="1"
							class="w-full accent-shark-primary"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
