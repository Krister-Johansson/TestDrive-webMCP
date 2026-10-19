# Accessibility

The target is WCAG 2.2 level AA for every route: `/` (grid and table views, filters), `/book/[carId]` and its modal, `/bookings/[id]`, `/admin` (all tabs, dialogs, tables, slot generator), `/connect`, the not-found page, and the site header. The audit covers the light and dark themes and a 320 CSS pixel wide viewport.

This document records what was checked and how. It is not a conformance claim: the checks ran in Chromium only, and nobody has tested the app with a screen reader yet.

## How to run the audit

```sh
npm run test:e2e -- e2e/a11y.spec.ts e2e/a11y-behavior.spec.ts
npm test
```

- `e2e/a11y.spec.ts` runs axe (`@axe-core/playwright`) with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa` on each route in both themes. It also scans the open states: the brand combobox, a select list, the help dialog, the filter sheet, the car modal, the confirm sheet with an error, the booked view, the cancel alert dialog, the add car dialog with errors, the slot generator result, the WebMCP tools popover, and the admin tabs at 320 px.
- `e2e/a11y-behavior.spec.ts` checks what axe cannot: page titles and language, the skip link, focus return, keyboard paths, focus indicator contrast, focus behind the sticky header, reflow, text spacing, status messages, and reduced motion.
- `src/app/theme-contrast.test.ts` checks the theme tokens for the focus ring and input borders, and fails if a component dims the ring with an opacity modifier.

Two scans turn off one rule for one state, with the reason in the spec:

- With the brand combobox open, `aria-hidden-focus` is off. Base UI marks the rest of the page `aria-hidden` while the list is open and focus stays in the input. Tab closes the list and removes the attribute first, which `a11y-behavior.spec.ts` checks.
- With a select list open, `target-size` is off. The open list covers part of a filter pill, and that pill cannot be used until the list closes.

## Fixes by criterion

### 1.3.1 Info and relationships

- Fully booked days in the slot calendar were struck through with no text equivalent. Their names now end in "fully booked".
- The booking form and the admin car form showed errors next to fields without linking them. Each invalid field now has `aria-invalid` and `aria-describedby` pointing to its error.
- The booking form's Name field is now `required`.

### 1.4.1 Use of color

The live status showed only an amber or red dot on phones. It now shows "Connecting" or "Reconnecting" as text at every width.

### 1.4.3 Contrast (minimum)

- "No tow hitch" on car cards used 70 percent muted text (2.71:1 light, 4:1 dark). It now uses the muted foreground color.
- Destructive text on its tinted background was 3.82:1 (light) and 4.24:1 (dark). The `--destructive` token is darker in light mode and lighter in dark mode.
- The slot generator's success message used emerald 600 (3.65:1). It now uses emerald 700 in light mode.
- The Native badge used white on emerald 600. It now uses emerald 700.
- The generated car placeholder drew small text at 80 percent opacity and only checked contrast against one end of its gradient. The text is now opaque, and the palette darkens until the text reaches 4.5:1 against both ends.

### 1.4.11 Non-text contrast

- The focus ring was `--ring` at 50 percent opacity, about 2:1 or less against the page. The ring is now opaque and `--ring` reaches 3:1 against the background, card, popover, and muted surfaces in both themes.
- Input borders and switch tracks used `--input`, about 1.3:1 against the page. `--input` now reaches 3:1 in both themes.

### 1.4.12 Text spacing

Badges had a fixed height with hidden overflow, so text spacing overrides clipped their text. They now have a minimum height and grow.

### 2.1.1 Keyboard

- The code snippets on `/connect` scroll sideways but could not receive focus. They are now focusable named regions.
- The slot overview table on the admin Slots tab scrolls sideways at 320 px and has no focusable cells. Its scroll container is now a focusable named region.

### 2.4.1 Bypass blocks

A "Skip to content" link is the first tab stop on every page and moves focus past the header.

### 2.4.2 Page titled

`/` was titled "TestDrive" and the not-found page also fell back to "TestDrive". They are now "Book a test drive · TestDrive" and "Page not found · TestDrive". The not-found page sets its title with a React `<title>` element, because a `metadata` export in `not-found.tsx` was not applied.

### 2.4.7 Focus visible

The admin tab panels receive focus but had no focus style. They now show the focus ring.

### 2.4.11 Focus not obscured (minimum)

Tabbing backwards up a page put focused elements under the sticky header. `html` now has `scroll-padding-top` sized to the header (7rem below 768 px, where the header wraps, and 5rem above).

### 2.5.3 Label in name

- Calendar day buttons were named "Thursday, October 1st, 2026", which does not contain the visible "1". They are now "Thursday, October 1, 2026".
- Copy buttons were named "Copy to clipboard" while showing "Copy" or "Copied". The name is now the visible text.

### 2.5.8 Target size (minimum)

The photo carousel dots were 6 to 8 px wide with 6 px gaps. Each dot is now a 24 by 24 px button with the small dot drawn inside it.

### 4.1.2 Name, role, value

The combobox clear and open buttons had no names. They are now "Clear selection" and "Show options".

### 4.1.3 Status messages

- The result count used `aria-live` without a role. It is now `role="status"`.
- The slot generator's result and the copy confirmation were inserted together with their status role, which screen readers do not announce reliably. Both regions now stay mounted and only their text changes.
- The live status swapped between two elements. It is now one status element that stays mounted.

## Checked and passing without changes

- 1.4.10 Reflow: no route scrolls sideways at 320 px, including the car modal. Admin tables scroll inside their own container, which the criterion allows for data tables.
- 1.4.13 Content on hover or focus: the live status tooltip is gone. The remaining hover text comes from native `title` attributes on color swatches, which the browser controls.
- 2.1.2 No keyboard trap and 2.4.3 Focus order: the slot calendar moves with arrow keys, filter pills toggle with Space, and Tab leaves an open combobox. Closing the car modal, the confirm sheet, and the filter sheet returns focus to the control that opened them.
- 2.5.7 Dragging movements: the carousel can be swiped, and the previous and next buttons and the dots do the same with a single tap.
- 3.1.1 Language of page: `<html lang="en">`.
- 3.2.6 Consistent help: the WebMCP help dialog sits in the header, in the same place on every page.
- 3.3.3 Error suggestion: each form error says what to do, for example "Pick a brand and model. Add new ones on the Brands tab."
- 3.3.7 Redundant entry: no flow asks for the same information twice. The booking form sets `autocomplete` on name and email.
- 3.3.8 Accessible authentication: not applicable, the app has no login.
- Reduced motion: with `prefers-reduced-motion: reduce`, view transition animations have a duration of 0, and Motion animations check `useReducedMotion`.

## Gaps and checks done by hand only

- Nobody has tested the app with a screen reader (VoiceOver, NVDA, TalkBack). The tests check roles, names, and live regions in the DOM, not what a screen reader announces.
- All automated checks run in Chromium. Safari and Firefox are untested.
- Toasts appear at the bottom right and can cover a focused element near the bottom of the window until they close (after a few seconds, or with their close button). No test covers this, and 2.4.11 for toasts is unverified.
- The e2e fleet has no photos, so axe never scans a page with the photo carousel. Component tests cover the carousel's names and dot size. The white dots sit on arbitrary photos, so their 3:1 contrast depends on the photo and is not guaranteed.
- The carousel dots use `role="tab"` without tab panels. axe accepts this, but a list of buttons with `aria-current` would describe them better.
- The text spacing test only looks for clipped text inside elements that hide overflow, on four routes.
- The theme token test covers the neutral tokens. The destructive color is covered by the axe scans of the states that use it.
