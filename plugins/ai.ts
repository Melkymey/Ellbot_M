export default async function ({ cmd, q, botSettings, saveSettings, reply, model, sock, jid, prefix }: any) {
    if (cmd === "setai") {
        if (!q) return reply(`Gunakan ${prefix}setai on atau off`);
        botSettings.aiEnabled = q.toLowerCase() === "on";
        saveSettings();
        reply(`Fitur AI berhasil di${botSettings.aiEnabled ? "aktifkan" : "matikan"}.`);
        return true;
    }

    if (cmd === "ai") {
        if (!botSettings.aiEnabled) return reply("Fitur AI sedang dimatikan oleh admin.");
        if (!q) return reply("Silahkan masukkan pertanyaan Anda.");
        try {
            await sock.sendPresenceUpdate('composing', jid);
            const result = await model.generateContent(q);
            const responseText = result.response.text();
            await reply(responseText);
        } catch (error) {
            console.error("Gemini Error:", error);
            await reply("Terjadi kesalahan pada AI.");
        }
        return true;
    }
    
    return false;
}
