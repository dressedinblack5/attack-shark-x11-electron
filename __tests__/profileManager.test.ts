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

const { saveProfile, loadProfile, deleteProfile, listProfiles } = await import('../src/main/storage/profileManager.js');
const STORAGE_PATH = '/tmp/test-user-data/profiles.json';

describe('profileManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('listProfiles', () => {
		it('should return empty list when file does not exist', async () => {
			mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
			const names = await listProfiles();
			expect(names).toEqual([]);
		});

		it('should return profile names', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify([
					{ name: 'gaming', data: { dpi: 800 } },
					{ name: 'office', data: { dpi: 1600 } },
				]),
			);
			const names = await listProfiles();
			expect(names).toEqual(['gaming', 'office']);
		});

		it('should handle corrupted JSON gracefully', async () => {
			mockReadFile.mockResolvedValue('not valid json {{{');
			const names = await listProfiles();
			expect(names).toEqual([]);
		});
	});

	describe('saveProfile', () => {
		it('should create a new profile', async () => {
			mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
			await saveProfile('gaming', { dpi: 800, pollingRate: 1000 });
			expect(mockWriteFile).toHaveBeenCalledWith(
				STORAGE_PATH,
				JSON.stringify([{ name: 'gaming', data: { dpi: 800, pollingRate: 1000 } }]),
			);
		});

		it('should append to existing profiles', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify([{ name: 'gaming', data: { dpi: 800 } }]));
			await saveProfile('office', { dpi: 1600 });
			const [, data] = mockWriteFile.mock.calls[0];
			expect(JSON.parse(data)).toEqual([
				{ name: 'gaming', data: { dpi: 800 } },
				{ name: 'office', data: { dpi: 1600 } },
			]);
		});

		it('should update existing profile with same name', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify([
					{ name: 'gaming', data: { dpi: 800 } },
					{ name: 'office', data: { dpi: 1600 } },
				]),
			);
			await saveProfile('gaming', { dpi: 3200 });
			const [, data] = mockWriteFile.mock.calls[0];
			expect(JSON.parse(data)).toEqual([
				{ name: 'gaming', data: { dpi: 3200 } },
				{ name: 'office', data: { dpi: 1600 } },
			]);
		});
	});

	describe('loadProfile', () => {
		it('should return profile data by name', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify([{ name: 'gaming', data: { dpi: 800 } }]));
			const data = await loadProfile('gaming');
			expect(data).toEqual({ dpi: 800 });
		});

		it('should return null for missing profile', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify([{ name: 'gaming', data: { dpi: 800 } }]));
			const data = await loadProfile('nonexistent');
			expect(data).toBeNull();
		});

		it('should return null when file does not exist', async () => {
			mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
			const data = await loadProfile('gaming');
			expect(data).toBeNull();
		});
	});

	describe('deleteProfile', () => {
		it('should remove a profile', async () => {
			mockReadFile.mockResolvedValue(
				JSON.stringify([
					{ name: 'gaming', data: { dpi: 800 } },
					{ name: 'office', data: { dpi: 1600 } },
				]),
			);
			await deleteProfile('gaming');
			const [, data] = mockWriteFile.mock.calls[0];
			expect(JSON.parse(data)).toEqual([{ name: 'office', data: { dpi: 1600 } }]);
		});

		it('should do nothing when profile does not exist', async () => {
			mockReadFile.mockResolvedValue(JSON.stringify([{ name: 'gaming', data: { dpi: 800 } }]));
			await deleteProfile('nonexistent');
			const [, data] = mockWriteFile.mock.calls[0];
			expect(JSON.parse(data)).toEqual([{ name: 'gaming', data: { dpi: 800 } }]);
		});

		it('should handle deletion from empty file', async () => {
			mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
			await deleteProfile('gaming');
			const [, data] = mockWriteFile.mock.calls[0];
			expect(JSON.parse(data)).toEqual([]);
		});
	});
});
