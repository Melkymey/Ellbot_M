export default async function ({ cmd, prefix, pushname, botSettings, reply }: any) {
    if (cmd !== "menu" && cmd !== "help") return false;

    const menu = `
╭━━━━━━━━━━━━━━━━━━━━╮
┃     🔰 *ellbot_MK* 🔰
╰━━━━━━━━━━━━━━━━━━━━╯

👤 *User:* ${pushname}
📡 *Status:* Online
⚡ *Prefix:* ${prefix}

╭─── *SETTINGS* ───
│ ⚙️ *${prefix}setai* <on/off> [${botSettings.aiEnabled ? '✅' : '❌'}]
│ ⚙️ *${prefix}setsticker* <on/off> [${botSettings.stickerEnabled ? '✅' : '❌'}]
╰────────────────

╭─── *CORE AI* ───
│ 🤖 *${prefix}ai* <tanya>
│ 🎨 *${prefix}sticker* (reply media)
│ 👤 *${prefix}owner* (kontak owner)
╰────────────────

╭─── *DOWNLOADER* ───
│ 🎵 *${prefix}tiktok* <url>
│ 📺 *${prefix}ytmp3* <url>
│ 🎥 *${prefix}ytmp4* <url>
╰────────────────

╭─── *TOOLS* ───
│ 📝 *${prefix}nulis* <teks>
│ 📖 *${prefix}wiki* <query>
│ 📝 *${prefix}tr* <lang> <teks>
│ 📄 *${prefix}buatcv* <data>
╰────────────────

╭─── *GROUP* ───
│ 👥 *${prefix}hidetag* <pesan>
│ 🚪 *${prefix}kick* @user
│ ➕ *${prefix}add* 62xxx
╰────────────────

_Bot Status: Stable v2.0_
`.trim();
    
    await reply(menu);
    return true;
}
