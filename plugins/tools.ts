import axios from "axios";

export default async function ({ cmd, q, reply, sock, jid, msg, prefix }: any) {
    if (cmd === "nulis") {
        if (!q) return reply(`Gunakan ${prefix}nulis <teks kamu>`);
        try {
            const nulisUrl = `https://api.shizuhub.site/api/canvas/nulis?text=${encodeURIComponent(q)}`;
            await sock.sendMessage(jid, { image: { url: nulisUrl }, caption: "Ini hasilnya kak!" }, { quoted: msg });
        } catch (e) {
            reply("Gagal memproses fitur nulis.");
        }
        return true;
    }

    if (cmd === "tr" || cmd === "translate") {
        if (!q) return reply(`Contoh: ${prefix}tr en Halo`);
        const trArgs = q.split(" ");
        const toLang = trArgs[0];
        const trText = trArgs.slice(1).join(" ");
        try {
            const trResult = await axios.get(`https://api.popcat.xyz/translate?to=${toLang}&text=${encodeURIComponent(trText)}`);
            reply(trResult.data.translated);
        } catch (e) {
            reply("Gagal menerjemahkan.");
        }
        return true;
    }

    if (cmd === "wiki") {
        if (!q) return reply("Masukkan apa yang ingin dicari di Wikipedia.");
        try {
            const wikiRes = await axios.get(`https://api.shizuhub.site/api/search/wiki?q=${encodeURIComponent(q)}`);
            if (wikiRes.data.status) {
                reply(`*Wikipedia: ${q}*\n\n${wikiRes.data.result}`);
            } else {
                reply("Tidak ditemukan hasil di Wikipedia.");
            }
        } catch (e) {
            reply("Gagal mencari di Wikipedia.");
        }
        return true;
    }
    
    return false;
}
