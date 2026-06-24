import { usb } from 'usb';
import { EventEmitter } from 'node:events';
import { DeviceError, DriverError, InterfaceError, TimeoutError } from '../errors.js';
import { R1DpiBuilder, type R1DpiBuilderOptions } from '../protocols/R1DpiBuilder.js';
import {
	R1PollingRateBuilder,
	type R1Rate,
	type R1PollingRateBuilder as R1PollingRateBuilderType,
} from '../protocols/R1PollingRateBuilder.js';
import {
	R1UserPreferencesBuilder,
	type R1UserPreferencesBuilderOptions,
} from '../protocols/R1UserPreferencesBuilder.js';
import {
	ConnectionMode,
	type ControlTransferIn,
	type ControlTransferOptions,
	type ControlTransferOut,
	type Logger,
} from '../types.js';
import { delay } from '../utils/delay.js';
import { logger as defaultLogger } from '../logger/index.js';
import { BatteryMonitor } from './BatteryMonitor.js';

type USBRequestType = 'standard' | 'class' | 'vendor';
type USBRecipient = 'device' | 'interface' | 'endpoint' | 'other';

interface USBControlTransferParameters {
	requestType: USBRequestType;
	recipient: USBRecipient;
	request: number;
	value: number;
	index: number;
}

interface UsbDeviceLike {
	vendorId: number;
	productId: number;
	deviceVersionMajor: number;
	deviceVersionMinor: number;
	deviceVersionSubminor: number;
	configurations: Array<{ configurationValue: number }>;
	opened: boolean;
	open(): Promise<void>;
	close(): Promise<void>;
	claimInterface(interfaceNumber: number): Promise<void>;
	releaseInterface(interfaceNumber: number): Promise<void>;
	selectConfiguration(configurationValue: number): Promise<void>;
	detachKernelDriver(interfaceNumber: number): Promise<void>;
	attachKernelDriver(interfaceNumber: number): Promise<void>;
	controlTransferIn?(setup: USBControlTransferParameters, length: number): Promise<unknown>;
	controlTransferOut?(setup: USBControlTransferParameters, data?: BufferSource): Promise<unknown>;
	nativeControlTransferIn(
		setup: USBControlTransferParameters,
		timeout: number,
		length: number,
	): Promise<Uint8Array | null>;
	nativeControlTransferOut(
		setup: USBControlTransferParameters,
		timeout: number,
		data?: Uint8Array | null,
	): Promise<number>;
	nativeTransferIn(endpointNumber: number, timeout: number, length: number): Promise<Uint8Array | null>;
	nativeTransferOut(endpointNumber: number, timeout: number, data: Uint8Array): Promise<number>;
}

const VID = 0x1d57;
const DEVICE_INTERFACE = 0x02;
const INTERRUPT_ENDPOINT = 3;
const CONTROL_TRANSFER_TIMEOUT = 1000;

const REQUEST_TYPES = ['standard', 'class', 'vendor'] as const;
const RECIPIENTS = ['device', 'interface', 'endpoint', 'other'] as const;

function parseBmRequestType(bmRequestType: number): {
	requestType: USBRequestType;
	recipient: USBRecipient;
	isIn: boolean;
} {
	const direction = (bmRequestType >> 7) & 1;
	const type = (bmRequestType >> 5) & 0x3;
	const recipient = bmRequestType & 0x1f;

	return {
		requestType: REQUEST_TYPES[type] ?? 'vendor',
		recipient: (RECIPIENTS[recipient] as USBRecipient) ?? 'interface',
		isIn: direction === 1,
	};
}

export interface AttackSharkR1Events {
	batteryChange: [battery: number];
	error: [error: Error];
}

export class AttackSharkR1 extends EventEmitter<AttackSharkR1Events> {
	public readonly productId: number;
	device!: UsbDeviceLike;
	public readonly delayMs: number;
	private isDeviceOpen: boolean = false;
	private lastBattery: number = -1;
	private logger: Logger;
	private batteryMonitor: BatteryMonitor | null = null;
	private cachedUserPreferences: R1UserPreferencesBuilderOptions | null = null;

	constructor(options: { connectionMode: ConnectionMode; logger?: Logger; delayMs?: number }) {
		super();
		if (!options.connectionMode) {
			throw new DriverError('The type of connection was not specified');
		}

		this.logger = options.logger ?? defaultLogger;
		this.delayMs = options.delayMs ?? 250;
		this.productId = options.connectionMode;
	}

	get connectionMode(): ConnectionMode {
		return this.productId as ConnectionMode;
	}

	async open(): Promise<void> {
		this.logger.info(`Searching for USB device VID:${VID.toString(16)} PID:${this.productId.toString(16)}...`);

		const device = await usb.findDeviceByIds(VID, this.productId);

		if (!device) {
			throw new DeviceError(`Device with idProduct ${this.productId} not found`);
		}

		this.device = device;

		this.logger.info(`Opening USB device VID:${VID.toString(16)} PID:${this.productId.toString(16)}...`);

		try {
			await device.open();
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			this.logger.error('Failed to open USB device', error);
			throw new DeviceError(
				`An unexpected error occurred while trying to open device ${this.connectionMode}. ${error.message}`,
				{
					cause: error,
				},
			);
		}

		if (process.platform === 'linux') {
			try {
				await device.detachKernelDriver(DEVICE_INTERFACE);
				this.logger.info('Detaching kernel driver...');
			} catch {
				// Kernel driver may not be active — that's fine
			}
		}

		if (device.configurations && device.configurations.length > 0) {
			const firstConfig = device.configurations[0];
			if (firstConfig) {
				try {
					await device.selectConfiguration(firstConfig.configurationValue);
				} catch (e: unknown) {
					const error = e instanceof Error ? e : new Error(String(e));
					this.logger.warn(`selectConfiguration failed (may already be configured): ${error.message}`);
				}
			}
		}

		try {
			this.logger.info(`Claiming interface ${DEVICE_INTERFACE}...`);
			await device.claimInterface(DEVICE_INTERFACE);
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			if (error.message.includes('LIBUSB_ERROR_BUSY')) {
				this.logger.warn(`Interface ${DEVICE_INTERFACE} is already claimed. Attempting to continue...`);
			} else {
				this.logger.error(`Could not claim interface ${DEVICE_INTERFACE}`, error);
				throw new InterfaceError(
					`Could not claim interface ${DEVICE_INTERFACE}. ${error.message}`,
					DEVICE_INTERFACE,
					{ cause: error },
				);
			}
		}

		this.isDeviceOpen = true;

		// Detect actual device and use appropriate battery config
		// PID 0xfa60 is shared by X11 and R1 wireless, so we use X11 config for compatibility
		const isX11Wireless = this.device.productId === 0xfa60;
		const batteryConfig = isX11Wireless
			? {
					headerPrefix: Buffer.from([0x03, 0x55, 0x40, 0x01]),
					extractValue: (data: Buffer): number => data[4] ?? 0,
				}
			: {
					headerPrefix: null,
					extractValue: (data: Buffer): number => (data[4] ?? 0) * 10,
				};

		this.batteryMonitor = new BatteryMonitor(
			this.device,
			INTERRUPT_ENDPOINT,
			() => this.connectionMode,
			this.logger,
			() => this.isDeviceOpen,
			batteryConfig,
		);

		this.batteryMonitor.on('batteryChange', (level) => {
			this.lastBattery = level;
			this.emit('batteryChange', level);
		});

		this.batteryMonitor.on('error', (err) => {
			this.emit('error', err);
		});

		this.batteryMonitor.setupListeners();
		this.batteryMonitor.startPolling();
		this.logger.info('Device ready.');
	}

	async close(): Promise<void> {
		if (!this.isDeviceOpen) return;

		this.logger.info('Closing driver and releasing resources...');
		this.removeAllListeners();

		if (this.batteryMonitor) {
			this.batteryMonitor.destroy();
		}

		try {
			this.logger.info(`Releasing interface ${DEVICE_INTERFACE}...`);
			await this.device.releaseInterface(DEVICE_INTERFACE);
		} catch (e) {
			this.logger.error('Failed to release interface', e);
		}

		try {
			this.logger.info('Closing USB device...');
			await this.device.close();
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			if (error.message.includes('pending request')) {
				this.logger.warn('Device had pending requests during close. This is common on app exit.');
			} else {
				this.logger.error('Error while closing device', error);
			}
		}

		this.isDeviceOpen = false;
		this.logger.info('Driver closed.');
	}

	checkIsOpen(): void {
		if (!this.isDeviceOpen) throw new DriverError('You have to open the device first');
	}

	controlTransfer(options: ControlTransferIn): Promise<Buffer>;
	controlTransfer(options: ControlTransferOut): Promise<number>;
	controlTransfer(options: ControlTransferOptions): Promise<number | Buffer>;
	async controlTransfer(options: ControlTransferOptions): Promise<number | Buffer> {
		this.checkIsOpen();

		const { requestType, recipient, isIn } = parseBmRequestType(options.bmRequestType);
		const setup: USBControlTransferParameters = {
			requestType,
			recipient,
			request: options.bRequest,
			value: options.wValue,
			index: options.wIndex,
		};

		let result: number | Buffer;

		if (isIn) {
			const length = typeof options.data === 'number' ? options.data : 0;
			const data = await this.device.nativeControlTransferIn(setup, CONTROL_TRANSFER_TIMEOUT, length);
			result = data ? Buffer.from(data) : Buffer.alloc(0);
		} else {
			const data = options.data instanceof Buffer ? new Uint8Array(options.data) : undefined;
			const bytesWritten = await this.device.nativeControlTransferOut(setup, CONTROL_TRANSFER_TIMEOUT, data);
			result = bytesWritten;
		}

		if (Buffer.isBuffer(options.data)) {
			await delay(this.delayMs);
		}

		return result;
	}

	private sendBuilder(builder: {
		build(mode: ConnectionMode): Buffer;
		bmRequestType: number;
		bRequest: number;
		wValue: number;
		wIndex: number;
	}): Promise<number> {
		return this.controlTransfer({
			data: builder.build(this.connectionMode),
			bmRequestType: builder.bmRequestType,
			bRequest: builder.bRequest,
			wValue: builder.wValue,
			wIndex: builder.wIndex,
		} as ControlTransferOut) as Promise<number>;
	}

	getBatteryLevel(timeoutMs = 1000): Promise<number> {
		this.checkIsOpen();

		if (this.connectionMode === ConnectionMode.R1Wired) {
			return Promise.resolve(-1);
		}

		if (this.batteryMonitor && !this.batteryMonitor.isPolling) {
			return Promise.resolve(-1);
		}

		return new Promise((resolve, reject) => {
			if (this.lastBattery !== -1 && this.lastBattery <= 100) {
				resolve(this.lastBattery);
				return;
			}

			let finished = false;

			const cleanup = (): void => {
				if (finished) return;
				finished = true;
				clearTimeout(timeout);
				this.removeListener('batteryChange', handleBattery);
			};

			const handleBattery = (battery: number): void => {
				if (finished) return;
				if (battery <= 100) {
					cleanup();
					resolve(battery);
				}
			};

			const timeout = setTimeout(() => {
				cleanup();
				reject(new TimeoutError('Timeout waiting for battery report'));
			}, timeoutMs);

			this.on('batteryChange', handleBattery);
		});
	}

	onBatteryChange(listener: (battery: number) => void): () => void {
		this.checkIsOpen();
		this.on('batteryChange', listener);
		return () => {
			this.removeListener('batteryChange', listener);
		};
	}

	setDpi(options: R1DpiBuilder | R1DpiBuilderOptions): Promise<number> {
		this.checkIsOpen();
		const builder = options instanceof R1DpiBuilder ? options : new R1DpiBuilder(options);
		return this.sendBuilder(builder);
	}

	setPollingRate(rate: R1Rate | R1PollingRateBuilderType): Promise<number> {
		this.checkIsOpen();
		const builder = rate instanceof R1PollingRateBuilder ? rate : new R1PollingRateBuilder().setRate(rate);
		return this.sendBuilder(builder);
	}

	setUserPreferences(options: R1UserPreferencesBuilder | R1UserPreferencesBuilderOptions): Promise<number> {
		this.checkIsOpen();
		const builder = options instanceof R1UserPreferencesBuilder ? options : new R1UserPreferencesBuilder(options);
		if (!(options instanceof R1UserPreferencesBuilder)) {
			this.cachedUserPreferences = { ...options };
		}
		return this.sendBuilder(builder);
	}

	getCachedUserPreferences(): R1UserPreferencesBuilderOptions | null {
		return this.cachedUserPreferences;
	}

	resetPollingRate(): Promise<number> {
		this.checkIsOpen();
		return this.sendBuilder(new R1PollingRateBuilder());
	}

	resetDpi(): Promise<number> {
		this.checkIsOpen();
		return this.sendBuilder(new R1DpiBuilder());
	}

	resetUserPreferences(): Promise<number> {
		this.checkIsOpen();
		return this.sendBuilder(new R1UserPreferencesBuilder());
	}

	async reset(): Promise<void> {
		this.checkIsOpen();
		await this.resetDpi();
		await this.resetUserPreferences();
		await this.resetPollingRate();
	}

	getDeviceInfo(): {
		manufacturer: string;
		product: string;
		serialNumber: string;
		vendorId: string;
		productId: string;
		bcdDevice: string;
		connectionMode: string;
		interfaces: number;
	} {
		this.checkIsOpen();
		return {
			manufacturer: 'Beken',
			product: 'Attack Shark R1',
			serialNumber: 'N/A',
			vendorId: `0x${this.device.vendorId.toString(16).padStart(4, '0')}`,
			productId: `0x${this.device.productId.toString(16).padStart(4, '0')}`,
			bcdDevice: `${this.device.deviceVersionMajor}.${this.device.deviceVersionMinor}`,
			connectionMode: this.connectionMode === ConnectionMode.Adapter ? 'Wireless (2.4GHz)' : 'Wired (USB)',
			interfaces: this.device.configurations?.length ?? 0,
		};
	}
}

export default AttackSharkR1;
