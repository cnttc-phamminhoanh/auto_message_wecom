const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function post(data) {
  const { data: result } = await axios.post(process.env.WECOM_WEBHOOK, data);

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

async function post_group_MatiGanhTeam(data) {
  const { data: result } = await axios.post(process.env.WeCOM_WEHOOK_MATI_GANH_TEAM, data);

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

async function exportShippingPost(data) {
  const { data: result } = await axios.post(
    process.env.EXPORT_SHIPPING_WEBHOOK,
    data,
  );

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

async function uploadFile(filePath) {
  const form = new FormData();

  form.append("media", fs.createReadStream(filePath));

  const webhook = new URL(process.env.EXPORT_SHIPPING_WEBHOOK);

  const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${webhook.searchParams.get("key")}&type=file`;

  const { data: result } = await axios.post(uploadUrl, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result.media_id;
}

async function sendFile(mediaId) {
  return exportShippingPost({
    msgtype: "file",
    file: {
      media_id: mediaId,
    },
  });
}

const DEPARTMENT_LABELS = {
  "Sock & Embroidering": "部门/ Bộ phận: 印绣设备保养/ Bảo trì thiết bị in và thêu",
  "Mechanic": "部门/ Bộ phận: 缝纫机保养/ Bảo trì máy may",
  "Electrical maintainance": "部门/ Bộ phận: 电气维护/ Bảo trì điện",
  "IT": "部门/ Bộ phận: IT",
};

async function sendMentionMessage(users, departments = []) {
  const departmentLines = [...new Set(departments)]
    .map((department) => DEPARTMENT_LABELS[department])
    .filter(Boolean);

  const content = ["🚨 LƯU Ý / NOTE / 注意", ...departmentLines].join("\n");

  return post({
    msgtype: "text",
    text: {
      content,
      mentioned_list: users,
    },
  });
}

async function sendMaintenanceCardTomorow({
  title,
  description,
  image,
  departments,
  totalDevices,
  maintenanceDate,
  reportUrl,
}) {
  return post({
    msgtype: "template_card",
    template_card: {
      card_type: "news_notice",
      main_title: {
        title,
        desc: description,
      },
      card_image: {
        url: image,
        aspect_ratio: 2.25,
      },
      horizontal_content_list: [
        {
          keyname: "🏢 Phòng ban / Dept / 部门",
          value: departments.join(", "),
        },
        {
          keyname: "📦 Số lượng / Quantity / 数量",
          value: totalDevices,
        },
        {
          keyname: "📅 Thời gian / Time / 时间",
          value: maintenanceDate,
        },
      ],
      quote_area: {
        type: 0,
        quote_text: "⚠ Vui lòng theo dõi! / Please pay attention! / 请留意!",
      },
      jump_list: [
        {
          type: 1,
          title: "📄 View Details / 查看详情",
          url: reportUrl,
        },
      ],

      // Click toàn bộ card
      card_action: {
        type: 1,
        url: reportUrl,
      },
    },
  });
}

async function sendMaintenanceCardAlert({
  title,
  description,
  image,
  departments,
  totalDevices,
  lateQty,
  todayQty,
  reportUrl,
}) {
  return post({
    msgtype: "template_card",
    template_card: {
      card_type: "news_notice",

      // Tiêu đề
      main_title: {
        title,
        desc: description,
      },
      // Banner
      card_image: {
        url: image,
        aspect_ratio: 2.25,
      },

      // Thông tin
      horizontal_content_list: [
        {
          keyname: "🏢 Phòng ban / Dept / 部门",
          value: departments.join(", "),
        },
        {
          keyname: "📦 Số lượng / Quantity / 数量",
          value: totalDevices,
        },
        {
          keyname: "🔴 Trễ / Late / 迟到",
          value: lateQty,
        },
        {
          keyname: "🟠 Hôm nay / Today / 今天",
          value: todayQty,
        },
      ],

      // Nội dung nhắc nhở
      quote_area: {
        type: 0,
        quote_text: "⚠ Vui lòng theo dõi! / Please pay attention! / 请留意!",
      },

      // Nút
      jump_list: [
        {
          type: 1,
          title: "📄 View Details / 查看详情",
          url: reportUrl,
        },
      ],

      // Click toàn bộ card
      card_action: {
        type: 1,
        url: reportUrl,
      },
    },
  });
}

async function sendMarkdown(content) {
  return exportShippingPost({
    msgtype: "markdown",
    markdown: {
      content,
    },
  });
}

async function notifyMaintenanceTomorow({
  users,
  title,
  description,
  image,
  departments,
  totalDevices,
  maintenanceDate,
  reportUrl,
}) {
  console.log("Sending tomorow card...");
  await sendMaintenanceCardTomorow({
    title,
    description,
    image,
    departments,
    totalDevices,
    maintenanceDate,
    reportUrl,
  });

  console.log("Sending tomorow mention...");
  await sendMentionMessage(users, departments);
}

async function notifyMaintenanceAlert({
  users,
  title,
  description,
  image,
  departments,
  totalDevices,
  lateQty,
  todayQty,
  reportUrl,
}) {
  console.log("Sending alert card...");
  await sendMaintenanceCardAlert({
    title,
    description,
    image,
    departments,
    totalDevices,
    lateQty,
    todayQty,
    reportUrl,
  });

  console.log("Sending alert mention...");
  await sendMentionMessage(users, departments);
}

async function notifySOChange(data) {
  const now = new Date().toLocaleString("sv-SE");

  const totalOrders = data.length;

  const qtyChanged = data.filter(
    (x) =>
      Number(x["Old Order Qty"] ?? -999999) !==
      Number(x["New Order Qty"] ?? -999999),
  ).length;

  const priceChanged = data.filter(
    (x) =>
      Number(x["Old Price"] ?? -999999) !== Number(x["New Price"] ?? -999999),
  ).length;

  const crdChanged = data.filter(
    (x) => (x["Old Customer CRD"] || "") !== (x["New Customer CRD"] || ""),
  ).length;

  const countryChanged = data.filter(
    (x) => (x["Old Country"] || "") !== (x["New Country"] || ""),
  ).length;

  const packingChanged = data.filter(
    (x) => (x["Old Packing Method"] || "") !== (x["New Packing Method"] || ""),
  ).length;

  const message = `# 🔄 Sale Order Change Notification

> **Generated** : ${now}

### Summary
──────────────

> **Total Orders** : ${totalOrders}

> **Quantity Changed** : ${qtyChanged}
> **Price Changed** : ${priceChanged}
> **CRD Changed** : ${crdChanged}
> **Country Changed** : ${countryChanged}
> **Packing Method Changed** : ${packingChanged}

> The detailed Excel report is attached below.`;

  return sendMarkdown(message);
}

/**
 * Gửi text message
 */
const sendText = (
  content,
  mentionedList = []
) => {
  if (!content) {
    throw new Error(
      'Nội dung thông báo WeCom không được để trống'
    );
  }

  return post_group_MatiGanhTeam({
    msgtype: 'text',
    text: {
      content,
      mentioned_list: mentionedList
    }
  });
};
/**
 * Nội dung thông báo MO không được cập nhập WO
 */
const buildMoNotification = () => {
  return [
    '@IT_Huyền Sương(Suzy)',
    '',
    'MO không được cập nhập WO',
    '',
    'select m.sheet_no, m.sheet_id, m.sheet_qty, m.goods_no, m.def02, m.def01',
    'from [rds].[erp_t8_gi].[dbo].sfc_mo2 m',
    'inner join [rds].[erp_t8_gi].[dbo].sfc_mo1 m1 on m.sheet_no = m1.sheet_no',
    'inner join ig_pywrkord o on m1.sheet_no = o.ext_field07',
    "where m1.sheet_date >= '2025-01-01'",
    '    and m1.sheet_kind = 0',
    '    and m.def16 is null',
    "    and m1.sheet_type not in ('MOGIC', 'MOGICW')",
    "    and m.sheet_no not in ('MOGID260515034', 'MOGID260410002', 'MOGID260512006')"
  ].join('\n');
};

// gửi thông báo WeCom với nội dung được xây dựng từ dữ liệu
const sendSheetNotification = async () => {
  const content = buildMoNotification();

  /**
   * User ID thật của Suzy trên WeCom
   */
  const mentionUserId =
    process.env.WECOM_MENTION_USER_ID;

  const mentionedList =
    mentionUserId
      ? [mentionUserId]
      : [];

  return sendText(
    content,
    mentionedList
  );
};

module.exports = {
  notifyMaintenanceTomorow,
  notifyMaintenanceAlert,
  notifySOChange,
  uploadFile,
  sendFile,
  sendSheetNotification,
};
