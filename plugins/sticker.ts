import { Sticker, StickerTypes } from "wa-sticker-formatter";

export default async function ({ cmd, q, botSettings, saveSettings, reply, sock, jid, msg, downloadMediaMessage, pushname, prefix }: any) {
    if (cmd === "setsticker") {
        if (!q) return reply(`Gunakan ${prefix}setsticker on atau off`);
        botSettings.stickerEnabled = q.toLowerCase() === "on";
        saveSettings();
        reply(`Fitur Sticker berhasil di${botSettings.stickerEnabled ? "aktifkan" : "matikan"}.`);
        return true;
    }

    if (cmd === "s" || cmd === "sticker" || cmd === "stiker") {
        if (!botSettings.stickerEnabled) return reply("Fitur Stiker sedang dimatikan oleh admin.");
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message?.imageMessage || msg.message?.videoMessage;
        if (!quoted) return reply(`Kirim/Balas media dengan caption ${prefix}sticker`);
        
        try {
            const media = await downloadMediaMessage(
                { message: quoted } as any,
                'buffer',
                {}
            );
            
            const sticker = new Sticker(media as Buffer, {
                pack: "WhatsApp AI Pro",
                author: pushname,
                type: StickerTypes.FULL,
                id: "12345",
                quality: 50,
            });
            
            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
        } catch (e) {
            console.error(e);
            reply("Gagal mengonversi ke stiker.");
        }
        return true;
    }
    
    return false;
}
