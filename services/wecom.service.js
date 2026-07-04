const axios = require("axios");

async function post(data) {
  const { data: result } = await axios.post(process.env.WECOM_WEBHOOK, data);

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

module.exports = {
  notifyMaintenanceTomorow,
  notifyMaintenanceAlert
};
