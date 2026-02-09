# Specification

## Summary
**Goal:** Add a Program Calendar experience aligned to today’s date so users can quickly see which programs are currently running.

**Planned changes:**
- Add a backend query method that accepts an epoch-milliseconds date value and returns programs where `startDate <= date <= endDate`, enforcing existing read authentication/authorization behavior.
- Add a new dashboard view/tab labeled “Calendar” or “Program Calendar” that defaults to the current month, highlights today, and includes a “Today” control.
- Display, for the selected date (default: today), a list of active programs including program name, unit/division, PIC name, start/end dates, and existing-style status/priority badges; show an English empty state when none match.
- Wire the calendar view data fetching via React Query with caching keyed by selected date, refetching on date change, handling JS Date ↔ epoch-milliseconds conversion, and showing English loading/error states.

**User-visible outcome:** Authenticated users can open a new Program Calendar in the dashboard, jump to today, select dates on a calendar, and see which programs are active on each selected date (or an empty-state message if none).
