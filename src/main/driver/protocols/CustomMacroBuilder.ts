import { BaseBuilder } from '../core/BaseProtocolBuilder.js';
import { ParamsError } from '../errors.js';
import { Button, type ConnectionMode } from '../types.js';
import { type KeyCode, MacroName, macroTemplates, type MacroTuple } from '../../../shared/macro-templates.js';
import { type MacroBuilderOptions, MacrosBuilder } from './MacrosBuilder.js';
import { MacroMode, CUSTOM_MACRO_BUTTONS } from '../../../shared/macro-types.js';

// noinspection JSUnusedGlobalSymbols
export enum MouseMacroEvent {
	LEFT_CLICK = 0xf1,
	RIGHT_CLICK = 0xf2,
	MIDDLE_CLICK = 0xf3,
	FORWARD_CLICK = 0xf5,
	BACKWARD_CLICK = 0xf4,
}

export interface CustomMacroBuilderOptions {
	playOptions?: {
		mode?: MacroMode;
		times?: number;
	};
	targetButton?: Button;
	// ⚠️ Use these parameters unless you are certain that this class works; I do not recommend using them directly ⚠️
	macroEvents?: number[];
	macrosBuilder?: MacrosBuilder | MacroBuilderOptions;
}

/**
 * Builder for creating complex custom macros (Report 0x0309).
 * Allows key sequences with specific delays and different playback modes.
 */
export class CustomMacroBuilder extends BaseBuilder {
	public static readonly MAX_MACRO_EVENTS = 47;
	public static readonly DEFAULT_OPTIONS: CustomMacroBuilderOptions = {
		playOptions: {
			mode: MacroMode.THE_NUMBER_OF_TIME_TO_PLAY,
			times: 1,
		},
	};
	readonly buffer: Buffer = Buffer.alloc(0);
	readonly wValue: number = 0x0309;
	private defineMacroButton: MacrosBuilder;
	private readonly secondPacket: Buffer = Buffer.alloc(64);
	private readonly thirdPacket: Buffer = Buffer.alloc(64);
	private readonly fourthPacket: Buffer = Buffer.alloc(64);
	private readonly macroEvents: number[] = [];

	constructor(options?: CustomMacroBuilderOptions) {
		super();
		this.secondPacket[0] = 0x09;
		this.secondPacket[1] = 0x40;
		this.secondPacket[3] = 0x00; // Page 0
		this.secondPacket[4] = MacroMode.THE_NUMBER_OF_TIME_TO_PLAY;
		this.secondPacket[8] = 0x01;

		this.thirdPacket[0] = 0x09;
		this.thirdPacket[1] = 0x40;
		this.thirdPacket[3] = 0x01; // Page 1

		this.fourthPacket[0] = 0x09;
		this.fourthPacket[1] = 0x0c;
		this.fourthPacket[3] = 0x02; // Page 2

		const config = { ...CustomMacroBuilder.DEFAULT_OPTIONS, ...options };

		this.defineMacroButton = new MacrosBuilder();
		if (config.macrosBuilder !== undefined)
			this.defineMacroButton =
				config.macrosBuilder instanceof MacrosBuilder
					? config.macrosBuilder
					: new MacrosBuilder(config.macrosBuilder);
		if (config.playOptions !== undefined) this.setPlayOptions(config.playOptions.mode, config.playOptions.times);
		if (config.targetButton !== undefined) this.setTargetButton(config.targetButton);
		if (config.macroEvents && config.macroEvents.length > 0) this.macroEvents.push(...config.macroEvents);
	}

	/**
	 * Adds a key or button event to the macro.
	 * @param key Key code (KeyCode) or mouse event (MouseMacroEvent).
	 * @param delayMs Delay after the event in milliseconds.
	 * @param isRelease If true, the event represents releasing the key (KeyUp).
	 */
	addEvent(key: KeyCode | MouseMacroEvent | number, delayMs: number = 10, isRelease: boolean = false): this {
		const { eventDelay, extraDelay } = this.handleDelay(delayMs);
		this.pushEventBytes(isRelease ? 0x80 | eventDelay : eventDelay, key);
		if (extraDelay) {
			this.pushEventBytes(extraDelay, 0x03);
		}
		return this;
	}

	pushEventBytes(byte1: number, byte2: number): this {
		this.macroEvents.push(byte1, byte2);
		return this;
	}

	/**
	 * Sets the playback options for the macro.
	 * @param mode Execution mode (repeat N times, until key press, or while held).
	 * @param times Number of repetitions (used only in THE_NUMBER_OF_TIME_TO_PLAY mode).
	 */
	setPlayOptions(mode: MacroMode = MacroMode.THE_NUMBER_OF_TIME_TO_PLAY, times?: number): this {
		this.secondPacket[4] = mode;

		if (!times) {
			this.secondPacket[8] = 0x01;
			return this;
		}
		if (times < 1 || times > 255) {
			throw new ParamsError(
				'times',
				'The number of loops must be at least 1 (0x01) and at most 255 (0xFF), regardless of the mode',
			);
		}

		this.secondPacket[8] = times;
		return this;
	}

	/**
	 * Defines which mouse button this custom macro will be assigned to.
	 * @param button Mouse button.
	 * @param macrosBuilder Optionally, an existing macros builder to avoid overwriting other settings.
	 */
	setTargetButton(button: Button, macrosBuilder?: MacrosBuilder | MacroBuilderOptions): this {
		if (macrosBuilder !== undefined) {
			this.defineMacroButton =
				macrosBuilder instanceof MacrosBuilder ? macrosBuilder : new MacrosBuilder(macrosBuilder);
		}
		let buttonMap: CUSTOM_MACRO_BUTTONS;
		let macroTemplate: MacroTuple;

		switch (Number(button)) {
			case Button.LEFT:
				buttonMap = CUSTOM_MACRO_BUTTONS.LEFT_BUTTON;
				macroTemplate = macroTemplates[MacroName.CUSTOM_MACRO_LEFT_BUTTON];
				break;
			case Button.RIGHT:
				buttonMap = CUSTOM_MACRO_BUTTONS.RIGHT_BUTTON;
				macroTemplate = macroTemplates[MacroName.CUSTOM_MACRO_RIGHT_BUTTON];
				break;
			case Button.MIDDLE:
				buttonMap = CUSTOM_MACRO_BUTTONS.MIDDLE_BUTTON;
				macroTemplate = macroTemplates[MacroName.CUSTOM_MACRO_MIDDLE_BUTTON];
				break;
			case Button.FORWARD:
				buttonMap = CUSTOM_MACRO_BUTTONS.EXTRA_BUTTON_4;
				macroTemplate = macroTemplates[MacroName.CUSTOM_MACRO_EXTRA_BUTTON_4];
				break;
			case Button.BACKWARD:
				buttonMap = CUSTOM_MACRO_BUTTONS.EXTRA_BUTTON_5;
				macroTemplate = macroTemplates[MacroName.CUSTOM_MACRO_EXTRA_BUTTON_5];
				break;
			default:
				throw new ParamsError('button', `Unsupported button for custom macro: ${button}`);
		}

		this.defineMacroButton.setMacro(button, macroTemplate);

		this.secondPacket[2] = buttonMap;
		this.thirdPacket[2] = buttonMap;
		this.fourthPacket[2] = buttonMap;

		return this;
	}

	calculateChecksum(): number {
		let sum = 0;

		for (let i = 8; i < this.secondPacket.length; i++) {
			sum += this.secondPacket[i] ?? 0x00;
		}

		for (let i = 4; i < this.thirdPacket.length; i++) {
			sum += this.thirdPacket[i] ?? 0x00;
		}
		return sum;
	}

	build(mode: ConnectionMode): [Buffer, Buffer, Buffer, Buffer] {
		const eventCount = Math.floor(this.macroEvents.length / 2);
		this.secondPacket[29] = Math.min(eventCount, CustomMacroBuilder.MAX_MACRO_EVENTS);

		// Clear events area first
		this.secondPacket.fill(0, 30);
		this.thirdPacket.fill(0, 4);

		let eventByteIndex = 0;

		// Fill Second Packet (17 events max, 34 bytes)
		for (let i = 30; i < 64 && eventByteIndex < this.macroEvents.length; i++) {
			this.secondPacket[i] = this.macroEvents[eventByteIndex++] ?? 0x00;
		}

		// Fill the Third Packet (30 events max, 60 bytes)
		for (let i = 4; i < 64 && eventByteIndex < this.macroEvents.length; i++) {
			this.thirdPacket[i] = this.macroEvents[eventByteIndex++] ?? 0x00;
		}

		const checksum = this.calculateChecksum();

		this.fourthPacket[10] = (checksum >> 8) & 0xff;
		this.fourthPacket[11] = checksum & 0xff;

		return [this.defineMacroButton.build(mode), this.secondPacket, this.thirdPacket, this.fourthPacket];
	}

	private handleDelay(delayMs: number): {
		eventDelay: number;
		extraDelay?: number;
	} {
		const MAX_DELAY = 51000;
		const clampedMs = Math.min(delayMs, MAX_DELAY);

		const computeByte = (ms: number): number => 2 * Math.floor((ms + 5) / 20) + 1;

		if (clampedMs <= 1070) {
			return { eventDelay: computeByte(clampedMs) };
		} else {
			const extraUnits = Math.min(Math.floor(clampedMs / 200), 255);
			const rem = clampedMs % 200;
			return { eventDelay: computeByte(rem), extraDelay: extraUnits };
		}
	}
}
