"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import * as FaIcons from "react-icons/fa";

const MAX_DENEME = 5;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [deneme, setDeneme] = useState(0);
  const [kilitli, setKilitli] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kilitli) return;

    setHata("");
    setYukleniyor(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (error: any) {
      const yeniDeneme = deneme + 1;
      setDeneme(yeniDeneme);

      // DÜZELTİLDİ: alert() yerine inline hata mesajı
      if (yeniDeneme >= MAX_DENEME) {
        setKilitli(true);
        setHata(`${MAX_DENEME} hatalı deneme. Form kilitlendi, sayfayı yenileyin.`);
      } else {
        const kalan = MAX_DENEME - yeniDeneme;
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
          setHata(`E-posta veya şifre hatalı. ${kalan} deneme hakkın kaldı.`);
        } else if (error.code === "auth/too-many-requests") {
          setKilitli(true);
          setHata("Çok fazla hatalı giriş. Bir süre bekleyin.");
        } else {
          setHata("Giriş yapılamadı. Lütfen tekrar deneyin.");
        }
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* LOGO */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            HABER<span className="text-red-600">PİK</span>
          </h1>
          <p className="text-gray-500 text-[11px] font-black italic uppercase mt-2 tracking-widest">
            Admin Paneli
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 space-y-4 shadow-2xl"
        >
          {/* E-POSTA */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black italic uppercase text-gray-500 tracking-widest">
              E-Posta
            </label>
            <div className="flex items-center bg-[#222] border border-white/10 rounded-xl focus-within:border-red-600 transition-colors">
              <FaIcons.FaEnvelope className="text-gray-600 ml-4 shrink-0" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@haberpik.com"
                disabled={kilitli}
                className="flex-1 bg-transparent px-3 py-4 text-white text-sm outline-none placeholder:text-gray-700 disabled:opacity-50"
              />
            </div>
          </div>

          {/* ŞİFRE */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black italic uppercase text-gray-500 tracking-widest">
              Şifre
            </label>
            <div className="flex items-center bg-[#222] border border-white/10 rounded-xl focus-within:border-red-600 transition-colors">
              <FaIcons.FaLock className="text-gray-600 ml-4 shrink-0" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={kilitli}
                className="flex-1 bg-transparent px-3 py-4 text-white text-sm outline-none placeholder:text-gray-700 disabled:opacity-50"
              />
            </div>
          </div>

          {/* HATA MESAJI */}
          {hata && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-[11px] font-bold px-4 py-3 rounded-xl flex items-center gap-2">
              <FaIcons.FaExclamationCircle size={14} className="shrink-0" />
              {hata}
            </div>
          )}

          {/* DENEME SAYACI */}
          {deneme > 0 && !kilitli && (
            <div className="flex gap-1 justify-center">
              {Array.from({ length: MAX_DENEME }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < deneme ? 'bg-red-600' : 'bg-white/10'}`}
                />
              ))}
            </div>
          )}

          {/* GİRİŞ BUTONU */}
          <button
            type="submit"
            disabled={yukleniyor || kilitli}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black italic uppercase py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-sm"
          >
            {yukleniyor ? (
              <><FaIcons.FaSpinner className="animate-spin" size={16} /> GİRİŞ YAPILIYOR...</>
            ) : kilitli ? (
              <><FaIcons.FaLock size={16} /> KİLİTLENDİ</>
            ) : (
              <><FaIcons.FaSignInAlt size={16} /> GİRİŞ YAP</>
            )}
          </button>
        </form>

        <p className="text-center text-gray-700 text-[10px] font-black italic uppercase mt-6 tracking-widest">
          © {new Date().getFullYear()} HABERPİK — Yetkisiz giriş yasaktır.
        </p>
      </div>
    </div>
  );
}