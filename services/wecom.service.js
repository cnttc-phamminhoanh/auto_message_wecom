const axios = require("axios");

async function post(data) {
  const { data: result } = await axios.post(process.env.WECOM_WEBHOOK, data);

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

async function exportShippingPost(data) {
  const { data: result } = await axios.post(process.env.EXPORT_SHIPPING_WEBHOOK, data);

  if (result.errcode !== 0) {
    throw new Error(result.errmsg);
  }

  return result;
}

async function sendMentionMessage(users, totalDevices) {
  return post({
    msgtype: "text",
    text: {
      content: `🚨 LƯU Ý / NOTE / 注意 \n`,
      mentioned_list: users
    }
  });
}

async function sendMaintenanceCardTomorow({
  title,
  description,
  image,
  departments,
  totalDevices,
  maintenanceDate,
  reportUrl
}) {
  return post({
    msgtype: "template_card",
    template_card: {
      card_type: "news_notice",
      
      // Tiêu đề
      main_title: {
        title,
        desc: description
      },
      // Banner
      card_image: {
        url: image,
        aspect_ratio: 2.25
      },

      // Thông tin
      horizontal_content_list: [
        {
          keyname: "🏢 Phòng ban / Dept / 部门",
          value: departments.join(", ")
        },
        {
          keyname: "📦 Số lượng / Quantity / 数量",
          value: totalDevices
        },
        {
          keyname: "📅 Thời gian / Time / 时间",
          value: maintenanceDate
        }
      ],

      // Nội dung nhắc nhở
      quote_area: {
        type: 0,
        quote_text: "⚠ Vui lòng theo dõi! / Please pay attention! / 请留意!"
      },

      // Nút
      jump_list: [
        {
          type: 1,
          title: "📄 View Details / 查看详情",
          url: reportUrl
        }
      ],

      // Click toàn bộ card
      card_action: {
        type: 1,
        url: reportUrl
      }
    }
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
  reportUrl
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
        aspect_ratio: 2.25
      },

      // Thông tin
      horizontal_content_list: [
        {
          keyname: "🏢 Phòng ban / Dept / 部门",
          value: departments.join(", ")
        },
        {
          keyname: "📦 Số lượng / Quantity / 数量",
          value: totalDevices
        },
        {
          keyname: "🔴 Trễ / Late / 迟到",
          value: lateQty
        },
        {
          keyname: "🟠 Hôm nay / Today / 今天",
          value: todayQty
        }
      ],

      // Nội dung nhắc nhở
      quote_area: {
        type: 0,
        quote_text: "⚠ Vui lòng theo dõi! / Please pay attention! / 请留意!"
      },

      // Nút
      jump_list: [
        {
          type: 1,
          title: "📄 View Details / 查看详情",
          url: reportUrl
        }
      ],

      // Click toàn bộ card
      card_action: {
        type: 1,
        url: reportUrl
      }
    }
  });
}

async function sendMarkdown(content) {
  return exportShippingPost({
    msgtype: "markdown",
    markdown: {
      content
    }
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
  reportUrl
}) {
  console.log("Sending tomorow card...");
  await sendMaintenanceCardTomorow({
    title,
    description,
    image,
    departments,
    totalDevices,
    maintenanceDate,
    reportUrl
  });

  console.log("Sending tomorow mention...");
  await sendMentionMessage(users, totalDevices);
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
  reportUrl
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
    reportUrl
  });

  console.log("Sending alert mention...");
  await sendMentionMessage(users, totalDevices);
}

async function notifySOChange({
  id,
  soNo,
  soId,
  custPo,
  customer,
  modifiedUser,
  modifiedAt,
  changeDetail
}) {
  console.log(`[${new Date().toISOString()}] Sending alert change SO... - ID: ${id}`);

  // const formatDate = new Date(modifiedAt).toLocaleString("sv-SE");

  const detail = changeDetail
    .replace(/^\/+/, "") // Xóa dấu / ở đầu chuỗi. ^ nghĩa là đầu chuỗi. \/+ nghĩa là một hoặc nhiều dấu / Ví dụ: /Qty: 0.1~0.2/Price: 0~0.1 thành Qty: 0.1~0.2/Price: 0~0.1
    .split("/") // Cắt chuỗi thành mảng theo dấu /.
    .map(item => `• ${item.replace(/~/g, " ➜ ")}`)
    .join("\n");

const message = `# 🔄 PO Change for Merchandising

> **SO No:** ${soNo}
> **SO ID:** ${soId}
> **Cust PO:** ${custPo || ""}
> **Customer:** ${customer || ""}
> **Modified At:** ${modifiedAt}
> **Modified User:** ${modifiedUser}

<font color="warning">Change Details</font>

${detail}`;

  return sendMarkdown(message);
}

module.exports = {
  notifyMaintenanceTomorow,
  notifyMaintenanceAlert,
  notifySOChange
};
