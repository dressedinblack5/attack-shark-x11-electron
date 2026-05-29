# Design Doc: Simple Macro Selector UI

## Goal
Simplify the Macro Editor by removing the complex event sequence builder and replacing it with a direct "Button + Template = Apply" interface.

## Design

### 1. UI Components
- **Target Button Dropdown:** Select which mouse button to modify (e.g., Forward, Backward).
- **Macro Template Dropdown:** Select from available `macroTemplates` (e.g., Browser Forward, Browser Backward, Media Play/Pause).
- **Apply Button:** Triggers the assignment of the selected template to the target button.

### 2. UI Layout
- **Container:** Replace the current complex grid layout with a single, centered, or top-aligned row/column containing:
    - [Button Dropdown]
    - [Template Dropdown]
    - [Apply Button]

### 3. Backend Interaction
- When "Apply" is clicked:
    - Call `window.api.setMacro` (or equivalent driver function) mapping the selected button and the selected template.
    - Show a success or error message.

## Success Criteria
- User can select a button and a macro template.
- Clicking "Apply" successfully maps the template to the button.
- The UI is significantly simplified and no longer exposes the complex event sequence editor.
- The "Apply" button is only enabled when both a button and a template are selected.
