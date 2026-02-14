# Specification

## Summary
**Goal:** Make Team Member photo management file-upload only by removing the manual avatar URL input, while continuing to store the hosted image URL in the existing `avatar` field for create and edit flows.

**Planned changes:**
- Update `frontend/src/components/TeamMemberFormDialog.tsx` to remove the “Or enter photo URL manually” label and the avatar URL input field, leaving only the existing file picker + upload flow.
- Ensure create flow sets the uploaded/hosted image URL into `avatar` and submits it on save; ensure edit flow previews existing `member.avatar`, allows replacement via upload, and supports clearing via the existing clear action.
- Remove now-unused manual-URL code paths and related validation (including submit-time URL validation and any unused imports such as `isValidUrl`), while keeping upload progress/disabled states, error handling, and success/error toasts in English.
- Keep `frontend/src/components/team/PhotoUrlPreview.tsx` in use for previewing the current `avatar` URL and showing an error state if the hosted image fails to load.

**User-visible outcome:** Users can no longer paste a photo URL for a Team Member; they can only upload a photo file (or clear an existing photo), and the app saves the resulting hosted URL as the member’s avatar.
