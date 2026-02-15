# Specification

## Summary
**Goal:** Improve Team Member cards by making the avatar frame larger and square-with-rounded-corners, and enable direct click/tap-to-change member photos via a device file picker with robust upload/error handling.

**Planned changes:**
- Update the TeamMemberCard avatar presentation on the Team Members “Cards” view to be larger, 1:1 square, and slightly rounded while preserving the initials/fallback behavior when no valid avatar URL exists.
- Make the avatar frame clickable/tappable to open the native file chooser, upload the selected image using the existing image upload utility, and save the hosted URL back to the member’s `avatar` via the existing update mutation flow.
- Add a clear uploading state on the avatar frame, prevent double uploads, handle cancel without noise, and show English error messaging on failures/invalid returned URLs without breaking card/list interactivity.

**User-visible outcome:** On the Team “Cards” view, member avatars appear larger in a rounded-square frame, and users can tap/click an avatar to pick a new photo from their device; uploads show progress, update the card on success, and display English errors without crashes on failure.
