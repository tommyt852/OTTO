(function () {
  "use strict";

  const state = {
    applications: [],
    staff: [],
  };

  let writeOffDraft = [];

  const el = {
    banner: document.getElementById("banner"),
    views: document.querySelectorAll(".view"),
    navButtons: document.querySelectorAll("nav [data-view]"),
    recordForm: document.getElementById("record-form"),
    recordId: document.getElementById("record-id"),
    recordType: document.getElementById("record-type"),
    recordStaff: document.getElementById("record-staff"),
    recordStartDate: document.getElementById("record-start-date"),
    recordStartPicker: document.getElementById("record-start-picker"),
    recordStartTime: document.getElementById("record-start-time"),
    recordEndDate: document.getElementById("record-end-date"),
    recordEndPicker: document.getElementById("record-end-picker"),
    recordEndTime: document.getElementById("record-end-time"),
    recordReason: document.getElementById("record-reason"),
    recordHours: document.getElementById("record-hours"),
    lunchWrap: document.getElementById("lunch-wrap"),
    recordLunchPreset: document.getElementById("record-lunch-preset"),
    recordLunchStart: document.getElementById("record-lunch-start"),
    recordLunchEnd: document.getElementById("record-lunch-end"),
    colleaguesHint: document.getElementById("colleagues-hint"),
    colleaguesBlock: document.getElementById("colleagues-block"),
    colleagueRows: document.getElementById("colleague-rows"),
    colleagueTemplate: document.getElementById("colleague-row-template"),
    addColleague: document.getElementById("add-colleague"),
    recordNew: document.getElementById("record-new"),
    recordCancel: document.getElementById("record-cancel"),
    recordFormTitle: document.getElementById("record-form-title"),
    recordList: document.getElementById("record-list"),
    recordFilters: document.getElementById("record-filters"),
    filterType: document.getElementById("filter-type"),
    filterStaff: document.getElementById("filter-staff"),
    filterMonth: document.getElementById("filter-month"),
    filterSort: document.getElementById("filter-sort"),
    filterClear: document.getElementById("filter-clear"),
    recordFilterCount: document.getElementById("record-filter-count"),
    staffForm: document.getElementById("staff-form"),
    staffNew: document.getElementById("staff-new"),
    staffFormTitle: document.getElementById("staff-form-title"),
    staffOriginalName: document.getElementById("staff-original-name"),
    staffName: document.getElementById("staff-name"),
    staffOpening: document.getElementById("staff-opening"),
    staffActive: document.getElementById("staff-active"),
    writeoffList: document.getElementById("writeoff-list"),
    writeoffMonth: document.getElementById("writeoff-month"),
    addWriteoff: document.getElementById("add-writeoff"),
    staffCancel: document.getElementById("staff-cancel"),
    staffList: document.getElementById("staff-list"),
    reportForm: document.getElementById("report-form"),
    reportStaff: document.getElementById("report-staff"),
    reportMonth: document.getElementById("report-month"),
    reportResult: document.getElementById("report-result"),
    exportData: document.getElementById("export-data"),
    importData: document.getElementById("import-data"),
    importDataBtn: document.getElementById("import-data-btn"),
    staffNameOptions: document.getElementById("staff-name-options"),
    toReasonOptions: document.getElementById("to-reason-options"),
    pageZoomOut: document.getElementById("page-zoom-out"),
    pageZoomIn: document.getElementById("page-zoom-in"),
    pageZoomReset: document.getElementById("page-zoom-reset"),
    page: document.getElementById("page"),
  };

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function formatHours(n) {
    return round2(n).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid() {
    return "a-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function showBanner(message, kind) {
    el.banner.hidden = false;
    el.banner.className = kind === "err" ? "err" : "ok";
    el.banner.textContent = message;
  }

  function clearBanner() {
    el.banner.hidden = true;
    el.banner.textContent = "";
    el.banner.className = "";
  }

  function normalizeDate(s) {
    if (typeof s !== "string") return s;
    const match = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return s.trim();
    return pad2(Number(match[1])) + "/" + pad2(Number(match[2])) + "/" + match[3];
  }

  function isValidDate(s) {
    s = normalizeDate(s);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
    const d = Number(s.slice(0, 2));
    const m = Number(s.slice(3, 5));
    const y = Number(s.slice(6, 10));
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function normalizeTime(s) {
    if (typeof s === "string" && /^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
    return s;
  }

  function isValidTime(s) {
    s = normalizeTime(s);
    if (!/^\d{2}:\d{2}$/.test(s)) return false;
    const h = Number(s.slice(0, 2));
    const min = Number(s.slice(3, 5));
    return h >= 0 && h <= 23 && min >= 0 && min <= 59;
  }

  function isValidMonth(s) {
    if (!/^\d{4}-\d{2}$/.test(s)) return false;
    const m = Number(s.slice(5, 7));
    return m >= 1 && m <= 12;
  }

  function parseDateTime(date, time) {
    date = normalizeDate(date);
    time = normalizeTime(time);
    const d = Number(date.slice(0, 2));
    const m = Number(date.slice(3, 5));
    const y = Number(date.slice(6, 10));
    const h = Number(time.slice(0, 2));
    const min = Number(time.slice(3, 5));
    return new Date(y, m - 1, d, h, min, 0, 0);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDate(dt) {
    return pad2(dt.getDate()) + "/" + pad2(dt.getMonth() + 1) + "/" + dt.getFullYear();
  }

  function formatTime(dt) {
    return pad2(dt.getHours()) + ":" + pad2(dt.getMinutes());
  }

  function monthStart(yyyyMm) {
    const y = Number(yyyyMm.slice(0, 4));
    const m = Number(yyyyMm.slice(5, 7));
    return new Date(y, m - 1, 1, 0, 0, 0, 0);
  }

  function nextMonthStart(yyyyMm) {
    const y = Number(yyyyMm.slice(0, 4));
    const m = Number(yyyyMm.slice(5, 7));
    return new Date(y, m, 1, 0, 0, 0, 0);
  }

  function toMonthKey(dt) {
    return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1);
  }

  function hoursBetween(start, end) {
    return round2((end.getTime() - start.getTime()) / 3600000);
  }

  function lunchKey(start, end) {
    return normalizeTime(start) + "-" + normalizeTime(end);
  }

  function lunchPresetValue(slot) {
    if (!slot) return "";
    for (let i = 0; i < LUNCH_PRESETS.length; i += 1) {
      if (lunchKey(LUNCH_PRESETS[i].start, LUNCH_PRESETS[i].end) === lunchKey(slot.start, slot.end)) {
        return lunchKey(LUNCH_PRESETS[i].start, LUNCH_PRESETS[i].end);
      }
    }
    return "custom";
  }

  function fillLunchPresetSelect(select) {
    const current = select.value;
    let html = "<option value=\"\">None</option>";
    LUNCH_PRESETS.forEach(function (p) {
      const value = lunchKey(p.start, p.end);
      html +=
        "<option value=\"" +
        escapeHtml(value) +
        "\">" +
        escapeHtml(p.start + "–" + p.end) +
        "</option>";
    });
    html += "<option value=\"custom\">Custom</option>";
    select.innerHTML = html;
    if (current) select.value = current;
  }

  function parseLunchSlot(raw) {
    if (!raw || typeof raw !== "object") return null;
    const start = normalizeTime(raw.start);
    const end = normalizeTime(raw.end);
    if (!isValidTime(start) || !isValidTime(end)) return null;
    const s = parseDateTime("01/01/2000", start);
    const e = parseDateTime("01/01/2000", end);
    if (e <= s) return null;
    return { start: start, end: end };
  }

  function lunchSelectionError(select, startInput, endInput, label) {
    if (!select || !select.value) return null;
    if (select.value === "custom" && (!startInput.value || !endInput.value)) {
      return label + ": enter custom lunch start and end.";
    }
    if (!lunchFromControls(select, startInput, endInput)) {
      return label + ": lunch end must be after start.";
    }
    return null;
  }

  function lunchFromControls(select, startInput, endInput) {
    const value = select.value;
    if (!value) return null;
    if (value === "custom") {
      return parseLunchSlot({
        start: startInput.value,
        end: endInput.value,
      });
    }
    const parts = value.split("-");
    if (parts.length !== 2) return null;
    return parseLunchSlot({ start: parts[0], end: parts[1] });
  }

  function setLunchControls(select, startInput, endInput, wrapCustom, slot) {
    fillLunchPresetSelect(select);
    const value = lunchPresetValue(slot);
    select.value = value;
    if (value === "custom" && slot) {
      startInput.value = slot.start;
      endInput.value = slot.end;
    } else if (value && value !== "custom") {
      const parts = value.split("-");
      startInput.value = parts[0];
      endInput.value = parts[1];
    } else {
      startInput.value = "";
      endInput.value = "";
    }
    const showCustom = value === "custom";
    if (wrapCustom && wrapCustom.length) {
      wrapCustom.forEach(function (node) {
        node.hidden = !showCustom;
      });
    } else if (startInput && startInput.closest) {
      const row = startInput.closest(".lunch-fields");
      if (row) {
        row.querySelectorAll(".lunch-custom").forEach(function (node) {
          node.hidden = !showCustom;
        });
      }
    }
  }

  function lunchOverlapHours(start, end, lunch) {
    const slot = parseLunchSlot(lunch);
    if (!slot) return 0;
    const lsH = Number(slot.start.slice(0, 2));
    const lsM = Number(slot.start.slice(3, 5));
    const leH = Number(slot.end.slice(0, 2));
    const leM = Number(slot.end.slice(3, 5));
    let total = 0;
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (day <= last) {
      const ls = new Date(day.getFullYear(), day.getMonth(), day.getDate(), lsH, lsM, 0, 0);
      const le = new Date(day.getFullYear(), day.getMonth(), day.getDate(), leH, leM, 0, 0);
      if (le > ls) {
        const from = start > ls ? start : ls;
        const to = end < le ? end : le;
        if (to > from) total = round2(total + hoursBetween(from, to));
      }
      day.setDate(day.getDate() + 1);
    }
    return total;
  }

  function netHours(start, end, lunch) {
    let hours = hoursBetween(start, end);
    const slot = parseLunchSlot(lunch);
    if (slot) {
      hours = round2(hours - lunchOverlapHours(start, end, slot));
      if (hours < 0) hours = 0;
    }
    return hours;
  }

  function intervalHours(date1, time1, date2, time2, lunch) {
    if (!isValidDate(date1) || !isValidTime(time1) || !isValidDate(date2) || !isValidTime(time2)) {
      return null;
    }
    const start = parseDateTime(date1, time1);
    const end = parseDateTime(date2, time2);
    if (end <= start) return null;
    return netHours(start, end, lunch);
  }

  function clipIntervalToMonth(date1, time1, date2, time2, yyyyMm, lunch) {
    const start = parseDateTime(date1, time1);
    const end = parseDateTime(date2, time2);
    const fromBound = monthStart(yyyyMm);
    const toBound = nextMonthStart(yyyyMm);
    const from = start > fromBound ? start : fromBound;
    const to = end < toBound ? end : toBound;
    if (to <= from) return null;
    const hours = netHours(from, to, lunch);
    if (hours === 0) return null;
    return {
      start: from,
      end: to,
      hours: hours,
    };
  }

  function findStaff(name) {
    const key = name.trim();
    return state.staff.find(function (s) {
      return s.name === key;
    });
  }

  function ensureStaff(name) {
    const key = name.trim();
    let person = findStaff(key);
    if (person) return person;
    person = {
      name: key,
      openingBalance: 0,
      writeOffMonths: [],
      active: true,
    };
    state.staff.push(person);
    sortStaff();
    return person;
  }

  function sortStaff() {
    state.staff.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function nameAllowed(name, previousName, isNewRecord) {
    const key = name.trim();
    const person = findStaff(key);
    if (!person || person.active) return true;
    if (isNewRecord) return false;
    return previousName != null && previousName.trim() === key;
  }

  function applicationNames(app) {
    const names = [app.staffName];
    (app.colleagues || []).forEach(function (c) {
      names.push(c.staffName);
    });
    return names;
  }

  function collectColleagueRows() {
    const rows = [];
    el.colleagueRows.querySelectorAll(".colleague-row").forEach(function (row) {
      rows.push({
        staffName: row.querySelector(".col-name").value.trim(),
        startDate: normalizeDate(row.querySelector(".col-start-date").value),
        startTime: normalizeTime(row.querySelector(".col-start-time").value),
        endDate: normalizeDate(row.querySelector(".col-end-date").value),
        endTime: normalizeTime(row.querySelector(".col-end-time").value),
        lunch: lunchFromControls(
          row.querySelector(".col-lunch-preset"),
          row.querySelector(".col-lunch-start"),
          row.querySelector(".col-lunch-end")
        ),
      });
    });
    return rows;
  }

  function validateInterval(label, date1, time1, date2, time2) {
    if (!date1 || !time1 || !date2 || !time2) {
      return label + ": start and end date/time are required.";
    }
    if (!isValidDate(date1) || !isValidTime(time1) || !isValidDate(date2) || !isValidTime(time2)) {
      return label + ": date or time is not valid.";
    }
    if (parseDateTime(date1, time1) >= parseDateTime(date2, time2)) {
      return label + ": end must be after start.";
    }
    return null;
  }

  function validateApplicationInput(input, isNew, previous) {
    if (input.type !== "OT" && input.type !== "TO") {
      return "Type must be OT or TO.";
    }
    if (!input.staffName) {
      return "Staff name is required.";
    }
    if (!input.reason) {
      return "Reason is required.";
    }
    const mainErr = validateInterval(
      "Main person",
      input.startDate,
      input.startTime,
      input.endDate,
      input.endTime
    );
    if (mainErr) return mainErr;

    const previousMain = previous ? previous.staffName : "";
    if (!nameAllowed(input.staffName, previousMain, isNew)) {
      return "That staff member is deactivated and cannot be used here.";
    }

    const seen = {};
    seen[input.staffName] = true;
    for (let i = 0; i < input.colleagues.length; i += 1) {
      const col = input.colleagues[i];
      const label = "Colleague " + (i + 1);
      if (!col.staffName) {
        return label + ": name is required.";
      }
      if (seen[col.staffName]) {
        return "The main person cannot also be a colleague, and colleague names must be unique.";
      }
      seen[col.staffName] = true;
      const colErr = validateInterval(label, col.startDate, col.startTime, col.endDate, col.endTime);
      if (colErr) return colErr;
      const prevCol = previous
        ? (previous.colleagues || []).find(function (c) {
            return c.staffName === col.staffName;
          })
        : null;
      const prevName = prevCol ? prevCol.staffName : "";
      if (!nameAllowed(col.staffName, prevName, isNew)) {
        return "That staff member is deactivated and cannot be used here.";
      }
    }
    return findOtToOverlapError(input, previous ? previous.id : null);
  }

  function validateStaffInput(input, originalName) {
    if (!input.name) {
      return "Staff name is required.";
    }
    if (!Number.isFinite(input.openingBalance)) {
      return "Opening balance must be a number.";
    }
    const clash = state.staff.find(function (s) {
      return s.name === input.name && s.name !== originalName;
    });
    if (clash) {
      return "Staff names must be unique.";
    }
    const months = input.writeOffMonths;
    const uniq = {};
    for (let i = 0; i < months.length; i += 1) {
      if (!isValidMonth(months[i])) {
        return "Write-off months must be YYYY-MM.";
      }
      if (uniq[months[i]]) {
        return "Write-off months cannot be duplicated.";
      }
      uniq[months[i]] = true;
    }
    return null;
  }

  function renameStaff(oldName, newName) {
    if (oldName === newName) return;
    state.applications.forEach(function (app) {
      if (app.staffName === oldName) app.staffName = newName;
      (app.colleagues || []).forEach(function (c) {
        if (c.staffName === oldName) c.staffName = newName;
      });
    });
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function isOtToPair(typeA, typeB) {
    return (typeA === "OT" && typeB === "TO") || (typeA === "TO" && typeB === "OT");
  }

  function slotLabel(slot) {
    return (
      slot.type +
      " " +
      formatDate(slot.start) +
      " " +
      formatTime(slot.start) +
      " – " +
      formatDate(slot.end) +
      " " +
      formatTime(slot.end)
    );
  }

  function forEachPersonSlot(app, fn) {
    fn(app.staffName, {
      type: app.type,
      start: parseDateTime(app.startDate, app.startTime),
      end: parseDateTime(app.endDate, app.endTime),
      reason: app.reason,
    });
    (app.colleagues || []).forEach(function (c) {
      fn(c.staffName, {
        type: app.type,
        start: parseDateTime(c.startDate, c.startTime),
        end: parseDateTime(c.endDate, c.endTime),
        reason: app.reason,
      });
    });
  }

  function collectSlotsByPerson(applications, skipId) {
    const byPerson = {};
    applications.forEach(function (app) {
      if (skipId && app.id === skipId) return;
      forEachPersonSlot(app, function (name, slot) {
        if (!byPerson[name]) byPerson[name] = [];
        byPerson[name].push(slot);
      });
    });
    return byPerson;
  }

  function overlapMessage(name, a, b) {
    return (
      name +
      " has overlapping OT and TO (" +
      slotLabel(a) +
      " and " +
      slotLabel(b) +
      ")."
    );
  }

  function findOverlapInSlotMap(byPerson) {
    const names = Object.keys(byPerson);
    for (let n = 0; n < names.length; n += 1) {
      const slots = byPerson[names[n]];
      for (let i = 0; i < slots.length; i += 1) {
        for (let j = i + 1; j < slots.length; j += 1) {
          if (
            isOtToPair(slots[i].type, slots[j].type) &&
            rangesOverlap(slots[i].start, slots[i].end, slots[j].start, slots[j].end)
          ) {
            return overlapMessage(names[n], slots[i], slots[j]);
          }
        }
      }
    }
    return null;
  }

  function findOtToOverlapError(record, skipId) {
    const byPerson = collectSlotsByPerson(state.applications, skipId);
    forEachPersonSlot(record, function (name, slot) {
      if (!byPerson[name]) byPerson[name] = [];
      byPerson[name].push(slot);
    });
    return findOverlapInSlotMap(byPerson);
  }

  function findOtToOverlapInList(applications) {
    return findOverlapInSlotMap(collectSlotsByPerson(applications, null));
  }

  function personIntervals(app, personName) {
    const out = [];
    const toLunch = app.type === "TO";
    if (app.staffName === personName) {
      out.push({
        type: app.type,
        startDate: app.startDate,
        startTime: app.startTime,
        endDate: app.endDate,
        endTime: app.endTime,
        reason: app.reason,
        applicationId: app.id,
        lunch: toLunch ? app.lunch : null,
      });
    }
    (app.colleagues || []).forEach(function (c) {
      if (c.staffName === personName) {
        out.push({
          type: app.type,
          startDate: c.startDate,
          startTime: c.startTime,
          endDate: c.endDate,
          endTime: c.endTime,
          reason: app.reason,
          applicationId: app.id,
          lunch: toLunch ? c.lunch : null,
        });
      }
    });
    return out;
  }

  function personMonthHours(personName, yyyyMm) {
    let ot = 0;
    let to = 0;
    const lines = [];
    state.applications.forEach(function (app) {
      personIntervals(app, personName).forEach(function (iv) {
        const clip = clipIntervalToMonth(
          iv.startDate,
          iv.startTime,
          iv.endDate,
          iv.endTime,
          yyyyMm,
          iv.lunch
        );
        if (!clip || clip.hours === 0) return;
        if (iv.type === "OT") ot = round2(ot + clip.hours);
        else to = round2(to + clip.hours);
        lines.push({
          type: iv.type,
          start: clip.start,
          end: clip.end,
          hours: clip.hours,
          reason: iv.reason,
          applicationId: iv.applicationId,
        });
      });
    });
    lines.sort(function (a, b) {
      return a.start.getTime() - b.start.getTime();
    });
    return { ot: ot, to: to, lines: lines };
  }

  function monthsTouched(personName, writeOffMonths) {
    const set = {};
    (writeOffMonths || []).forEach(function (m) {
      set[m] = true;
    });
    state.applications.forEach(function (app) {
      personIntervals(app, personName).forEach(function (iv) {
        const start = parseDateTime(iv.startDate, iv.startTime);
        const end = parseDateTime(iv.endDate, iv.endTime);
        let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= last) {
          set[toMonthKey(cursor)] = true;
          cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }
      });
    });
    return Object.keys(set).sort();
  }

  function openingForMonth(person, yyyyMm) {
    let bal = round2(person.openingBalance);
    const months = monthsTouched(person.name, person.writeOffMonths);
    for (let i = 0; i < months.length; i += 1) {
      const m = months[i];
      if (m >= yyyyMm) break;
      const slice = personMonthHours(person.name, m);
      bal = round2(bal + slice.ot - slice.to);
      if (person.writeOffMonths.indexOf(m) !== -1) bal = 0;
    }
    return bal;
  }

  function buildReport(personName, yyyyMm) {
    const person = findStaff(personName);
    if (!person || !person.active) return null;
    const opening = openingForMonth(person, yyyyMm);
    const slice = personMonthHours(personName, yyyyMm);
    let running = opening;
    const lines = slice.lines.map(function (line) {
      running = round2(line.type === "OT" ? running + line.hours : running - line.hours);
      return {
        type: line.type,
        start: line.start,
        end: line.end,
        hours: line.hours,
        reason: line.reason,
        applicationId: line.applicationId,
        subBalance: running,
      };
    });
    let closing = round2(opening + slice.ot - slice.to);
    const writeOff = person.writeOffMonths.indexOf(yyyyMm) !== -1;
    const beforeWriteOff = closing;
    if (writeOff) closing = 0;
    return {
      person: person,
      month: yyyyMm,
      opening: opening,
      lines: lines,
      ot: slice.ot,
      to: slice.to,
      writeOff: writeOff,
      writeOffAmount: writeOff ? beforeWriteOff : 0,
      closing: closing,
    };
  }

  function isApplicationShape(app, ids) {
    if (!app || typeof app !== "object") return "Each application must be an object.";
    if (typeof app.id !== "string" || !app.id.trim()) return "Each application needs an id.";
    if (ids[app.id]) return "Application ids must be unique.";
    ids[app.id] = true;
    if (app.type !== "OT" && app.type !== "TO") return "Application type must be OT or TO.";
    if (typeof app.staffName !== "string" || !app.staffName.trim()) {
      return "Application staff name is required.";
    }
    if (typeof app.reason !== "string" || !app.reason.trim()) {
      return "Application reason is required.";
    }
    const mainErr = validateInterval(
      "Application " + app.id,
      app.startDate,
      app.startTime,
      app.endDate,
      app.endTime
    );
    if (mainErr) return mainErr;
    let colleagues = app.colleagues;
    if (colleagues == null) colleagues = [];
    if (!Array.isArray(colleagues)) return "colleagues must be an array.";
    const seen = {};
    seen[app.staffName.trim()] = true;
    for (let i = 0; i < colleagues.length; i += 1) {
      const c = colleagues[i];
      if (!c || typeof c !== "object") return "Each colleague must be an object.";
      if (typeof c.staffName !== "string" || !c.staffName.trim()) {
        return "Colleague name is required.";
      }
      if (seen[c.staffName.trim()]) {
        return "Colleague names must be unique and cannot repeat the main person.";
      }
      seen[c.staffName.trim()] = true;
      const colErr = validateInterval(
        "Application " + app.id + " colleague",
        c.startDate,
        c.startTime,
        c.endDate,
        c.endTime
      );
      if (colErr) return colErr;
    }
    return null;
  }

  function parseRecordsPayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { error: "Records file must be an object." };
    }
    if (!Array.isArray(data.applications)) {
      return { error: "Records file must have an applications array." };
    }
    const ids = {};
    const applications = [];
    for (let i = 0; i < data.applications.length; i += 1) {
      const raw = data.applications[i];
      const err = isApplicationShape(raw, ids);
      if (err) return { error: err };
      applications.push({
        id: raw.id.trim(),
        type: raw.type,
        startDate: normalizeDate(raw.startDate),
        startTime: normalizeTime(raw.startTime),
        endDate: normalizeDate(raw.endDate),
        endTime: normalizeTime(raw.endTime),
        staffName: raw.staffName.trim(),
        reason: raw.reason.trim(),
        lunch: raw.type === "TO" ? parseLunchSlot(raw.lunch) : null,
        colleagues: (raw.colleagues || []).map(function (c) {
          return {
            staffName: c.staffName.trim(),
            startDate: normalizeDate(c.startDate),
            startTime: normalizeTime(c.startTime),
            endDate: normalizeDate(c.endDate),
            endTime: normalizeTime(c.endTime),
            lunch: raw.type === "TO" ? parseLunchSlot(c.lunch) : null,
          };
        }),
      });
    }
    const overlap = findOtToOverlapInList(applications);
    if (overlap) return { error: overlap };
    return { applications: applications };
  }

  function parseStaffPayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { error: "Staff file must be an object." };
    }
    if (!Array.isArray(data.staff)) {
      return { error: "Staff file must have a staff array." };
    }
    const names = {};
    const staff = [];
    for (let i = 0; i < data.staff.length; i += 1) {
      const raw = data.staff[i];
      if (!raw || typeof raw !== "object") return { error: "Each staff entry must be an object." };
      if (typeof raw.name !== "string" || !raw.name.trim()) {
        return { error: "Each staff entry needs a name." };
      }
      const name = raw.name.trim();
      if (names[name]) return { error: "Staff names must be unique." };
      names[name] = true;
      if (typeof raw.openingBalance !== "number" || !Number.isFinite(raw.openingBalance)) {
        return { error: "Opening balance must be a number." };
      }
      if (typeof raw.active !== "boolean") return { error: "active must be true or false." };
      if (!Array.isArray(raw.writeOffMonths)) {
        return { error: "writeOffMonths must be an array." };
      }
      const months = [];
      const uniq = {};
      for (let j = 0; j < raw.writeOffMonths.length; j += 1) {
        const m = raw.writeOffMonths[j];
        if (typeof m !== "string" || !isValidMonth(m)) {
          return { error: "Write-off months must be YYYY-MM." };
        }
        if (uniq[m]) return { error: "Write-off months cannot be duplicated." };
        uniq[m] = true;
        months.push(m);
      }
      months.sort();
      staff.push({
        name: name,
        openingBalance: round2(raw.openingBalance),
        writeOffMonths: months,
        active: raw.active,
      });
    }
    staff.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    return { staff: staff };
  }

  function parseDataPayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { error: "Data file must be an object." };
    }
    const records = parseRecordsPayload(data);
    if (records.error) return records;
    const staff = parseStaffPayload(data);
    if (staff.error) return staff;
    return { applications: records.applications, staff: staff.staff };
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function readJsonFile(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        callback(JSON.parse(String(reader.result)));
      } catch (err) {
        showBanner("Import failed: file is not valid JSON.", "err");
      }
    };
    reader.onerror = function () {
      showBanner("Import failed: could not read the file.", "err");
    };
    reader.readAsText(file);
  }

  function showView(name) {
    el.views.forEach(function (view) {
      view.hidden = view.dataset.view !== name;
    });
    el.navButtons.forEach(function (btn) {
      if (btn.dataset.view === name) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  function isToType() {
    return el.recordType.value === "TO";
  }

  function updateMainHours() {
    const lunch = isToType()
      ? lunchFromControls(el.recordLunchPreset, el.recordLunchStart, el.recordLunchEnd)
      : null;
    const hours = intervalHours(
      el.recordStartDate.value,
      el.recordStartTime.value,
      el.recordEndDate.value,
      el.recordEndTime.value,
      lunch
    );
    el.recordHours.textContent = hours == null ? "—" : formatHours(hours);
  }

  function updateColleagueHours(row) {
    const lunch = isToType()
      ? lunchFromControls(
          row.querySelector(".col-lunch-preset"),
          row.querySelector(".col-lunch-start"),
          row.querySelector(".col-lunch-end")
        )
      : null;
    const hours = intervalHours(
      row.querySelector(".col-start-date").value,
      row.querySelector(".col-start-time").value,
      row.querySelector(".col-end-date").value,
      row.querySelector(".col-end-time").value,
      lunch
    );
    row.querySelector(".col-hours").textContent = hours == null ? "—" : formatHours(hours);
  }

  function dmyToIso(s) {
    const n = normalizeDate(s);
    if (!isValidDate(n)) return "";
    return n.slice(6, 10) + "-" + n.slice(3, 5) + "-" + n.slice(0, 2);
  }

  function isoToDmy(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(5, 7));
    const d = Number(s.slice(8, 10));
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return "";
    return pad2(d) + "/" + pad2(m) + "/" + y;
  }

  function syncPickerFromText(textInput, pickerInput) {
    const n = normalizeDate(textInput.value.trim());
    pickerInput.value = isValidDate(n) ? dmyToIso(n) : "";
  }

  function setDateCombo(textInput, pickerInput, dmy) {
    const n = dmy ? normalizeDate(dmy) : "";
    textInput.value = isValidDate(n) ? n : dmy || "";
    syncPickerFromText(textInput, pickerInput);
  }

  function bindDateCombo(textInput, pickerInput) {
    pickerInput.addEventListener("change", function () {
      if (!pickerInput.value) return;
      const dmy = isoToDmy(pickerInput.value);
      if (!dmy) return;
      textInput.value = dmy;
      textInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    textInput.addEventListener("blur", function () {
      const n = normalizeDate(textInput.value.trim());
      if (isValidDate(n)) textInput.value = n;
      syncPickerFromText(textInput, pickerInput);
    });
    textInput.addEventListener("input", function () {
      syncPickerFromText(textInput, pickerInput);
    });
  }

  function defaultEndDate(startInput, endInput, endPicker) {
    const start = startInput.value.trim();
    const end = endInput.value.trim();
    if (start && (!end || end === startInput.dataset.lastStart)) {
      endInput.value = start;
      if (endPicker) syncPickerFromText(endInput, endPicker);
    }
    startInput.dataset.lastStart = start;
  }

  function bindColleagueRow(row) {
    const startInput = row.querySelector(".col-start-date");
    const endInput = row.querySelector(".col-end-date");
    const startPicker = row.querySelector(".col-start-picker");
    const endPicker = row.querySelector(".col-end-picker");
    startInput.dataset.lastStart = startInput.value;
    bindDateCombo(startInput, startPicker);
    bindDateCombo(endInput, endPicker);
    syncPickerFromText(startInput, startPicker);
    syncPickerFromText(endInput, endPicker);
    row.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () {
        if (input === startInput) defaultEndDate(startInput, endInput, endPicker);
        updateColleagueHours(row);
      });
      input.addEventListener("change", function () {
        updateColleagueHours(row);
      });
    });
    row.querySelector(".remove-colleague").addEventListener("click", function () {
      row.remove();
    });
    updateColleagueHours(row);
  }

  function addColleagueRow(data) {
    const node = el.colleagueTemplate.content.firstElementChild.cloneNode(true);
    const values = data || {
      staffName: "",
      startDate: el.recordStartDate.value,
      startTime: el.recordStartTime.value,
      endDate: el.recordEndDate.value,
      endTime: el.recordEndTime.value,
    };
    node.querySelector(".col-name").value = values.staffName || "";
    node.querySelector(".col-start-date").value = values.startDate || "";
    node.querySelector(".col-start-time").value = values.startTime || "";
    node.querySelector(".col-end-date").value = values.endDate || "";
    node.querySelector(".col-end-time").value = values.endTime || "";
    fillLunchPresetSelect(node.querySelector(".col-lunch-preset"));
    setLunchControls(
      node.querySelector(".col-lunch-preset"),
      node.querySelector(".col-lunch-start"),
      node.querySelector(".col-lunch-end"),
      node.querySelectorAll(".lunch-custom"),
      values.lunch || null
    );
    bindColleagueRow(node);
    bindLunchFields(
      node.querySelector(".col-lunch-preset"),
      node.querySelector(".col-lunch-start"),
      node.querySelector(".col-lunch-end"),
      function () {
        updateColleagueHours(node);
      }
    );
    el.colleagueRows.appendChild(node);
    toggleColleagueBlock();
  }

  function bindLunchFields(select, startInput, endInput, onChange) {
    function syncCustom() {
      const show = select.value === "custom";
      const row = select.closest(".lunch-fields");
      if (row) {
        row.querySelectorAll(".lunch-custom").forEach(function (node) {
          node.hidden = !show;
        });
      }
      if (onChange) onChange();
    }
    select.addEventListener("change", syncCustom);
    startInput.addEventListener("input", onChange);
    endInput.addEventListener("input", onChange);
  }

  function renderToReasonOptions() {
    el.toReasonOptions.innerHTML = TO_REASON_PRESETS.map(function (text) {
      return "<option value=\"" + escapeHtml(text) + "\"></option>";
    }).join("");
  }

  function toggleReasonList() {
    if (isToType()) el.recordReason.setAttribute("list", "to-reason-options");
    else el.recordReason.removeAttribute("list");
  }

  function toggleColleagueBlock() {
    const to = isToType();
    el.lunchWrap.hidden = !to;
    toggleReasonList();
    el.colleaguesHint.textContent = to
      ? "New rows copy the main start and end. Each person can set a lunch slot to exclude."
      : "New rows copy the main start and end.";
    el.colleagueRows.querySelectorAll(".col-lunch-wrap").forEach(function (wrap) {
      wrap.hidden = !to;
    });
    updateMainHours();
    el.colleagueRows.querySelectorAll(".colleague-row").forEach(updateColleagueHours);
  }

  function showRecordEditor(title) {
    el.recordFormTitle.textContent = title;
    el.recordForm.hidden = false;
    el.recordForm.scrollIntoView({ block: "nearest" });
  }

  function hideRecordEditor() {
    el.recordForm.hidden = true;
  }

  function resetRecordForm() {
    el.recordForm.reset();
    el.recordId.value = "";
    el.colleagueRows.innerHTML = "";
    el.recordType.value = "OT";
    el.recordStartDate.dataset.lastStart = "";
    setDateCombo(el.recordStartDate, el.recordStartPicker, "");
    setDateCombo(el.recordEndDate, el.recordEndPicker, "");
    el.recordFormTitle.textContent = "New application";
    setLunchControls(
      el.recordLunchPreset,
      el.recordLunchStart,
      el.recordLunchEnd,
      el.lunchWrap.querySelectorAll(".lunch-custom"),
      null
    );
    toggleColleagueBlock();
    updateMainHours();
  }

  function fillRecordForm(app) {
    el.recordId.value = app.id;
    el.recordType.value = app.type;
    el.recordStaff.value = app.staffName;
    setDateCombo(el.recordStartDate, el.recordStartPicker, app.startDate);
    el.recordStartTime.value = app.startTime;
    setDateCombo(el.recordEndDate, el.recordEndPicker, app.endDate);
    el.recordEndTime.value = app.endTime;
    el.recordStartDate.dataset.lastStart = app.startDate;
    el.recordReason.value = app.reason;
    setLunchControls(
      el.recordLunchPreset,
      el.recordLunchStart,
      el.recordLunchEnd,
      el.lunchWrap.querySelectorAll(".lunch-custom"),
      app.type === "TO" ? app.lunch : null
    );
    el.colleagueRows.innerHTML = "";
    (app.colleagues || []).forEach(function (c) {
      addColleagueRow(c);
    });
    toggleColleagueBlock();
    updateMainHours();
    showRecordEditor("Edit application");
  }

  function renderWriteOffList() {
    if (!writeOffDraft.length) {
      el.writeoffList.innerHTML = "<p class=\"muted\">None</p>";
      return;
    }
    el.writeoffList.innerHTML =
      "<div class=\"chip-row\">" +
      writeOffDraft
        .map(function (m, i) {
          return (
            "<span class=\"chip\">" +
            escapeHtml(m) +
            "<button type=\"button\" data-remove-writeoff=\"" +
            i +
            "\" aria-label=\"Remove " +
            escapeHtml(m) +
            "\">×</button></span>"
          );
        })
        .join("") +
      "</div>";
  }

  function showStaffEditor(title) {
    el.staffFormTitle.textContent = title;
    el.staffForm.hidden = false;
    el.staffForm.scrollIntoView({ block: "nearest" });
  }

  function hideStaffEditor() {
    el.staffForm.hidden = true;
  }

  function resetStaffForm() {
    el.staffForm.reset();
    el.staffOriginalName.value = "";
    el.staffOpening.value = "0.00";
    el.staffActive.checked = true;
    writeOffDraft = [];
    el.staffFormTitle.textContent = "Add staff";
    renderWriteOffList();
  }

  function fillStaffForm(person) {
    el.staffOriginalName.value = person.name;
    el.staffName.value = person.name;
    el.staffOpening.value = formatHours(person.openingBalance);
    el.staffActive.checked = person.active;
    writeOffDraft = person.writeOffMonths.slice();
    renderWriteOffList();
    showStaffEditor("Edit staff");
  }

  function appIncludesStaff(app, name) {
    if (app.staffName === name) return true;
    return (app.colleagues || []).some(function (c) {
      return c.staffName === name;
    });
  }

  function appTouchesMonth(app, yyyyMm) {
    if (clipIntervalToMonth(app.startDate, app.startTime, app.endDate, app.endTime, yyyyMm)) {
      return true;
    }
    if (app.type !== "OT") return false;
    return (app.colleagues || []).some(function (c) {
      return !!clipIntervalToMonth(c.startDate, c.startTime, c.endDate, c.endTime, yyyyMm);
    });
  }

  function filteredApplications() {
    const type = el.filterType.value;
    const staff = el.filterStaff.value;
    const month = el.filterMonth.value;
    const sort = el.filterSort.value;
    const list = state.applications.filter(function (app) {
      if (type && app.type !== type) return false;
      if (staff && !appIncludesStaff(app, staff)) return false;
      if (month && isValidMonth(month) && !appTouchesMonth(app, month)) return false;
      return true;
    });
    list.sort(function (a, b) {
      const diff =
        parseDateTime(a.startDate, a.startTime) - parseDateTime(b.startDate, b.startTime);
      return sort === "asc" ? diff : -diff;
    });
    return list;
  }

  function renderRecordFilterStaff() {
    const current = el.filterStaff.value;
    const names = {};
    state.staff.forEach(function (s) {
      names[s.name] = true;
    });
    state.applications.forEach(function (app) {
      names[app.staffName] = true;
      (app.colleagues || []).forEach(function (c) {
        if (c.staffName) names[c.staffName] = true;
      });
    });
    const sorted = Object.keys(names).sort(function (a, b) {
      return a.localeCompare(b);
    });
    el.filterStaff.innerHTML =
      "<option value=\"\">All</option>" +
      sorted
        .map(function (name) {
          return "<option value=\"" + escapeHtml(name) + "\">" + escapeHtml(name) + "</option>";
        })
        .join("");
    if (names[current]) el.filterStaff.value = current;
  }

  function renderRecords() {
    renderRecordFilterStaff();
    if (!state.applications.length) {
      el.recordFilterCount.textContent = "";
      el.recordList.innerHTML = "<p class=\"empty\">No applications yet.</p>";
      return;
    }
    const list = filteredApplications();
    const total = state.applications.length;
    if (list.length === total) {
      el.recordFilterCount.textContent = total + " application" + (total === 1 ? "" : "s");
    } else {
      el.recordFilterCount.textContent =
        list.length + " of " + total + " applications";
    }
    if (!list.length) {
      el.recordList.innerHTML = "<p class=\"empty\">No applications match these filters.</p>";
      return;
    }
    const rows = list
      .map(function (app) {
        const hours = intervalHours(
          app.startDate,
          app.startTime,
          app.endDate,
          app.endTime,
          app.type === "TO" ? app.lunch : null
        );
        const colNames = (app.colleagues || [])
          .map(function (c) {
            return c.staffName;
          })
          .filter(Boolean);
        const withCell = colNames.length
          ? escapeHtml(colNames.join(", "))
          : "<span class=\"muted\">—</span>";
        const badgeClass = app.type === "OT" ? "badge-ot" : "badge-to";
        return (
          "<tr>" +
          "<td><span class=\"badge " +
          badgeClass +
          "\">" +
          escapeHtml(app.type) +
          "</span></td>" +
          "<td>" +
          escapeHtml(app.staffName) +
          "</td>" +
          "<td>" +
          withCell +
          "</td>" +
          "<td class=\"period\">" +
          escapeHtml(app.startDate + " " + app.startTime) +
          "<div class=\"muted\">" +
          escapeHtml(app.endDate + " " + app.endTime) +
          "</div></td>" +
          "<td class=\"num\">" +
          formatHours(hours) +
          "</td>" +
          "<td>" +
          escapeHtml(app.reason) +
          "</td>" +
          "<td class=\"row-actions\">" +
          "<button type=\"button\" data-edit-record=\"" +
          escapeHtml(app.id) +
          "\">Edit</button>" +
          "<button type=\"button\" class=\"btn-danger\" data-delete-record=\"" +
          escapeHtml(app.id) +
          "\">Delete</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    el.recordList.innerHTML =
      "<div class=\"table-wrap\"><table><thead><tr>" +
      "<th>Type</th><th>Staff</th><th>With</th><th>Period</th><th class=\"num\">Hours</th><th>Reason</th><th></th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>";
  }

  function renderStaffOptions() {
    const names = state.staff
      .filter(function (s) {
        return s.active;
      })
      .map(function (s) {
        return s.name;
      });
    el.staffNameOptions.innerHTML = names
      .map(function (name) {
        return "<option value=\"" + escapeHtml(name) + "\"></option>";
      })
      .join("");
  }

  function renderStaff() {
    if (!state.staff.length) {
      el.staffList.innerHTML = "<p class=\"empty\">No staff yet. Add someone here or type a new name on a record.</p>";
      return;
    }
    const rows = state.staff
      .map(function (s) {
        const months = s.writeOffMonths.length ? s.writeOffMonths.join(", ") : "—";
        const status = s.active ? "Active" : "Deactivated";
        return (
          "<tr>" +
          "<td>" +
          escapeHtml(s.name) +
          "</td>" +
          "<td class=\"num\">" +
          formatHours(s.openingBalance) +
          "</td>" +
          "<td>" +
          escapeHtml(months) +
          "</td>" +
          "<td>" +
          (s.active ? status : "<span class=\"inactive-tag\">" + status + "</span>") +
          "</td>" +
          "<td class=\"row-actions\">" +
          "<button type=\"button\" data-edit-staff=\"" +
          escapeHtml(s.name) +
          "\">Edit</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    el.staffList.innerHTML =
      "<div class=\"table-wrap\"><table><thead><tr>" +
      "<th>Name</th><th class=\"num\">Opening</th><th>Write-off months</th><th>Status</th><th></th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>";
  }

  function renderReportStaffOptions() {
    const current = el.reportStaff.value;
    const active = state.staff.filter(function (s) {
      return s.active;
    });
    if (!active.length) {
      el.reportStaff.innerHTML = "<option value=\"\">No active staff</option>";
      return;
    }
    el.reportStaff.innerHTML = active
      .map(function (s) {
        return "<option value=\"" + escapeHtml(s.name) + "\">" + escapeHtml(s.name) + "</option>";
      })
      .join("");
    if (active.some(function (s) { return s.name === current; })) {
      el.reportStaff.value = current;
    }
  }

  function renderReport(report) {
    if (!report) {
      el.reportResult.innerHTML = "<p class=\"empty\">Choose an active staff member and a month.</p>";
      return;
    }
    const lineRows = report.lines.length
      ? report.lines
          .map(function (line) {
            const sign = line.type === "OT" ? "+" : "−";
            const badgeClass = line.type === "OT" ? "badge-ot" : "badge-to";
            return (
              "<tr>" +
              "<td><span class=\"badge " +
              badgeClass +
              "\">" +
              escapeHtml(line.type) +
              "</span></td>" +
              "<td class=\"period\">" +
              escapeHtml(formatDate(line.start) + " " + formatTime(line.start)) +
              "</td>" +
              "<td class=\"period\">" +
              escapeHtml(formatDate(line.end) + " " + formatTime(line.end)) +
              "</td>" +
              "<td>" +
              escapeHtml(line.reason) +
              "</td>" +
              "<td class=\"num\">" +
              sign +
              formatHours(line.hours) +
              "</td>" +
              "<td class=\"num\">" +
              formatHours(line.subBalance) +
              "</td>" +
              "</tr>"
            );
          })
          .join("")
      : "<tr><td colspan=\"6\" class=\"muted\">No OT or TO in this month.</td></tr>";

    const writeOffRow = report.writeOff
      ? "<tr class=\"ledger-writeoff\"><td colspan=\"4\">Write-off (balance cleared)</td><td></td><td class=\"num\">" +
        formatHours(report.closing) +
        "</td></tr>"
      : "";

    el.reportResult.innerHTML =
      "<div class=\"report-head\">" +
      "<p><strong>" +
      escapeHtml(report.person.name) +
      "</strong></p>" +
      "<p class=\"muted\">" +
      escapeHtml(report.month) +
      " · OT +" +
      formatHours(report.ot) +
      " · TO −" +
      formatHours(report.to) +
      "</p>" +
      "</div>" +
      "<div class=\"table-wrap\"><table class=\"ledger\"><thead><tr>" +
      "<th>Type</th><th>Start</th><th>End</th><th>Reason</th><th class=\"num\">Hours</th><th class=\"num\">Sub-balance</th>" +
      "</tr></thead><tbody>" +
      "<tr class=\"ledger-open\"><td colspan=\"4\">Opening balance</td><td></td><td class=\"num\">" +
      formatHours(report.opening) +
      "</td></tr>" +
      lineRows +
      writeOffRow +
      "</tbody><tfoot><tr class=\"ledger-close\"><td colspan=\"4\">Closing balance</td><td></td><td class=\"num\">" +
      formatHours(report.closing) +
      "</td></tr></tfoot></table></div>";
  }

  function refresh() {
    renderRecords();
    renderStaff();
    renderStaffOptions();
    renderReportStaffOptions();
  }

  function saveRecord(event) {
    event.preventDefault();
    clearBanner();
    const isNew = !el.recordId.value;
    const previous = isNew
      ? null
      : state.applications.find(function (a) {
          return a.id === el.recordId.value;
        });
    const input = {
      type: el.recordType.value,
      staffName: el.recordStaff.value.trim(),
      startDate: normalizeDate(el.recordStartDate.value),
      startTime: normalizeTime(el.recordStartTime.value),
      endDate: normalizeDate(el.recordEndDate.value),
      endTime: normalizeTime(el.recordEndTime.value),
      reason: el.recordReason.value.trim(),
      lunch: isToType()
        ? lunchFromControls(el.recordLunchPreset, el.recordLunchStart, el.recordLunchEnd)
        : null,
      colleagues: collectColleagueRows(),
    };
    if (isToType()) {
      const lunchErr = lunchSelectionError(
        el.recordLunchPreset,
        el.recordLunchStart,
        el.recordLunchEnd,
        "Main person"
      );
      if (lunchErr) {
        showBanner(lunchErr, "err");
        return;
      }
      const colRows = el.colleagueRows.querySelectorAll(".colleague-row");
      for (let i = 0; i < colRows.length; i += 1) {
        const colErr = lunchSelectionError(
          colRows[i].querySelector(".col-lunch-preset"),
          colRows[i].querySelector(".col-lunch-start"),
          colRows[i].querySelector(".col-lunch-end"),
          "Colleague " + (i + 1)
        );
        if (colErr) {
          showBanner(colErr, "err");
          return;
        }
      }
    }
    const err = validateApplicationInput(input, isNew, previous);
    if (err) {
      showBanner(err, "err");
      return;
    }
    const record = {
      id: isNew ? uid() : previous.id,
      type: input.type,
      startDate: input.startDate,
      startTime: input.startTime,
      endDate: input.endDate,
      endTime: input.endTime,
      staffName: input.staffName,
      reason: input.reason,
      lunch: input.type === "TO" ? input.lunch : null,
      colleagues: input.colleagues.map(function (c) {
        return {
          staffName: c.staffName,
          startDate: c.startDate,
          startTime: c.startTime,
          endDate: c.endDate,
          endTime: c.endTime,
          lunch: input.type === "TO" ? c.lunch || null : null,
        };
      }),
    };
    if (!record.lunch) delete record.lunch;
    record.colleagues.forEach(function (c) {
      if (!c.lunch) delete c.lunch;
    });
    applicationNames(record).forEach(ensureStaff);
    if (isNew) state.applications.push(record);
    else {
      const idx = state.applications.findIndex(function (a) {
        return a.id === record.id;
      });
      state.applications[idx] = record;
    }
    resetRecordForm();
    hideRecordEditor();
    refresh();
    showBanner(isNew ? "Application saved." : "Application updated.", "ok");
  }

  function saveStaff(event) {
    event.preventDefault();
    clearBanner();
    const originalName = el.staffOriginalName.value.trim();
    const input = {
      name: el.staffName.value.trim(),
      openingBalance: round2(Number(el.staffOpening.value)),
      writeOffMonths: writeOffDraft.slice().sort(),
      active: el.staffActive.checked,
    };
    const err = validateStaffInput(input, originalName);
    if (err) {
      showBanner(err, "err");
      return;
    }
    if (originalName) {
      const person = findStaff(originalName);
      if (!person) {
        showBanner("Staff member not found.", "err");
        return;
      }
      renameStaff(originalName, input.name);
      person.name = input.name;
      person.openingBalance = input.openingBalance;
      person.writeOffMonths = input.writeOffMonths;
      person.active = input.active;
    } else {
      state.staff.push({
        name: input.name,
        openingBalance: input.openingBalance,
        writeOffMonths: input.writeOffMonths,
        active: input.active,
      });
    }
    sortStaff();
    resetStaffForm();
    hideStaffEditor();
    refresh();
    el.reportResult.innerHTML = "";
    showBanner("Staff saved.", "ok");
  }

  el.navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showView(btn.dataset.view);
    });
  });

  bindDateCombo(el.recordStartDate, el.recordStartPicker);
  bindDateCombo(el.recordEndDate, el.recordEndPicker);
  el.recordStartDate.addEventListener("input", function () {
    defaultEndDate(el.recordStartDate, el.recordEndDate, el.recordEndPicker);
    updateMainHours();
  });
  [el.recordStartTime, el.recordEndDate, el.recordEndTime].forEach(function (input) {
    input.addEventListener("input", updateMainHours);
  });

  el.recordType.addEventListener("change", toggleColleagueBlock);

  el.addColleague.addEventListener("click", function () {
    addColleagueRow();
  });

  el.recordFilters.addEventListener("submit", function (event) {
    event.preventDefault();
  });
  el.recordFilters.addEventListener("change", function () {
    renderRecords();
  });
  el.filterClear.addEventListener("click", function () {
    el.filterType.value = "";
    el.filterStaff.value = "";
    el.filterMonth.value = "";
    el.filterSort.value = "desc";
    renderRecords();
  });

  el.recordNew.addEventListener("click", function () {
    clearBanner();
    resetRecordForm();
    showRecordEditor("New application");
    el.recordStaff.focus();
  });

  el.recordForm.addEventListener("submit", saveRecord);
  el.recordCancel.addEventListener("click", function () {
    clearBanner();
    resetRecordForm();
    hideRecordEditor();
  });

  el.recordList.addEventListener("click", function (event) {
    const editId = event.target.getAttribute("data-edit-record");
    const deleteId = event.target.getAttribute("data-delete-record");
    if (editId) {
      const app = state.applications.find(function (a) {
        return a.id === editId;
      });
      if (!app) return;
      fillRecordForm(app);
      clearBanner();
      el.recordForm.scrollIntoView({ block: "start" });
    }
    if (deleteId) {
      const app = state.applications.find(function (a) {
        return a.id === deleteId;
      });
      if (!app) return;
      if (!window.confirm("Delete this application? This cannot be undone in this tab.")) return;
      state.applications = state.applications.filter(function (a) {
        return a.id !== deleteId;
      });
      if (el.recordId.value === deleteId) {
        resetRecordForm();
        hideRecordEditor();
      }
      refresh();
      showBanner("Application deleted.", "ok");
    }
  });

  el.addWriteoff.addEventListener("click", function () {
    const month = el.writeoffMonth.value;
    if (!isValidMonth(month)) {
      showBanner("Choose a valid write-off month.", "err");
      return;
    }
    if (writeOffDraft.indexOf(month) !== -1) {
      showBanner("That write-off month is already listed.", "err");
      return;
    }
    writeOffDraft.push(month);
    writeOffDraft.sort();
    el.writeoffMonth.value = "";
    renderWriteOffList();
    clearBanner();
  });

  el.writeoffList.addEventListener("click", function (event) {
    const idx = event.target.getAttribute("data-remove-writeoff");
    if (idx == null) return;
    writeOffDraft.splice(Number(idx), 1);
    renderWriteOffList();
  });

  el.staffNew.addEventListener("click", function () {
    clearBanner();
    resetStaffForm();
    showStaffEditor("Add staff");
    el.staffName.focus();
  });

  el.staffForm.addEventListener("submit", saveStaff);
  el.staffCancel.addEventListener("click", function () {
    clearBanner();
    resetStaffForm();
    hideStaffEditor();
  });

  el.staffList.addEventListener("click", function (event) {
    const name = event.target.getAttribute("data-edit-staff");
    if (!name) return;
    const person = findStaff(name);
    if (!person) return;
    fillStaffForm(person);
    clearBanner();
    el.staffForm.scrollIntoView({ block: "start" });
  });

  el.reportForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearBanner();
    const name = el.reportStaff.value;
    const month = el.reportMonth.value;
    if (!name) {
      showBanner("No active staff to report on.", "err");
      return;
    }
    if (!isValidMonth(month)) {
      showBanner("Choose a month.", "err");
      return;
    }
    const report = buildReport(name, month);
    if (!report) {
      showBanner("Monthly report is only for active staff.", "err");
      el.reportResult.innerHTML = "";
      return;
    }
    renderReport(report);
  });

  el.importDataBtn.addEventListener("click", function () {
    el.importData.click();
  });

  el.exportData.addEventListener("click", function () {
    downloadJson("data.json", {
      applications: state.applications,
      staff: state.staff,
    });
    showBanner("Data file downloaded.", "ok");
  });

  el.importData.addEventListener("change", function () {
    const file = el.importData.files[0];
    el.importData.value = "";
    readJsonFile(file, function (data) {
      const parsed = parseDataPayload(data);
      if (parsed.error) {
        showBanner("Import failed: " + parsed.error, "err");
        return;
      }
      state.applications = parsed.applications;
      state.staff = parsed.staff;
      parsed.applications.forEach(function (app) {
        applicationNames(app).forEach(function (name) {
          if (!findStaff(name)) ensureStaff(name);
        });
      });
      resetRecordForm();
      hideRecordEditor();
      resetStaffForm();
      hideStaffEditor();
      refresh();
      el.reportResult.innerHTML = "<p class=\"empty\">Choose an active staff member and a month.</p>";
      showBanner("Data imported.", "ok");
    });
  });

  var pageZoom = PAGE_ZOOM_DEFAULT;

  function applyPageZoom() {
    document.documentElement.style.zoom = "";
    el.page.style.zoom = pageZoom + "%";
    el.pageZoomReset.textContent = pageZoom + "%";
    el.pageZoomOut.disabled = pageZoom <= PAGE_ZOOM_MIN;
    el.pageZoomIn.disabled = pageZoom >= PAGE_ZOOM_MAX;
  }

  el.pageZoomOut.addEventListener("click", function () {
    pageZoom = Math.max(PAGE_ZOOM_MIN, pageZoom - PAGE_ZOOM_STEP);
    applyPageZoom();
  });
  el.pageZoomIn.addEventListener("click", function () {
    pageZoom = Math.min(PAGE_ZOOM_MAX, pageZoom + PAGE_ZOOM_STEP);
    applyPageZoom();
  });
  el.pageZoomReset.addEventListener("click", function () {
    pageZoom = PAGE_ZOOM_DEFAULT;
    applyPageZoom();
  });

  fillLunchPresetSelect(el.recordLunchPreset);
  fillLunchPresetSelect(el.colleagueTemplate.content.querySelector(".col-lunch-preset"));
  renderToReasonOptions();
  bindLunchFields(el.recordLunchPreset, el.recordLunchStart, el.recordLunchEnd, updateMainHours);

  showView("records");
  toggleColleagueBlock();
  resetStaffForm();
  el.recordStartDate.dataset.lastStart = "";
  refresh();
  updateMainHours();
  applyPageZoom();
})();
