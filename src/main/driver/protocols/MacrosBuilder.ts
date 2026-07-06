import { BaseBuilder } from '../core/BaseProtocolBuilder.js';
import { ParamsError } from '../errors.js';
import { Button, type ConnectionMode } from '../types.js';
import {
	FirmwareAction,
	KeyCode,
	MacroName,
	Modifiers,
	macroTemplates,
	type MacroTuple,
} from '../../../shared/macro-templates.js';

enum InternalButtons {
	LEFT = 0,
	RIGHT = 1,
	MIDDLE = 2,
	FORWARD = 3,
	BACKWARD = 4,
	DPI = 6,
	SCROLL_UP = 16,
	SCROLL_DOWN = 17,
}

const internalButtonsMap: Record<Button, InternalButtons> = {
	[Button.LEFT]: InternalButtons.LEFT,
	[Button.RIGHT]: InternalButtons.RIGHT,
	[Button.MIDDLE]: InternalButtons.MIDDLE,
	[Button.FORWARD]: InternalButtons.FORWARD,
	[Button.BACKWARD]: InternalButtons.BACKWARD,
	[Button.DPI]: InternalButtons.DPI,
	[Button.SCROLL_UP]: InternalButtons.SCROLL_UP,
	[Button.SCROLL_DOWN]: InternalButtons.SCROLL_DOWN,
};

const BUTTON_OFFSET: Record<InternalButtons, number> = {
	[InternalButtons.LEFT]: 3,
	[InternalButtons.RIGHT]: 6,
	[InternalButtons.MIDDLE]: 9,
	[InternalButtons.FORWARD]: 21,
	[InternalButtons.BACKWARD]: 24,
	[InternalButtons.DPI]: 18,
	[InternalButtons.SCROLL_UP]: 51,
	[InternalButtons.SCROLL_DOWN]: 54,
};

export interface MacroBuilderOptions {
	left?: MacroTuple;
	right?: MacroTuple;
	middle?: MacroTuple;
	forward?: MacroTuple;
	backward?: MacroTuple;
	dpi?: MacroTuple;
	scrollUp?: MacroTuple;
	scrollDown?: MacroTuple;
}

export class MacrosBuilder extends BaseBuilder {
	public static readonly DEFAULT_MACROS: MacroBuilderOptions = {
		left: macroTemplates[MacroName.GLOBAL_LEFT_CLICK],
		right: macroTemplates[MacroName.GLOBAL_RIGHT_CLICK],
		middle: macroTemplates[MacroName.GLOBAL_MIDDLE],
		forward: macroTemplates[MacroName.GLOBAL_FORWARD],
		backward: macroTemplates[MacroName.GLOBAL_BACKWARD],
	};

	readonly buffer: Buffer = Buffer.alloc(59);
	readonly wValue: number = 0x0308;

	constructor(options?: MacroBuilderOptions) {
		super();
		this.reset();
		if (options) {
			this.applyOptions(options);
		}
	}

	private initializeBuffer(): void {
		this.buffer.fill(0);

		this.buffer[0] = 0x08;
		this.buffer[1] = 0x3b;
		this.buffer[2] = 0x01;

		for (let i = 3; i <= 54; i += 3) {
			this.buffer[i] = 0x01;
			this.buffer[i + 1] = 0x00;
			this.buffer[i + 2] = 0x00;
		}

		this.buffer[18] = 0x0d;
		this.buffer[51] = 0x09;
		this.buffer[54] = 0x0a;
	}

	private applyOptions(options: MacroBuilderOptions): void {
		if (options.left !== undefined) this.setMacro(Button.LEFT, options.left);
		if (options.right !== undefined) this.setMacro(Button.RIGHT, options.right);
		if (options.middle !== undefined) this.setMacro(Button.MIDDLE, options.middle);
		if (options.forward !== undefined) this.setMacro(Button.FORWARD, options.forward);
		if (options.backward !== undefined) this.setMacro(Button.BACKWARD, options.backward);
		if (options.dpi !== undefined) this.setMacro(Button.DPI, options.dpi);
		if (options.scrollUp !== undefined) this.setMacro(Button.SCROLL_UP, options.scrollUp);
		if (options.scrollDown !== undefined) this.setMacro(Button.SCROLL_DOWN, options.scrollDown);
	}

	public reset(): this {
		this.initializeBuffer();
		this.applyOptions(MacrosBuilder.DEFAULT_MACROS);
		return this;
	}

	setMacro(button: Button, macro: MacroTuple): this {
		const [firmwareAction = FirmwareAction.DISABLE_BUTTON, modifier = Modifiers.NONE, keyCode = KeyCode.NONE] =
			macro;

		const internalButton = internalButtonsMap[button];

		const offset = BUTTON_OFFSET[internalButton];
		if (offset === undefined) {
			throw new ParamsError('button', `Invalid button identifier: ${button}`);
		}

		this.buffer[offset] = firmwareAction;
		this.buffer[offset + 1] = modifier;
		this.buffer[offset + 2] = keyCode;

		return this;
	}

	calculateChecksum(): number {
		let sum = 0;

		for (let i = 2; i < this.buffer.length - 1; i++) {
			sum = (sum + (this.buffer[i] ?? 0x00)) & 0xff;
		}

		return (sum - 1) & 0xff;
	}

	build(_mode: ConnectionMode): Buffer {
		this.buffer[58] = this.calculateChecksum();
		return this.buffer;
	}
}

export { FirmwareAction, KeyCode, MacroName, Modifiers, macroTemplates, type MacroTuple };
