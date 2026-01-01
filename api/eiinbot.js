const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// Config
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";
const OWNER_USERNAME = "@Bdkingboss";
const CHANNEL_USERNAME = "@Rfcyberteam";

// Init Bot
const bot = new Telegraf(BOT_TOKEN);

// Keyboard
const menuKeyboard = Markup.keyboard([
  ["🔍 IMEI চেক করুন"],
  ["ℹ️ সাহায্য", "⭐ চ্যানেল জয়েন করুন"],
  ["📞 যোগাযোগ", "👑 Owner"]
]).resize();

// START
bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || "বন্ধু";

  const welcomeMessage = `
👋 *স্বাগতম ${firstName}*

📱 *BTRC IMEI Checker Bot*

IMEI নম্বর পাঠান (15 Digit)
উদাহরণ: \`358879090123456\`
`;

  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    ...menuKeyboard
  });
});

// HELP
bot.hears("ℹ️ সাহায্য", (ctx) =>
  ctx.reply(
    `🆘 IMEI *১৫ ডিজিট* এর হয়  
ফোনে *#06#* ডায়াল করে পান`,
    { parse_mode: "Markdown" }
  )
);

// CHANNEL
bot.hears("⭐ চ্যানেল জয়েন করুন", (ctx) =>
  ctx.reply(`👉 ${CHANNEL_USERNAME}`, { parse_mode: "Markdown" })
);

// CONTACT
bot.hears("📞 যোগাযোগ", (ctx) =>
  ctx.reply(`👑 ${OWNER_USERNAME}`, { parse_mode: "Markdown" })
);

// OWNER
bot.hears("👑 Owner", (ctx) =>
  ctx.reply(`Owner: ${OWNER_USERNAME}`, { parse_mode: "Markdown" })
);

// IMEI REQUEST
bot.hears("🔍 IMEI চেক করুন", async (ctx) => {
  ctx.reply(`IMEI নম্বর পাঠান:  
উদাহরণ: \`358879090123456\``, { parse_mode: "Markdown" });
});

// IMEI CHECK
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (!/^\d{15}$/.test(text)) return;

  await ctx.sendChatAction("typing");
  const waitMsg = await ctx.reply("⏳ চেক করা হচ্ছে...");

  try {
    const data = await checkBTRCAPI(text);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      undefined,
      data,
      { parse_mode: "Markdown" }
    );

    await ctx.reply("আরেকটি চেক করুন", Markup.inlineKeyboard([
      [Markup.button.callback("🔄 নতুন IMEI চেক", "check_another")],
      [
        Markup.button.url("⭐ চ্যানেল", "https://t.me/Rfcyberteam"),
        Markup.button.url("👑 Owner", "https://t.me/Bdkingboss")
      ]
    ]));

  } catch (e) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      undefined,
      "❌ সার্ভার রেসপন্স দিচ্ছে না!\nপরে চেষ্টা করুন।",
      { parse_mode: "Markdown" }
    );
  }
});

// API REQUEST
async function checkBTRCAPI(imei) {
  const url = "https://neir.btrc.gov.bd/services/NEIRPortalService/api/imei-status-check";

  const res = await axios.post(url, { imei }, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000
  });

  const msg = res?.data?.replyMessage?.msg || "ERROR";

  let status =
    msg === "WL"
      ? "🟢 *নিবন্ধিত*"
      : msg === "NF"
        ? "🔴 *নিবন্ধিত নয়*"
        : "🟡 *অজানা স্ট্যাটাস*";

  return `
📋 *IMEI রিপোর্ট*
IMEI: \`${imei}\`

স্ট্যাটাস: ${status}

সূত্র: BTRC (NEIR)
`;
}

// Callback
bot.action("check_another", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("নতুন IMEI পাঠান:");
});

// Webhook Handler for Vercel
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(200).send("OK");
  }
};

// Disable Launch() on Vercel (Webhook Only)
if (process.env.NODE_ENV !== "production") {
  bot.launch();
        }
