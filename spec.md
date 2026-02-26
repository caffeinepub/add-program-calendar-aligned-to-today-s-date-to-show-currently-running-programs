# Specification

## Summary
**Goal:** Fix the login/registration flow in Sistem Tracking so that the first user is automatically assigned the Admin role without errors, profile saving works for all users, and user data persists across redeployments.

**Planned changes:**
- Fix backend first-user detection so the very first registered user is automatically assigned Admin role, bypassing the "Only admins can assign user roles" authorization guard
- Ensure subsequent users do not get auto-assigned Admin role
- Fix the profile-save/registration endpoint so no Unauthorized error is returned for any new user saving their profile
- Add stable variables and update the migration module (backend/migration.mo) so user profiles, roles, and the firstAdminInitialized flag survive canister upgrades and redeployments
- Update ProfileSetupModal to show inline error messages on save failure, keep the save button re-enabled for retry, and keep the close (X) button functional after errors
- Disable the "Simpan Profil" button when the name field is empty (minimum 1 character required)
- Add a fallback display identifier using a shortened Principal ID (e.g., "User-abc12") when no name is stored

**User-visible outcome:** Users can register and save their profile without any "Unauthorized" error. The first user automatically becomes Admin and lands on the dashboard successfully. Existing user data is never lost on system updates, and the profile modal never permanently blocks a user.
