import { DpiBuilder, type StageIndex } from '../driver/protocols/DpiBuilder.js';
import type { AppSettings } from '../storage/settingsManager.js'; // Import AppSettings

export const validateDpiConfig = (config: unknown): AppSettings['dpiConfig'] => {
	// Change return type
	if (typeof config !== 'object' || config === null) {
		throw new Error('Invalid DPI configuration: must be an object');
	}

	const configObj = config as Record<string, unknown>;
	const validated: AppSettings['dpiConfig'] = { ...DpiBuilder.DEFAULT_OPTIONS } as AppSettings['dpiConfig'];

	if (configObj['angleSnap'] !== undefined) {
		if (typeof configObj['angleSnap'] !== 'boolean') throw new Error('Invalid angleSnap: must be a boolean');
		validated.angleSnap = configObj['angleSnap'];
	}

	if (configObj['ripplerControl'] !== undefined) {
		if (typeof configObj['ripplerControl'] !== 'boolean')
			throw new Error('Invalid ripplerControl: must be a boolean');
		validated.ripplerControl = configObj['ripplerControl'];
	}

	if (configObj['dpiValues'] !== undefined) {
		const dpiValues = configObj['dpiValues'];
		if (
			!Array.isArray(dpiValues) ||
			dpiValues.length !== 6 ||
			!dpiValues.every((v) => typeof v === 'number' && v > 0)
		) {
			throw new Error('Invalid dpiValues: must be an array of 6 positive numbers');
		}
		validated.dpiValues = dpiValues as [number, number, number, number, number, number];
	}

	if (configObj['activeStage'] !== undefined) {
		const activeStage = configObj['activeStage'] as number;
		if (![1, 2, 3, 4, 5, 6].includes(activeStage)) {
			throw new Error('Invalid activeStage: must be between 1 and 6');
		}
		validated.activeStage = activeStage as StageIndex;
	}

	return validated;
};
