# Design Doc: UI Validation for Macro Editor

## Goal
Prevent the assignment of empty macro sequences to the mouse, which has been identified as a potential cause for firmware state corruption (resulting in `LIBUSB_ERROR_IO` communication failures).

## Design

### 1. Button Guard
Modify the "Save & Assign" button in `src/renderer/src/components/MacroSettings.vue` to prevent submission if the `macroEvents` array is empty.

**Implementation Logic:**
- Update the `:disabled` binding on the button:
  ```html
  :disabled="!isConnected || isSaving || macroEvents.length === 0"
  ```

### 2. Visual Feedback
Add a small help text label beneath the "Save & Assign" button to guide the user.

**UI Component:**
```html
<p v-if="macroEvents.length === 0" class="text-xs text-red-400 mt-2">
    Add at least one event to save this macro.
</p>
```

## Success Criteria
- The "Save & Assign" button remains greyed out while `macroEvents` is empty.
- The red warning text appears when the macro is empty.
- The button becomes active and the warning disappears immediately upon adding a valid event.
- No invalid/empty macro packets are sent to the driver.
