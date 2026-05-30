# Copilot Instructions for attack-shark-x11-electron

This is an Electron desktop application that provides a driver and UI for the Attack Shark X11 gaming mouse. The app handles USB communication with the device to configure DPI, macros, lighting, polling rates, and other settings.

## Quick Commands

- **Install dependencies**: `bun install`
- **Start dev server**: `bun run dev` (runs with hot reload)
- **Build app**: `bun run build` (compiles TypeScript)
- **Package for distribution**: `bun run package` (builds + creates AppImage/deb)
- **Run tests**: `bun test` (or `bun test __tests__/DpiBuilder.test.ts` for a single test)
- **Lint**: `bunx eslint . --ext .ts --cache --cache-strategy content`
- **Lint fix**: `bunx eslint . --ext .ts --fix --cache --cache-strategy content`
- **Format check**: `bunx prettier --check . --cache --cache-strategy content`
- **Format fix**: `bunx prettier --write . --cache --cache-strategy content`
- **Type check**: `electron-vite typecheck`

## Architecture Overview

### Directory Structure
```
src/
├── main/                      # Electron main process & driver logic
│   ├── driver/               # Core USB driver
│   │   ├── core/            # AttackSharkX11 main class, BaseProtocolBuilder
│   │   ├── protocols/       # Protocol builders (Dpi, Macros, CustomMacro, PollingRate, UserPreferences)
│   │   ├── tables/          # DPI encoding maps
│   │   ├── logger/          # Logger interface and implementations
│   │   ├── errors.ts        # Custom error types
│   │   └── types.ts         # Enums and interfaces (ConnectionMode, Button, Logger, etc.)
│   ├── storage/             # Profile persistence (profileManager.ts)
│   ├── utils/               # Validation, preference sanitization, USB helpers
│   └── index.ts             # Electron app setup & IPC handlers
├── preload/                  # Preload script (IPC bridge)
└── renderer/src/            # Vue 3 UI (components, composables, stores)
```

### Key Architecture Patterns

**Protocol Builder Pattern**: Each device setting (DPI, macros, polling rate, etc.) has a dedicated builder class that:
- Constructs USB control transfer buffers
- Implements the `BaseProtocolBuilder` interface with `build()`, `toString()`, and checksum methods
- Takes a `ConnectionMode` in `build(mode)` to handle Wired vs. Adapter differences

**Connection Modes**:
- `ConnectionMode.Adapter` (0xfa60): Wireless 2.4GHz adapter
- `ConnectionMode.Wired` (0xfa55): USB wired connection
- Adapters use slightly different buffer sizes (some builders add extra padding)

**Main Driver Class (`AttackSharkX11`)**: 
- Manages USB device lifecycle (open/close)
- Uses Node.js `usb` package for HID communication
- Emits events: `batteryChange`, `error`
- Accepts optional custom logger and inter-packet delay (default 250ms to prevent lockup)
- IPC handlers in main/index.ts expose async methods to the renderer process

**USB Transfer Parameters**:
- `bmRequestType`: 0x21 for most operations (standard for device-to-host transfers)
- `bRequest`: 0x09 (SET_REPORT)
- `wValue`: varies by protocol (e.g., 0x0304 for DPI)
- `wIndex`: always 2 (HID interface)

## Key Conventions

### Code Style
- **Indentation**: Tabs (4 spaces per tab, enforced by ESLint)
- **Line length**: Max 120 characters (with exceptions for URLs, strings, templates)
- **Type imports**: Always use `import type { X } from 'module'` (enforced)
- **Variables**: `const` by default, `let` only when reassignment needed
- **Enums**: Prefer over unions for type definitions
- **Return types**: Explicit return types required on all functions (warn)

### Error Handling
- Custom error types in `src/main/driver/errors.ts` (DriverError, DeviceError, ControlTransferError, etc.)
- Use specific error types rather than generic Error
- Throw errors from invalid configurations (e.g., unsupported DPI values)

### Testing
- Tests live in `__tests__/` using Bun's test runner (`describe`, `it`, `expect` from `bun:test`)
- Test files named `*.test.ts` matching their source module (e.g., `DpiBuilder.test.ts`)
- Each builder class has comprehensive test coverage for buffer generation and checksum calculation
- Run individual tests: `bun test __tests__/DpiBuilder.test.ts`

### Buffer Format Conventions
- All protocol buffers use specific hex formats documented in `docs/`
- Checksums are 2-byte values (high byte at offset, low byte at offset+1)
- DPI values mapped to single bytes via lookup table in `src/main/driver/tables/dpi-map.ts`
- Angle snap and rippler control stored as boolean flags (0x00/0x01)

### Dependency Injection
- Logger is injected via constructor options (implements `Logger` interface)
- Allows custom logging implementations without modifying driver code
- Default: `ConsoleLogger` if not provided

### Vue 3 & Pinia
- Store state in Pinia for reactive device settings
- Composables in `src/renderer/src/composables/` (e.g., `useDebounce`)
- IPC calls from renderer use preload bridge defined in `src/preload/index.ts`

## Protocol Documentation

Detailed USB protocol specifications are in `docs/`:
- `dpi-protocol.md` - DPI configuration packet format
- `polling-rate-protocol.md` - Polling rate settings (125-1000 Hz)
- `user-preferences-protocol.md` - LED modes, sleep settings, color
- `custom-macro-protocol.md` - Custom macro recording format
- `battery-status.md` - Battery level monitoring
- `internal-state-reset-protocol.md` - Device reset packets

Refer to these when implementing or modifying protocol builders.

## Adding New Protocol Features

1. Create a new builder class in `src/main/driver/protocols/` extending `BaseProtocolBuilder`
2. Implement `build(mode: ConnectionMode): Buffer` with proper buffer sizing for each mode
3. Add corresponding IPC handler in `src/main/index.ts` exposing the feature to the renderer
4. Create comprehensive tests in `__tests__/` covering both Wired and Adapter modes
5. Update renderer UI as needed (Vue components, Pinia store)
6. Document the protocol in `docs/`

## IPC Communication (Main Process ↔ Renderer)

The preload script (`src/preload/index.ts`) exposes an `api` object to the renderer via `contextBridge` for secure inter-process communication:

```typescript
window.api.connectDevice(mode: number)           // Connect to device
window.api.getBattery()                          // Get battery level (0-100, or -1 if error)
window.api.setDpi(config)                        // Configure DPI with validation
window.api.getDpi()                              // Read current DPI config
window.api.getPreferences()                      // Read LED/battery settings
window.api.resetDevice()                         // Send internal state reset
window.api.setPollingRate(rate: number)          // Set polling rate
window.api.setUserPreferences(prefs)             // Configure LED modes, sleep time, etc.
window.api.setMacro(config)                      // Configure button macros
window.api.setCustomMacro(options)               // Record custom macro
window.api.listProfiles()                        // Get saved profile names
window.api.saveProfile(name, data)               // Save device config as profile
window.api.loadProfile(name)                     // Load saved profile
window.api.deleteProfile(name)                   // Delete profile
window.api.getSummary()                          // Get device state summary
window.api.onBatteryUpdated(callback)            // Listen for battery changes (event-based)
```

All IPC handlers include **error handling** - wrapped in try/catch. Renderer must handle rejected promises.

**Types**: Preload API types are defined in `src/renderer/src/env.d.ts` on the `Window` interface.

## Input Validation & Sanitization

Critical for USB communication safety:

**`src/main/utils/validation.ts`**:
- `validateDpiConfig()` - Ensures DPI array has exactly 6 positive numbers, stage index is 1-6, boolean flags are valid
- Throws descriptive `Error` if validation fails
- Called before passing to driver in `set-dpi` IPC handler

**`src/main/utils/preferenceSanitizer.ts`**:
- `sanitizePreferences()` - Corrects invalid values for LED speed (1-5), sleep time (1-60 min), key response (4-50, even numbers)
- Applies defaults if value is out of range (e.g., 254 from corrupted data → 10)
- **Always** called in `set-user-preferences` handler before sending to device

**Pattern**: Validate on input, sanitize on assignment. Never trust renderer data directly.

## Profile Storage

Profiles persist to `userData` directory (OS-specific):
- **Linux**: `~/.config/{app-name}/profiles.json`
- **macOS**: `~/Library/Application Support/{app-name}/profiles.json`
- **Windows**: `%APPDATA%/{app-name}/profiles.json`

Managed by `src/main/storage/profileManager.ts`:
```typescript
interface Profile {
  name: string;
  data: unknown;  // Stores complete device config as JSON
}
```

Profiles are JSON arrays of Profile objects. Each save/delete operation reads, modifies, and writes the entire file. No transactions or locking (single-threaded Electron main).

## Renderer Architecture

**No Pinia stores currently** - state is managed per-component via `ref()` and local reactivity.

**Vue 3 Components** in `src/renderer/src/components/`:
- Base components: `BaseInput.vue`, `BaseSelect.vue`, `BaseSlider.vue`, `BaseButton.vue` (reusable UI)
- Feature components: `DpiSettings.vue`, `MacroSettings.vue`, `UserPreferences.vue`
- Each component calls `window.api.*()` methods and handles responses

**Composables** in `src/renderer/src/composables/`:
- `useDebounce.ts` - Debounce function calls (used for slider/input updates to avoid rapid device writes)

**Future refactoring**: Consider Pinia for global device state if complexity increases (multiple components needing shared state).

## Development & Debugging

**Hot Module Reload (HMR)**:
- Dev mode (`bun run dev`) uses Vite for renderer hot reload
- Main process changes require manual app restart
- Press F12 to toggle DevTools in development

**USB Device Detection**:
- Devices are auto-discovered via USB VID/PID (0x1d57) on app start and connection attempt
- Linux requires udev rules (see README) for non-root access
- No device hot-plug handling currently - must reconnect manually

**Battery Monitoring**:
- Driver emits `batteryChange` event on interrupt endpoint data
- Main process broadcasts to all renderer windows via `battery-updated` IPC event
- Renderer hooks with `window.api.onBatteryUpdated(callback)`

## Electron Builder Configuration

Defined in `package.json` under `build` key:
- **Linux targets**: AppImage (portable) and `.deb` (Debian/Ubuntu)
- **App ID**: `com.attackshark.driver`
- **Output**: Files go to `dist/` directory
- Files included in package: `out/**/*` (compiled app) and `package.json`

Build command `bun run package` runs `electron-vite build` then `electron-builder` in sequence.

## Common Issues & Solutions

- **Device lock-up**: Ensure adequate delay between USB packets (default 250ms). Increase `delayMs` if needed.
- **Buffer size mismatch**: Always check Adapter vs. Wired buffer padding differences in builders.
- **Checksum errors**: Verify checksum calculation after any buffer modifications. Sum bytes from offset 3 onwards.
- **Type safety**: Enable strict mode in TypeScript (already configured). Avoid `any` types.
- **IPC promise rejections**: Always await IPC calls and handle `.catch()` or try/catch in async functions. Errors from main throw in renderer.
- **Validation failures**: Renderer receives descriptive error messages. Display in UI instead of silently failing.
- **Profile load errors**: `loadProfile()` returns `null` if profile doesn't exist. Check before using loaded data.
