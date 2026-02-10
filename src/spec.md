# Specification

## Summary
**Goal:** Add a subtle, smooth open/close animation to the Program Detail drawer so it feels more polished and responsive.

**Planned changes:**
- Update `frontend/src/components/program-calendar/ProgramDetailDrawer.tsx` to animate the drawer/sheet on open and close using a gentle fade + directional slide (desktop: slide from right; mobile: slide up from bottom).
- Ensure the animation respects `prefers-reduced-motion` (disable or significantly minimize motion when enabled).
- Apply transitions via composition (e.g., `className`/wrappers) without modifying any files under `frontend/src/components/ui`.

**User-visible outcome:** Opening a program’s detail panel from the calendar or program list smoothly fades and slides into view (direction based on device), and closes with a matching reverse animation without UI glitches.
