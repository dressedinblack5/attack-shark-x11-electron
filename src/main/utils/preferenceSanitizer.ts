import type { UserPreferencesBuilderOptions } from '../driver/protocols/UserPreferencesBuilder.js';

export const sanitizePreferences = (prefs: UserPreferencesBuilderOptions): UserPreferencesBuilderOptions => {
	const sanitized = { ...prefs };

	// Ensure ledSpeed is between 1 and 5
	// If it's outside the range (e.g. 254 from bad data), force a safe default
	if (typeof sanitized.ledSpeed !== 'number' || sanitized.ledSpeed < 1 || sanitized.ledSpeed > 5) {
		sanitized.ledSpeed = 3;
	}

	// Ensure deepSleepTime is between 1 and 60
	if (typeof sanitized.deepSleepTime !== 'number' || sanitized.deepSleepTime < 1 || sanitized.deepSleepTime > 60) {
		sanitized.deepSleepTime = 10;
	}

	// Ensure keyResponse is within bounds (4-50) and step 2
	if (
		typeof sanitized.keyResponse !== 'number' ||
		sanitized.keyResponse < 4 ||
		sanitized.keyResponse > 50 ||
		sanitized.keyResponse % 2 !== 0
	) {
		sanitized.keyResponse = 8;
	}

	return sanitized;
};
