import type { BaseProtocolBuilder } from '../core/BaseProtocolBuilder.js';
import { ParamsError } from '../errors.js';
import { ConnectionMode } from '../types.js';

export enum Rate {
	powerSaving = 125,
	office = 250,
	gaming = 500,
	eSports = 1000,
}

export interface PollingRateBuilderOptions {
	rate?: Rate;
}

/**
 * Builder for configuring the polling rate.
 * Handles both X11 (single-byte + checksum) and R1 (little-endian u16) encoding.
 */
export class PollingRateBuilder implements BaseProtocolBuilder {
	public static readonly DEFAULT_OPTIONS: PollingRateBuilderOptions = {
		rate: Rate.eSports,
	};
	readonly buffer: Buffer = Buffer.alloc(9);
	public readonly bmRequestType: number = 0x21;
	public readonly bRequest: number = 0x09;
	public readonly wValue: number = 0x0306;
	public readonly wIndex: number = 2;
	private selectedRate: Rate = Rate.eSports;

	constructor(options?: PollingRateBuilderOptions) {
		this.reset();
		if (options) {
			this.applyOptions(options);
		}
		this.build(ConnectionMode.Adapter);
	}

	private initializeBuffer(): void {
		this.buffer.fill(0);
		this.buffer[0] = 0x06;
		this.buffer[1] = 0x09;
		this.buffer[2] = 0x01;
	}

	private applyOptions(options: PollingRateBuilderOptions): void {
		if (options.rate !== undefined) this.setRate(options.rate);
	}

	public reset(): this {
		this.initializeBuffer();
		this.selectedRate = Rate.eSports;
		return this;
	}

	calculateChecksum(): number {
		return 0xff - this.x11RateByte(this.selectedRate);
	}

	private x11RateByte(rate: Rate): number {
		const map: Record<Rate, number> = {
			[Rate.powerSaving]: 0x08,
			[Rate.office]: 0x04,
			[Rate.gaming]: 0x02,
			[Rate.eSports]: 0x01,
		};
		return map[rate] ?? 0x01;
	}

	/**
	 * Sets the polling rate.
	 * @param rate Rate option (125, 250, 500, or 1000 Hz).
	 *
	 * @example
	 * ```typescript
	 * builder.setRate(Rate.eSports); // 1000Hz
	 * ```
	 */
	setRate(rate: Rate): this {
		const validRates = new Set([125, 250, 500, 1000]);
		if (!validRates.has(rate)) {
			throw new ParamsError('rate', `Unsupported Polling Rate: ${rate}`);
		}
		this.selectedRate = rate;
		return this;
	}

	build(mode: ConnectionMode): Buffer {
		if (mode === ConnectionMode.R1Wired) {
			// R1 uses little-endian u16 encoding
			const r1Map: Record<Rate, number> = {
				[Rate.powerSaving]: 0xf708,
				[Rate.office]: 0xfb04,
				[Rate.gaming]: 0xfd02,
				[Rate.eSports]: 0xfe01,
			};
			const value = r1Map[this.selectedRate];
			this.buffer[3] = value & 0xff; // low byte
			this.buffer[4] = (value >> 8) & 0xff; // high byte
		} else {
			// X11 uses single-byte rate + checksum
			this.buffer[3] = this.x11RateByte(this.selectedRate);
			this.buffer[4] = this.calculateChecksum();
		}
		return this.buffer;
	}

	toString(): string {
		return this.buffer.toString('hex');
	}
}
