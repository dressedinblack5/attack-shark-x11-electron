<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { MousePointer2, Settings, Zap, Info, ShieldAlert, Keyboard } from 'lucide-vue-next';
import UserPreferences from './components/UserPreferences.vue';
import DpiSettings from './components/DpiSettings.vue';
import MacroSettings from './components/MacroSettings.vue';
import packageInfo from '../../../package.json';

const version = packageInfo.version;
const isConnected = ref(false);
const batteryLevel = ref(-1);
const preferences = reactive({
	lightMode: 0x20, // Breathing
	ledSpeed: 2,
	keyResponse: 4,
	pollingRate: 1000,
	sleepTime: 2,
	deepSleepTime: 10,
	rgb: { r: 255, g: 0, b: 255 },
});
const deviceSummary = ref<{
	ledSpeed: number;
	lightMode: number;
	keyResponse: number;
	rgb: { r: number; g: number; b: number };
} | null>(null);
const profiles = ref<string[]>([]);
const connectionError = ref('');
const activeTab = ref('preferences');

const updateProfiles = async () => {
	profiles.value = await window.api.listProfiles();
};

const connect = async (mode: number) => {
	console.log(`Connecting to mode 0x${mode.toString(16)}...`);
	connectionError.value = '';
	try {
		if (!window.api) throw new Error('IPC API not found.');
		const result = await window.api.connectDevice(mode);
		if (result.success) {
			isConnected.value = true;
			// Refresh battery explicitly after successful connection
			await updateBattery();
			await fetchSummary();
			await updateProfiles();
		} else {
			connectionError.value = result.error || 'Unknown error';
		}
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('IPC Error:', error);
		connectionError.value = `Connection Error: ${error.message}`;
	}
};

const fetchSummary = async () => {
	try {
		deviceSummary.value = await window.api.getSummary();
	} catch (err) {
		console.error('Failed to fetch summary:', err);
	}
};

const reset = async () => {
	if (!confirm('Are you sure you want to reset to factory defaults? This cannot be undone.')) return;
	try {
		await window.api.resetDevice();
		alert('Reset successful! Please reconnect the device.');
		isConnected.value = false;
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		alert(`Reset failed: ${error.message}`);
	}
};

const updateBattery = async () => {
	try {
		const level = await window.api.getBattery();
		batteryLevel.value = level;
	} catch (err) {
		console.warn('Battery update timed out or failed:', err);
		batteryLevel.value = -1;
	}
};

onMounted(() => {
	window.api.onBatteryUpdated((level: number) => {
		console.log('Received battery update:', level);
		batteryLevel.value = level;
	});
});
</script>

<template>
	<div class="flex h-full">
		<!-- Sidebar -->
		<div class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
			<div class="p-6">
				<h1 class="text-xl font-bold flex items-center gap-2 text-shark-primary">
					<MousePointer2 class="w-6 h-6" />
					Attack Shark X11
				</h1>
			</div>

			<nav class="flex-1 px-4 space-y-2">
				<button
					@click="activeTab = 'preferences'"
					:class="[
						'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						activeTab === 'preferences'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-slate-800 text-slate-400',
					]"
				>
					<Settings class="w-5 h-5" /> Preferences
				</button>
				<button
					@click="activeTab = 'dpi'"
					:class="[
						'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						activeTab === 'dpi'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-slate-800 text-slate-400',
					]"
				>
					<Zap class="w-5 h-5" /> DPI Config
				</button>
				<button
					@click="activeTab = 'macros'"
					:class="[
						'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						activeTab === 'macros'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-slate-800 text-slate-400',
					]"
				>
					<Keyboard class="w-5 h-5" /> Macros
				</button>
				<button
					@click="activeTab = 'about'"
					:class="[
						'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						activeTab === 'about'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-slate-800 text-slate-400',
					]"
				>
					<Info class="w-5 h-5" /> About
				</button>
			</nav>

			<div class="p-4 bg-slate-950 border-t border-slate-800">
				<div v-if="isConnected" class="flex items-center gap-3 text-sm">
					<div class="relative w-8 h-4 border border-slate-600 rounded-sm p-0.5">
						<div
							class="h-full rounded-xs"
							:class="batteryLevel <= 20 ? 'bg-red-500' : 'bg-green-700'"
							:style="{ width: `${batteryLevel > 0 ? batteryLevel : 0}%` }"
						></div>
						<div class="absolute -right-1 top-1 w-1 h-2 bg-slate-600 rounded-r-sm"></div>
					</div>
					<span class="text-slate-300 font-medium">{{
						batteryLevel >= 0 ? `${batteryLevel}%` : 'Wired'
					}}</span>
				</div>
				<div v-else class="text-xs text-slate-500 italic">Device Disconnected</div>
				<div class="text-[10px] text-slate-600 mt-2">v{{ version }}</div>
			</div>
		</div>

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto p-8 bg-shark-dark">
			<div
				v-if="!isConnected"
				class="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
			>
				<div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
					<MousePointer2 class="w-10 h-10 text-slate-600" />
				</div>
				<h2 class="text-2xl font-bold mb-2">Connect your X11</h2>
				<p class="text-slate-400 mb-8">Please select the connection mode to start configuring your device.</p>

				<div class="grid grid-cols-2 gap-4 w-full">
					<button
						@click="connect(0xfa60)"
						class="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all group"
					>
						<Zap class="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-shark-primary" />
						<span class="block font-semibold">2.4G Adapter</span>
					</button>
					<button
						@click="connect(0xfa55)"
						class="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all group"
					>
						<ShieldAlert class="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-shark-primary" />
						<span class="block font-semibold">Wired Mode</span>
					</button>
				</div>

				<button
					@click="window.location.reload()"
					class="mt-8 text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors"
				>
					<Info class="w-3 h-3" /> Force App Refresh
				</button>

				<div
					v-if="connectionError"
					class="mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg"
				>
					{{ connectionError }}
					<p class="text-[10px] mt-2 opacity-50">Tip: If device is busy, try unplugging and replugging it.</p>
				</div>
			</div>

			<div v-else>
				<!-- Preferences Content -->
				<div v-if="activeTab === 'preferences'">
					<UserPreferences :preferences="preferences" :isConnected="isConnected" />
				</div>

				<!-- DPI Content -->
				<div v-if="activeTab === 'dpi'">
					<DpiSettings :isConnected="isConnected" />
				</div>

				<!-- Macros Content -->
				<div v-if="activeTab === 'macros'">
					<MacroSettings :isConnected="isConnected" />
				</div>

				<!-- About Content -->
				<div v-if="activeTab === 'about'">
					<h2 class="text-3xl font-bold mb-8">About Attack Shark Driver</h2>
					<div class="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
						<p class="text-slate-300">
							A community-driven, open-source driver for the Attack Shark X11 gaming mouse.
						</p>

						<div class="pt-6 border-t border-slate-800">
							<h4 class="font-bold text-red-400 mb-2">Emergency Reset</h4>
							<p class="text-sm text-slate-500 mb-4">
								Restore factory settings if the device becomes unresponsive.
							</p>
							<button
								@click="reset"
								class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-2 rounded-lg font-bold transition-all"
							>
								Factory Reset Device
							</button>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>
