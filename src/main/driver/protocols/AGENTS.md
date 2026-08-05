# PROTOCOL BUILDERS KNOWLEDGE BASE

**Generated:** 2026-08-04
**Parent:** ../AGENTS.md

## OVERVIEW
Each builder encodes one USB HID report (control transfer OUT, `bmRequestType=0x21`, `bRequest=0x09`, `wIndex=2`). Builders are stateless-ish: `new Builder(opts).setX().build(mode)` returns a `Buffer` (or `Buffer[]` for CustomMacro).

## STRUCTURE
```
src/main/driver/protocols/
├── DpiBuilder.ts              # Report 0x0304 — 6-stage DPI + angle snap + ripple
├── UserPreferencesBuilder.ts  # Report 0x0305 — lighting, sleep, key response, RGB
├── MacrosBuilder.ts           # Report 0x0308 — simple button remap (firmware actions)
├── CustomMacroBuilder.ts      # Report 0x0309 — multi-page key sequences (47 events max)
└── PollingRateBuilder.ts      # Report 0x0306 — 125/250/500/1000 Hz
```

## REPORT MAP
| Builder | wValue | Wireless Len | Wired/R1 Len | Key Features |
|---------|--------|--------------|--------------|--------------|
| DpiBuilder | 0x0304 | 56 | 52 | 6 stages, angleSnap, ripplerControl, activeStage, checksum u16BE |
| UserPreferencesBuilder | 0x0305 | 15 | 13 | LightMode enum, RGB, ledSpeed 1-5, sleepTime 0.5-30, deepSleep 1-60, keyResponse 4-50 step 2 |
| MacrosBuilder | 0x0308 | 59 | 59 | 8 buttons × 3 bytes (action, modifier, keyCode), checksum u8 |
| CustomMacroBuilder | 0x0309 | 4×64 | 4×64 | 4 packets: def + 3 pages, 47 events max, delay encoding (10ms base, 200ms units) |
| PollingRateBuilder | 0x0306 | 9 | 5 | Rate enum, X11: byte+checksum, R1: LE u16 (0xfe01=1000Hz) |

## WHERE TO LOOK
| Feature | Builder | Method |
|---------|---------|--------|
| Set DPI stage value | DpiBuilder | `setDpiValue(stage, dpi)` / `setStages([6 values])` |
| Angle snapping | DpiBuilder | `setAngleSnap(true/false)` |
| Ripple control | DpiBuilder | `setRipplerControl(true/false)` |
| Active DPI stage | DpiBuilder | `setCurrentStage(1-6)` |
| Light mode | UserPreferencesBuilder | `setLightMode(LightMode.Off/Static/Breathing/...)` |
| RGB color | UserPreferencesBuilder | `setRgb({r,g,b})` |
| LED animation speed | UserPreferencesBuilder | `setLedSpeed(1-5)` |
| Sleep timer | UserPreferencesBuilder | `setSleep(0.5-30)` |
| Deep sleep | UserPreferencesBuilder | `setDeepSleep(1-60)` |
| Key response (debounce) | UserPreferencesBuilder | `setKeyResponse(4-50 step 2)` |
| Button remap | MacrosBuilder | `setMacro(Button.LEFT, [action, mod, key])` |
| Custom macro events | CustomMacroBuilder | `addEvent(keyCode, delayMs, isRelease)` |
| Macro play options | CustomMacroBuilder | `setPlayOptions(mode, times)` |
| Target button for macro | CustomMacroBuilder | `setTargetButton(Button, macrosBuilder?)` |
| Polling rate | PollingRateBuilder | `setRate(Rate.eSports/gaming/office/powerSaving)` |

## CONVENTIONS
- **All extend `BaseProtocolBuilder`** — provides USB control transfer constants + `toString()` → hex
- **`build(mode: ConnectionMode)` returns `Buffer` (or `Buffer[]` for CustomMacro)** — mode determines truncation
- **Validation via `ParamsError`** — throws on invalid ranges (DPI unsupported, ledSpeed 1-5, keyResponse even 4-50, etc.)
- **DPI encoding**: `tables/dpi-map.ts` maps DPI→byte; `encodeDpi()` finds smallest map key ≥ requested DPI; throws if >22000
- **Stage mask**: bits set for stages >12000 (bytes 6,7); high flags (bytes 16-21) for DPI in [10100,12000] ∪ [20100,22000]
- **R1 differences**: no RGB, no macros, no light modes; DPI defaults 800-12000; PollingRate LE u16; UserPreferences packs deepSleep differently
- **CustomMacro delay encoding**: `eventDelay = 2*floor((ms+5)/20)+1`; >1070ms adds extra delay byte (units of 200ms, max 255)

## ANTI-PATTERNS
- **Never use `CustomMacroBuilder.macroEvents` / `macrosBuilder` options directly** (CustomMacroBuilder.ts:23) — marked unstable
- **Never exceed 47 macro events** (CustomMacroBuilder.MAX_MACRO_EVENTS)
- **Never use unsupported DPI values** — `encodeDpi` throws `ParamsError` (max 22000, step 50)
- **Never skip checksum** — `build()` computes it; all builders validate in tests via golden hex

## TESTS
All in `__tests__/` — golden hex assertions via `builder.toString()`:
- `DpiBuilder.test.ts`: stage values, angleSnap, ripple, checksum, R1 defaults
- `UserPreferencesBuilder.test.ts`: light modes, RGB, sleep/deepSleep bounds, keyResponse validation, R1 packing, JSDoc cites `docs/light-settings/`
- `MacrosBuilder.test.ts`: button offsets, firmware actions, checksum
- `CustomMacroBuilder.test.ts`: multi-page events, delay encoding, play modes, target buttons
- `PollingRateBuilder.test.ts`: X11 byte+checksum, R1 LE u16, rate enum