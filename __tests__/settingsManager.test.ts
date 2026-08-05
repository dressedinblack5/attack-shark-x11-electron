import { describe, expect, it, vi, beforeEach } from 'bun:test';

const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();

vi.mock('electron', () => ({
	app: {
		getPath: vi.fn(() => '/tmp/test-user-data'),
	},
}));

vi.mock('fs/promises', () => ({
	default: {
		readFile: mockReadFile,
		writeFile: mockWriteFile,
	},
	readFile: mockReadFile,
	writeFile: mockWriteFile,
}));

const { getSettings, saveSettings } = await import('../src/main/storage/settingsManager.js');
const SETTINGS_PATH = '/tmp/test-user-data/settings.json';

const DEFAULT_SETTINGS = {
	lastTab: 'preferences',
	connectionMode: 'Adapter',
	deviceModel: 'X11',
	language: 'en',
	theme: 'dark',
	preferences: {
		lightMode: 0x20,
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

describe('settingsManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getSettings', () => {
		it('should return defaults when file does not exist', async () => {
			mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
			const settings = await getSettings();
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});

		it('should return defaults when JSON is corrupted', async () => {
			mockReadFile.mockResolvedValue('not valid json {{{');
			const settings = await getSettings();
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});

		it('should merge saved settings over defaults', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					lastTab: 'dpi',
					theme: 'light',
					preferences: {
						pollingRate: 500,
					},
				}),
			);
			const settings = await getSettings();
			expect(settings.lastTab).toBe('dpi');
			expect(settings.theme).toBe('light');
			expect(settings.preferences.pollingRate).toBe(500);
			expect(settings.preferences.lightMode).toBe(DEFAULT_SETTINGS.preferences.lightMode);
			expect(settings.preferences.ledSpeed).toBe(DEFAULT_SETTINGS.preferences.ledSpeed);
		});

		it('should coerce numeric preferences to numbers', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					preferences: {
						lightMode: '32',
						ledSpeed: '3',
						keyResponse: '8',
						pollingRate: '1000',
						sleepTime: '1.5',
						deepSleepTime: '15',
						rgb: { r: '100', g: '200', b: '50' },
					},
				}),
			);
			const settings = await getSettings();
			expect(settings.preferences.lightMode).toBe(0x20);
			expect(settings.preferences.ledSpeed).toBe(3);
			expect(settings.preferences.keyResponse).toBe(8);
			expect(settings.preferences.pollingRate).toBe(1000);
			expect(settings.preferences.sleepTime).toBe(1.5);
			expect(settings.preferences.deepSleepTime).toBe(15);
			expect(settings.preferences.rgb).toEqual({ r: 100, g: 200, b: 50 });
		});

		it('should fall back to defaults for invalid numeric preferences', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					preferences: {
						lightMode: 'not-a-number',
						ledSpeed: -1,
						keyResponse: null,
						pollingRate: 'invalid',
						sleepTime: 'invalid',
						deepSleepTime: undefined,
						rgb: { r: null, g: 'oops', b: 123 },
					},
				}),
			);
			const settings = await getSettings();
			expect(settings.preferences.ledSpeed).toBe(-1);
			expect(settings.preferences.keyResponse).toBe(0);
			expect(settings.preferences.lightMode).toBe(DEFAULT_SETTINGS.preferences.lightMode);
			expect(settings.preferences.pollingRate).toBe(DEFAULT_SETTINGS.preferences.pollingRate);
			expect(settings.preferences.sleepTime).toBe(DEFAULT_SETTINGS.preferences.sleepTime);
			expect(settings.preferences.deepSleepTime).toBe(DEFAULT_SETTINGS.preferences.deepSleepTime);
			expect(settings.preferences.rgb).toEqual({
				r: 0,
				g: DEFAULT_SETTINGS.preferences.rgb.g,
				b: 123,
			});
		});

		it('should fix deviceModel: R1 stays R1, everything else becomes X11', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify({ deviceModel: 'R1' }));
			let settings = await getSettings();
			expect(settings.deviceModel).toBe('R1');

			mockReadFile.mockResolvedValue(JSON.stringify({ deviceModel: 'X11SE' }));
			settings = await getSettings();
			expect(settings.deviceModel).toBe('X11');

			mockReadFile.mockResolvedValue(JSON.stringify({ deviceModel: 'unknown' }));
			settings = await getSettings();
			expect(settings.deviceModel).toBe('X11');
		});

		it('should use saved dpiValues as-is (no padding to 6)', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					dpiConfig: {
						dpiValues: [100, 200, 300],
					},
				}),
			);
			const settings = await getSettings();
			expect(settings.dpiConfig.dpiValues).toHaveLength(3);
			expect(settings.dpiConfig.dpiValues).toEqual([100, 200, 300]);
		});

		it('should coerce dpiConfig numeric values only (no boolean coercion)', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify({
					dpiConfig: {
						activeStage: '3',
						angleSnap: 'true',
						ripplerControl: 'false',
						dpiValues: ['800', 'invalid', 3200, 4000, 5000, '22000'],
					},
				}),
			);
			const settings = await getSettings();
			expect(settings.dpiConfig.activeStage).toBe(3);
			expect(settings.dpiConfig.angleSnap).toBe('true');
			expect(settings.dpiConfig.ripplerControl).toBe('false');
			expect(settings.dpiConfig.dpiValues[0]).toBe(800);
			expect(settings.dpiConfig.dpiValues[1]).toBe(800);
			expect(settings.dpiConfig.dpiValues[2]).toBe(3200);
			expect(settings.dpiConfig.dpiValues[5]).toBe(22000);
		});

		it('should coerce activeStage to number (no range validation)', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify({ dpiConfig: { activeStage: 99 } }));
			const settings = await getSettings();
			expect(settings.dpiConfig.activeStage).toBe(99);

			mockReadFile.mockResolvedValue(JSON.stringify({ dpiConfig: { activeStage: 'oops' } }));
			const settings2 = await getSettings();
			expect(settings2.dpiConfig.activeStage).toBe(DEFAULT_SETTINGS.dpiConfig.activeStage);
		});
	});

	describe('saveSettings', () => {
		it('should write settings to file with pretty JSON', async () => {
			await saveSettings(DEFAULT_SETTINGS);
			expect(mockWriteFile).toHaveBeenCalledWith(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
		});

		it('should write partial settings', async () => {
			const partial = { lastTab: 'macros', theme: 'cappuccino' };
			await saveSettings(partial);
			expect(mockWriteFile).toHaveBeenCalledWith(SETTINGS_PATH, JSON.stringify(partial, null, 2));
		});
	});
});
