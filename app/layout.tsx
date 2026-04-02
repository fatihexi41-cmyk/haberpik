"use client"; 
import React, { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import * as FaIcons from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation"; // KANKA: Arama yönlendirmesi için şart
import axios from "axios";
import { db } from "@/lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [menuAcik, setMenuAcik] = useState(false);
  const [aramaInput, setAramaInput] = useState(""); // KANKA: Arama kutusu state'i
  const [havaDurumu, setHavaDurumu] = useState({ derece: "10", durum: "GÜNEŞLİ" });
  const [namazVakitleri, setNamazVakitleri] = useState<any>(null);
  const [namazVaktiHover, setNamazVaktiHover] = useState(false);

  const [siteAyarlari, setSiteAyarlari] = useState({
    siteAdi: 'HABERPİK',
    logoUrl: '',
    whatsapp: '0552 073 07 07',
    footerMetin: "© 2026 HABERPİK MEDYA - TÜRKİYE'NİN HABER MERKEZİ",
    facebook: '', twitter: '', instagram: '', youtube: ''
  });

  // KANKA: Tam istediğin sıralama ile DRAWER (Yandan Menü) listesi
  const tumKategoriler = [
    "Gündem", "Spor", "Siyaset", "Asayiş", "Ekonomi", "Türkiye Haberleri", 
    "Dünya", "Bilim Teknoloji", "Kültür Sanat", "Eğitim", "Sağlık", 
    "Emlak", "Otomobil", "Magazin", "Hayatın İçinden", "Video Galeri", "Foto Galeri"
  ];

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "ayarlar", "genel"), (doc) => {
      if (doc.exists()) {
        setSiteAyarlari(doc.data() as any);
      }
    });

    const fetchData = async () => {
      try {
        const hava = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kocaeli&units=metric&lang=tr&appid=8f27806f155940c6a394f4a36f4f2c0b`);
        setHavaDurumu({ derece: Math.round(hava.data.main.temp).toString(), durum: hava.data.weather[0].description.toUpperCase() });
        const namaz = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=Kocaeli&country=Turkey&method=13`);
        setNamazVakitleri(namaz.data.data.timings);
      } catch (e) { console.log("Header verileri çekilemedi"); }
    };
    
    fetchData();
    return () => unsubSettings();
  }, []);

  // KANKA: Arama motorunu çalıştıran fonksiyon
  const aramaYap = (e: React.FormEvent) => {
    e.preventDefault();
    if (aramaInput.trim()) {
      router.push(`/arama?q=${encodeURIComponent(aramaInput)}`);
      setAramaInput(""); 
    }
  };

  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#e6e6e6] text-[#111] font-sans selection:bg-red-600 selection:text-white flex flex-col">
        
        {/* YANDAN MENÜ (Drawer) - KORUNDU & SIRALAMA GÜNCELLENDİ */}
        <div className={`fixed inset-y-0 right-0 z-[999] w-80 bg-[#111] shadow-2xl transform ${menuAcik ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out border-l border-red-600/30`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <span className="text-2xl font-black italic text-white uppercase tracking-tighter">
                {siteAyarlari.logoUrl ? <img src={siteAyarlari.logoUrl} alt="logo" className="h-8 w-auto inline-block" /> : siteAyarlari.siteAdi}
              </span>
              <button onClick={() => setMenuAcik(false)} className="text-white hover:text-red-600 transition-colors"><FaIcons.FaTimes size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10 flex flex-col gap-3">
              {tumKategoriler.map(m => (
                <Link key={m} href={`/kategori/${m.toLowerCase().replace(/, /g, '-').replace(/ /g, '-')}`} onClick={() => setMenuAcik(false)} className="text-gray-300 text-base font-bold italic uppercase hover:text-red-600 hover:translate-x-2 transition-all border-b border-white/5 pb-1">{m}</Link>
              ))}
            </div>
          </div>
        </div>
        {menuAcik && <div onClick={() => setMenuAcik(false)} className="fixed inset-0 bg-black/60 z-[998] animate-in fade-in duration-300"></div>}

        {/* 1. ÜST HEADER - KORUNDU */}
        <header className="bg-white border-b border-gray-300 py-1 z-[850]">
          <div className="max-w-[1150px] mx-auto px-2 flex justify-between items-center">
            <Link href="/" className="text-4xl font-black italic tracking-tighter uppercase shrink-0">
               {siteAyarlari.logoUrl ? (
                 <img src={siteAyarlari.logoUrl} alt="logo" className="h-10 w-auto object-contain" />
               ) : (
                 <> {siteAyarlari.siteAdi.split('PİK')[0]}<span className="text-red-600">PİK</span> </>
               )}
            </Link>
            <div className="hidden lg:flex items-center gap-4 font-black text-[10px] text-gray-600 uppercase italic">
              <span className="flex items-center gap-1 text-green-600 border-r pr-4 border-gray-200"><FaIcons.FaWhatsapp size={14}/> {siteAyarlari.whatsapp}</span>
              <span className="flex items-center gap-1 border-r pr-4 border-gray-200"><FaIcons.FaCloudSun size={14} className="text-blue-400"/> KOCAELİ {havaDurumu.derece}° ({havaDurumu.durum})</span>
              <div className="relative group" onMouseEnter={() => setNamazVaktiHover(true)} onMouseLeave={() => setNamazVaktiHover(false)}>
                <span className="flex items-center gap-1 cursor-pointer text-gray-800"><FaIcons.FaClock className="text-green-700"/> NAMAZ VAKİTLERİ</span>
                {namazVaktiHover && namazVakitleri && (
                  <div className="absolute top-full left-0 w-48 bg-white shadow-2xl border border-gray-200 z-[999] p-3 mt-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] space-y-1">
                      {[{ad: "İMSAK", v: namazVakitleri.Fajr}, {ad: "GÜNEŞ", v: namazVakitleri.Sunrise}, {ad: "ÖĞLE", v: namazVakitleri.Dhuhr}, {ad: "İKİNDİ", v: namazVakitleri.Asr}, {ad: "AKŞAM", v: namazVakitleri.Maghrib}, {ad: "YATSI", v: namazVakitleri.Isha}].map(v => (
                        <div key={v.ad} className="flex justify-between border-b border-gray-50 pb-0.5 uppercase italic font-bold"><span>{v.ad}</span><b>{v.v}</b></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 text-gray-400"><FaIcons.FaFacebookF/><FaIcons.FaTwitter/><FaIcons.FaInstagram/></div>
          </div>
        </header>

        {/* 2. NAVBAR - KORUNDU & DÜNYA-TÜRKİYE-BİLİM TEKNOLOJİ GÜNCELLENDİ */}
        <nav className="bg-[#1a1a1a] sticky top-0 z-[800] shadow-sm font-black italic border-b border-red-600">
          <div className="max-w-[1150px] mx-auto flex items-center justify-between text-[12px] uppercase tracking-tighter text-white">
            <div className="flex items-center overflow-x-auto no-scrollbar">
              <Link href="/" className="px-3 py-3 bg-red-600 text-white"><FaIcons.FaHome size={18}/></Link>
              {["GÜNDEM", "SİYASET", "SPOR", "EKONOMİ", "ASAYİŞ", "DÜNYA", "TÜRKİYE HABERLERİ", "BİLİM TEKNOLOJİ"].map(m => (
                <Link key={m} href={`/kategori/${m.toLowerCase().replace(/ /g, '-')}`} className="px-3 py-3 hover:bg-white/10 border-r border-white/5 whitespace-nowrap">{m}</Link>
              ))}
            </div>
            
            {/* KANKA: ARAMA MOTORU BURADA MÜHÜRLENDİ */}
            <div className="flex items-center">
              <form onSubmit={aramaYap} className="flex items-center bg-white/5 mx-2 rounded-sm border border-white/10 focus-within:border-red-600">
                <input 
                  type="text" 
                  placeholder="HABER ARA..." 
                  className="bg-transparent border-none outline-none px-2 py-1 text-[10px] w-24 md:w-32 text-white placeholder:text-gray-600"
                  value={aramaInput}
                  onChange={(e) => setAramaInput(e.target.value)}
                />
                <button type="submit" className="p-2 hover:text-red-600 transition-colors">
                  <FaIcons.FaSearch size={14}/>
                </button>
              </form>
              <button onClick={() => setMenuAcik(!menuAcik)} className="px-4 py-3 bg-red-600 flex items-center gap-2 whitespace-nowrap">
                MENÜ {menuAcik ? <FaIcons.FaTimes size={16}/> : <FaIcons.FaBars size={16}/>}
              </button>
            </div>
          </div>
        </nav>

        {/* 3. ASIL İÇERİK */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 🛠️ KANKA: YÜZEN WHATSAPP İHBAR BUTONU (EKLENDİ) */}
        <a 
          href={`https://wa.me/${siteAyarlari.whatsapp.replace(/ /g, '')}`} 
          target="_blank" 
          className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 overflow-hidden max-w-[60px] hover:max-w-[200px] duration-500"
        >
          <FaIcons.FaWhatsapp size={28} className="shrink-0" />
          <span className="font-black italic uppercase text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">İHBAR HATTI</span>
        </a>

        {/* 4. PREMIUM FOOTER - KORUNDU & GÜNCELLENDİ */}
        <footer className="bg-[#0f0f0f] text-white pt-16 pb-8 border-t-8 border-red-600 mt-10">
          <div className="max-w-[1150px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 text-left">
              <div className="md:col-span-4 flex flex-col items-start">
                <Link href="/" className="mb-6">
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    {siteAyarlari.logoUrl ? <img src={siteAyarlari.logoUrl} alt="logo" className="h-12 grayscale invert" /> : <>HABER<span className="text-red-600">PİK</span></>}
                  </h2>
                </Link>
                <p className="text-gray-500 font-bold italic text-sm mb-8 leading-relaxed uppercase tracking-tighter max-w-sm">
                  {siteAyarlari.footerMetin}
                </p>
                <div className="flex gap-3">
                  {[{ icon: <FaIcons.FaFacebookF/>, link: siteAyarlari.facebook }, { icon: <FaIcons.FaTwitter/>, link: siteAyarlari.twitter }, { icon: <FaIcons.FaInstagram/>, link: siteAyarlari.instagram }, { icon: <FaIcons.FaYoutube/>, link: siteAyarlari.youtube }].map((s, i) => (
                    <a key={i} href={s.link || "#"} target="_blank" className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center rounded-sm hover:bg-red-600 transition-all group"><span className="text-white group-hover:scale-125 transition-transform">{s.icon}</span></a>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col gap-3">
                <h4 className="text-red-600 font-black italic text-sm mb-2 uppercase">Kategoriler</h4>
                <Link href="/kategori/gundem" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Gündem</Link>
                <Link href="/kategori/spor" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Spor</Link>
                <Link href="/kategori/foto-galeri" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Foto Galeri</Link>
                <Link href="/kategori/video-galeri" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Video Galeri</Link>
              </div>

              <div className="md:col-span-3 flex flex-col gap-3">
                <h4 className="text-red-600 font-black italic text-sm mb-2 uppercase">Kurumsal</h4>
                <Link href="/kunye" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Künye</Link>
                <Link href="/iletisim" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">İletişim</Link>
                <Link href="/kullanim-sartlari" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Kullanım Şartları</Link>
                <Link href="/gizlilik-sozlesmesi" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Gizlilik Sözleşmesi</Link>
                <Link href="/yayin-ilkeleri" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Yayın İlkeleri</Link>
              </div>

              <div className="md:col-span-2 flex flex-col items-start md:items-end">
                <h4 className="text-red-600 font-black italic text-sm mb-4 uppercase">İhbar Hattı</h4>
                <a href={`https://wa.me/${siteAyarlari.whatsapp.replace(/ /g, '')}`} target="_blank" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-sm font-black italic text-[10px] flex items-center gap-2 transition-all">
                  <FaIcons.FaWhatsapp size={16} /> WHATSAPP İHBAR
                </a>
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black italic text-gray-600 uppercase tracking-widest">
              <p>© {new Date().getFullYear()} {siteAyarlari.siteAdi} - TÜM HAKLARI SAKLIDIR.</p>
              <div className="flex items-center gap-2"><span>TASARIM & YAZILIM:</span><span className="text-red-600">HABERPİK TECH</span></div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}