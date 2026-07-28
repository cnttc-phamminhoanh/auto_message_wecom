const ExcelJS = require("exceljs");

async function generateExcel(data, filePath, options = {}) {
  const {
    companyName = "GERMTON VIETNAM",
    reportTitle = "Report",
    sheetName = "Report"
  } = options

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  const headerRowNumber = 5;

  // ===== Get Dynamic Headers =====
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const totalColumns = Math.max(headers.length, 1);

  // Convert:
  // 1 -> A
  // 26 -> Z
  // 27 -> AA
  const getColumnLetter = (num) => {
    let column = "";

    while (num > 0) {
      const remainder = (num - 1) % 26
      column = String.fromCharCode(65 + remainder) + column
      num = Math.floor((num - 1) / 26);
    }

    return column;
  };

  const lastColumn = getColumnLetter(totalColumns);

  // ===== Report Title =====
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").value = companyName;

  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getCell("A2").value = reportTitle;

  sheet.mergeCells(`A3:${lastColumn}3`);
  sheet.getCell("A3").value = `Generated At: ${new Date().toLocaleString("sv-SE")}`;

  ["A1", "A2", "A3"].forEach((address) => {
    const cell = sheet.getCell(address);

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  sheet.getCell("A1").font = {
    bold: true,
    size: 18,
  };

  sheet.getCell("A2").font = {
    bold: true,
    size: 14,
  };

  sheet.getCell("A3").font = {
    italic: true,
    size: 10,
  };

  // ===== Blank Rows =====
  sheet.addRow([]);
  sheet.addRow([]);

  // ===== Dynamic Header =====
  sheet.getRow(headerRowNumber).values = headers;

  sheet.columns = headers.map((header) => ({
    key: header,
  }));

  // ===== Add Data =====
  data.forEach((row) => {
    sheet.addRow(row);
  });

  // ===== Format Date/DateTime Columns =====
  headers.forEach((header, index) => {
    // Tìm dòng đầu tiên có giá trị khác null để xác định kiểu dữ liệu
    const sampleValue = data.find(r => r[header] != null)?.[header];

    if (sampleValue instanceof Date) {
      sheet.getColumn(index + 1).numFmt = "yyyy-mm-dd hh:mm:ss";
    }
  });

  // ===== Header Style =====
  const headerRow = sheet.getRow(headerRowNumber);

  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "1F4E78",
      },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ===== Data Style =====
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;

    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };

        cell.alignment = {
            horizontal: "center",
            vertical: "middle",
        };
    });
  });

  // ===== Auto Width =====
  sheet.columns.forEach((column) => {
    let maxLength = 0;

    column.eachCell(
      {
        includeEmpty: true,
      },
      (cell) => {
        const value = cell.value == null ? "" : cell.value.toString();

        maxLength = Math.max(maxLength, value.length);
      },
    );

    // min:15
    // max:22
    // padding:2
    column.width = Math.min(Math.max(maxLength + 2, 15), 22);
  });

  // ===== Freeze Header =====
  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
    },
  ];

  // ===== Auto Filter =====
  if (headers.length > 0) {
    sheet.autoFilter = {
      from: {
        row: headerRowNumber,
        column: 1,
      },
      to: {
        row: headerRowNumber,
        column: headers.length,
      },
    };
  }

  await workbook.xlsx.writeFile(filePath);
}

module.exports = {
  generateExcel,
}
