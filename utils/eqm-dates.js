/**
 * Logic tính ngày đến hạn bảo trì + dời ngày nghỉ
 * (khớp với local-api)
 */

function fmtDate(d) {
  if (!d) return null;

  // Nếu đã là string YYYY-MM-DD
  if (typeof d === "string") {
    return d.slice(0, 10);
  }

  // Nếu là Date object từ mssql
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

const CYCLE_MONTHS = {
  "1_month": 1,
  "1_year": 12,
};

function getNextDueDay(device) {
  const base = fmtDate(device.max_mt_date) || fmtDate(device.use_date);
  if (!base) return null;

  const cycle = device.maintenance_type || "1_month";

  if (cycle === "1_week") return addDays(base, 7);
  if (cycle === "2_weeks" || cycle === "2_week") return addDays(base, 14);

  return addMonthsClamped(base, CYCLE_MONTHS[cycle] || 1);
}

/** 1900-01-01 là thứ Hai → Chủ nhật = (days % 7 === 6) */
function isSunday(dateStr) {
  const days = Math.round(
    (Date.parse(`${dateStr}T00:00:00Z`) - Date.parse("1900-01-01T00:00:00Z")) /
      86400000,
  );
  return days % 7 === 6;
}

function shiftPastHolidays(dateStr, holidaySet) {
  if (!dateStr) return dateStr;

  let d = dateStr;
  let guard = 0;

  while ((isSunday(d) || holidaySet.has(d)) && guard < 60) {
    d = addDays(d, 1);
    guard++;
  }

  return d;
}

function getAdjustedDueDay(device, holidaySet) {
  const next = getNextDueDay(device);
  return shiftPastHolidays(next, holidaySet);
}

/** Hôm nay theo giờ kinh doanh GMT+7 */
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
  getAdjustedDueDay,
  businessToday,
  daysBetween,
  shiftPastHolidays,
};
