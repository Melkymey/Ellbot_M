import axios from "axios";

export default async function ({ cmd, q, reply, model, sock, jid, pushname, prefix, saveCV }: any) {
    if (cmd !== "buatcv" && cmd !== "cv") return false;

    if (!q || !q.includes("|")) {
        return reply(`Gunakan format:\n${prefix}buatcv Nama | Posisi | Pengalaman | Skill\n\nContoh:\n${prefix}buatcv Budi | Web Developer | 2 Tahun React | JS, Node, CSS`);
    }

    const [nama, posisi, pengalaman, skill] = q.split("|").map((s: string) => s.trim());

    try {
        await sock.sendPresenceUpdate('composing', jid);
        reply("Sedang merancang Web CV profesional untuk Anda, mohon tunggu...");

        const prompt = `Buatkan konten CV profesional dalam Bahasa Indonesia untuk:
Nama: ${nama}
Posisi yang dilamar: ${posisi}
Pengalaman: ${pengalaman}
Skill: ${skill}

Berikan output dalam format JSON yang berisi:
{
  "summary": "profil singkat profesional",
  "experience": ["list pengalaman"],
  "skills": ["list skill"],
  "letter": "isi surat lamaran kerja yang sopan dan profesional"
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON from AI response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Gagal generate format CV.");
        
        const cvData = JSON.parse(jsonMatch[0]);
        const finalData = {
            nama,
            posisi,
            ...cvData,
            date: new Date().toLocaleDateString('id-ID')
        };

        // Save to internal storage (via server helper)
        // We'll use a random ID
        const cvId = Math.random().toString(36).substring(7);
        saveCV(cvId, finalData);

        const appUrl = process.env.APP_URL || "https://ais-pre-rjpxxgames5yqqcztnutrm-576768729476.asia-southeast1.run.app";
        const cvUrl = `${appUrl}/cv/${cvId}`;

        const successMsg = `
✅ *Web CV Berhasil Dibuat!*

👤 *Nama:* ${nama}
💼 *Posisi:* ${posisi}

🔗 *Link Web CV Anda:*
${cvUrl}

Silahkan bagikan link tersebut ke HRD atau simpan sebagai portfolio online Anda.
`.trim();

        await reply(successMsg);

    } catch (e) {
        console.error(e);
        reply("Gagal membuat CV. Pastikan format benar atau coba lagi nanti.");
    }

    return true;
}
