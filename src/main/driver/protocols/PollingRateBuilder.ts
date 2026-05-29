import type { BaseProtocolBuilder } from '../core/BaseProtocolBuilder.js';
import { ParamsError } from '../errors.js';
import type { ConnectionMode } from '../types.js';

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
 * Builder for configuring the update rate (Polling Rate).
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

	constructor(options?: PollingRateBuilderOptions) {
		this.reset();
		if (options) {
			this.applyOptions(options);
		}
	}

	private initializeBuffer(): void {
		this.buffer.fill(0);
		this.buffer[0] = 0x06; // header
		this.buffer[1] = 0x09; // header
		this.buffer[2] = 0x01; // header
		this.buffer[3] = 0x01; // polling rate
		this.buffer[4] = 0xfe; // checksum
		// 5-8 are 0x00 due to fill(0)
	}

	private applyOptions(options: PollingRateBuilderOptions): void {
		if (options.rate !== undefined) this.setRate(options.rate);
	}

	public reset(): this {
		this.initializeBuffer();
		this.applyOptions(PollingRateBuilder.DEFAULT_OPTIONS);
		return this;
	}

	/**
	 * Creates an instance already configured for a specific rate
	 * @deprecated
	 */
	static forRate(rate: Rate): PollingRateBuilder {
		return new PollingRateBuilder({ rate });
	}

	calculateChecksum(): number {
		return 0xff - (this.buffer[3] ?? 0x00);
	}

	/**
	 * Sets the update rate (Polling Rate).
	 * @param rate Rate option (125, 250, 500, or 1000 Hz).
	 *
	 * @example
	 * ```typescript
	 * builder.setRate(Rate.eSports); // 1000Hz
	 * ```
	 */
	setRate(rate: Rate): this {
		const rateMap: Record<Rate, number> = {
			[Rate.powerSaving]: 0x08,
			[Rate.office]: 0x04,
			[Rate.gaming]: 0x02,
			[Rate.eSports]: 0x01,
		};

		const value = rateMap[rate];
		if (value !== undefined) {
			this.buffer[3] = value;
		} else {
			throw new ParamsError('rate', `Unsupported Polling Rate: ${rate}`);
		}

		return this;
	}

	build(_mode: ConnectionMode): Buffer {
		// In both connection modes, the buffer is the same.
		this.buffer[4] = this.calculateChecksum();
		return this.buffer;
	}

	toString(): string {
		return this.buffer.toString('hex');
	}

	compareWithHexString(value: string): boolean {
		return this.toString() === value;
	}
}
