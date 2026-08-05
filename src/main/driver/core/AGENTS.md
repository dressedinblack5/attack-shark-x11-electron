# DRIVER CORE KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../AGENTS.md

## OVERVIEW
Core driver classes: `AttackSharkX11` (main driver, 545 lines), `BatteryMonitor` (interrupt polling, 158 lines), `BaseProtocolBuilder` (abstract base, 20 lines).

## STRUCTURE
```
src/main/driver/core/
├── AttackSharkX11.ts      # Main driver class — EventEmitter, USB control transfers, battery
├── BatteryMonitor.ts      # Interrupt endpoint polling — emits batteryChange
└── BaseProtocolBuilder.ts # Abstract base — USB constants, toString()
```

## WHERE TO LOOK
| Task | File | Key Methods |
|------|------|-------------|
| Open device, claim interface, detach kernel | AttackSharkX11.ts | `open()`, `close()` |
| All device commands (DPI, macros, prefs, etc.) | AttackSharkX11.ts | `setDpi()`, `setPollingRate()`, `setUserPreferences()`, `setMacro()`, `setCustomMacro()`, `reset()` |
| Battery level / live updates | AttackSharkX11.ts | `getBatteryLevel()`, `onBatteryChange()` |
| Battery polling internals | BatteryMonitor.ts | `startPolling()`, `pollLoop()`, `extractValue()` |
| USB control transfer primitive | AttackSharkX11.ts | `controlTransfer()` (IN/OUT, native) |
| Send builder payload | AttackSharkX11.ts | `sendBuilder()` (wraps controlTransfer) |
| Device info | AttackSharkX11.ts | `getDeviceInfo()` |

## CONVENTIONS
- **`AttackSharkX11` extends `EventEmitter<AttackSharkX11Events>`** — events: `batteryChange: [number]`, `error: [Error]`
- **Connection lifecycle**: `open()` → claim interface 2, detach kernel driver (Linux), select config, start `BatteryMonitor` → `close()` → release interface, close device, destroy monitor
- **`checkIsOpen()`** guards every public method — throws `DriverError` if not open
- **Control transfers**: `controlTransfer()` uses `nativeControlTransferIn/Out` (usb v3 async); 250ms delay after OUT transfers with data
- **BatteryMonitor**: polls interrupt endpoint 3 every 100ms via `nativeTransferIn`; matches `headerPrefix` (X11: `[0x03,0x55,0x40,0x01]`, R1: varies); extracts byte 4
- **Wired devices**: no battery (`getBatteryLevel()` returns -1); `getDpi()` returns empty buffer; `getSummary()` reads cached prefs
- **R1 differences**: handled in `AttackSharkX11` constructor via `deviceModel` option; affects battery config, reset sequence, capabilities
- **Error hierarchy**: `DriverError` → `ParamsError` (paramName), `DeviceError`, `InterfaceError` (interfaceNumber), `TimeoutError`
- **Logger**: injected via constructor, defaults to structured console `{time, level, message, context}`

## ANTI-PATTERNS
- **Never call any method before `open()`** — `checkIsOpen()` throws
- **Never skip `close()`** — leaks kernel driver attachment, interface claim; `before-quit` in main/index.ts handles cleanup
- **Never assume battery works on wired** — returns -1, monitor not started
- **Never send partial reset** — `reset()` must reapply DPI, user prefs, polling, macros, custom macros (internal state reset report 0x0C first for X11)
- **Never use `AttackSharkX11` without `deviceModel` for R1** — pass `{ deviceModel: 'R1' }` in constructor

## TESTS
- `__tests__/AttackSharkX11.test.ts` — full MockDevice (usb v3 async API), 34 tests
- `__tests__/BatteryMonitor.test.ts` — fake timers, EventEmitter, 37 tests