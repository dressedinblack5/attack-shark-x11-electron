# attack-shark-x11-electron

![Attack Shark X11 Gaming Mouse](assets/shark-x11-electron.png)

[![npm version](https://img.shields.io/npm/v/attack-shark-x11-driver.svg)](https://www.npmjs.com/package/attack-shark-x11-driver)
[![license](https://img.shields.io/npm/l/attack-shark-x11-driver.svg)](https://github.com/HarukaYamamoto0/attack-shark-x11-driver/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)

A TypeScript driver for the **Attack Shark X11 gaming mouse**, providing cross-platform support (focused on Linux) to configure DPI, macros, lighting, and polling rates via USB HID.

This repository is an enhanced version of the original driver created by [HarukaYamamoto0](https://github.com/HarukaYamamoto0), featuring a new integrated User Interface built with **Electron** for easier device configuration.

## Features Added
- 🖥️ **Modern User Interface**: Intuitive management of device settings.

## Core Features
- ✅ **DPI Configuration**: Customizable stages and active stage selection.
- ✅ **Button Remapping**: Fully customizable button behavior.
- ✅ **Macros**: Support for custom macros and templates with timing control.
- ✅ **Lighting Control**: Adjustable modes, speeds, and colors.
- ✅ **Polling Rate**: Configurable from 125 Hz to 1000 Hz.
- ✅ **Battery Status**: Real-time battery monitoring.
- ✅ **Device Reset**: Ability to reset internal device state.
- ✅ **Cross-platform**: Works on Linux, macOS, and Windows.


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

## Installation

You can install this application using pre-built binaries or the AUR.

### AUR Installation (Arch Linux)
If you are using Arch Linux or an Arch-based distribution, you can install the package directly from the AUR using an AUR helper like `yay`:

```bash
yay -S attack-shark-x11-electron
```

### Installation from Binaries
You can find pre-built binaries in the [Releases](https://github.com/dressedinblack5/attack-shark-x11-electron/releases) section.

### AppImage (Portable)
1. Download the `attack-shark-x11-driver-1.2.0.AppImage` file.
2. Make it executable:
   ```bash
   chmod +x attack-shark-x11-driver-1.2.0.AppImage
   ```
3. Run it:
   ```bash
   ./attack-shark-x11-driver-1.2.0.AppImage
   ```

### .deb Package (Debian/Ubuntu/Pop!_OS)
1. Download the `attack-shark-x11-driver_1.2.0_amd64.deb` file.
2. Install it using `apt`:
   ```bash
   sudo apt install ./attack-shark-x11-driver_1.2.0_amd64.deb
   ```

## Building from Source

To build the application from the source code, ensure you have [Bun](https://bun.sh/) installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/dressedinblack5/attack-shark-x11-electron.git
   cd attack-shark-x11-electron
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Build the application:
   ```bash
   bun run package
   ```
   This will compile the application and generate the distribution files in the `dist` folder.

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
