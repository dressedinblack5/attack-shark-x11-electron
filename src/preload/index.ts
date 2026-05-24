import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
	connectDevice: (mode: number) => ipcRenderer.invoke('connect-device', mode),
	getBattery: () => ipcRenderer.invoke('get-battery'),
	setDpi: (config: any) => ipcRenderer.invoke('set-dpi', config),
	getDpi: () => ipcRenderer.invoke('get-dpi'),
	getPreferences: () => ipcRenderer.invoke('get-preferences'),
	resetDevice: () => ipcRenderer.invoke('reset-device'),
	setPollingRate: (rate: number) => ipcRenderer.invoke('set-polling-rate', rate),
	setUserPreferences: (prefs: any) => ipcRenderer.invoke('set-user-preferences', prefs),
	setMacro: (config: any) => ipcRenderer.invoke('set-macro', config),
	setCustomMacro: (options: any) => ipcRenderer.invoke('set-custom-macro', options),
	listProfiles: () => ipcRenderer.invoke('list-profiles'),
	saveProfile: (name: string, data: any) => ipcRenderer.invoke('save-profile', name, data),
	loadProfile: (name: string) => ipcRenderer.invoke('load-profile', name),
	deleteProfile: (name: string) => ipcRenderer.invoke('delete-profile', name),
	getSummary: () => ipcRenderer.invoke('get-summary'),
	onBatteryUpdated: (callback: (level: number) => void) =>
		ipcRenderer.on('battery-updated', (_event, value) => callback(value)),
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
	// @ts-expect-error (define in d.ts)
	window.electron = electronAPI;
	// @ts-expect-error (define in d.ts)
	window.api = api;
}
