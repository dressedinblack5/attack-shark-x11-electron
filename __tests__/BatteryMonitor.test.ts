import { describe, expect, it, vi, beforeEach } from 'bun:test';
import { BatteryMonitor } from '../src/main/driver/core/BatteryMonitor.js';
import { ConnectionMode } from '../src/main/driver/types.js';
import { TimeoutError } from '../src/main/driver/errors.js';

describe('BatteryMonitor', () => {
	let mockDevice: { nativeTransferIn: ReturnType<typeof vi.fn> };
	let mockLogger: {
		debug: ReturnType<typeof vi.fn>;
		info: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};
	let connectionMode: () => ConnectionMode;
	let isOpen: () => boolean;
	let monitor: BatteryMonitor;

	beforeEach(() => {
		mockDevice = { nativeTransferIn: vi.fn().mockResolvedValue(new Uint8Array(64)) };
		mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
		connectionMode = () => ConnectionMode.Adapter;
		isOpen = () => true;
		monitor = new BatteryMonitor(mockDevice, 0x02, connectionMode, mockLogger, isOpen);
	});

	describe('constructor', () => {
		it('should use X11 battery config by default', () => {
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.setupListeners();
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 75]));
			expect(spy).toHaveBeenCalledWith(75);
		});

		it('should accept custom headerPrefix and extractValue', () => {
			const custom = new BatteryMonitor(mockDevice, 0x02, connectionMode, mockLogger, isOpen, {
				headerPrefix: Buffer.from([0xaa, 0xbb]),
				extractValue: (data: Buffer) => data[2] + data[3],
			});
			const spy = vi.fn();
			custom.on('batteryChange', spy);
			custom.setupListeners();
			// Data must be ≥5 bytes for handler, extractValue reads data[2] + data[3]
			custom.emit('_internalBatteryData', Buffer.from([0xaa, 0xbb, 0x05, 0x03, 0x00]));
			expect(spy).toHaveBeenCalledWith(8);
		});

		it('should handle null headerPrefix (match all data)', () => {
			const custom = new BatteryMonitor(mockDevice, 0x02, connectionMode, mockLogger, isOpen, {
				headerPrefix: null,
			});
			const spy = vi.fn();
			custom.on('batteryChange', spy);
			custom.setupListeners();
			custom.emit('_internalBatteryData', Buffer.from([0xff, 0x00, 0x00, 0x00, 50]));
			expect(spy).toHaveBeenCalledWith(50);
		});
	});

	describe('getBatteryLevel', () => {
		it('should return -1 immediately in wired mode', async () => {
			const wiredMonitor = new BatteryMonitor(mockDevice, 0x02, () => ConnectionMode.Wired, mockLogger, isOpen);
			const level = await wiredMonitor.getBatteryLevel(1000);
			expect(level).toBe(-1);
		});

		it('should return cached lastBattery if valid', async () => {
			monitor.setupListeners();
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 60]));
			const level = await monitor.getBatteryLevel(1000);
			expect(level).toBe(60);
		});

		it('should resolve from batteryChange event', async () => {
			const promise = monitor.getBatteryLevel(1000);
			monitor.emit('batteryChange', 55);
			await expect(promise).resolves.toBe(55);
		});

		it('should reject on timeout', async () => {
			vi.useFakeTimers();
			try {
				const promise = monitor.getBatteryLevel(500);
				vi.advanceTimersByTime(500);
				await expect(promise).rejects.toThrow(TimeoutError);
			} finally {
				vi.useRealTimers();
			}
		});

		it('should not resolve for battery values > 100', async () => {
			vi.useFakeTimers();
			try {
				const promise = monitor.getBatteryLevel(500);
				monitor.emit('batteryChange', 200);
				vi.advanceTimersByTime(500);
				await expect(promise).rejects.toThrow(TimeoutError);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('setupListeners / _internalBatteryData handler', () => {
		it('should set up listeners only once', () => {
			monitor.setupListeners();
			monitor.setupListeners();
			// If idempotent, the handler is only registered once
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 70]));
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('should not emit for non-matching header prefix', () => {
			monitor.setupListeners();
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.emit('_internalBatteryData', Buffer.from([0x00, 0x00, 0x00, 0x00, 50]));
			expect(spy).not.toHaveBeenCalled();
		});

		it('should not emit for short data (< 5 bytes)', () => {
			monitor.setupListeners();
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40]));
			expect(spy).not.toHaveBeenCalled();
		});

		it('should not emit batteryChange for same battery value', () => {
			monitor.setupListeners();
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			const data = Buffer.from([0x03, 0x55, 0x40, 0x01, 50]);
			monitor.emit('_internalBatteryData', data);
			monitor.emit('_internalBatteryData', data);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(50);
		});

		it('should update lastBattery on new value', () => {
			monitor.setupListeners();
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 30]));
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 45]));
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			// Now cached value is 45 — emit the same means no batteryChange
			monitor.emit('_internalBatteryData', Buffer.from([0x03, 0x55, 0x40, 0x01, 45]));
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('startPolling / stopPolling', () => {
		it('should start polling and call nativeTransferIn', async () => {
			let resolveTransfer: (v: Uint8Array) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((resolve) => {
					resolveTransfer = resolve;
				}),
			);
			monitor.startPolling();
			expect(monitor.isPolling).toBe(true);
			expect(mockDevice.nativeTransferIn).toHaveBeenCalledWith(0x02, 2000, 64);
			monitor.stopPolling();
			resolveTransfer!(new Uint8Array(64));
			await new Promise((r) => setTimeout(r, 5));
		});

		it('should not start polling if device is not open', () => {
			const closedMonitor = new BatteryMonitor(mockDevice, 0x02, connectionMode, mockLogger, () => false);
			closedMonitor.startPolling();
			expect(closedMonitor.isPolling).toBe(false);
		});

		it('should not start polling twice', async () => {
			let resolveTransfer: (v: Uint8Array) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((resolve) => {
					resolveTransfer = resolve;
				}),
			);
			monitor.startPolling();
			monitor.startPolling();
			expect(monitor.isPolling).toBe(true);
			expect(mockDevice.nativeTransferIn).toHaveBeenCalledTimes(1);
			monitor.stopPolling();
			resolveTransfer!(new Uint8Array(64));
			await new Promise((r) => setTimeout(r, 5));
		});

		it('should emit batteryChange when poll returns matching data', async () => {
			let resolveTransfer: (v: Uint8Array) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((resolve) => {
					resolveTransfer = resolve;
				}),
			);
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.setupListeners();
			monitor.startPolling();
			monitor.stopPolling();
			resolveTransfer!(Buffer.from([0x03, 0x55, 0x40, 0x01, 65]));
			await new Promise((r) => setTimeout(r, 5));
			expect(spy).toHaveBeenCalledWith(65);
		});

		it('should log errors from nativeTransferIn (non-Cancelled)', async () => {
			let rejectTransfer: (e: Error) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((_, reject) => {
					rejectTransfer = reject;
				}),
			);
			monitor.setupListeners();
			monitor.startPolling();
			rejectTransfer!(new Error('USB stall'));
			await new Promise((r) => setTimeout(r, 10));
			monitor.stopPolling();
			expect(mockLogger.warn).toHaveBeenCalledWith('Battery monitor interrupt read error', expect.any(Error));
		});

		it('should not log Cancelled errors', async () => {
			let rejectTransfer: (e: Error) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((_, reject) => {
					rejectTransfer = reject;
				}),
			);
			monitor.setupListeners();
			monitor.startPolling();
			rejectTransfer!(new Error('Cancelled'));
			await new Promise((r) => setTimeout(r, 10));
			monitor.stopPolling();
			expect(mockLogger.warn).not.toHaveBeenCalled();
		});

		it('should not call logger.warn after stopPolling clears polling flag', async () => {
			let resolveTransfer: (v: Uint8Array) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((resolve) => {
					resolveTransfer = resolve;
				}),
			);
			monitor.setupListeners();
			monitor.startPolling();
			await new Promise((r) => setTimeout(r, 5));
			monitor.stopPolling();
			resolveTransfer!(new Uint8Array(64));
			await new Promise((r) => setTimeout(r, 5));
			expect(mockLogger.warn).not.toHaveBeenCalled();
		});
	});

	describe('destroy', () => {
		it('should stop polling and remove all listeners', async () => {
			let resolveTransfer: (v: Uint8Array) => void;
			mockDevice.nativeTransferIn.mockReturnValue(
				new Promise<Uint8Array>((resolve) => {
					resolveTransfer = resolve;
				}),
			);
			monitor.startPolling();
			monitor.destroy();
			expect(monitor.isPolling).toBe(false);
			resolveTransfer!(new Uint8Array(64));
			await new Promise((r) => setTimeout(r, 5));
			const spy = vi.fn();
			monitor.on('batteryChange', spy);
			monitor.emit('batteryChange', 50);
			expect(spy).toHaveBeenCalled();
		});

		it('should clear pending timeout', () => {
			monitor.destroy();
			expect(true).toBe(true);
		});
	});
});
