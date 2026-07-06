import type { Buffer } from 'buffer';
import type { ConnectionMode } from '../types.js';

/**
 * Shared builder base: USB control-transfer fields + toString().
 * Each protocol builder extends this instead of re-declaring the same fields.
 */
export abstract class BaseBuilder {
	readonly bmRequestType: number = 0x21;
	readonly bRequest: number = 0x09;
	readonly wIndex: number = 2;

	abstract readonly buffer: Buffer;
	abstract readonly wValue: number;
	abstract build(mode: ConnectionMode): Buffer | Buffer[];

	toString(): string {
		return this.buffer.toString('hex');
	}
}
