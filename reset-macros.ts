import { AttackSharkX11, ConnectionMode } from './src/main/driver/index.js';

const driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter });

try {
	await driver.open();
	console.log('Connected!');

	console.log('Resetting Mouse Internal State...');
	await driver.sendInternalStateResetReportBuilder();
	console.log('Reset command sent!');
} catch (e) {
	console.error('Error:', e);
} finally {
	await driver.close();
}
