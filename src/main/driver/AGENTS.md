# USB DRIVER KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../AGENTS.md

## OVERVIEW
Core USB HID driver for Attack Shark X11/R1 mice. Uses node-usb-rs v3 (async WebUSB API). All device communication via control transfers (reports 0x0304-0x0309) + interrupt endpoint for battery.

## STRUCTURE
```
src/main/driver/
├── core/               # Main driver classes — see core/AGENTS.md
│   ├── AttackSharkX11.ts      # Main driver (545 lines)
│   ├── BatteryMonitor.ts      # Interrupt polling (158 lines)
│   └── BaseProtocolBuilder.ts # Abstract base (20 lines)
├── protocols/          # Report builders — see protocols/AGENTS.md
│   ├── DpiBuilder.ts              # Report 0x0304 (56/52 bytes)
│   ├── UserPreferencesBuilder.ts  # Report 0x0305 (15/13 bytes)
│   ├── MacrosBuilder.ts           # Report 0x0308 (59 bytes)
│   ├── CustomMacroBuilder.ts      # Report 0x0309 (4 packets)
│   └── PollingRateBuilder.ts      # Report 0x0306 (9/5 bytes)
├── tables/
│   └── dpi-map.ts       # DPI→byte encoding (326 lines)
├── errors.ts            # DriverError, ParamsError, DeviceError, InterfaceError, TimeoutError
├── types.ts             # ConnectionMode, Button, ControlTransfer*, Logger, DeviceModel
└── index.ts             # Barrel exports all classes, types, errors
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Open/close device, all high-level ops | core/AttackSharkX11.ts |
| Battery level / polling | core/BatteryMonitor.ts |
| DPI stages, angle snap, ripple control | protocols/DpiBuilder.ts |
| Lighting, sleep, key response, RGB | protocols/UserPreferencesBuilder.ts |
| Button remapping (simple macros) | protocols/MacrosBuilder.ts |
| Complex key-sequence macros | protocols/CustomMacroBuilder.ts |
| Polling rate (125-1000 Hz) | protocols/PollingRateBuilder.ts |
| DPI value → hardware byte | tables/dpi-map.ts |
| Error handling | errors.ts |
| Type definitions | types.ts |

## CONVENTIONS
- **All builders extend `BaseProtocolBuilder`** (provides `bmRequestType=0x21`, `bRequest=0x09`, `wIndex=2`, `toString()` → hex)
- **Builder pattern**: `new Builder(options).setX().setY().build(mode)` — immutable-ish, returns `this`
- **ConnectionMode affects output length**: Wired/R1Wired truncate checksum bytes (DpiBuilder: 52 vs 56; UserPreferences: 13 vs 15; PollingRate: 5 vs 9)
- **R1 uses different encodings**: DPI defaults, PollingRate (LE u16), UserPreferences (deep sleep packing), no RGB/macros
- **Checksums**: DpiBuilder (sum bytes 3-49, u16BE at 50-51), UserPreferences (sum 3-10, u8 at 12), MacrosBuilder (sum 2-len-2, u8 at 58), PollingRate (0xff - rateByte), CustomMacro (sum across packets 2-4)
- **Delay between control transfers**: 250ms default (`delayMs` in AttackSharkX11 constructor) after any `data` buffer write
- **Logger**: structured `{time, level, message, context}` via `Logger` interface; default logs to console with ISO timestamps

## ANTI-PATTERNS
- **Never call driver methods without `open()` first** — `checkIsOpen()` throws `DriverError`
- **Never use `CustomMacroBuilder.macroEvents` / `macrosBuilder` directly** (protocols/CustomMacroBuilder.ts:23) — unstable
- **Never skip `close()`** — leaks kernel driver attachment, interface claims; `before-quit` handler in main/index.ts ensures cleanup
- **Never assume wireless protocol works on wired** — `getDpi()` returns empty buffer for wired; `getSummary()` reads cached prefs for wired
- **Never send incomplete reset** — `reset()` must reapply DPI, user prefs, polling, macros, custom macros (see docs/internal-state-reset-protocol.md)

## COMMANDS
```bash
bun test __tests__/AttackSharkX11.test.ts     # driver integration (MockDevice)
bun test __tests__/BatteryMonitor.test.ts     # polling, fake timers
bun test __tests__/DpiBuilder.test.ts         # golden hex, validation
bun test __tests__/UserPreferencesBuilder.test.ts
bun test __tests__/MacrosBuilder.test.ts
bun test __tests__/CustomMacroBuilder.test.ts
bun test __tests__/PollingRateBuilder.test.ts
```