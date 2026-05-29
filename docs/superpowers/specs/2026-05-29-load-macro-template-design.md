# Design Doc: Load Macro Template Feature

## Goal
Implement a "Load from Template" feature within the existing `MacroSettings.vue` UI, allowing users to quickly populate the macro sequence with pre-defined actions.

## Design

### 1. UI Integration
- Add a "Load Template" button next to the "Add Event" button in the Macro Sequence panel.
- This button will open a dropdown menu (or a small modal) containing available macro templates (e.g., Browser Forward, Browser Backward, Media Play/Pause).

### 2. Behavior (Clear and Replace)
- When a user selects a template:
    - The current `macroEvents` array will be cleared.
    - The new events from the selected template will be loaded into the `macroEvents` array.

### 3. Backend Interaction
- The UI will need access to the `macroTemplates` defined in `src/main/driver/protocols/MacrosBuilder.ts`.
- When a template is loaded, the `MacroSettings.vue` will map the template's actions to the format expected by the `macroEvents` array.

## UI Sketch (Visual Companion placeholder)
- **Top Bar:** [Macro Editor Title] [Save & Assign] [Load Template ▼]
- **Dropdown:**
    - [Browser Forward]
    - [Browser Backward]
    - [Media Play/Pause]
    - [Close Window]

## Success Criteria
- User can open the template dropdown.
- Selecting a template replaces the current sequence with the template's events.
- UI automatically updates to reflect the new macro sequence.
- "Save & Assign" button remains functional and respects the new validation logic.
