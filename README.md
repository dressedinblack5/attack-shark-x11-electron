# attack-shark-x11-electron (UI Enhanced Version)

![Attack Shark X11 Gaming Mouse](assets/x11-mouse.png)

[![npm version](https://img.shields.io/npm/v/attack-shark-x11-driver.svg)](https://www.npmjs.com/package/attack-shark-x11-driver)
[![license](https://img.shields.io/npm/l/attack-shark-x11-driver.svg)](https://github.com/HarukaYamamoto0/attack-shark-x11-driver/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)

A TypeScript driver for the **Attack Shark X11 gaming mouse**, providing cross-platform support (focused on Linux) to configure DPI, macros, lighting, and polling rates via USB HID.

This repository is an enhanced version of the original driver created by [HarukaYamamoto0](https://github.com/HarukaYamamoto0), featuring a new integrated User Interface built with **Electron** for easier device configuration.

## Features Added
- 🖥️ **Modern User Interface**: Intuitive management of device settings.

## Original Features
- ✅ **DPI Configuration**: Set stages and active stage.
- ✅ **Button Remapping**: Fully customizable button behavior.
- ✅ **Macros**: Support for custom macros and templates.
- ✅ **Lighting Control**: Change modes and speeds.
- ✅ **Polling Rate**: Support for 125 Hz to 1000 Hz.
- ✅ **Battery Status**: Real-time battery monitoring.
- ✅ **Cross-platform**: Works on Linux, macOS, and Windows.

## Installation

```bash
bun add attack-shark-x11-driver
# or
npm install attack-shark-x11-driver
```

## Quick Start

```typescript
import { AttackSharkX11, ConnectionMode, Rate } from 'attack-shark-x11-driver';

const driver = new AttackSharkX11({
	connectionMode: ConnectionMode.Adapter, // or Wired
	delayMs: 300, // Recommended safe delay between packets
});

try {
	await driver.open();

	// Set Polling Rate to 1000Hz (eSports)
	await driver.setPollingRate(Rate.eSports);

	// Configure DPI Stages
	await driver.setDpi({
		dpiValues: [800, 1600, 2400, 3200, 5000, 22000],
		activeStage: 2,
	});

	// Get Battery Level
	const battery = await driver.getBatteryLevel();
	console.log(`Battery: ${battery}%`);
} catch (error) {
	console.error('Driver error:', error);
} finally {
	await driver.close();
}
```

## Linux Setup (udev)

To access the device without root permissions on Linux, you need to create an udev rule:

1. Create the rule file:
    ```bash
    sudo nano /etc/udev/rules.d/99-attack-shark-x11.rules
    ```
2. Add the following lines:
    ```udev
    SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0666", GROUP="plugdev"
    SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0666", GROUP="plugdev"
    ```
3. Reload rules:
    ```bash
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    ```

## Installation from Binaries

You can find pre-built binaries in the [Releases](https://github.com/dressedinblack5/attack-shark-x11-electron/releases) section.

### AppImage (Portable)
1. Download the `.AppImage` file.
2. Make it executable:
   ```bash
   chmod +x Attack-Shark-X11-Driver-*.AppImage
   ```
3. Run it:
   ```bash
   ./Attack-Shark-X11-Driver-*.AppImage
   ```

### .deb Package (Debian/Ubuntu/Pop!_OS)
1. Download the `.deb` file.
2. Install it using `apt`:
   ```bash
   sudo apt install ./Attack-Shark-X11-Driver-*.deb
   ```

## Supported Hardware

| Device           | Mode            | Status     |
|------------------|-----------------|------------|
| Attack Shark X11 | Wired           | Supported  |
| Attack Shark X11 | 2.4GHz wireless | Supported  |
| Attack Shark X11 | Bluetooth       | Not tested |

_Note: Attack Shark R1 might be compatible but hasn't been verified yet._

## Contributing

This project is a reverse-engineering effort. Contributions such as protocol documentation, new features, or testing with different hardware are very welcome.

- **Protocol Docs**: See `docs/` for packet analysis.
- **Tools used**: Wireshark, USBPcap.

## License

MIT © [HarukaYamamoto0](https://github.com/HarukaYamamoto0)

---

_Disclaimer: This project is not affiliated with Attack Shark. Use at your own risk._
