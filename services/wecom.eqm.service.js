const axios = require("axios");
const {
  getAdjustedDueDay,
  businessToday,
  daysBetween,
  fmtDate,
} = require("../utils/eqm-dates");
const {
  getHolidays,
  getDevicesForOverdueCheck,
} = require("../repositories/eqm.repository");

/** Mapping mnt_dept_no → WeCom Account ID */
const DEPT_MENTION_MAP = {
  DF0042: ["nguyndng", "833675565"],
  DF0043: ["776227674", "355321678"],
  DF0017004: ["931122418", "352569641", "865953693"],
  DO0005: ["germton", "379180014"],
};

/**
 * Tính danh sách thiết bị trễ hạn theo đúng logic local-api
 */
async function getOverdueSummary() {
  const today = businessToday();
  const holidaySet = await getHolidays();
  const devices = await getDevicesForOverdueCheck();

  console.log(`[EQM] Today (GMT+7): ${today}`);
  console.log(`[EQM] Số ngày lễ lấy được: ${holidaySet.size}`);
  console.log(`[EQM] Tổng thiết bị lấy từ DB: ${devices.length}`);

  const overdue = [];

  for (const d of devices) {
    if (
      ["pending_approval", "in_maintenance", "rejected"].includes(
        d.maintenance_status,
      )
    ) {
      continue;
    }

    const due = getAdjustedDueDay(
      {
        max_mt_date: d.max_mt_date,
        use_date: d.use_date,
        maintenance_type: d.maintenance_type,
      },
      holidaySet,
    );

    if (!due) continue;

    const diff = daysBetween(due, today);
    if (diff <= 0) continue;

    overdue.push({
      equ_no: d.equ_no,
      equ_name: d.equ_name,
      mnt_dept_no: d.mnt_dept_no,
      mnt_dept_name: d.mnt_dept_name || d.mnt_dept_no || "OTHER",
      overdue_days: diff,
    });
  }

  console.log(`[EQM] Số thiết bị trễ hạn sau khi tính: ${overdue.length}`);

  // Group theo mnt_dept_no
  const byDept = {};

  for (const item of overdue) {
    const key = item.mnt_dept_no || "OTHER";

    if (!byDept[key]) {
      byDept[key] = {
        deptNo: key,
        deptName: item.mnt_dept_name,
        count: 0,
      };
    }

    byDept[key].count++;
  }

  return {
    today,
    total: overdue.length,
    byDept,
  };
}

/**
 * Gửi tin tổng hợp và tin tag người phụ trách riêng
 */
async function sendOverdueSummary(webhookUrl) {
  const summary = await getOverdueSummary();

  if (summary.total === 0) {
    console.log(
      `[EQM] Không có thiết bị trễ hạn ngày ${summary.today} → không gửi tin`,
    );
    return { sent: false, total: 0 };
  }

  // Chỉ lấy phòng ban có thiết bị trễ hạn > 0
  const departments = Object.values(summary.byDept).filter(
    (dept) => dept.count > 0,
  );

  // ===== Tin nhắn 1: Thống kê tất cả phòng ban =====
  //   let content = `<font color="red">🚨 **EQUIPMENT MAINTENANCE ALERT**</font>\n\n\n`;
  //   content += `📅 Date: **${summary.today}**\n\n`;
  //   content += `🏢 Total Overdue: <font color="red">**${summary.total}**</font>\n\n`;
  //   content += `⚠️Overdue by Department:\n\n`;

  //   for (const dept of departments) {
  //     content += `   > **${dept.deptName}:** <font color="red">**${dept.count}**</font>\n\n`;
  //   }

  //   content += `\nPlease check and handle promptly.`;

  // ===== Tin nhắn 1: Thống kê tất cả phòng ban =====
  let content = `<font color="warning">🚨 **EQUIPMENT MAINTENANCE ALERT**</font>\n\n`;
  content += `<font color="grey"> ─────────────────────────────</font>\n`;
  content += `📅 Date: **${summary.today}**\n\n`;
  content += `📊 Total Overdue: <font color="red">**${summary.total}**</font>\n\n`;
  content += `⚠️ **OVERDUE BY DEPARTMENT**\n`;

  // ===== Thống kê phòng ban =====
  for (const dept of departments) {
    content += `>  **${dept.deptName}  :**  <font color="red">**${dept.count}**</font>\n`;
  }
  content += `\n\n`;
  content += `Please check and handle promptly.`;

  const { data: summaryData } = await axios.post(webhookUrl, {
    msgtype: "markdown",
    markdown: { content },
  });

  if (summaryData.errcode !== 0) {
    console.error("[EQM] Gửi tin thống kê thất bại:", summaryData.errmsg);
    return { sent: false, total: summary.total };
  }

  console.log("[EQM] Đã gửi tin thống kê tổng hợp");

  // ===== Tin nhắn 2: Tag người phụ trách riêng =====
  const mentionIds = [
    ...new Set(
      departments.flatMap((dept) => DEPT_MENTION_MAP[dept.deptNo] || []),
    ),
  ];

  if (mentionIds.length > 0) {
    const { data: mentionData } = await axios.post(webhookUrl, {
      msgtype: "text",
      text: {
        content: "❗ Vui lòng kiểm tra và xử lý thiết bị trễ hạn.",
        mentioned_list: mentionIds,
      },
    });

    if (mentionData.errcode !== 0) {
      console.error("[EQM] Gửi tin tag thất bại:", mentionData.errmsg);
    } else {
      console.log(`[EQM] Đã gửi tin tag ${mentionIds.length} người phụ trách`);
    }
  }

  return {
    sent: true,
    total: summary.total,
    departments: departments.length,
  };
}

module.exports = {
  getOverdueSummary,
  sendOverdueSummary,
  DEPT_MENTION_MAP,
};
