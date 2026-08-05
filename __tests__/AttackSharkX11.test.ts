import { describe, expect, it, vi, beforeEach } from 'bun:test';

interface MockDevice {
	vendorId: number;
	productId: number;
	deviceVersionMajor: number;
	deviceVersionMinor: number;
	deviceVersionSubminor: number;
	configurations: Array<{ configurationValue: number; configurationName: string; interfaces: [] }>;
	opened: boolean;
	open: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	claimInterface: ReturnType<typeof vi.fn>;
	releaseInterface: ReturnType<typeof vi.fn>;
	selectConfiguration: ReturnType<typeof vi.fn>;
	detachKernelDriver: ReturnType<typeof vi.fn>;
	attachKernelDriver: ReturnType<typeof vi.fn>;
	nativeControlTransferIn: ReturnType<typeof vi.fn>;
	nativeControlTransferOut: ReturnType<typeof vi.fn>;
	nativeTransferIn: ReturnType<typeof vi.fn>;
	nativeTransferOut: ReturnType<typeof vi.fn>;
}

const createMockDevice = (productId: number): MockDevice => ({
	vendorId: 0x1d57,
	productId,
	deviceVersionMajor: 2,
	deviceVersionMinor: 0,
	deviceVersionSubminor: 0,
	configurations: [{ configurationValue: 1, configurationName: 'Config', interfaces: [] }],
	opened: false,
	open: vi.fn().mockResolvedValue(undefined),
	close: vi.fn().mockResolvedValue(undefined),
	claimInterface: vi.fn().mockResolvedValue(undefined),
	releaseInterface: vi.fn().mockResolvedValue(undefined),
	selectConfiguration: vi.fn().mockResolvedValue(undefined),
	detachKernelDriver: vi.fn().mockResolvedValue(undefined),
	attachKernelDriver: vi.fn().mockResolvedValue(undefined),
	nativeControlTransferIn: vi
		.fn()
		.mockImplementation((_setup: unknown, _timeout: number, length: number): Promise<Uint8Array | null> =>
			Promise.resolve(new Uint8Array(length)),
		),
	nativeControlTransferOut: vi
		.fn()
		.mockImplementation((_setup: unknown, _timeout: number, data?: Uint8Array): Promise<number> =>
			Promise.resolve(data?.length ?? 0),
		),
	nativeTransferIn: vi.fn().mockResolvedValue(new Uint8Array(64)),
	nativeTransferOut: vi.fn().mockResolvedValue(0),
});

const mockAdapterDevice = createMockDevice(0xfa60);
const mockWiredDevice = createMockDevice(0xfa55);

vi.mock('usb', () => ({
	usb: {
		findDeviceByIds: vi.fn((vid: number, pid: number): Promise<typeof mockAdapterDevice | null> => {
			if (vid === 0x1d57 && pid === 0xfa60) return Promise.resolve(mockAdapterDevice);
			if (vid === 0x1d57 && pid === 0xfa55) return Promise.resolve(mockWiredDevice);
			return Promise.resolve(null);
		}),
	},
}));

const { AttackSharkX11, ConnectionMode, DriverError, DeviceError } = await import('../src/main/driver/index.js');

function createDriver(mode: ConnectionMode = ConnectionMode.Adapter, delayMs = 0): InstanceType<typeof AttackSharkX11> {
	return new AttackSharkX11({ connectionMode: mode, delayMs });
}

describe('AttackSharkX11', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should create an Adapter-mode instance when connection mode is specified', () => {
			const driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter });
			expect(driver.connectionMode).toBe(ConnectionMode.Adapter);
			expect(driver.productId).toBe(0xfa60);
			expect(driver.delayMs).toBe(250);
		});

		it('should create a Wired-mode instance when connection mode is specified', () => {
			const driver = new AttackSharkX11({ connectionMode: ConnectionMode.Wired });
			expect(driver.connectionMode).toBe(ConnectionMode.Wired);
			expect(driver.productId).toBe(0xfa55);
		});

		it('should throw DriverError if connectionMode is not specified', () => {
			expect(() => new AttackSharkX11({} as { connectionMode: ConnectionMode })).toThrow(DriverError);
		});

		it('should throw DeviceError if no matching device is found', async () => {
			const { usb: usbMock } = await import('usb');
			(usbMock.findDeviceByIds as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
			const driver = createDriver();

			await expect(driver.open()).rejects.toThrow(DeviceError);
		});

		it('should accept custom delayMs', () => {
			const driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, delayMs: 500 });
			expect(driver.delayMs).toBe(500);
		});
	});

	describe('open()', () => {
		it('should open the device and claim the interface', async () => {
			const driver = createDriver();
			await driver.open();

			expect(mockAdapterDevice.open).toHaveBeenCalledTimes(1);
			expect(mockAdapterDevice.claimInterface).toHaveBeenCalledWith(2);
		});

		it('should detach kernel driver on Linux when active', async () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'linux' });

			const driver = createDriver();
			await driver.open();

			expect(mockAdapterDevice.detachKernelDriver).toHaveBeenCalledWith(2);

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should not call detachKernelDriver on non-Linux', async () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'darwin' });

			const driver = createDriver();
			await driver.open();

			expect(mockAdapterDevice.detachKernelDriver).not.toHaveBeenCalled();

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should not throw if detachKernelDriver fails on Linux', async () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'linux' });

			mockAdapterDevice.detachKernelDriver.mockRejectedValueOnce(new Error('No kernel driver'));
			const driver = createDriver();

			await expect(driver.open()).resolves.toBeUndefined();

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should start battery monitor polling on open', async () => {
			const driver = createDriver();
			await driver.open();

			// Battery monitor is started — transferIn should be called in the polling loop
			await new Promise((r) => setTimeout(r, 50));
			expect(mockAdapterDevice.nativeTransferIn).toHaveBeenCalled();
		});
	});

	describe('close()', () => {
		it('should close the device and release the interface', async () => {
			const driver = createDriver();
			await driver.open();
			await driver.close();

			expect(mockAdapterDevice.releaseInterface).toHaveBeenCalledWith(2);
			expect(mockAdapterDevice.close).toHaveBeenCalledTimes(1);
		});

		it('should do nothing if not open', async () => {
			const driver = createDriver();
			await driver.close();

			expect(mockAdapterDevice.close).not.toHaveBeenCalled();
		});

		it('should not throw when device close has pending request error', async () => {
			const driver = createDriver();
			await driver.open();

			mockAdapterDevice.close.mockRejectedValueOnce(new Error('LIBUSB_ERROR_NOT_FOUND pending request'));
			await expect(driver.close()).resolves.toBeUndefined();
		});
	});

	describe('getBatteryLevel()', () => {
		it('should return -1 in wired mode', async () => {
			const driver = createDriver(ConnectionMode.Wired);
			await driver.open();
			const level = await driver.getBatteryLevel();
			expect(level).toBe(-1);
		});

		it('should resolve when batteryChange event fires', async () => {
			const driver = createDriver();
			await driver.open();

			const result = driver.getBatteryLevel(5000);
			driver.emit('batteryChange', 75);

			await expect(result).resolves.toBe(75);
		});

		it('should timeout if no battery event received', async () => {
			const driver = createDriver();
			await driver.open();

			await expect(driver.getBatteryLevel(10)).rejects.toThrow('Timeout waiting for battery report');
		});
	});

	describe('checkIsOpen()', () => {
		it('should throw DriverError if device not opened', () => {
			const driver = createDriver();
			expect(() => driver.checkIsOpen()).toThrow(DriverError);
		});

		it('should not throw if device is open', async () => {
			const driver = createDriver();
			await driver.open();
			expect(() => driver.checkIsOpen()).not.toThrow();
		});
	});

	describe('getDeviceInfo()', () => {
		it('should return device info with correct values for adapter mode', async () => {
			const driver = createDriver();
			await driver.open();
			const info = driver.getDeviceInfo();

			expect(info.manufacturer).toBe('Beken');
			expect(info.product).toBe('Attack Shark X11');
			expect(info.vendorId).toBe('0x1d57');
			expect(info.productId).toBe('0xfa60');
			expect(info.connectionMode).toBe('Wireless (2.4GHz)');
			expect(info.interfaces).toBe(1);
		});

		it('should return Wired connection mode for wired device', async () => {
			const driver = createDriver(ConnectionMode.Wired);
			await driver.open();
			const info = driver.getDeviceInfo();

			expect(info.productId).toBe('0xfa55');
			expect(info.connectionMode).toBe('Wired (USB)');
		});
	});

	describe('controlTransfer()', () => {
		it('should throw if device not open', async () => {
			const driver = createDriver();
			await expect(
				driver.controlTransfer({
					bmRequestType: 0x21,
					bRequest: 0x09,
					wValue: 0x0304,
					wIndex: 2,
					data: Buffer.from([0x04]),
				}),
			).rejects.toThrow(DriverError);
		});

		it('should send control transfer with output data', async () => {
			const driver = createDriver();
			await driver.open();

			const data = Buffer.from([0x04, 0x01]);
			const result = await driver.controlTransfer({
				bmRequestType: 0x21,
				bRequest: 0x09,
				wValue: 0x0304,
				wIndex: 2,
				data,
			});

			expect(result).toBe(2);
			expect(mockAdapterDevice.nativeControlTransferOut).toHaveBeenCalledWith(
				expect.objectContaining({
					requestType: 'class',
					recipient: 'interface',
					request: 0x09,
					value: 0x0304,
					index: 2,
				}),
				expect.any(Number),
				new Uint8Array(data),
			);
		});

		it('should handle input control transfers', async () => {
			const driver = createDriver();
			await driver.open();

			const result = await driver.controlTransfer({
				bmRequestType: 0xa1,
				bRequest: 0x01,
				wValue: 0x0305,
				wIndex: 2,
				data: 15,
			});

			expect(Buffer.isBuffer(result)).toBe(true);
			expect((result as Buffer).length).toBe(15);
		});
	});

	describe('setDpi()', () => {
		it('should throw DriverError if device not open', () => {
			const driver = createDriver();
			expect(() => driver.setDpi({ dpiValues: [800, 1600, 2400, 3200, 5000, 22000] })).toThrow(DriverError);
		});

		it('should send DPI configuration via control transfer', async () => {
			const driver = createDriver();
			await driver.open();

			await driver.setDpi({
				activeStage: 2,
				angleSnap: false,
				ripplerControl: true,
				dpiValues: [800, 1600, 2400, 3200, 5000, 22000],
			});

			expect(mockAdapterDevice.nativeControlTransferOut).toHaveBeenCalled();
		});
	});

	describe('setPollingRate()', () => {
		it('should send polling rate via control transfer', async () => {
			const driver = createDriver();
			await driver.open();

			await driver.setPollingRate(1000);

			expect(mockAdapterDevice.nativeControlTransferOut).toHaveBeenCalled();
		});
	});

	describe('setUserPreferences()', () => {
		it('should send user preferences via control transfer', async () => {
			const driver = createDriver();
			await driver.open();

			await driver.setUserPreferences({
				lightMode: 0x20,
				ledSpeed: 2,
				keyResponse: 4,
			});

			expect(mockAdapterDevice.nativeControlTransferOut).toHaveBeenCalled();
		});
	});

	describe('setMacro()', () => {
		it('should send macro config via control transfer', async () => {
			const driver = createDriver();
			await driver.open();

			await driver.setMacro({ forward: [0x12, 0x00, 0x00] });

			expect(mockAdapterDevice.nativeControlTransferOut).toHaveBeenCalled();
		});
	});

	describe('reset()', () => {
		it('should call all sub-reset methods in order', async () => {
			const driver = createDriver();
			await driver.open();

			const sendInternalSpy = vi.spyOn(driver, 'sendInternalStateResetReportBuilder');
			const resetDpiSpy = vi.spyOn(driver, 'resetDpi');
			const resetUserPreferencesSpy = vi.spyOn(driver, 'resetUserPreferences');
			const resetPollingRateSpy = vi.spyOn(driver, 'resetPollingRate');
			const resetMacroSpy = vi.spyOn(driver, 'resetMacro');
			const resetCustomMacroSpy = vi.spyOn(driver, 'resetCustomMacro');

			await driver.reset();

			expect(sendInternalSpy).toHaveBeenCalled();
			expect(resetDpiSpy).toHaveBeenCalled();
			expect(resetUserPreferencesSpy).toHaveBeenCalled();
			expect(resetPollingRateSpy).toHaveBeenCalled();
			expect(resetMacroSpy).toHaveBeenCalled();
			expect(resetCustomMacroSpy).toHaveBeenCalled();
		});
	});

	describe('onBatteryChange()', () => {
		it('should register a listener and return an unsubscribe function', async () => {
			const driver = createDriver();
			await driver.open();

			const listener = vi.fn();
			const unsubscribe = driver.onBatteryChange(listener);

			driver.emit('batteryChange', 42);
			expect(listener).toHaveBeenCalledWith(42);

			unsubscribe();
			driver.emit('batteryChange', 50);
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('should throw if device not open', () => {
			const driver = createDriver();
			expect(() => driver.onBatteryChange(() => undefined)).toThrow(DriverError);
		});
	});
});
