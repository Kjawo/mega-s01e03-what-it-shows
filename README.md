# MEGA S01E03 — what it shows

Two causes were merged into support ticket #4471. This repository contains the course KB export,
one signed incident page, its rendered HTML, and one GitHub issue for each cause.

## Deliverables

- [Signed source page](src/routes/kb/incidents/4471/+page.svx)
- [Rendered page](src/routes/kb/incidents/4471/+page.html)
- [Browser screenshot](rendered-review.png)
- [Parser issue — 379 unique reports](https://github.com/Kjawo/mega-s01e03-what-it-shows/issues/1)
- [Form hint issue — 33 unique reports](https://github.com/Kjawo/mega-s01e03-what-it-shows/issues/2)

The rendered HTML contains the actual server-rendered tables, timeline, and signature stamp.
Its adjacent +page.js provides interactive behavior; open +page.html after downloading the
repository. The signature is Kjawo; the supplied deskRef implementation derives DR-1D35-RY95.

## Evidence

The 2026-10-04 export has 427 rows and 412 unique report ids. Fifteen repeated rows are identical.
Tenant locale, booking form version, and channel classify 379 reports as parser and 33 as hint;
38 intake tags disagree with this classification. analysis.json records all group members.
The original cause model independently agrees with that membership.

The engineering update on the challenge page records #4471 closed on 2026-10-05:
parser FIXED, fix(dates): parse dd/mm for eu locales; hint WON'T FIX, booking-v3 form retired.
The issues record those separate outcomes. The old accepted decision is preserved, and the
review explains why a new cause-based decision should supersede subject-only deduplication.

render-verification.json records model and build checks. browser-verification.json records
rendered counts, the derived stamp, the five one-day notes, the timeline, dedupe examples,
and interactive behavior. No production deployment or independent runtime fix test is claimed.

## Rebuild

Node.js 18 or newer and npm:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node render.mjs .
```

The original source export is documented in EXPORT_README.md. Its archive SHA-256 is
267efc5ea61aca6efaaca842160ac4d0377d56bcbf5123e61c604d6ae99597f2.
Only the working copy of the incident page was updated; the source ZIP is preserved separately.
