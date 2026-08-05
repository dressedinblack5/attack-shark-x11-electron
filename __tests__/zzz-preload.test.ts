import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const PRELOAD_PATH = join(import.meta.dirname, '../src/preload/index.ts');

function getSource(): string {
	return readFileSync(PRELOAD_PATH, 'utf-8');
}

describe('preload', () => {
	describe('source code structure', () => {
		it('should export api object', () => {
			expect(getSource()).toContain('export const api = {');
		});

		it('should define all expected API methods', () => {
			const source = getSource();
			const expectedMethods = [
				'detectDevice',
				'connectDevice',
				'getBattery',
				'setDpi',
				'getDpi',
				'resetDevice',
				'setPollingRate',
				'setUserPreferences',
				'setMacro',
				'setCustomMacro',
				'sendCustomMacro',
				'listProfiles',
				'saveProfile',
				'loadProfile',
				'deleteProfile',
				'getSettings',
				'saveSettings',
				'getSummary',
				'getDeviceInfo',
				'getDeviceModel',
				'getDeviceCapabilities',
				'onBatteryUpdated',
			];

			for (const method of expectedMethods) {
				expect(source).toContain(`${method}:`);
			}
		});

		it('should use ipcRenderer.invoke for all methods except onBatteryUpdated', () => {
			const source = getSource();
			const methodLines = source.split('\n').filter((line) => line.includes('ipcRenderer.invoke'));
			expect(methodLines.length).toBeGreaterThanOrEqual(21);
		});

		it('should expose api via contextBridge', () => {
			expect(getSource()).toContain("contextBridge.exposeInMainWorld('api', api)");
		});

		it('should handle non-context-isolated fallback', () => {
			expect(getSource()).toContain('window.api = api');
		});

		it('should have onBatteryUpdated with cleanup function', () => {
			const source = getSource();
			expect(source).toContain('onBatteryUpdated:');
			expect(source).toContain('ipcRenderer.on');
			expect(source).toContain('ipcRenderer.removeListener');
			expect(source).toContain('return () =>');
		});
	});

	describe('imports', () => {
		it('should import contextBridge and ipcRenderer from electron', () => {
			expect(getSource()).toContain("import { contextBridge, ipcRenderer } from 'electron'");
		});

		it('should import AppSettings type from settingsManager', () => {
			expect(getSource()).toContain("import type { AppSettings } from '../main/storage/settingsManager.js'");
		});
	});
});
