import { AttackSharkX11, ConnectionMode } from './src/main/driver/index.js';

const driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter });

try {
	await driver.open();
	console.log('Connected!');

	// Read DPI (Report 0x0304)
	console.log('Reading DPI...');
	const dpiBuffer = await driver.controlTransfer({
		bmRequestType: 0xa1,
		bRequest: 0x01,
		wValue: 0x0304,
		wIndex: 2,
		data: 56,
	});
	console.log('DPI Buffer:', dpiBuffer.toString('hex'));

	// Read User Preferences (Report 0x0305)
	console.log('Reading User Preferences...');
	const prefsBuffer = await driver.controlTransfer({
		bmRequestType: 0xa1,
		bRequest: 0x01,
		wValue: 0x0305,
		wIndex: 2,
		data: 15,
	});
	console.log('Preferences Buffer:', prefsBuffer.toString('hex'));
} catch (e) {
	console.error('Error:', e);
} finally {
	await driver.close();
}
