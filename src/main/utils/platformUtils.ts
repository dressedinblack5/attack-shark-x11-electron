import { app } from 'electron';

export function getUserDataPath(): string {
	return app.getPath('userData');
}
