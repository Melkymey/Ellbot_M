import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    downloadMediaMessage,
    proto
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import axios from "axios";
import { Sticker, createSticker, StickerTypes } from "wa-sticker-formatter";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || "";
let model: any = null;

if (apiKey) {
    try {
        const genAI = new (GoogleGenAI as any)(apiKey);
        model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Gemini AI initialized.");
    } catch (e) {
        console.error("Gemini Init Error:", e);
    }
} else {
    console.warn("GEMINI_API_KEY is missing.");
}

// Persistent Settings
const SETTINGS_FILE = "./bot_settings.json";
const CV_STORAGE_FILE = "./cv_storage.json";

let botSettings = {
    aiEnabled: true,
    stickerEnabled: true,
    nulisEnabled: true,
    downloaderEnabled: true
};

let cvStorage: Record<string, any> = {};

if (fs.existsSync(SETTINGS_FILE)) {
    try {
        botSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    } catch (e) {
        console.error("Error reading settings:", e);
    }
}

if (fs.existsSync(CV_STORAGE_FILE)) {
    try {
        cvStorage = JSON.parse(fs.readFileSync(CV_STORAGE_FILE, "utf-8"));
    } catch (e) {
        console.error("Error reading CV storage:", e);
    }
}

const saveSettings = () => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(botSettings, null, 2));
};

const saveCV = (id: string, data: any) => {
    cvStorage[id] = data;
    fs.writeFileSync(CV_STORAGE_FILE, JSON.stringify(cvStorage, null, 2));
};

async function startServer() {
    const app = express();
    const server = createServer(app);
    const io = new Server(server);
    const PORT = 3000;

    const sessionPath = "./wa_session";
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath);
    }

    const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionPath, 'auth_info'));
    const { version } = await fetchLatestBaileysVersion();

    let sock: any = null;
    let qrCode: string | null = null;
    let connectionStatus = "Disconnected";

    const connectToWhatsApp = async () => {
        console.log("Connecting to WhatsApp...");
        connectionStatus = "Connecting";
        io.emit("status", connectionStatus);

        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            browser: Browsers.macOS("Desktop"),
            syncFullHistory: false,
            markOnlineOnConnect: true,
        });

        sock.ev.on("connection.update", async (update: any) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                qrCode = await QRCode.toDataURL(qr);
                io.emit("qr", qrCode);
                connectionStatus = "Waiting for Scan";
                io.emit("status", connectionStatus);
            }

            if (connection === "close") {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
                
                qrCode = null;
                connectionStatus = "Disconnected";
                io.emit("status", connectionStatus);
                io.emit("qr", null);

                if (statusCode === DisconnectReason.restartRequired) {
                    connectToWhatsApp();
                } else if (shouldReconnect) {
                    // Force logout/clear session if session is invalid or bad
                    if (statusCode === 401 || statusCode === DisconnectReason.badSession) {
                        console.log("Session invalid, clearing auth folder...");
                        try {
                            fs.rmSync(path.join(sessionPath, 'auth_info'), { recursive: true, force: true });
                        } catch (e) {}
                    }
                    
                    console.log("Waiting 5s before reconnecting...");
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            } else if (connection === "open") {
                console.log("Opened connection");
                qrCode = null;
                connectionStatus = "Connected";
                io.emit("status", connectionStatus);
                io.emit("qr", null);
            }
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("messages.upsert", async (m: any) => {
            try {
                const msg = m.messages[0];
                if (!msg.message || (msg.key && msg.key.fromMe)) return;

                const jid = msg.key.remoteJid;
                const text = msg.message.conversation || 
                             msg.message.extendedTextMessage?.text || 
                             msg.message.imageMessage?.caption || 
                             msg.message.videoMessage?.caption;

                if (!text) return;

                const isGroup = jid.endsWith("@g.us");
                const sender = isGroup ? msg.key.participant : jid;
                const pushname = msg.pushName || "User";

                console.log(`[MSG] from ${pushname} (${jid}): ${text}`);

                const prefix = process.env.VITE_BOT_PREFIX || "!";
                const reply = async (content: string) => {
                    await sock.sendMessage(jid, { text: content }, { quoted: msg });
                };

                // 👑 OWNER COMMAND (Auto Share Contact)
                if (text.toLowerCase() === prefix + "owner" || text.toLowerCase() === "owner") {
                    const vcard = 'BEGIN:VCARD\n'
                        + 'VERSION:3.0\n' 
                        + 'FN:Official Owner\n' 
                        + 'ORG:ellbot_MK;\n'
                        + `TEL;type=CELL;type=VOICE;waid=6282123456789:+6282123456789\n` 
                        + 'END:VCARD';
                    
                    await sock.sendMessage(jid, { 
                        contacts: { 
                            displayName: 'Official Owner', 
                            contacts: [{ vcard }] 
                        }
                    }, { quoted: msg });
                    return;
                }

                // 📂 PLUGIN LOADER LOGIC
                if (text.startsWith(prefix)) {
                    const [command, ...args] = text.slice(prefix.length).trim().split(/\s+/);
                    const cmd = command.toLowerCase();
                    const q = args.join(" ");

                    const pluginsDir = path.join(process.cwd(), "plugins");
                    if (fs.existsSync(pluginsDir)) {
                        const files = fs.readdirSync(pluginsDir);
                        for (const file of files) {
                            if (file.endsWith(".ts") || file.endsWith(".js")) {
                                try {
                                    const plugin = await import(path.join(pluginsDir, file));
                                    if (plugin.default && typeof plugin.default === "function") {
                                        const result = await plugin.default({
                                            cmd, q, args, sock, msg, jid, pushname, prefix, isGroup, sender, model, botSettings, saveSettings, saveCV, reply, downloadMediaMessage
                                        });
                                        if (result) return; 
                                    }
                                } catch (e) {
                                    console.error(`Error loading plugin ${file}:`, e);
                                }
                            }
                        }
                    }
                }

                // AUTO-REPLY LOGIC (If not a command and in private chat)
                if (!isGroup && !text.startsWith(prefix)) {
                    console.log(`[AUTO-REPLY] to ${jid}`);
                    await reply(`Halo kak *${pushname}*! 👋\n\nSaya adalah *ellbot_MK*, asisten WhatsApp AI Anda. Ketik *${prefix}menu* untuk melihat daftar fitur yang tersedia.\n\nContoh: *${prefix}ai Apa itu AI?*`);
                }
            } catch (err) {
                console.error("Handler Error:", err);
            }
        });
    };

    connectToWhatsApp();

    // API Routes
    app.get("/api/status", (req, res) => {
        res.json({ status: connectionStatus, qr: qrCode });
    });

    app.get("/api/cv/:id", (req, res) => {
        const cv = cvStorage[req.params.id];
        if (cv) {
            res.json(cv);
        } else {
            res.status(404).json({ error: "CV not found" });
        }
    });

    app.post("/api/cv", express.json(), (req, res) => {
        const id = Math.random().toString(36).substring(7);
        saveCV(id, req.body);
        res.json({ id });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    io.on("connection", (socket) => {
        socket.emit("status", connectionStatus);
        socket.emit("qr", qrCode);
    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

startServer();
