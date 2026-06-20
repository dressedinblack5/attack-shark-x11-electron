<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, toRaw, shallowRef } from 'vue';
import { Settings, Zap, Info, ShieldAlert, Keyboard, MousePointer2, Menu, LayoutDashboard } from 'lucide-vue-next';

import UserPreferences from './components/UserPreferences.vue';
import DpiSettings from './components/DpiSettings.vue';
import MacroSettings from './components/MacroSettings.vue';
import DeviceInfo from './components/DeviceInfo.vue';
import LanguageSelector from './components/LanguageSelector.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import BatteryIndicator from './components/widgets/BatteryIndicator.vue';
import ToastStack from './components/widgets/ToastStack.vue';
import StatusMessage from './components/StatusMessage.vue';
import BaseButton from './components/BaseButton.vue';
import { useToast } from './composables/useToast';
import { useI18n } from 'vue-i18n';
import packageInfo from '../../../package.json';

const version = packageInfo.version;
const isConnected = ref(false);
const connectionMode = ref<'Adapter' | 'Wired' | null>(null);
const deviceModel = ref<'X11' | 'X11SE' | 'R1'>('X11');
const capabilities = ref<Record<string, boolean>>({});
const batteryLevel = ref(-1);
const sidebarCollapsed = ref(false);
const { toasts, removeToast } = useToast();
const { t } = useI18n();
const preferences = ref({
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
const LIGHT_MODE_I18N: Record<number, string> = {
	0x00: 'preferences.lightModes.off',
	0x10: 'preferences.lightModes.static',
	0x20: 'preferences.lightModes.breathing',
	0x30: 'preferences.lightModes.neon',
	0x40: 'preferences.lightModes.colorBreathing',
	0x50: 'preferences.lightModes.staticDpi',
	0x60: 'preferences.lightModes.breathingDpi',
};
const ledModeName = computed(() => {
	const key = LIGHT_MODE_I18N[preferences.value.lightMode];
	return key ? t(key) : t('preferences.lightModes.off');
});
const profiles = ref<string[]>([]);
const connectionError = ref('');
const activeTab = ref('preferences');
const lastMode = ref(0xfa60);

const isPermissionError = computed(() => {
	const msg = connectionError.value.toLowerCase();
	return msg.includes('permission') || msg.includes('eacces') || msg.includes('access');
});

const updateProfiles = async () => {
	profiles.value = await window.api.listProfiles();
};

const connect = async (mode: number) => {
	lastMode.value = mode;
	connectionError.value = '';
	try {
		if (!window.api) throw new Error('IPC API not found.');
		// Auto-detect model: wireless PID is shared, so we don't know model yet
		const result = await window.api.connectDevice({ model: 'X11', mode });
		if (result.success) {
			await finalizeConnection(mode);
		} else {
			connectionError.value = result.error || 'Unknown error';
		}
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('IPC Error:', error);
		connectionError.value = `Connection Error: ${error.message}`;
	}
};

const connectWired = async () => {
	lastMode.value = 0xfa55; // Try X11 wired first
	connectionError.value = '';
	try {
		if (!window.api) throw new Error('IPC API not found.');
		// Try X11 wired first
		let result = await window.api.connectDevice({ model: 'X11', mode: 0xfa55 });
		if (!result.success) {
			// Try R1 wired
			result = await window.api.connectDevice({ model: 'R1', mode: 0xfa61 });
			if (result.success) {
				await finalizeConnection(0xfa61);
				return;
			}
		} else {
			await finalizeConnection(0xfa55);
			return;
		}
		connectionError.value = result.error || 'Unknown error';
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('IPC Error:', error);
		connectionError.value = `Connection Error: ${error.message}`;
	}
};

const finalizeConnection = async (mode: number) => {
	isConnected.value = true;
	connectionMode.value = mode === 0xfa55 || mode === 0xfa61 ? 'Wired' : 'Adapter';
	const caps = await window.api.getDeviceCapabilities();
	capabilities.value = caps;
	const model = await window.api.getDeviceModel();
	deviceModel.value = model as 'X11' | 'X11SE' | 'R1';
	await updateBattery();
	await fetchSummary();
	await updateProfiles();
};

const retryConnection = async () => {
	if (lastMode.value === 0xfa60) {
		await connect(0xfa60);
	} else {
		await connectWired();
	}
};

const fetchSummary = async () => {
	try {
		const summary = await window.api.getSummary();
		deviceSummary.value = summary;
	} catch (err) {
		console.error('Failed to fetch summary:', err);
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

onMounted(async () => {
	try {
		window.api.onBatteryUpdated((level: number) => {
			batteryLevel.value = level;
		});

		const settings = await window.api.getSettings();
		if (settings) {
			if (settings.lastTab) activeTab.value = settings.lastTab;
			if (settings.connectionMode) connectionMode.value = settings.connectionMode;
			if (settings.deviceModel) deviceModel.value = settings.deviceModel;
			if (settings.theme) {
				localStorage.setItem('theme', settings.theme);
				document.documentElement.className = settings.theme === 'dark' ? '' : settings.theme;
			}
			if (settings.preferences) {
				Object.assign(preferences.value, settings.preferences);
			}
		}
	} catch (err) {
		console.warn('App initialization skipped (API not available):', err);
	}

	// Auto-detect connected device on startup
	try {
		const detection = await window.api.detectDevice();
		if (detection.detected && detection.mode != null && detection.model) {
			const result = await window.api.connectDevice({ model: detection.model, mode: detection.mode });
			if (result.success) {
				await finalizeConnection(detection.mode);
			}
		}
	} catch {
		// silently fail — manual connect is available
	}
});

// Cache the last-saved settings so we never need to re-read from disk to merge
let cachedSettings: AppSettings | null = null;

// Snapshot preferences for watcher comparison (avoids reactive proxy identity churn)
const preferencesSnapshot = shallowRef(JSON.parse(JSON.stringify(toRaw(preferences.value))));
watch(
	preferences,
	(val) => {
		preferencesSnapshot.value = JSON.parse(JSON.stringify(toRaw(val)));
	},
	{ deep: true },
);

watch(
	() => [activeTab.value, preferencesSnapshot.value, connectionMode.value, deviceModel.value],
	async () => {
		if (!cachedSettings) {
			cachedSettings = await window.api.getSettings();
		}
		await window.api.saveSettings({
			...cachedSettings,
			lastTab: activeTab.value,
			connectionMode: connectionMode.value ?? 'Adapter',
			deviceModel: deviceModel.value,
			theme: localStorage.getItem('theme') || 'dark',
			preferences: preferencesSnapshot.value,
		});
		cachedSettings = null; // force re-read next time in case another component wrote
	},
);
</script>

<template>
	<div class="flex h-full">
		<!-- Sidebar -->
		<div
			id="sidebar"
			:class="[
				'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col transition-all duration-300',
				sidebarCollapsed ? 'w-16' : 'w-64',
			]"
		>
			<div class="p-6 flex items-center justify-between" :class="sidebarCollapsed ? 'flex-col gap-4' : ''">
				<template v-if="!sidebarCollapsed">
					<h1 class="text-xl font-bold flex items-center gap-2 text-shark-primary whitespace-nowrap">
						{{ $t('sidebar.deviceName') }}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							class="w-6 h-6"
							fill="currentColor"
							stroke="none"
						>
							<path d="M3 12 6 8 9 7 10 2 12 8 17 9 22 6 19 11 22 16 16 16 12 17 8 16 5 15 4 13Z" />
							<circle cx="6" cy="10" r=".6" />
						</svg>
					</h1>
				</template>
				<template v-else>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						class="w-6 h-6 text-shark-primary flex-shrink-0"
						fill="currentColor"
						stroke="none"
					>
						<path d="M3 12 6 8 9 7 10 2 12 8 17 9 22 6 19 11 22 16 16 16 12 17 8 16 5 15 4 13Z" />
						<circle cx="6" cy="10" r=".6" />
					</svg>
				</template>
				<button
					@click="sidebarCollapsed = !sidebarCollapsed"
					class="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] transition-colors flex-shrink-0"
					:title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
				>
					<Menu class="w-4 h-4" />
				</button>
			</div>

			<nav class="flex-1 px-4 space-y-2" :class="sidebarCollapsed ? 'flex flex-col items-center' : ''">
				<button
					@click="activeTab = 'overview'"
					:class="[
						'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						sidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
						activeTab === 'overview'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]',
					]"
					:title="sidebarCollapsed ? 'Overview' : ''"
				>
					<LayoutDashboard class="w-5 h-5 flex-shrink-0" />
					<span v-if="!sidebarCollapsed">Overview</span>
				</button>
				<button
					@click="activeTab = 'preferences'"
					:class="[
						'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						sidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
						activeTab === 'preferences'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]',
					]"
					:title="sidebarCollapsed ? $t('sidebar.preferences') : ''"
				>
					<Settings class="w-5 h-5 flex-shrink-0" />
					<span v-if="!sidebarCollapsed">{{ $t('sidebar.preferences') }}</span>
				</button>
				<button
					@click="activeTab = 'dpi'"
					:class="[
						'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						sidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
						activeTab === 'dpi'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]',
					]"
					:title="sidebarCollapsed ? $t('sidebar.dpi') : ''"
				>
					<Zap class="w-5 h-5 flex-shrink-0" />
					<span v-if="!sidebarCollapsed">{{ $t('sidebar.dpi') }}</span>
				</button>
				<button
					v-if="capabilities.macros !== false"
					@click="activeTab = 'macros'"
					:class="[
						'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						sidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
						activeTab === 'macros'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]',
					]"
					:title="sidebarCollapsed ? $t('sidebar.macros') : ''"
				>
					<Keyboard class="w-5 h-5 flex-shrink-0" />
					<span v-if="!sidebarCollapsed">{{ $t('sidebar.macros') }}</span>
				</button>
				<button
					@click="activeTab = 'device-info'"
					:class="[
						'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
						sidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
						activeTab === 'device-info'
							? 'bg-shark-primary/20 text-shark-primary'
							: 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]',
					]"
					:title="sidebarCollapsed ? $t('sidebar.deviceInfo') : ''"
				>
					<ShieldAlert class="w-5 h-5 flex-shrink-0" />
					<span v-if="!sidebarCollapsed">{{ $t('sidebar.deviceInfo') }}</span>
				</button>
			</nav>

			<div
				v-if="!sidebarCollapsed"
				class="p-4 bg-[var(--sidebar-footer-bg)] border-t border-[var(--sidebar-footer-border)] space-y-2"
			>
				<div class="flex items-center justify-between">
					<LanguageSelector />
					<ThemeToggle />
				</div>
				<div v-if="isConnected">
					<BatteryIndicator :level="batteryLevel" :connected="isConnected" />
				</div>
				<div v-else class="text-xs text-[var(--sidebar-text-muted)] italic">
					{{ $t('connection.disconnected') }}
				</div>
				<div class="text-[10px] text-[var(--sidebar-text-dim)] mt-2">v{{ version }}</div>
			</div>
		</div>

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto p-8 bg-[var(--bg-primary)]">
			<div
				v-if="!isConnected"
				class="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4"
			>
				<!-- Device icon with subtle glow ring -->
				<div
					class="w-24 h-24 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-6 ring-4 ring-shark-primary/10"
				>
					<MousePointer2 class="w-12 h-12 text-[var(--text-muted)]" />
				</div>

				<h2 class="text-2xl font-bold mb-2 text-[var(--text-primary)]">
					{{ $t('connection.title') }}
				</h2>
				<p class="text-[var(--text-secondary)] mb-8 max-w-sm">
					{{ $t('connection.description') }}
				</p>

				<!-- Single connection mode selector (model auto-detected after connect) -->
				<div class="grid grid-cols-2 gap-4 w-full max-w-sm">
					<button
						@click="connect(0xfa60)"
						class="bg-[var(--connection-card-bg)] hover:bg-[var(--connection-card-hover)] p-5 rounded-xl border border-[var(--connection-card-border)] transition-all group flex flex-col items-center"
						aria-label="Connect via 2.4GHz wireless adapter"
					>
						<Zap
							class="w-8 h-8 mb-3 text-[var(--connection-card-text)] group-hover:text-shark-primary transition-colors"
						/>
						<span class="block font-semibold text-[var(--text-primary)]">{{
							$t('connection.adapter')
						}}</span>
						<span class="block text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{{
							$t('connection.adapterDesc')
						}}</span>
					</button>
					<button
						@click="connectWired"
						class="bg-[var(--connection-card-bg)] hover:bg-[var(--connection-card-hover)] p-5 rounded-xl border border-[var(--connection-card-border)] transition-all group flex flex-col items-center"
						aria-label="Connect via USB cable"
					>
						<ShieldAlert
							class="w-8 h-8 mb-3 text-[var(--connection-card-text)] group-hover:text-shark-primary transition-colors"
						/>
						<span class="block font-semibold text-[var(--text-primary)]">{{ $t('connection.wired') }}</span>
						<span class="block text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{{
							$t('connection.wiredDesc')
						}}</span>
					</button>
				</div>

				<!-- Error state with StatusMessage component and retry -->
				<div v-if="connectionError" class="mt-6 w-full max-w-sm space-y-3">
					<StatusMessage :message="connectionError" type="error" />
					<div
						v-if="isPermissionError"
						class="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] p-3 rounded-lg"
					>
						{{ $t('connection.udevTip') }}
					</div>
					<BaseButton
						@click="retryConnection"
						variant="green"
						class="w-full"
						:aria-label="
							'Retry connection in ' + (connectionMode === 'Wired' ? 'wired' : 'wireless') + ' mode'
						"
					>
						{{ $t('connection.retry') }}
					</BaseButton>
				</div>

				<!-- Force refresh link -->
				<button
					@click="window.location.reload()"
					class="mt-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
					aria-label="Force refresh the application"
				>
					<Info class="w-3 h-3" /> {{ $t('connection.forceRefresh') }}
				</button>
			</div>

			<Transition v-else name="fade-slide" mode="out-in">
				<div :key="activeTab">
					<!-- Overview / Dashboard -->
					<div v-if="activeTab === 'overview'" class="space-y-6">
						<h2 class="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
							<LayoutDashboard class="w-8 h-8 text-shark-primary" />
							{{ $t('overview.title') }}
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div
								class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-md transition-all duration-300 hover:shadow-xl"
							>
								<h3 class="text-sm text-[var(--text-secondary)] mb-1">{{ $t('overview.battery') }}</h3>
								<p class="text-2xl font-bold text-[var(--text-primary)]">
									{{ batteryLevel >= 0 ? `${batteryLevel}%` : $t('overview.batteryUnknown') }}
								</p>
							</div>
							<div
								class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-md transition-all duration-300 hover:shadow-xl"
							>
								<h3 class="text-sm text-[var(--text-secondary)] mb-1">
									{{ $t('overview.connection') }}
								</h3>
								<p class="text-2xl font-bold text-[var(--text-primary)]">
									{{
										connectionMode === 'Wired'
											? $t('connection.wiredDisplay')
											: $t('overview.wireless')
									}}
								</p>
							</div>
							<div
								class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-md transition-all duration-300 hover:shadow-xl"
							>
								<h3 class="text-sm text-[var(--text-secondary)] mb-1">{{ $t('overview.ledMode') }}</h3>
								<p class="text-2xl font-bold text-[var(--text-primary)]">
									{{ ledModeName }}
								</p>
							</div>
							<div
								class="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-md transition-all duration-300 hover:shadow-xl"
							>
								<h3 class="text-sm text-[var(--text-secondary)] mb-1">{{ $t('overview.device') }}</h3>
								<p class="text-2xl font-bold text-[var(--text-primary)]">
									Attack Shark {{ deviceModel }}
								</p>
							</div>
						</div>
					</div>

					<!-- Preferences Content -->
					<div v-if="activeTab === 'preferences'">
						<UserPreferences
							v-model="preferences"
							:isConnected="isConnected"
							:deviceModel="deviceModel"
							:connectionMode="connectionMode"
							@reset-complete="isConnected = false"
						/>
					</div>

					<!-- DPI Content -->
					<div v-if="activeTab === 'dpi'">
						<DpiSettings :isConnected="isConnected" :deviceModel="deviceModel" />
					</div>

					<!-- Macros Content -->
					<div v-if="activeTab === 'macros'">
						<MacroSettings :isConnected="isConnected" />
					</div>

					<!-- Device Info Content -->
					<div v-if="activeTab === 'device-info'">
						<DeviceInfo :isConnected="isConnected" />
					</div>
				</div>
			</Transition>

			<ToastStack :toasts="toasts" @remove="removeToast" />
		</main>
	</div>
</template>
