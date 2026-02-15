# Specification

## Summary
**Goal:** Update the app’s visual design to a cohesive SHQ dark navy + light green accent theme, and reposition the top tab navigation into a centered translucent “pill” bar aligned with the header.

**Planned changes:**
- Apply a global SHQ color palette via Tailwind/CSS theme tokens so backgrounds, cards, borders, buttons, and focus rings consistently use a dark navy base with light green accents across all pages (Dashboard, Calendar, Program, KPI, Team, Reports, Login, Profile Setup), while preserving readable contrast in both light and dark modes.
- Rework the top navigation layout to render the existing tabs in a centered, rounded, translucent pill-style menu near the top/header area, with a clear active state and responsive behavior (no overflow/click issues on small screens), without changing tabs, permissions (admin-only Users), or routing behavior.
- Harmonize header, main content background, and footer styling to feel like one cohesive system using CSS-based subtle dark navy gradient/texture-like treatment (reference-only style direction from IMG_0109.jpeg; not used as an actual background asset), keeping existing header actions functional (theme toggle, user menu, logout).

**User-visible outcome:** The entire app displays a consistent SHQ dark navy theme with light green accents, and the tab menu appears as a centered translucent pill navigation at the top that remains fully functional and responsive.
