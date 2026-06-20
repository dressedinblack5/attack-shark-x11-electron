/// <reference types="vite/client" />

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$t: (key: string, ...args: unknown[]) => string;
	}
}

interface AppSettings {
	lastTab: string;
	connectionMode: 'Adapter' | 'Wired';
	deviceModel: 'X11' | 'X11SE' | 'R1';
	language: string;
	theme: string;
	preferences: {
		lightMode: number;
		ledSpeed: number;
		keyResponse: number;
		pollingRate: number;
		sleepTime: number;
		deepSleepTime: number;
		rgb: { r: number; g: number; b: number };
	};
	dpiConfig: {
		activeStage: 1 | 2 | 3 | 4 | 5 | 6;
		angleSnap: boolean;
		ripplerControl: boolean;
		dpiValues: [number, number, number, number, number, number];
	};
}

declare global {
	interface Window {
		api: {
			detectDevice: () => Promise<{ detected: boolean; mode?: number; model?: string }>;
			connectDevice: (
				params: number | { model: string; mode: number },
			) => Promise<{ success: boolean; error?: string }>;
			getBattery: () => Promise<number>;
			setDpi: (config: unknown) => Promise<number>;
			getDpi: () => Promise<Buffer>;
			resetDevice: () => Promise<{ success: boolean }>;
			setPollingRate: (rate: number) => Promise<number>;
			setUserPreferences: (prefs: unknown) => Promise<number>;
			setMacro: (config: unknown) => Promise<number>;
			setCustomMacro: (options: unknown) => Promise<void>;
			sendCustomMacro: (packets: unknown) => Promise<void>;
			listProfiles: () => Promise<string[]>;
			saveProfile: (name: string, data: unknown) => Promise<void>;
			loadProfile: (name: string) => Promise<unknown>;
			deleteProfile: (name: string) => Promise<void>;
			getSettings: () => Promise<AppSettings | null>;
			saveSettings: (settings: AppSettings) => Promise<void>;
			getSummary: () => Promise<unknown>;
			getDeviceInfo: () => Promise<unknown>;
			getDeviceModel: () => Promise<'X11' | 'X11SE' | 'R1'>;
			getDeviceCapabilities: () => Promise<Record<string, boolean>>;
			onBatteryUpdated: (callback: (level: number) => void) => void;
		};
	}
}

export {};
