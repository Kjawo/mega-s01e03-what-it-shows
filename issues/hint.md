# booking-v3 date hint conflicts with day-first tenant parsing — 33 reports

## Resolution — engineering update, 2026-10-05

**Status: WON'T FIX.** Closed as not planned; label: wontfix.

Engineering reason: **booking-v3 form retired**.

The affected form was removed rather than its misleading hint being corrected. Do not report this as a delivered hint fix. The desk records source ticket #4471 closed on 5 October.

[Source: current engineering update on the MEGA challenge page](https://hq.mega.dev/challenges/what-it-shows).

## Scope and evidence

- Source ticket: #4471; 33 unique reports in the 2026-10-04 KB export.
- Affected tenants: alder.physio, copper.studio, pale.harbour; channel: form; booking form: booking-v3.
- Window: 2026-04-17 through 2026-09-22. Counts describe this export, not the current desk queue.
- Classify by tenant locale and form version after deduplicating report ids. Intake tagged only 18 as hint and incorrectly tagged 15 as parser.

## Problem and reproduction

On a booking-v3 form for a day-first tenant, the hint prints MM/DD/YYYY. A user follows it and enters 06/01/2026 for 1 June. The form reads the value in the tenant's day-first order and produces 6 January. Expected: the displayed hint and form parser use the same tenant-specific order.

R-41230 (copper.studio, form) reports 1 June becoming 6 January, although intake tagged it parser. R-41241 (alder.physio, form) reports 6 August becoming 8 June. This is a form-hint mismatch, distinct from the shared parser bug.

## Impact and smallest correction

The form instructs customers to enter a date in an order it does not read. Generate the hint from the same tenant format used by parsing. Verify booking-v3 for all three affected tenants and ensure booking-v2 behavior remains consistent. Fixing the shared parser alone does not correct this hint.

## Triage notes

Do not merge by matching subject alone. An app report and a booking-v3 form report from the same tenant can have different causes; different tenants' form reports can also differ by form version. Accepted decision 0001 must be superseded by a new decision record, not silently rewritten.

Evidence: src/lib/kb/causes.ts (DATE_HINT and causeOf); src/lib/kb/locales.ts; src/lib/data/tenants/; analysis.json records every included report id.

## Knowledge base page

- Source (.svx): https://github.com/Kjawo/mega-s01e03-what-it-shows/blob/main/src/routes/kb/incidents/4471/%2Bpage.svx
- Rendered HTML: https://github.com/Kjawo/mega-s01e03-what-it-shows/blob/main/src/routes/kb/incidents/4471/%2Bpage.html
- Signature: Kjawo; rendered desk reference: DR-1D35-RY95.
