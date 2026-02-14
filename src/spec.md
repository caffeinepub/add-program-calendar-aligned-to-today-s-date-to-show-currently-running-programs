# Specification

## Summary
**Goal:** Fix the Program Calendar dashboard tab so it never renders as a blank screen and remains stable across modes and devices.

**Planned changes:**
- Ensure ProgramCalendarTab always renders visible UI scaffolding (header, filters, view controls, and calendar body area) immediately on tab open, including during loading.
- Add defensive runtime guards in `frontend/src/components/ProgramCalendarTab.tsx` for browser APIs (safe `localStorage` access and safe Notifications permission handling) to prevent render crashes.
- Add safe data access and fallbacks for incomplete/malformed program data so filters and calendar rendering cannot throw during render.
- Add an in-tab English error and empty-state UI (no blank areas) with a Retry action that triggers React Query refetch for calendar-range queries.

**User-visible outcome:** Clicking the Calendar tab consistently shows the calendar UI (with loading, error, or empty states as needed) across Month/Week/Day/Agenda on desktop and mobile, without uncaught exceptions from storage/notification access or malformed data.
