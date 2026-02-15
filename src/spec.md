# Specification

## Summary
**Goal:** Make Team member photo upload interactions reliably clickable on mobile/desktop and ensure updated avatars refresh immediately across Team views (including Structure View) without reloading.

**Planned changes:**
- Fix pointer/click handling on the Team Member Card avatar frame so the file picker always opens when editing is allowed, including when hover/upload overlays are visible, and prevent multiple opens/uploads while an upload is in progress.
- Fix the Team Member create/edit dialog “Choose from Device” control so it reliably opens the OS file picker when enabled and clearly appears disabled during upload.
- Ensure avatar updates after successful upload propagate immediately across Cards view and Structure View, with graceful fallback to initials if the avatar URL is missing/invalid.
- Keep all user-facing text related to these flows in English.

**User-visible outcome:** Users can consistently click/tap to choose a Team member photo in both the card and the create/edit dialog, and the new avatar appears right away across Cards and Structure View without needing a page refresh.
