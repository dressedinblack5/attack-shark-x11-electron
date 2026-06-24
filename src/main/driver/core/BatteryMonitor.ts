import { EventEmitter } from 'node:events';
import { ConnectionMode, type Logger } from '../types.js';
import { TimeoutError } from '../errors.js';

export interface BatteryMonitorEvents {
	batteryChange: [battery: number];
	error: [error: Error];
}

export interface BatteryMonitorConfig {
	headerPrefix?: Buffer | null;
	extractValue?: (data: Buffer) => number;
}

const X11_BATTERY_CONFIG: Required<Pick<BatteryMonitorConfig, 'headerPrefix' | 'extractValue'>> = {
	headerPrefix: Buffer.from([0x03, 0x55, 0x40, 0x01]),
	extractValue: (data: Buffer): number => data[4] ?? 0,
};

export class BatteryMonitor extends EventEmitter<BatteryMonitorEvents> {
	private lastBattery: number = -1;
	private device: { nativeTransferIn(endpoint: number, timeout: number, length: number): Promise<Uint8Array | null> };
	private interruptEndpoint: number;
	private connectionMode: () => ConnectionMode;
	private logger: Logger;
	private isOpen: () => boolean;
	private listenersSetup = false;
	private polling = false;
	get isPolling(): boolean {
		return this.polling;
	}
	private pollTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly headerPrefix: Buffer | null;
	private readonly extractValue: (data: Buffer) => number;

	constructor(
		device: { nativeTransferIn(endpoint: number, timeout: number, length: number): Promise<Uint8Array | null> },
		interruptEndpoint: number,
		connectionMode: () => ConnectionMode,
		logger: Logger,
		isOpen: () => boolean,
		config?: BatteryMonitorConfig,
	) {
		super();
		this.device = device;
		this.interruptEndpoint = interruptEndpoint;
		this.connectionMode = connectionMode;
		this.logger = logger;
		this.isOpen = isOpen;
		this.headerPrefix = config?.headerPrefix !== undefined ? config.headerPrefix : X11_BATTERY_CONFIG.headerPrefix;
		this.extractValue = config?.extractValue ?? X11_BATTERY_CONFIG.extractValue;
	}

	getBatteryLevel(timeoutMs: number): Promise<number> {
		return new Promise((resolve, reject) => {
			if (this.connectionMode() === ConnectionMode.Wired) {
				resolve(-1);
				return;
			}

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

	setupListeners(): void {
		if (this.listenersSetup) return;
		this.listenersSetup = true;

		this.on('_internalBatteryData', (data: Buffer) => {
			const matched =
				this.headerPrefix === null || this.headerPrefix === undefined
					? true
					: data.subarray(0, this.headerPrefix.length).equals(this.headerPrefix);

			if (!matched) return;
			if (data.length < 5) return;

			const battery = this.extractValue(data);
			if (battery !== undefined && battery !== this.lastBattery) {
				this.lastBattery = battery;
				this.emit('batteryChange', battery);
			}
		});
	}

	startPolling(): void {
		if (!this.isOpen() || this.polling) return;
		this.polling = true;
		this.pollLoop();
	}

	private async pollLoop(): Promise<void> {
		while (this.polling) {
			try {
				const data = await this.device.nativeTransferIn(this.interruptEndpoint, 2000, 64);
				if (data) {
					const buffer = Buffer.from(data);
					this.emit('_internalBatteryData', buffer);
				}
			} catch (e) {
				if (this.polling) {
					const errMsg = e instanceof Error ? e.message : String(e);
					// "Cancelled" is normal — means no data arrived within the timeout window.
					// Log other errors as they may indicate device issues.
					if (!errMsg.includes('Cancelled')) {
						this.logger.warn('Battery monitor interrupt read error', e);
					}
				}
			}

			if (this.polling) {
				await new Promise<void>((resolve) => {
					this.pollTimeout = setTimeout(resolve, 100);
				});
			}
		}
	}

	stopPolling(): void {
		this.polling = false;
		if (this.pollTimeout) {
			clearTimeout(this.pollTimeout);
			this.pollTimeout = null;
		}
	}

	destroy(): void {
		this.stopPolling();
		this.removeAllListeners();
	}
}
