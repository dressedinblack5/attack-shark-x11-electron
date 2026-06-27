export { AttackSharkX11 } from './core/AttackSharkX11.js';
export type { BaseProtocolBuilder } from './core/BaseProtocolBuilder.js';
export { CustomMacroBuilder, MouseMacroEvent } from './protocols/CustomMacroBuilder.js';
export { CUSTOM_MACRO_BUTTONS, MacroMode } from '../../shared/macro-types.js';
export type { CustomMacroBuilderOptions } from './protocols/CustomMacroBuilder.js';
export { DpiBuilder } from './protocols/DpiBuilder.js';
export type { DpiBuilderOptions, StageIndex } from './protocols/DpiBuilder.js';
export { MacrosBuilder } from './protocols/MacrosBuilder.js';
export type { MacroBuilderOptions } from './protocols/MacrosBuilder.js';
export { FirmwareAction, KeyCode, MacroName, Modifiers, macroTemplates } from './protocols/MacrosBuilder.js';
export type { MacroTuple } from './protocols/MacrosBuilder.js';
export { PollingRateBuilder, Rate } from './protocols/PollingRateBuilder.js';
export type { PollingRateBuilderOptions } from './protocols/PollingRateBuilder.js';
export { UserPreferencesBuilder, LightMode } from './protocols/UserPreferencesBuilder.js';
export type {
	UserPreferencesBuilderOptions,
	LedSpeed,
	KeyResponse,
	DeepSleepTime,
	SleepTime,
	RGB,
} from './protocols/UserPreferencesBuilder.js';

export { ConnectionMode, Button } from './types.js';
export type {
	ControlTransferIn,
	ControlTransferOut,
	ControlTransferOptions,
	Logger,
	LogLevel,
	DeviceModel,
} from './types.js';
export { DriverError, ParamsError, DeviceError, InterfaceError, TimeoutError } from './errors.js';
