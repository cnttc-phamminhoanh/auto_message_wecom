/**
 * Logic tính ngày đến hạn (bù Chủ nhật + lễ trong kỳ)
 * Khớp rule:
 * - Ngày gốc = max_mt_date || use_date (fmt theo Asia/Hong_Kong)
 * - Hạn gốc theo chu kỳ (1_week / 2_weeks / 1_month / 1_year, kẹp cuối tháng)
 * - Cộng bù mọi ngày nghỉ trong (gốc+1 → hạn), lặp đến ổn định
 * - Thứ 7 vẫn là ngày làm việc
 *
 * Trễ / hôm nay / mai: job tự so với businessToday() bằng daysBetween
 */

function fmtDate(d) {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) {
    // Hong Kong = UTC+7, không DST — cùng lịch với VN
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
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

function getBaseDate(device) {
  return (
    fmtDate(device.lastMaintenanceDate) ||
    fmtDate(device.max_mt_date) ||
    fmtDate(device.startDate) ||
    fmtDate(device.use_date) ||
    null
  );
}

function getCycle(device) {
  return (
    device.maintenanceCycle ||
    device.maintenance_type ||
    device.maintenanceType ||
    "1_month"
  );
}

/** Hạn gốc (chưa bù nghỉ) */
function getRawDueDay(device) {
  const base = getBaseDate(device);
  if (!base) return null;

  const cycle = getCycle(device);

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
  return isSunday(dateStr) || (holidaySet && holidaySet.has(dateStr));
}

/** Số Chủ nhật trong [fromStr, toStr] inclusive — O(1) */
function countSundaysInRange(fromStr, toStr) {
  if (!fromStr || !toStr || fromStr > toStr) return 0;

  const start = Date.parse(`${fromStr}T00:00:00Z`);
  const end = Date.parse(`${toStr}T00:00:00Z`);
  const totalDays = Math.round((end - start) / 86400000) + 1;

  const startIndex = Math.round(
    (start - Date.parse("1900-01-01T00:00:00Z")) / 86400000,
  );
  // cùng rule isSunday: % 7 === 6
  const firstSunOffset = (6 - (((startIndex % 7) + 7) % 7) + 7) % 7;
  if (firstSunOffset >= totalDays) return 0;
  return Math.floor((totalDays - 1 - firstSunOffset) / 7) + 1;
}

/** Số ngày nghỉ (CN + lễ) trong (base, due] = [base+1, due] */
function countRestDaysInPeriod(base, due, holidaySet) {
  const from = addDays(base, 1);
  if (!from || !due || from > due) return 0;

  let count = countSundaysInRange(from, due);

  if (holidaySet && holidaySet.size > 0) {
    for (const h of holidaySet) {
      if (h >= from && h <= due && !isSunday(h)) count += 1;
    }
  }
  return count;
}

/**
 * Hạn hiệu lực = hạn gốc + bù CN/lễ trong kỳ
 * Mỗi vòng O(1) + O(|holidays|), không quét từng ngày
 */
function getEffectiveDueDay(device, holidaySet) {
  const base = getBaseDate(device);
  const rawDue = getRawDueDay(device);
  if (!base || !rawDue) return null;

  const holidays = holidaySet || new Set();

  let restCount = countRestDaysInPeriod(base, rawDue, holidays);
  let due = addDays(rawDue, restCount);
  let guard = 0;
  const MAX = 500;

  while (guard < MAX) {
    guard += 1;
    const nextCount = countRestDaysInPeriod(base, due, holidays);
    const next = addDays(rawDue, nextCount);
    if (next === due) break;
    restCount = nextCount;
    due = next;
  }

  return due;
}

/**
 * Map equ_no → hạn hiệu lực (từng máy độc lập, không cascade toàn cục)
 * rows: { equ_no, use_date, max_mt_date, maintenance_type }
 */
function buildEffectiveDueMap(rows, holidaySet) {
  const effective = new Map();
  for (const row of rows) {
    const due = getEffectiveDueDay(
      {
        use_date: row.use_date,
        max_mt_date: row.max_mt_date,
        maintenance_type: row.maintenance_type,
        startDate: row.use_date,
        lastMaintenanceDate: row.max_mt_date,
        maintenanceCycle: row.maintenance_type,
      },
      holidaySet,
    );
    if (due) effective.set(row.equ_no, due);
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
  addMonthsClamped,
  getRawDueDay,
  getEffectiveDueDay,
  getNextDueDay: getEffectiveDueDay, // alias: chỗ cũ gọi getNextDueDay cần truyền holidaySet
  buildEffectiveDueMap,
  businessToday,
  daysBetween,
  isSunday,
  isRestDay,
};
