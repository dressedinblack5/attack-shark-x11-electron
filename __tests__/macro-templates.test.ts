import { describe, expect, it } from 'bun:test';
import { macroTemplates, MacroName, KeyCode, Modifiers } from '../src/main/driver/index.js';

describe('macroTemplates', () => {
	it('should export templates as a record', () => {
		expect(macroTemplates).toBeDefined();
		expect(typeof macroTemplates).toBe('object');
	});

	it('should cover every MacroName key', () => {
		const keys = Object.keys(macroTemplates);
		const enumKeys = Object.values(MacroName);
		expect(keys.length).toBe(enumKeys.length);
		for (const key of keys) {
			expect(enumKeys).toContain(key as MacroName);
		}
	});

	it('each template should be a 3-element MacroTuple', () => {
		for (const tuple of Object.values(macroTemplates)) {
			expect(Array.isArray(tuple)).toBe(true);
			expect(tuple.length).toBe(3);
			expect(typeof tuple[0]).toBe('number');
			expect(typeof tuple[1]).toBe('number');
			expect(typeof tuple[2]).toBe('number');
		}
	});

	it('should have multimedia templates', () => {
		expect(macroTemplates[MacroName.MULTIMEDIA_PLAY_PAUSE]).toBeDefined();
		expect(macroTemplates[MacroName.MULTIMEDIA_VOLUME_PLUS]).toBeDefined();
		expect(macroTemplates[MacroName.MULTIMEDIA_VOLUME_MINUS]).toBeDefined();
		expect(macroTemplates[MacroName.MULTIMEDIA_MUTE]).toBeDefined();
	});

	it('should have shortcut templates', () => {
		expect(macroTemplates[MacroName.SHORTCUT_COPY]).toEqual([0x11, 0x01, KeyCode.C]);
		expect(macroTemplates[MacroName.SHORTCUT_PASTE]).toEqual([0x11, 0x01, KeyCode.V]);
		expect(macroTemplates[MacroName.SHORTCUT_CUT]).toEqual([0x11, 0x01, KeyCode.X]);
		expect(macroTemplates[MacroName.SHORTCUT_REDO]).toEqual([0x11, 0x01, KeyCode.Y]);
		expect(macroTemplates[MacroName.SHORTCUT_SWAP_WINDOW]).toEqual([0x11, 0x04, KeyCode.TAB]);
		expect(macroTemplates[MacroName.SHORTCUT_CLOSE_WINDOW]).toEqual([0x11, 0x04, KeyCode.F4]);
	});

	it('should have browser templates', () => {
		expect(macroTemplates[MacroName.BROWSER_HOME]).toBeDefined();
		expect(macroTemplates[MacroName.BROWSER_REFRESH]).toBeDefined();
		expect(macroTemplates[MacroName.BROWSER_SEARCH]).toBeDefined();
	});

	it('should have global action templates', () => {
		expect(macroTemplates[MacroName.GLOBAL_DPI_CYCLE]).toBeDefined();
		expect(macroTemplates[MacroName.GLOBAL_DPI_PLUS]).toBeDefined();
		expect(macroTemplates[MacroName.GLOBAL_DPI_MINUS]).toBeDefined();
	});

	it('should have custom macro templates', () => {
		expect(macroTemplates[MacroName.CUSTOM_MACRO_LEFT_BUTTON]).toEqual([0x12, 0x00, 0x01]);
		expect(macroTemplates[MacroName.CUSTOM_MACRO_RIGHT_BUTTON]).toEqual([0x12, 0x00, 0x02]);
	});
});

describe('KeyCode enum', () => {
	it('should have standard keyboard key codes', () => {
		expect(KeyCode.A).toBe(0x04);
		expect(KeyCode.B).toBe(0x05);
		expect(KeyCode.C).toBe(0x06);
		expect(KeyCode.ENTER).toBe(0x28);
		expect(KeyCode.SPACE).toBe(0x2c);
	});

	it('should have modifier key codes', () => {
		expect(KeyCode.LCtrl).toBe(0xe0);
		expect(KeyCode.LShift).toBe(0xe1);
		expect(KeyCode.LAlt).toBe(0xe2);
	});
});

describe('Modifiers enum', () => {
	it('should have modifier flag values', () => {
		expect(Modifiers.CTRL).toBe(0x01);
		expect(Modifiers.SHIFT).toBe(0x02);
		expect(Modifiers.ALT).toBe(0x04);
		expect(Modifiers.WIN).toBe(0x08);
	});
});
