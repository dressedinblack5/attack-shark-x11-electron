import fs from 'fs/promises';
import path from 'path';
import { getUserDataPath } from '../utils/platformUtils';

const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');

export interface AppSettings {
	lastTab: string;
	connectionMode: 'Adapter' | 'Wired' | 'Bluetooth';
	language: string;
}

const DEFAULT_SETTINGS: AppSettings = {
	lastTab: 'dashboard',
	connectionMode: 'Adapter',
	language: 'en',
};

export async function getSettings(): Promise<AppSettings> {
	try {
		const data = await fs.readFile(getSettingsPath(), 'utf-8');
		return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export async function saveSettings(settings: AppSettings): Promise<void> {
	await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2));
}
