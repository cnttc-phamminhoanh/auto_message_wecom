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

async function exportShippingPost(data) {
  const { data: result } = await axios.post(process.env.EXPORT_SHIPPING_WEBHOOK, data);

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
    maxContentLength: Infinity
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
      media_id: mediaId
    }
  });
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

async function notifySOChange(data) {
  const now = new Date().toLocaleString("sv-SE");

  const totalOrders = data.length;

  const qtyChanged = data.filter(
    x => Number(x["Old Order Qty"] ?? -999999) !== Number(x["New Order Qty"] ?? -999999)
  ).length;

  const priceChanged = data.filter(
    x => Number(x["Old Price"] ?? -999999) !== Number(x["New Price"] ?? -999999)
  ).length;

  const crdChanged = data.filter(
    x => (x["Old Customer CRD"] || "") !== (x["New Customer CRD"] || "")
  ).length;

  const countryChanged = data.filter(
    x => (x["Old Country"] || "") !== (x["New Country"] || "")
  ).length;

  const packingChanged = data.filter(
    x => (x["Old Packing Method"] || "") !== (x["New Packing Method"] || "")
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

module.exports = {
  notifyMaintenanceTomorow,
  notifyMaintenanceAlert,
  notifySOChange,
  uploadFile,
  sendFile
};
