# Shared parser reads day-first tenant dates as MM/DD/YYYY — 379 reports

## Resolution — engineering update, 2026-10-05

**Status: FIXED.** Closed as completed.

Engineering summary: `fix(dates): parse dd/mm for eu locales`.

The desk records source ticket #4471 closed on 5 October. This is the engineering-reported parser fix, not an independent production test.

[Source: current engineering update on the MEGA challenge page](https://hq.mega.dev/challenges/what-it-shows).

## Scope and evidence

- Source ticket: #4471; 379 unique reports in the 2026-10-04 KB export, across 11 tenants.
- Window: 2026-04-01 through 2026-10-04. Counts describe this export, not the current desk queue.
- Deduplicate reports by id before counting. The full export contains 427 rows and 412 unique ids.
- Classification uses tenant locale, channel, and booking form version through causes.ts. Browser locale and intakeTag are intake guesses.
- Of these reports, intake tagged 356 as parser and 23 as hint; the tenant-based cause remains parser.

## Problem and reproduction

For a day-first tenant, enter a date such as 07/04/2026 through the app or email workflow, or a booking-v2 form. The shared parser reads month before day and produces 4 July instead of 7 April. Expected: the parsed date follows the tenant's day-first convention.

R-41200 (harbour.dental, app) reports 7 April becoming 4 July. R-41201 describes the reverse mix-up. These belong to the same parser cause despite different subject lines.

## Impact and smallest correction

Invites and reminders reach customers on the wrong date. Parse an explicit, tenant-appropriate date format and carry an unambiguous normalized date internally; do not infer it from browser locale. Verify app, email, and booking-v2 paths with ambiguous and unambiguous dates. The booking-v3 hint issue needs its own correction.

## Triage notes

Five reports were read by the desk as a one-day move: R-41202, R-41209, R-41236, R-41344, R-41620. The supplied cause model files them here; retain their symptom notes without counting them again or asserting an unproved timezone cause.

Evidence: src/lib/kb/causes.ts; src/lib/kb/locales.ts; src/lib/data/tenants/; analysis.json records every included report id.

## Knowledge base page

- Source (.svx): https://github.com/Kjawo/mega-s01e03-what-it-shows/blob/main/src/routes/kb/incidents/4471/%2Bpage.svx
- Rendered HTML: https://github.com/Kjawo/mega-s01e03-what-it-shows/blob/main/src/routes/kb/incidents/4471/%2Bpage.html
- Course-issued signature in page frontmatter; rendered desk reference: DR-6Z5H-4170.
