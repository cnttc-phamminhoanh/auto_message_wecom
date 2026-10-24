const pendingReport = require('../reports/find_pending_notifications_report');
const { executeQuery, executeQueryGiBi } = require('./report.service');

const runNotificationJob = async () => {
    const [rdsRows, giBiRows] = await Promise.all([
        executeQuery(pendingReport.rds),
        executeQueryGiBi(pendingReport.giBi),
    ]);

    // JOIN chéo trong JS: chỉ giữ các MO có sheet_no tồn tại trong
    // ig_pywrkord.ext_field07 (2 bảng nằm trên 2 server khác nhau
    // nên không thể JOIN trong cùng 1 câu SQL)
    const woSheetNos = new Set(giBiRows.map((row) => row.ext_field07));
    const rows = rdsRows.filter((row) => woSheetNos.has(row.sheet_no));

    return {
        executedAt: new Date().toISOString(),
        count: rows.length,
        data: rows,
    };
};

module.exports = {
  runNotificationJob
};
