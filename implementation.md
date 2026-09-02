# Otto implementation

Work follows `README.md`. This file is the development schedule: what to build, in what order, and when a slice is done.

Do not add screens, storage, or features listed as out of scope in the design.

## Principles

- HTML / CSS / JS only. No framework, no backend, no build step.
- Lean HTML: structure in `index.html`, styles in CSS, behaviour in JS.
- One page, three views: Records, Manage staff, Monthly report.
- Each milestone must be usable on its own before the next starts.
- Persistence is files only. Do not add `localStorage` or anything that survives a tab close.

## Files

Start with three files. Split JS later only if a file becomes hard to work in.

| File | Role |
| --- | --- |
| `index.html` | Markup for the three views, forms, lists, import/export controls |
| `styles.css` | Layout and appearance |
| `app.js` | State, validation, hours/report math, UI wiring |

Open `index.html` in a browser to run. No server required unless the browser blocks file import; if that happens, a static file open or a trivial local static server is enough — still no app backend.

## Schedule overview

| Milestone | Name | Builds | Done when |
| --- | --- | --- | --- |
| M1 | App shell | — | Three views switch; empty Records / Staff / Report visible |
| M2 | Single-person records | M1 | Create / edit / delete OT and TO for one person; hours shown as `0.00` |
| M3 | OT colleagues | M2 | OT can add colleagues with default then editable times |
| M4 | Staff | M3 | Staff JSON in memory; manage page; deactivate blocks new names; rename updates records |
| M5 | Import / export | M4 | Two separate `.json` files; failed import leaves memory unchanged |
| M6 | Monthly report | M5 | Active staff, one month: opening, in-month OT/TO (clipped), write-off, closing |
| M7 | Validation pass | M6 | README validation and edge cases hold; ready to use |

Build **M1 → M7** in order. Do not start a milestone until the previous one meets its “done when” checks.

---

## M1 — App shell

**Goal.** A single page that can show the three screens, with nowhere else to go.

**Build**

- `index.html` with a simple nav: Records | Manage staff | Monthly report.
- One visible view at a time.
- Records: empty list + placeholder for a create form.
- Manage staff: empty list + placeholder for add/edit.
- Monthly report: placeholders for staff, month, and result area.
- Import/export buttons may exist as disabled or unwired labels; they must not pretend to save.

**Done when**

- Opening `index.html` shows Records by default.
- Clicking each nav item shows only that view.
- HTML has no large inline CSS or JS.

---

## M2 — Single-person records

**Goal.** The user can log OT and TO for one person, change them, and remove them. Memory only.

**Build**

- In-memory list of applications in the README shape (`id`, `type`, dates/times, `staffName`, `reason`, `colleagues: []`).
- Create OT or TO (no colleague UI yet).
- List applications (type, staff, start, end, reason, hours).
- Edit and delete by `id`.
- Hours from start/end, rounded and displayed with two decimals.
- Dates as `DD/MM/YYYY`. End date defaults to the start date.
- Staff name chosen from the staff list or typed if new.
- Required fields; end must be after start.

**Done when**

- A TO from 09:00 to 12:30 the same day shows `3.50` hours.
- Edit changes the stored application; delete removes it.
- Refresh or tab close clears everything (expected).
- TO has no colleague controls.

---

## M3 — OT colleagues

**Goal.** One OT application can name colleagues who joined, without splitting the record.

**Build**

- On create/edit OT: add/remove colleague rows.
- New colleague row copies the main start/end date and time.
- Each colleague: name + start/end, editable before save and on later edit.
- Hide colleague UI when type is TO; saving TO stores no colleagues.
- Reject empty colleague names, duplicate colleague names, and the main person listed as a colleague.
- Each colleague’s end must be after that colleague’s start.
- Delete application removes main and colleagues together.

**Done when**

- Creating OT for Alice with Bob (default times) stores one application with a `colleagues` array.
- Changing Bob’s end time does not change Alice’s times.
- Switching type to TO drops colleague fields.

---

## M4 — Staff

**Goal.** Staff live in a second in-memory object. Records and staff stay in sync.

**Build**

- In-memory `staff` list: `name`, `openingBalance`, `writeOffMonths`, `active`.
- Manage staff: add; edit name, opening balance (two decimals, negative allowed), write-off months (`YYYY-MM`, unique), active / deactivated.
- Typing a **new** name on a record (main or colleague) creates staff: active, `0.00`, no write-off months.
- Deactivated name cannot be used on a **new** record (main or colleague). Existing applications that already use that name stay.
- Staff names unique after trim.
- Renaming a staff member updates the staff entry and every application main/colleague name that matched the old name.

**Done when**

- Alice typed on a record appears on Manage staff with `0.00` and active.
- Deactivating Alice blocks a new record in her name; an old record still lists her.
- Renaming Alice → Alicia updates the staff row and her applications.
- Write-off months can be added and removed on the staff page.

---

## M5 — Import / export

**Goal.** The two JSON files are the only way to keep data after the tab closes.

**Build**

- Export records → download `records.json` (`{ "applications": [ ... ] }`).
- Export staff → download `staff.json` (`{ "staff": [ ... ] }`).
- Import records from a `.json` file; import staff from a `.json` file; two separate actions.
- Parse and shape-check against README. On any failure, show an error and **do not** replace in-memory data.
- Successful import replaces only that side (records import does not wipe staff, and the reverse).
- After import, lists and forms show the loaded data.

**Done when**

- Export → close tab → reopen → import both files restores applications and staff.
- Broken JSON or a missing `applications` / `staff` array leaves the previous memory intact.
- Records and staff never download as a single combined file.

---

## M6 — Monthly report

**Goal.** One active staff member, one calendar month, with correct hours and write-off.

**Build**

- Report view: choose an **active** staff member and a month (`YYYY-MM`). Deactivated staff are not listed and get no report.
- Opening = ledger at the start of that month (first opening balance, then every earlier month’s OT/TO and write-offs).
- Lines: this person’s OT and TO hours that fall in the month.
  - Main OT uses the main start/end.
  - Colleague OT uses that colleague’s start/end on the parent application.
  - Own TO uses the TO start/end.
- Do not split stored records. Clip each interval to `[month start, next month start)`.
- Hours per line and totals at two decimals. OT adds, TO subtracts.
- After each application line, show the running **sub-balance**.
- If the chosen month is in that staff member’s `writeOffMonths`, show a write-off after the movements and closing `0.00`.
- Next month’s opening is that closing (zero after write-off).

**Done when** (use this fixture)

- Alice opening `2.00`, write-off month `2026-04`.
- One OT: 31 Mar 22:00 → 1 Apr 02:00, Alice only, reason “Night cover”.
- March report: opening `2.00`, OT slice `2.00`, closing `4.00`, no write-off.
- April report: opening `4.00`, OT slice `2.00`, write-off `6.00`, closing `0.00`.
- Bob as colleague on that same OT appears on **Bob’s** April/March reports with his own clipped hours, not on Alice’s extra lines.

---

## M7 — Validation pass

**Goal.** Common-sense rules from the README all hold. This is the last development milestone.

**Check and fix**

- Required fields; trimmed names; end after start (main and each colleague).
- Hours always displayed as two decimals; computed, not typed.
- Deactivated names blocked only on **new** records; edit of an old record that already names them still allowed unless you also change the name to another deactivated person.
- Unique staff names; unique write-off months per staff; valid `YYYY-MM`.
- Main person not also a colleague; no duplicate colleagues on one OT.
- Same person cannot have overlapping OT and TO (create, edit, import). End touching start is allowed.
- Month-crossing clip is report-only; `records.json` still has one application.
- Failed import does not clobber memory.
- Tab close still loses unsaved memory.
- No extra screens, no `localStorage`, no mailbox features.

**Done when**

- The M6 fixture still passes.
- A TO spanning two months reports as two slices, one stored record.
- A bad staff import (for example `{ "staff": "nope" }`) is rejected and staff in memory is unchanged.
- README and this file still match what the app does. Update the docs if a small behaviour had to be clarified; do not silently add features.

---

## After M7

The app is usable: enter mail-based OT/TO, manage staff, export two files, import them next session, run monthly reports.

Further work is out of scope until the design says so (print, extra screens, browser save, mail import, and the rest of the README out-of-scope list).
