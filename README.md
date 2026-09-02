# OTTO

Overtime (OT) and time-off (TO) recording for a single user.

The user receives applications by email and types them into OTTO by hand. OTTO does not read mailboxes or import mail.

## Constraints

- Pure frontend: HTML, CSS, and JavaScript only. No server, no framework, no build step.
- Keep HTML lean. Structure in HTML, styles in CSS, behaviour in JS. Do not dump CSS or JS into the markup.
- One user. No login.
- No screens beyond the three listed below.

## Screens

1. **Records** — create, edit, and delete OT/TO applications. The list can be filtered by type, staff, and month, and sorted by date ascending or descending.
2. **Manage staff** — staff name, first opening balance, write-off month(s), active / deactivated.
3. **Monthly report** — per active staff member, per calendar month.

One page with these three views is enough.

## Application (OT / TO)

Each application is **one record**, even if it crosses a month or includes colleagues.

| Field | Required | Notes |
| --- | --- | --- |
| Type | Yes | `OT` or `TO` |
| Start date | Yes | Calendar date the period begins (`DD/MM/YYYY`) |
| Start time | Yes | Time the period begins |
| End date | Yes | Calendar date the period ends (`DD/MM/YYYY`). Defaults to the start date. |
| End time | Yes | Time the period ends |
| Staff name | Yes | Main person. Choose from the staff list or type a new name. Must not be a deactivated staff name. |
| Reason | Yes | Why the OT or TO exists |

### OT colleagues

TO is always one person. No colleagues.

OT may include colleagues who joined the same overtime:

- Chosen from the staff list or typed on the main person’s application if the name is new.
- Each colleague has their own name and start/end date and time.
- Defaults: same start/end as the main person. End date defaults to that person’s start date.
- Those times can be changed per colleague while creating and while editing.
- A colleague name must follow the same staff rules as the main name (list or type, not deactivated).
- Adding or removing colleagues is allowed when creating or editing.

The whole OT (main person + colleagues) is still **one application**. Delete removes all of it.

### Month-crossing applications

Do **not** split storage. One application stays one record.

When a monthly report is generated, hours that fall in that month are clipped to the month. A span from 31 Mar 22:00 to 1 Apr 02:00 reports as:

- March: 31 Mar 22:00 → 1 Apr 00:00 (2.00 hours)
- April: 1 Apr 00:00 → 1 Apr 02:00 (2.00 hours)

If the range crosses more than one month boundary, each month gets its own slice. Slices stay linked to the same application (same type, reason, people).

## Staff

Staff names are chosen from the list or typed on a record when the person does not exist yet. Staff details are stored in the same JSON data file as applications.

| Field | Meaning |
| --- | --- |
| Name | Identity. Join key to applications (main and colleagues). |
| Opening balance | First opening the user sets. Hours, two decimals. |
| Write-off months | Calendar months (`YYYY-MM`) when closing balance is written off (contract renewal). Zero or more. |
| Active | Active or deactivated |

### Manage staff

The user can:

- Add a staff member
- Edit name, opening balance, write-off months, and active / deactivated
- There is no monthly report action on this page

Name is the identity. If a name is changed, update that staff entry **and** every application (main or colleague) that used the old name so history stays attached.

Typing a **new** name on a record (unknown, not deactivated) adds that person as active, opening balance `0.00`, no write-off months. The user then edits opening balance and write-off months here when needed.

### Deactivated staff

- Cannot be typed on a **new** record (main or colleague).
- Existing applications that already name them are left as history.
- **No monthly report** for deactivated staff.

## Hours and balance

- Unit: **hours**, always **two decimal places** (e.g. `8.50`, `2.25`).
- Duration = end date/time minus start date/time, rounded to two decimals.
- **OT adds** to the balance.
- **TO subtracts** from the balance.
- Each person has their own running balance (main OT, colleague OT, and their own TO all count for that person only).

### Monthly report (active staff only)

For one staff member and one calendar month:

1. **Opening balance** — ledger at the start of that month.
2. **All OT and TO in that month** — this person’s hours only; month-crossing applications appear as the in-month slice, still tied to the original application. After each application line, show the **sub-balance** (running total from the opening, OT added, TO subtracted).
3. **Closing balance** — after that month’s OT/TO (same as the last sub-balance, before any write-off).
4. If this month is a **write-off month** for that staff member, the closing balance is written off (cleared). Show the write-off on the report. The next month’s opening is `0.00`.

Ledger walk:

- Start from the staff member’s first opening balance.
- Apply months in order: add OT hours, subtract TO hours, then apply write-off if that month is listed.
- Opening of month *M* = closing of the previous month (after write-off, if any).

## Persistence

- While the tab is open, data lives in memory as JSON objects.
- **Closing the tab discards memory.** Nothing is kept in the browser.
- Safety is a file: **Export data** to save, **Import data** to restore.
- **One `.json` file** holds both applications and staff (`data.json`).

Typical flow: import data → work → export data.

## File format

### Data file (`data.json`)

```json
{
  "applications": [
    {
      "id": "a1",
      "type": "OT",
      "startDate": "31/03/2026",
      "startTime": "22:00",
      "endDate": "01/04/2026",
      "endTime": "02:00",
      "staffName": "Alice",
      "reason": "Night cover",
      "colleagues": [
        {
          "staffName": "Bob",
          "startDate": "31/03/2026",
          "startTime": "22:00",
          "endDate": "01/04/2026",
          "endTime": "02:00"
        }
      ]
    }
  ],
  "staff": [
    {
      "name": "Alice",
      "openingBalance": 0.00,
      "writeOffMonths": ["2026-04"],
      "active": true
    }
  ]
}
```

- `type` is `"OT"` or `"TO"`.
- `colleagues` is only used for OT. TO uses `[]` or omits the field.
- Dates `DD/MM/YYYY`, times `HH:mm` (24-hour).
- `id` uniquely identifies the application for edit/delete.
- `openingBalance` is a number stored at two decimal places.
- `writeOffMonths` entries are `"YYYY-MM"`.
- `active` is `true` or `false`.

## Validation (common sense)

- All required application fields must be filled.
- Dates are `DD/MM/YYYY`. Type them or pick from the calendar. End date defaults to the start date and can be changed.
- End date/time must be after start date/time (main person and each colleague).
- OT and TO must not overlap for the same person (including OT as a colleague). Touching at an endpoint is allowed. Overlap is rejected on create, edit, and import.
- Staff name and colleague names: non-empty after trim; must not match a deactivated staff name on **new** records.
- Duplicate colleague names on the same OT are not allowed. The main person must not also appear as a colleague.
- Hours are computed, not typed, and shown with two decimals.
- Opening balance must be a number (two decimals). Negative opening is allowed if the user enters it.
- Write-off months must be valid `YYYY-MM` values, no duplicates per staff.
- Staff names are unique (trim). Two active/deactivated people cannot share the same name.
- Import rejects invalid JSON and objects that do not match the shapes above. A failed import must not replace in-memory data.
- Export downloads the current in-memory applications and staff as one `.json` file.

## Out of scope (for now)

- Mailbox integration
- Login, multiple users, roles, approvals
- Browser storage (localStorage, etc.)
- Extra screens (print layout, settings, dashboards)
- Multi-person TO
- Splitting an application into multiple stored records
- Backend or database
