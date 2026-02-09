# Specification

## Summary
**Goal:** Redesign the Program Calendar tab into a full-width, readability-first management calendar with multiple views, filtering, day-level counts, and program detail drawers.

**Planned changes:**
- Redesign `frontend/src/components/ProgramCalendarTab.tsx` to use a full-width, large-typography calendar layout that remains usable on mobile without horizontal scrolling.
- Add a clearly visible view switcher: Monthly, Weekly, and Agenda (default Monthly on desktop; default Agenda on mobile) while preserving the selected date/visible range when switching.
- Add filter controls above the calendar for Unit/Division, PIC, Status, and Priority, including a clear/reset action; apply filters consistently across all views and detail panels.
- In Monthly/Weekly grid views, show per-day numeric badges for the count of matching programs; clicking a day opens a day detail panel (right-side on desktop, modal/sheet on smaller screens) listing programs for that date.
- Add a program detail drawer/sheet when selecting a program from any list/view, showing description, period (start/end), PIC, visual progress bar, status, and an Edit button that reuses the existing `ProgramFormDialog` edit flow.
- Update data loading to fetch programs for the visible Monthly/Weekly ranges using the existing backend range query (`getProgramsActiveInRange`) via React Query, with correct Date → BigInt milliseconds conversion and stable caching to avoid excessive refetches.
- Refine visuals to a modern card-based UI (soft shadows, consistent iconography, non-garish status/priority colors) while keeping the calendar full-width and readability-focused.

**User-visible outcome:** Users can view programs in Monthly/Weekly/Agenda modes, filter what they see, quickly understand workload via per-day badge counts, open a day’s program list, and open/edit individual program details from a drawer/sheet with updates reflected back in the calendar.
