# Specification

## Summary
**Goal:** Fix the "invalid record" error when saving KPI forms by ensuring frontend data structure matches backend expectations.

**Planned changes:**
- Fix data type serialization for Nilai Target and Nilai Realisasi fields (ensure they are sent as numbers, not strings)
- Verify Program Terkait dropdown maps correctly to backend program identifier format
- Verify Tim/PIC dropdown maps correctly to backend Principal ID format
- Add comprehensive error logging to capture and display specific field validation errors from backend
- Ensure all form fields serialize to exact backend KPI type structure

**User-visible outcome:** Users can successfully save KPI forms without "invalid record" errors, and receive clear error messages if any field validation fails.
