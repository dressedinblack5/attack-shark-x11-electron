import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
	connectDevice: (mode: number): Promise<{ success: boolean; error?: string }> =>
		ipcRenderer.invoke('connect-device', mode),
	getBattery: (): Promise<number> => ipcRenderer.invoke('get-battery'),
	setDpi: (config: unknown): Promise<number> => ipcRenderer.invoke('set-dpi', config),
	getDpi: (): Promise<Buffer> => ipcRenderer.invoke('get-dpi'),
	getPreferences: (): Promise<Buffer> => ipcRenderer.invoke('get-preferences'),
	resetDevice: (): Promise<{ success: boolean }> => ipcRenderer.invoke('reset-device'),
	setPollingRate: (rate: number): Promise<number> => ipcRenderer.invoke('set-polling-rate', rate),
	setUserPreferences: (prefs: unknown): Promise<number> => ipcRenderer.invoke('set-user-preferences', prefs),
	setMacro: (config: unknown): Promise<number> => ipcRenderer.invoke('set-macro', config),
	setCustomMacro: (options: unknown): Promise<void> => ipcRenderer.invoke('set-custom-macro', options),
	listProfiles: (): Promise<string[]> => ipcRenderer.invoke('list-profiles'),
	saveProfile: (name: string, data: unknown): Promise<void> => ipcRenderer.invoke('save-profile', name, data),
	loadProfile: (name: string): Promise<unknown> => ipcRenderer.invoke('load-profile', name),
	deleteProfile: (name: string): Promise<void> => ipcRenderer.invoke('delete-profile', name),
	getSettings: (): Promise<unknown> => ipcRenderer.invoke('get-settings'),
	saveSettings: (settings: unknown): Promise<void> => ipcRenderer.invoke('save-settings', settings),
	getSummary: (): Promise<unknown> => ipcRenderer.invoke('get-summary'),
	getDeviceInfo: (): Promise<unknown> => ipcRenderer.invoke('get-device-info'),
	onBatteryUpdated: (callback: (level: number) => void): void => {
		ipcRenderer.on('battery-updated', (_event, value) => callback(value));
	},
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	window.electron = electronAPI;
	window.api = api;
}
