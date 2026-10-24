/**
 * Logic tính ngày đến hạn + cascade trượt chuyền (khớp due-schedule.service.js)
 */

function fmtDate(d) {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return fmtDate(d);
}

function addMonthsClamped(dateStr, months) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetMonthIndex = m - 1 + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();
  const day = Math.min(d, daysInTargetMonth);
  return `${targetYear}-${String(normalizedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const CYCLE_MONTHS = { "1_month": 1, "1_year": 12 };

/**
 * Hỗ trợ cả 2 kiểu tên field:
 * - local-api: lastMaintenanceDate / startDate / maintenanceCycle
 * - bảng eqm_mnt: max_mt_date / use_date / maintenance_type
 */
function getNextDueDay(device) {
  const base =
    fmtDate(device.lastMaintenanceDate) ||
    fmtDate(device.max_mt_date) ||
    fmtDate(device.startDate) ||
    fmtDate(device.use_date);

  if (!base) return null;

  const cycle =
    device.maintenanceCycle ||
    device.maintenance_type ||
    device.maintenanceType ||
    "1_month";

  if (cycle === "1_week") return addDays(base, 7);
  if (cycle === "2_weeks" || cycle === "2_week") return addDays(base, 14);
  return addMonthsClamped(base, CYCLE_MONTHS[cycle] || 1);
}

function isSunday(dateStr) {
  const days = Math.round(
    (Date.parse(`${dateStr}T00:00:00Z`) - Date.parse("1900-01-01T00:00:00Z")) /
      86400000,
  );
  return days % 7 === 6;
}

function isRestDay(dateStr, holidaySet) {
  return isSunday(dateStr) || holidaySet.has(dateStr);
}

/**
 * Cascade trượt chuyền — port từ due-schedule.service.js
 * rows: { equ_no, use_date, max_mt_date, maintenance_type }
 * return Map<equ_no, dueStr>
 */
function buildEffectiveDueMap(rows, holidaySet) {
  const byDate = new Map(); // hạn gốc -> [equNo, ...]

  for (const row of rows) {
    const due = getNextDueDay({
      startDate: row.use_date,
      lastMaintenanceDate: row.max_mt_date,
      maintenanceCycle: row.maintenance_type,
    });
    if (!due) continue;

    const batch = byDate.get(due);
    if (batch) batch.push(row.equ_no);
    else byDate.set(due, [row.equ_no]);
  }

  const effective = new Map();
  if (byDate.size === 0) return effective;

  const dates = [...byDate.keys()].sort();
  const carry = [];
  let cursor = dates[0];
  let di = 0;
  let guard = 0;
  const MAX_ITERATIONS = 200000;

  while ((di < dates.length || carry.length > 0) && guard < MAX_ITERATIONS) {
    guard += 1;

    if (carry.length === 0 && di < dates.length && cursor < dates[di]) {
      cursor = dates[di];
    }

    const own = byDate.get(cursor);
    if (own) di += 1;

    if (isRestDay(cursor, holidaySet)) {
      if (own) carry.push(own);
    } else if (carry.length > 0) {
      const batch = carry.shift();
      for (const equNo of batch) effective.set(equNo, cursor);
      if (own) carry.push(own);
    } else if (own) {
      for (const equNo of own) effective.set(equNo, cursor);
    }

    cursor = addDays(cursor, 1);
  }

  return effective;
}

function businessToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

module.exports = {
  fmtDate,
  addDays,
  getNextDueDay,
  buildEffectiveDueMap,
  businessToday,
  daysBetween,
  isSunday,
  isRestDay,
};
