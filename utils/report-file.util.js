const path = require("path");

function createReportFile(reportName) {
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  const timestamp =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "_" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  return path.join(
    __dirname,
    "../excel_reports",
    `${reportName}_${timestamp}.xlsx`,
  );
}

module.exports = {
  createReportFile,
}
