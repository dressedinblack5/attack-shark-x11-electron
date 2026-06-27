import type { BaseProtocolBuilder } from '../core/BaseProtocolBuilder.js';
import { ParamsError } from '../errors.js';
import { ConnectionMode } from '../types.js';

/**
 * Enum representing different light modes for a device or application.
 *
 * Each mode is associated with a unique hexadecimal value to facilitate
 * identification and control.
 *
 * Enum Members:
 * - `Off`: Represents the state where the light is turned off.
 * - `Static`: Represents a constant, unchanging light mode.
 * - `Breathing`: Represents a light mode that dims and brightens cyclically.
 * - `Neon`: Represents a neon-style light mode with specific effects.
 * - `ColorBreathing`: Represents a breathing light mode with changing colors.
 * - `StaticDpi`: Represents a static light mode associated with DPI settings.
 * - `BreathingDpi`: Represents a breathing light mode associated with DPI settings.
 */
export enum LightMode {
	Off = 0x00,
	Static = 0x10,
	Breathing = 0x20,
	Neon = 0x30,
	ColorBreathing = 0x40,
	StaticDpi = 0x50,
	BreathingDpi = 0x60,
}

/**
 * Represents configuration options for building user preferences.
 */
export interface UserPreferencesBuilderOptions {
	/** Light mode enum */
	lightMode?: LightMode;

	/** RGB color (0–255 each channel) */
	rgb?: RGB;

	/** LED speed (1–5) */
	ledSpeed?: LedSpeed;

	/** Sleep time in minutes (0.5–30, step 0.5) */
	sleepTime?: SleepTime;

	/** Deep sleep time in minutes (1–60) */
	deepSleepTime?: DeepSleepTime;

	/** Key response in ms (4–50, step 2) */
	keyResponse?: KeyResponse;
}

/**
 * Represents a color in the RGB color model.
 *
 * The RGB model describes colors through their red, green, and blue components.
 * Each component is represented as a numerical value.
 *
 * The `r` property corresponds to the red component,
 * the `g` property corresponds to the green component,
 * and the `b` property corresponds to the blue component.
 */
export interface RGB {
	r: number;
	g: number;
	b: number;
}

/**
 * Defines the allowed speed levels for an LED.
 *
 * This type represents the range of possible speed values for an LED,
 * which can be set to one of the following levels:
 * 1 - Lowest speed
 * 2 - Low speed
 * 3 - Medium speed
 * 4 - High speed
 * 5 - Highest speed
 *
 * It is commonly used to control animations or blinking intervals for LED components.
 */
export type LedSpeed = 1 | 2 | 3 | 4 | 5;

/**
 * Represents a KeyResponse, which is a union type of allowed numeric values.
 *
 * The KeyResponse type is strictly defined as one of the following values:
 * 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
 * 32, 34, 36, 38, 40, 42, 44, 46, 48, 50.
 *
 * This type is typically used to define a finite set of acceptable numeric values
 * for specific use cases or configurations.
 */
export type KeyResponse =
	| 4
	| 6
	| 8
	| 10
	| 12
	| 14
	| 16
	| 18
	| 20
	| 22
	| 24
	| 26
	| 28
	| 30
	| 32
	| 34
	| 36
	| 38
	| 40
	| 42
	| 44
	| 46
	| 48
	| 50;

/**
 * Deep sleep time in minutes (1–60)
 */
export type DeepSleepTime = number;

/**
 * Sleep time in minutes (0.5–30, step 0.5)
 */
export type SleepTime = number;

/**
 * Builder for user preferences and configurations (Report 0x0305)
 * Handles Light Mode, Deep Sleep, Sleep, Key Response and RGB settings.
 */
export class UserPreferencesBuilder implements BaseProtocolBuilder {
	public static readonly DEFAULT_OPTIONS: UserPreferencesBuilderOptions = {
		lightMode: LightMode.Off,
		rgb: { r: 0, g: 255, b: 0 },
		ledSpeed: 3,
		sleepTime: 0.5,
		deepSleepTime: 10,
		keyResponse: 4,
	};
	readonly buffer: Buffer;
	public readonly bmRequestType: number = 0x21;
	public readonly bRequest: number = 0x09;
	public readonly wValue: number = 0x0305;
	public readonly wIndex: number = 2;
	private deepSleepMinutes: number = 10;
	private keyResponseMs: number = 4;
	private ledSpeed: number = 0x03;

	constructor(options?: UserPreferencesBuilderOptions) {
		this.buffer = Buffer.alloc(15);
		this.buffer[0] = 0x05; // header
		this.buffer[1] = 0x0f; // header
		this.buffer[2] = 0x01; // header
		this.buffer[3] = 0x00; // Default color mode (Off)
		this.buffer[4] = 0x03; // Default bucket (0) << 4 | default ledSpeed (3)
		this.buffer[5] = 0xa8; // Default deep sleep (10 min)
		this.buffer[6] = 0x00; // RGB: R
		this.buffer[7] = 0xff; // RGB: G
		this.buffer[8] = 0x00; // RGB: B
		this.buffer[9] = 0x01; // Default sleep (0.5 min)
		this.buffer[10] = 0x04; // Default key response (8ms)
		this.buffer[11] = 0x01;
		this.buffer[12] = 0xaf; // Initial checksum

		const config = { ...UserPreferencesBuilder.DEFAULT_OPTIONS, ...options };

		if (config.lightMode !== undefined) this.setLightMode(config.lightMode);
		if (config.deepSleepTime !== undefined) this.setDeepSleep(config.deepSleepTime);
		if (config.ledSpeed !== undefined) this.setLedSpeed(config.ledSpeed);
		if (config.rgb !== undefined) this.setRgb(config.rgb);
		if (config.keyResponse !== undefined) this.setKeyResponse(config.keyResponse);
		if (config.sleepTime !== undefined) this.setSleep(config.sleepTime);
	}

	/**
	 * Sets the light mode for the current object and updates the internal state accordingly.
	 *
	 * @param {LightMode} mode - The desired light mode to be set.
	 * @return {this} The instance of the current object for method chaining.
	 */
	setLightMode(mode: LightMode): this {
		this.buffer[3] = mode;
		this.updateIndex11();
		return this;
	}

	/**
	 * Sets the deep sleep timer
	 * @param minutes Time in minutes (1-60)
	 */
	setDeepSleep(minutes: DeepSleepTime): this {
		if (minutes < 1 || minutes > 60) {
			throw new ParamsError('deepSleepTime', 'the minutes of deep sleep should be in the range of 1 to 60');
		}
		this.deepSleepMinutes = minutes;
		this.updateIndex4();
		this.buffer[5] = (0x08 + minutes * 0x10) & 0xff;
		return this;
	}

	/**
	 * Sets the LED animation speed
	 * @param speed Speed level (1-5, where 5 is fastest and 1 is slowest)
	 */
	setLedSpeed(speed: LedSpeed): this {
		if (speed < 1 || speed > 5) {
			throw new ParamsError('ledSpeed', 'LED speed must be between 1 and 5');
		}
		this.ledSpeed = speed;
		this.updateIndex4();
		return this;
	}

	/**
	 * Sets the RGB color values for the current buffer.
	 *
	 * @param {RGB} rgb - An object containing the red (r), green (g), and blue (b) color values to be set, where each value is an integer in the range 0-255.
	 * @return {this} The current instance, allowing for method chaining.
	 */
	setRgb(rgb: RGB): this {
		this.buffer[6] = rgb.r & 0xff;
		this.buffer[7] = rgb.g & 0xff;
		this.buffer[8] = rgb.b & 0xff;
		this.updateIndex11();
		return this;
	}

	/**
	 * Sets the sleep timer (normal sleep)
	 * @param minutes Time in minutes (0.5 to 30, step example: 0.5, 1, 1.5, 2.5, etc.)
	 */
	setSleep(minutes: SleepTime): this {
		if (minutes < 0.5 || minutes > 30) {
			throw new ParamsError('sleepTime', 'Invalid sleep value (0.5–30 min)');
		}
		this.buffer[9] = Math.round(minutes * 2);
		return this;
	}

	/**
	 * Sets the key response time (debounce)
	 * @param ms Time in milliseconds (4-50ms, must be even)
	 */
	setKeyResponse(ms: KeyResponse): this {
		if (ms < 4 || ms > 50 || ms % 2 !== 0) {
			throw new ParamsError('keyResponse', 'Invalid value (use 4–50ms, step 2)');
		}

		this.keyResponseMs = ms;
		this.buffer[10] = (ms - 4) / 2 + 0x02;
		return this;
	}

	calculateChecksum(): number {
		let checksum = 0;
		// Checksum is the sum of bytes from index 3 to 10
		for (let i = 3; i <= 10; i++) {
			checksum = (checksum + (this.buffer[i] ?? 0x00)) & 0xff;
		}
		return checksum;
	}

	build(mode: ConnectionMode): Buffer {
		if (mode === ConnectionMode.R1Wired) {
			const ds = this.deepSleepMinutes;
			this.buffer[4] = (0x03 | ((ds >> 4) & 0x0f)) & 0xff;
			this.buffer[5] = (0x08 | ((ds & 0x0f) << 4)) & 0xff;
			this.buffer[6] = 0x00;
			this.buffer[7] = 0x00;
			this.buffer[8] = 0xff;
			this.buffer[10] = this.keyResponseMs / 2;
			this.buffer[11] = 0x01;
			const deepSleepLo = ds & 0x0f;
			const deepSleepHi = (ds >> 4) & 0x0f;
			this.buffer[12] =
				(((deepSleepLo + deepSleepHi) & 0x0f) << 4) + 0x0a + (this.buffer[9] ?? 0) + (this.buffer[10] ?? 0);
		} else {
			this.buffer[12] = this.calculateChecksum();
		}
		if (mode === ConnectionMode.Wired || mode === ConnectionMode.R1Wired) return this.buffer.subarray(0, 13);
		else return this.buffer;
	}

	toString(): string {
		return this.buffer.toString('hex');
	}

	private updateIndex4(): void {
		const bucket = Math.floor((this.deepSleepMinutes - 1) / 16);
		// Scale is inverted in hardware: User 1-5 -> Hardware 5-1
		const hardwareSpeed = 6 - this.ledSpeed;
		// high nibble = deep sleep bucket, low nibble = led speed
		this.buffer[4] = ((bucket << 4) | (hardwareSpeed & 0x0f)) & 0xff;
	}

	private updateIndex11(): void {
		const mode = this.buffer[3] ?? LightMode.Off;
		const r = this.buffer[6] ?? 0x00;
		const g = this.buffer[7] ?? 0xff;
		const b = this.buffer[8] ?? 0x00;

		let count = 0;
		if (r >= 0x64) count++;
		if (g >= 0x64) count++;
		if (b >= 0x64) count++;

		if (mode === LightMode.BreathingDpi) {
			this.buffer[11] = (count + 1) & 0xff;
		} else {
			this.buffer[11] = count & 0xff;
		}
	}
}
