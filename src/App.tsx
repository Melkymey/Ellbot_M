import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { io } from "socket.io-client";
import { QrCode, Wifi, WifiOff, MessageSquare, ShieldCheck, Zap, Server, Briefcase, Mail, Download, User } from "lucide-react";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";

const socket = io();

function CVPage() {
  const { id } = useParams();
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cv/${id}`)
      .then(res => res.json())
      .then(data => {
        setCv(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-zinc-500">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cv) return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-zinc-500">
      CV tidak ditemukan.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans p-6 md:p-12 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="bg-emerald-500/10 p-8 md:p-12 border-b border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{cv.nama}</h1>
              <p className="text-emerald-400 font-medium text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {cv.posisi}
              </p>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium text-sm">
                 <Download className="w-4 h-4" /> Download PDF
               </button>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" /> Profil Profesional
              </h2>
              <p className="text-zinc-400 leading-relaxed text-lg">
                {cv.summary}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" /> Pengalaman Kerja
              </h2>
              <ul className="space-y-4">
                {cv.experience?.map((exp: string, i: number) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full mt-2.5 shrink-0" />
                    <span className="text-zinc-400">{exp}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-400" /> Surat Lamaran
              </h2>
              <div className="text-zinc-400 leading-relaxed whitespace-pre-wrap font-serif text-lg italic">
                {cv.letter}
              </div>
            </section>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Skill Utama</h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills?.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm border border-zinc-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="pt-8 border-t border-zinc-800">
               <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Dibuat pada</p>
               <p className="text-sm font-medium text-emerald-400">{cv.date}</p>
            </section>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mt-8 flex justify-center">
         <p className="text-zinc-600 text-sm">Powered by WhatsApp AI Pro Generator</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [status, setStatus] = useState<string>("Initializing...");
  const [qr, setQr] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: number; text: string; time: string }[]>([]);

  useEffect(() => {
    socket.on("status", (s: string) => setStatus(s));
    socket.on("qr", (q: string | null) => setQr(q));

    return () => {
      socket.off("status");
      socket.off("qr");
    };
  }, []);

  const addLog = (text: string) => {
    setLogs((prev) => [{ id: Date.now(), text, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (status === "Connected") addLog("Bot terhubung ke WhatsApp!");
    if (status === "Waiting for Scan") addLog("Menunggu scan QR code...");
  }, [status]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              ellbot_MK PRO
            </h1>
          </div>
          <p className="text-zinc-400 max-w-xl text-lg leading-relaxed">
            Bot WhatsApp pintar bertenaga Gemini AI. Kelola koneksi, pantau status, dan deploy dengan mudah.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Status and QR Card */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              layout
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-xl font-medium">Status Koneksi</h2>
                  <div className="flex items-center gap-2">
                    {status === "Connected" ? (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className={`text-sm font-semibold tracking-wide uppercase ${
                      status === "Connected" ? "text-emerald-400" : 
                      status === "Waiting for Scan" ? "text-amber-400" : "text-zinc-500"
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                  <Server className="w-5 h-5 text-zinc-400" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <AnimatePresence mode="wait">
                  {status === "Connected" ? (
                    <motion.div
                      key="connected"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="text-center space-y-4"
                    >
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                        <ShieldCheck className="w-32 h-32 text-emerald-400 relative z-10 mx-auto" />
                      </div>
                      <p className="text-zinc-400 max-w-xs mx-auto">
                        Bot Anda aktif dan siap menerima perintah. Gunakan prefix <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">!</code> untuk bertanya ke AI.
                      </p>
                    </motion.div>
                  ) : qr ? (
                    <motion.div
                      key="qr"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="text-center space-y-8"
                    >
                      <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <img src={qr} alt="WhatsApp QR" className="w-64 h-64 select-none" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-white">Scan QR Code</p>
                        <p className="text-sm text-zinc-400">Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="loading"
                      className="flex flex-col items-center gap-4 text-zinc-500"
                    >
                      <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="text-sm">Menyiapkan sesi WhatsApp...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
                <MessageSquare className="w-5 h-5 text-blue-400 mb-3" />
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Prefix</p>
                <p className="text-lg font-medium">!</p>
              </div>
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
                <QrCode className="w-5 h-5 text-purple-400 mb-3" />
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Session</p>
                <p className="text-lg font-medium whitespace-nowrap overflow-hidden text-ellipsis">Active_Multi</p>
              </div>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl h-full flex flex-col backdrop-blur-xl">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live Activity
                </h3>
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">{logs.length} Lines</span>
              </div>
              <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto space-y-3 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    Belum ada aktivitas...
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={log.id}
                      className="group flex gap-3"
                    >
                      <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                      <span className="text-zinc-300 break-all">{log.text}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-sm">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Gemini 1.5 Flash
            </span>
            <span>Baileys Socket 7.0</span>
          </div>
          <p>© 2024 WhatsApp AI Pro Manager</p>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cv/:id" element={<CVPage />} />
      </Routes>
    </BrowserRouter>
  );
}

