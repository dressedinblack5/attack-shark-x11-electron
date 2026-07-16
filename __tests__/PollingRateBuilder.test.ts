import { describe, expect, it, vi } from 'bun:test';
vi.mock('usb', () => ({ usb: { findDeviceByIds: vi.fn() } }));
import { PollingRateBuilder, Rate } from '../src/main/driver/protocols/PollingRateBuilder.js';
import { ConnectionMode } from '../src/main/driver/index.js';

describe('PollingRateBuilder', () => {
	it('should initialize with default buffer', () => {
		const builder = new PollingRateBuilder();
		expect(builder.toString()).toBe('06090101fe00000000');
	});

	const RATES: Array<[string, Rate, string]> = [
		['125Hz', Rate.powerSaving, '06090108f700000000'],
		['250Hz', Rate.office, '06090104fb00000000'],
		['500Hz', Rate.gaming, '06090102fd00000000'],
		['1000Hz', Rate.eSports, '06090101fe00000000'],
	];
	for (const [label, rate, expected] of RATES) {
		it(`should encode ${label}`, () => {
			const builder = new PollingRateBuilder({ rate });
			builder.build(ConnectionMode.Wired);
			expect(builder.toString()).toBe(expected);
		});
	}

	it('should have correct USB control transfer parameters', () => {
		const builder = new PollingRateBuilder();
		expect(builder.bmRequestType).toBe(0x21);
		expect(builder.bRequest).toBe(0x09);
		expect(builder.wValue).toBe(0x0306);
		expect(builder.wIndex).toBe(2);
	});

	it('should return the buffer when build() is called', () => {
		const builder = new PollingRateBuilder();
		const buffer = builder.build(ConnectionMode.Wired);
		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.length).toBe(9);
	});

	it('should correctly handle padding bytes', () => {
		const builder = new PollingRateBuilder();
		// Bytes 5, 6, 7, 8 should be 0x00
		expect(builder.buffer[5]).toBe(0x00);
		expect(builder.buffer[6]).toBe(0x00);
		expect(builder.buffer[7]).toBe(0x00);
		expect(builder.buffer[8]).toBe(0x00);
	});

	it('should create an instance for a specific rate using constructor options', () => {
		const builder = new PollingRateBuilder({ rate: Rate.gaming });
		expect(builder.buffer[3]).toBe(0x02); // 500Hz
	});

	it('should re-calculate checksum when polling rate is changed', () => {
		const builder = new PollingRateBuilder();

		builder.setRate(Rate.office); // 0x04
		builder.build(ConnectionMode.Adapter);
		expect(builder.buffer[4]).toBe(0xfb); // 0xFF - 0x04

		builder.setRate(Rate.gaming); // 0x02
		builder.build(ConnectionMode.Adapter);
		expect(builder.buffer[4]).toBe(0xfd); // 0xFF - 0x02
	});
});
