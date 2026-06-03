import type { StageIndex } from '../driver/protocols/DpiBuilder.js';
import fs from 'fs/promises';
import path from 'path';
import { getUserDataPath } from '../utils/platformUtils';

const getSettingsPath = (): string => path.join(getUserDataPath(), 'settings.json');

export interface AppSettings {
	lastTab: string;
	connectionMode: 'Adapter' | 'Wired' | 'Bluetooth';
	language: string;
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
		activeStage: StageIndex;
		angleSnap: boolean;
		ripplerControl: boolean;
		dpiValues: [number, number, number, number, number, number];
	};
}

const DEFAULT_SETTINGS: AppSettings = {
	lastTab: 'preferences',
	connectionMode: 'Adapter',
	language: 'en',
	preferences: {
		lightMode: 0x20, // Breathing
		ledSpeed: 2,
		keyResponse: 4,
		pollingRate: 1000,
		sleepTime: 2,
		deepSleepTime: 10,
		rgb: { r: 255, g: 0, b: 255 },
	},
	dpiConfig: {
		activeStage: 2,
		angleSnap: false,
		ripplerControl: true,
		dpiValues: [800, 1600, 2400, 3200, 5000, 22000],
	},
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
