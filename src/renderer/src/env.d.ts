/// <reference types="vite/client" />

interface Window {
	api: {
		connectDevice: (mode: number) => Promise<{ success: boolean; error?: string }>;
		getBattery: () => Promise<number>;
		setDpi: (config: any) => Promise<number>;
		getDpi: () => Promise<Buffer>;
		getPreferences: () => Promise<Buffer>;
		resetDevice: () => Promise<{ success: boolean }>;
		setPollingRate: (rate: number) => Promise<number>;
		setUserPreferences: (prefs: any) => Promise<number>;
		setMacro: (config: any) => Promise<number>;
		setCustomMacro: (options: any) => Promise<void>;
		onBatteryUpdated: (callback: (level: number) => void) => void;
	};
}
