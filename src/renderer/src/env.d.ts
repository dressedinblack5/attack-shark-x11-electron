/// <reference types="vite/client" />
import 'vue-router';

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$t: (key: string, ...args: unknown[]) => string;
	}
}

declare global {
	interface Window {
		electron: unknown;
		api: {
			connectDevice: (mode: number) => Promise<{ success: boolean; error?: string }>;
			getBattery: () => Promise<number>;
			setDpi: (config: unknown) => Promise<number>;
			getDpi: () => Promise<Buffer>;
			getPreferences: () => Promise<Buffer>;
			resetDevice: () => Promise<{ success: boolean }>;
			setPollingRate: (rate: number) => Promise<number>;
			setUserPreferences: (prefs: unknown) => Promise<number>;
			setMacro: (config: unknown) => Promise<number>;
			setCustomMacro: (options: unknown) => Promise<void>;
			listProfiles: () => Promise<string[]>;
			saveProfile: (name: string, data: unknown) => Promise<void>;
			loadProfile: (name: string) => Promise<unknown>;
			deleteProfile: (name: string) => Promise<void>;
			getSettings: () => Promise<unknown>;
			saveSettings: (settings: unknown) => Promise<void>;
			getSummary: () => Promise<unknown>;
			getDeviceInfo: () => Promise<unknown>;
			onBatteryUpdated: (callback: (level: number) => void) => void;
		};
	}
}

export {};
