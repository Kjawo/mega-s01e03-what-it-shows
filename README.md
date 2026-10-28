# MEGA S01E03 — what it shows

Review of the support desk's ticket #4471, using the supplied knowledge-base export.

## Results

| Cause | Unique reports | Ticket | Engineering outcome |
| --- | ---: | --- | --- |
| Shared parser reads day-first dates as month first | 379 | [Issue #1](https://github.com/Kjawo/mega-s01e03-what-it-shows/issues/1) | Fixed; closed as completed |
| booking-v3 hint conflicts with day-first form parsing | 33 | [Issue #2](https://github.com/Kjawo/mega-s01e03-what-it-shows/issues/2) | Form retired; closed as not planned |
| Total | 412 | | |

The export has 427 rows: 15 are repeated copies of an existing report id. There are no
conflicting duplicate records. Tenant locale, form version, and channel determine cause;
38 intake tags disagree with the supplied cause model. Counts cover the export dated
2026-10-04 and were verified on 2026-10-28. They are not live queue totals.

The [engineering update](https://hq.mega.dev/challenges/what-it-shows), revealed after the
course accepted the cause tickets, records #4471 closed on 2026-10-05. It distinguishes the
parser fix from retirement of booking-v3. The rendered review incorporates that later evidence
while preserving the original export. Neither outcome was independently tested in production.

## Deliverables

- Standalone entry files: [page.svx](page.svx) and [page.html](page.html), generated from the same KB route
- [Canonical signed incident page](src/routes/kb/incidents/4471/+page.svx)
- [Review route](src/routes/kb/incidents/4471-review/+page.svx), retained for existing links
- [Rendered page](rendered.html), including the working cause explorer
- [Screenshot](rendered-review.png)
- [Report membership and independent count analysis](analysis.json)
- [Original-model execution and build results](render-verification.json)
- [Browser checks](browser-verification.json)

The page's signature is `Kjawo`, the repository owner's verified GitHub handle. The original
RenderStamp component derives the desk reference from it; browser-verification.json records
the computed value. The canonical incident page is updated to the reviewed report; the other supplied KB files retain their original bytes. The original ZIP is preserved separately. The accepted subject-only decision is preserved; the review recommends a
new decision rather than rewriting the historical one.

## Rebuild

Requires Node.js 18 or newer and npm. Dependencies are pinned in package-lock.json.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node render.mjs .
```

Open rendered.html in a browser. It embeds the CSS and JavaScript and needs no external
assets. The full static KB is also generated under rendered/kb/. The script compiles
the supplied Svelte components and MDsveX pages, resolves the two source glob patterns,
and compares the original cause model's report membership with the independent analysis.

The model and browser checks passed with 379 parser reports, 33 hint reports, five preserved
one-day symptom notes, a valid rendered signature, and an interactive cause comparison.
The application itself and proposed fixes have not been run in a production environment.

## Source

MEGA course export: `kb-export-267efc5e.zip`, SHA-256
`267efc5ea61aca6efaaca842160ac4d0377d56bcbf5123e61c604d6ae99597f2`.
This repository contains course-provided fictional support data and the review artifacts.
