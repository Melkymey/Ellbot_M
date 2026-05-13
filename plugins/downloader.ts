import axios from "axios";

export default async function ({ cmd, q, reply, sock, jid, msg }: any) {
    if (cmd === "tiktok") {
        if (!q) return reply("Masukkan URL TikTok!");
        try {
            reply("Sedang mendownload TikTok, mohon tunggu...");
            const tkRes = await axios.get(`https://api.shizuhub.site/api/download/tiktok?url=${q}`);
            if (tkRes.data.status) {
                const videoUrl = tkRes.data.result.video;
                await sock.sendMessage(jid, { video: { url: videoUrl }, caption: "Download Berhasil!" }, { quoted: msg });
            } else {
                reply("Gagal mendownload video tersebut.");
            }
        } catch (e) {
            reply("Error saat mendownload TikTok.");
        }
        return true;
    }

    if (cmd === "ytmp3" || cmd === "ytmp4") {
        if (!q) return reply("Masukkan URL YouTube!");
        try {
            const isAudio = cmd === "ytmp3";
            reply(`Sedang mendownload YouTube ${isAudio ? 'Audio' : 'Video'}...`);
            const ytRes = await axios.get(`https://api.shizuhub.site/api/download/${isAudio ? 'ytmp3' : 'ytmp3'}?url=${q}`);
            if (ytRes.data.status) {
                 const mediaUrl = ytRes.data.result.download;
                 if (isAudio) {
                    await sock.sendMessage(jid, { audio: { url: mediaUrl }, mimetype: 'audio/mpeg' }, { quoted: msg });
                 } else {
                    await sock.sendMessage(jid, { video: { url: mediaUrl } }, { quoted: msg });
                 }
            } else {
                reply("Gagal mendownload YouTube tersebut.");
            }
        } catch (e) {
            reply("Error saat mendownload YouTube.");
        }
        return true;
    }
    
    return false;
}
