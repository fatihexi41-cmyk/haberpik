"use client";
import React, { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import * as FaIcons from "react-icons/fa";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// ─── SLUG HARİTASI (tek merkezi tanım — iki yerde kopyalanmıştı, biri "saglak" yazım hatasıyla) ───
const SLUG_MAP: Record<string, string> = {
  "GÜNDEM": "gundem",
  "SİYASET": "siyaset",
  "SPOR": "spor",
  "EKONOMİ": "ekonomi",
  "ASAYİŞ": "asayis",
  "DÜNYA": "dunya",
  "TÜRKİYE HABERLERİ": "turkiye",
  "BİLİM TEKNOLOJİ": "teknoloji",
  "SAĞLIK": "saglik",   // DÜZELTİLDİ: "saglak" → "saglik"
  "EĞİTİM": "egitim",
  "HAYATIN İÇİNDEN": "yasam",
};

const NAVBAR_KATEGORILER = [
  "GÜNDEM", "SİYASET", "SPOR", "EKONOMİ",
  "ASAYİŞ", "DÜNYA", "TÜRKİYE HABERLERİ", "BİLİM TEKNOLOJİ",
];

const TUM_KATEGORILER = Object.keys(SLUG_MAP);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin") || pathname?.startsWith("/login");

  const [menuAcik, setMenuAcik] = useState(false);
  const [aramaInput, setAramaInput] = useState("");
  const [havaDurumu, setHavaDurumu] = useState({ derece: "10", durum: "GÜNEŞLİ" });
  const [namazVakitleri, setNamazVakitleri] = useState<any>(null);
  const [namazVaktiHover, setNamazVaktiHover] = useState(false);
  const [namazVaktiTiklandi, setNamazVaktiTiklandi] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cerezBanner, setCerezBanner] = useState(false); // EKLENDI: KVKK çerez banner

  const [siteAyarlari, setSiteAyarlari] = useState<any>({
    siteBasligi: "HABERPİK",
    logoUrl: "",
    whatsapp: "0532 449 03 81",
    footerMetin: "© 2026 HABERPİK MEDYA - TÜRKİYE'NİN HABER MERKEZİ",
    siteAciklamasi: "",
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
  });

  // EKLENDI: Çerez banner — daha önce onaylamadıysa göster
  useEffect(() => {
    const onay = localStorage.getItem("cerez-onay");
    if (!onay) setCerezBanner(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAdminPage) return;

    const unsubSettings = onSnapshot(doc(db, "ayarlar", "genel"), (docSnap) => {
      if (docSnap.exists()) setSiteAyarlari(docSnap.data());
    });

    const unsubServices = onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.hava) {
          setHavaDurumu({
            derece: data.hava.derece.toString(),
            durum: data.hava.durum.toUpperCase(),
          });
        }
        if (data.namaz) setNamazVakitleri(data.namaz);
      }
    });

    return () => {
      unsubSettings();
      unsubServices();
    };
  }, [isAdminPage]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const cerezKabul = () => {
    localStorage.setItem("cerez-onay", "evet");
    setCerezBanner(false);
  };

  const aramaYap = (e: React.FormEvent) => {
    e.preventDefault();
    if (aramaInput.trim()) {
      router.push(`/arama?q=${encodeURIComponent(aramaInput)}`);
      setAramaInput("");
      setMenuAcik(false);
    }
  };

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${isDarkMode ? "dark" : ""}`}
    >
      {/* ─── SEO / META ─────────────────────────────────────────────────────────
          layout.tsx "use client" olduğu için metadata export edilemiyor.
          Statik meta etiketlerini buraya, dinamik olanları ilgili page.tsx'e ekle.
          Aşağıdaki head bloğu temel Open Graph + Twitter Card sağlar.
      ──────────────────────────────────────────────────────────────────────── */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Kocaeli ve Türkiye'den son dakika haberleri, gündem, spor, ekonomi ve daha fazlası — HABERPİK." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.haberpik.com" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="HABERPİK" />
        <meta property="og:locale" content="tr_TR" />
        <meta property="og:url" content="https://www.haberpik.com" />
        <meta property="og:title" content="HABERPİK — Kocaeli ve Türkiye Haberleri" />
        <meta property="og:description" content="Kocaeli ve Türkiye'den son dakika haberleri, gündem, spor, ekonomi ve daha fazlası." />
        <meta property="og:image" content="https://www.haberpik.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@haberpik" />
        <meta name="twitter:title" content="HABERPİK — Kocaeli ve Türkiye Haberleri" />
        <meta name="twitter:description" content="Kocaeli ve Türkiye'den son dakika haberleri, gündem, spor, ekonomi ve daha fazlası." />
        <meta name="twitter:image" content="https://www.haberpik.com/og-image.jpg" />

        {/* Schema.org — Haber Sitesi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              "name": "HABERPİK",
              "url": "https://www.haberpik.com",
              "logo": "https://www.haberpik.com/logo.png",
              "sameAs": [],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Darıca",
                "addressRegion": "Kocaeli",
                "addressCountry": "TR",
              },
            }),
          }}
        />
      </head>

      <body
        className={`min-h-full transition-colors duration-300 ${
          isDarkMode ? "bg-[#111] text-white" : "bg-[#e6e6e6] text-[#111]"
        } font-sans selection:bg-red-600 selection:text-white flex flex-col`}
      >
        {isAdminPage ? (
          <main className="flex-grow">{children}</main>
        ) : (
          <>
            {/* Scroll progress bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
              <div
                className="h-full bg-red-600 transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* ─── YANDAN MENÜ ─── */}
            <div
              className={`fixed inset-y-0 right-0 z-[999] w-80 bg-[#111] shadow-2xl transform ${
                menuAcik ? "translate-x-0" : "translate-x-full"
              } transition-transform duration-300 ease-in-out border-l border-red-600/30`}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <span className="text-2xl font-black italic text-white uppercase tracking-tighter">
                    {siteAyarlari.logoUrl ? (
                      <img src={siteAyarlari.logoUrl} alt="logo" className="h-8 w-auto inline-block" />
                    ) : (
                      siteAyarlari.siteBasligi
                    )}
                  </span>
                  <button onClick={() => setMenuAcik(false)} className="text-white hover:text-red-600 transition-colors">
                    <FaIcons.FaTimes size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pb-10 flex flex-col gap-3">
                  {TUM_KATEGORILER.map((m) => (
                    <Link
                      key={m}
                      href={`/kategori/${SLUG_MAP[m]}`}
                      onClick={() => setMenuAcik(false)}
                      className="text-gray-300 text-base font-bold italic uppercase hover:text-red-600 hover:translate-x-2 transition-all border-b border-white/5 pb-1"
                    >
                      {m}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {menuAcik && (
              <div
                onClick={() => setMenuAcik(false)}
                className="fixed inset-0 bg-black/60 z-[998] animate-in fade-in duration-300"
              />
            )}

            {/* ─── ÜST HEADER ─── */}
            <header
              className={`${
                isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-gray-300"
              } border-b py-1 z-[850] transition-colors`}
            >
              <div className="max-w-[1150px] mx-auto px-2 flex justify-between items-center">
                <Link href="/" className="text-4xl font-black italic tracking-tighter uppercase shrink-0">
                  {siteAyarlari.logoUrl ? (
                    <img
                      src={siteAyarlari.logoUrl}
                      alt={siteAyarlari.siteBasligi || "HABERPİK"}
                      className={`h-10 w-auto object-contain ${isDarkMode ? "brightness-125" : ""}`}
                    />
                  ) : (
                    <span className={isDarkMode ? "text-white" : "text-black"}>
                      {(siteAyarlari?.siteBasligi || "HABERPİK").split("PİK")[0]}
                      <span className="text-red-600">PİK</span>
                    </span>
                  )}
                </Link>

                <div
                  className={`hidden lg:flex items-center gap-4 font-black text-[10px] uppercase italic ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {/* DÜZELTİLDİ: İletişim sayfasındaki 0552 ile çakışıyordu — artık Firebase'den geliyor */}
                  <span className="flex items-center gap-1 text-green-600 border-r pr-4 border-gray-200/20">
                    <FaIcons.FaWhatsapp size={14} /> {siteAyarlari.whatsapp}
                  </span>
                  <span className="flex items-center gap-1 border-r pr-4 border-gray-200/20">
                    <FaIcons.FaCloudSun size={14} className="text-blue-400" /> KOCAELİ {havaDurumu.derece}°
                    ({havaDurumu.durum})
                  </span>

                  {/* Namaz Vakti Popup */}
                  <div
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNamazVaktiTiklandi(!namazVaktiTiklandi);
                    }}
                    onMouseEnter={() => setNamazVaktiHover(true)}
                    onMouseLeave={() => setNamazVaktiHover(false)}
                  >
                    <span
                      className={`flex items-center gap-1 cursor-pointer select-none hover:text-green-600 transition-colors ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      <FaIcons.FaClock className="text-green-700" /> NAMAZ VAKİTLERİ
                    </span>
                    {(namazVaktiTiklandi || namazVaktiHover) && (
                      <div
                        className={`absolute top-full left-0 w-52 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border z-[9999] p-4 mt-2 rounded-md ${
                          isDarkMode ? "bg-[#222] border-white/20" : "bg-white border-gray-300"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {namazVakitleri ? (
                          <div className="text-[11px] space-y-2">
                            <div className="text-red-600 font-black border-b pb-1 mb-2 uppercase italic">
                              Kocaeli Vakitleri
                            </div>
                            {[
                              { ad: "İmsak", v: namazVakitleri.Fajr },
                              { ad: "Güneş", v: namazVakitleri.Sunrise },
                              { ad: "Öğle", v: namazVakitleri.Dhuhr },
                              { ad: "İkindi", v: namazVakitleri.Asr },
                              { ad: "Akşam", v: namazVakitleri.Maghrib },
                              { ad: "Yatsı", v: namazVakitleri.Isha },
                            ].map((v) => (
                              <div
                                key={v.ad}
                                className={`flex justify-between border-b border-dashed pb-1 font-bold ${
                                  isDarkMode ? "border-white/10 text-white" : "border-gray-100 text-black"
                                }`}
                              >
                                <span className="text-gray-500 uppercase">{v.ad}</span>
                                <span className="font-black italic">{v.v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-red-600 animate-pulse italic">
                            Vakitler Yükleniyor...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={toggleDarkMode}
                    className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    {isDarkMode ? (
                      <FaIcons.FaSun className="text-yellow-500" size={16} />
                    ) : (
                      <FaIcons.FaMoon className="text-slate-700" size={16} />
                    )}
                  </button>

                  {/* DÜZELTİLDİ: href="#" yerine Firebase'den gelen gerçek linkler */}
                  <div className="flex gap-3 text-gray-400 border-l pl-4 border-gray-200/20 ml-2">
                    {siteAyarlari.facebook && (
                      <a href={siteAyarlari.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors" aria-label="Facebook">
                        <FaIcons.FaFacebookF size={14} />
                      </a>
                    )}
                    {siteAyarlari.twitter && (
                      <a href={siteAyarlari.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors" aria-label="Twitter">
                        <FaIcons.FaTwitter size={14} />
                      </a>
                    )}
                    {siteAyarlari.instagram && (
                      <a href={siteAyarlari.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors" aria-label="Instagram">
                        <FaIcons.FaInstagram size={14} />
                      </a>
                    )}
                    {siteAyarlari.youtube && (
                      <a href={siteAyarlari.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors" aria-label="YouTube">
                        <FaIcons.FaYoutube size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* ─── NAVBAR ─── */}
            <nav className="bg-[#1a1a1a] sticky top-0 z-[800] shadow-sm font-black italic border-b border-red-600">
              <div className="max-w-[1150px] mx-auto flex items-center justify-between text-[12px] uppercase tracking-tighter text-white">
                <div className="flex items-center overflow-x-auto no-scrollbar">
                  <Link href="/" className="px-3 py-3 bg-red-600 text-white" aria-label="Ana Sayfa">
                    <FaIcons.FaHome size={18} />
                  </Link>
                  {NAVBAR_KATEGORILER.map((m) => (
                    <Link
                      key={m}
                      href={`/kategori/${SLUG_MAP[m]}`}
                      className="px-3 py-3 hover:bg-white/10 border-r border-white/5 whitespace-nowrap"
                    >
                      {m}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center">
                  <form
                    onSubmit={aramaYap}
                    className="flex items-center bg-white/5 mx-2 rounded-sm border border-white/10 focus-within:border-red-600"
                    role="search"
                  >
                    <input
                      type="search"
                      placeholder="HABER ARA..."
                      aria-label="Haber ara"
                      className="bg-transparent border-none outline-none px-2 py-1 text-[10px] w-24 md:w-32 text-white placeholder:text-gray-600"
                      value={aramaInput}
                      onChange={(e) => setAramaInput(e.target.value)}
                    />
                    <button type="submit" className="p-2 hover:text-red-600 transition-colors" aria-label="Ara">
                      <FaIcons.FaSearch size={14} />
                    </button>
                  </form>
                  <button
                    onClick={() => setMenuAcik(!menuAcik)}
                    className="px-4 py-3 bg-red-600 flex items-center gap-2 whitespace-nowrap"
                    aria-label="Menüyü aç/kapat"
                  >
                    MENÜ {menuAcik ? <FaIcons.FaTimes size={16} /> : <FaIcons.FaBars size={16} />}
                  </button>
                </div>
              </div>
            </nav>

            <main className="flex-grow">{children}</main>

            {/* WhatsApp İhbar Butonu */}
            <a
              href={`https://wa.me/${(siteAyarlari.whatsapp || "").replace(/ /g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 overflow-hidden max-w-[60px] hover:max-w-[200px] duration-500"
              aria-label="WhatsApp İhbar Hattı"
            >
              <FaIcons.FaWhatsapp size={28} className="shrink-0" />
              <span className="font-black italic uppercase text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                İHBAR HATTI
              </span>
            </a>

            {/* ─── KVKK ÇEREZ BANNER (YENİ) ─── */}
            {cerezBanner && (
              <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-[#111] border-t-2 border-red-600 px-4 py-4">
                <div className="max-w-[1150px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-gray-300 text-xs font-bold italic uppercase leading-relaxed max-w-2xl">
                    Bu site, daha iyi hizmet sunmak amacıyla çerez kullanmaktadır.{" "}
                    <Link href="/gizlilik-sozlesmesi" className="text-red-500 underline hover:text-red-400">
                      Gizlilik Sözleşmesi
                    </Link>
                    'ni inceleyebilirsiniz. Siteyi kullanmaya devam ederek çerez politikamızı kabul etmiş sayılırsınız.
                  </p>
                  <button
                    onClick={cerezKabul}
                    className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-black italic uppercase text-xs px-6 py-3 rounded-sm transition-colors"
                  >
                    Kabul Et
                  </button>
                </div>
              </div>
            )}

            {/* ─── FOOTER ─── */}
            <footer
              className={`pt-16 pb-8 border-t-8 border-red-600 mt-10 transition-colors ${
                isDarkMode ? "bg-[#0a0a0a]" : "bg-[#0f0f0f]"
              }`}
            >
              <div className="max-w-[1150px] mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 text-left">
                  {/* Logo & Açıklama */}
                  <div className="md:col-span-4 flex flex-col items-start">
                    <Link href="/" className="mb-6">
                      <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                        {siteAyarlari.logoUrl ? (
                          <img
                            src={siteAyarlari.logoUrl}
                            alt={siteAyarlari.siteBasligi || "HABERPİK"}
                            className="h-12 grayscale invert brightness-200"
                          />
                        ) : (
                          <>
                            {(siteAyarlari.siteBasligi || "HABER").split("PİK")[0]}
                            <span className="text-red-600">PİK</span>
                          </>
                        )}
                      </h2>
                    </Link>
                    <p className="text-gray-500 font-bold italic text-sm mb-8 leading-relaxed uppercase tracking-tighter max-w-sm">
                      {siteAyarlari.siteAciklamasi ||
                        "Gündeme Yön Veren Haberler. Kocaeli'nin Dinamikleri ve Türkiye'nin Gerçekleri Tek Bir Çatı Altında"}
                    </p>
                    <div className="flex gap-3">
                      {[
                        { icon: <FaIcons.FaFacebookF />, link: siteAyarlari.facebook, label: "Facebook" },
                        { icon: <FaIcons.FaTwitter />, link: siteAyarlari.twitter, label: "Twitter" },
                        { icon: <FaIcons.FaInstagram />, link: siteAyarlari.instagram, label: "Instagram" },
                        { icon: <FaIcons.FaYoutube />, link: siteAyarlari.youtube, label: "YouTube" },
                      ].map((s, i) =>
                        s.link ? (
                          <a
                            key={i}
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={s.label}
                            className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center rounded-sm hover:bg-red-600 transition-all group"
                          >
                            <span className="text-white group-hover:scale-125 transition-transform">{s.icon}</span>
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>

                  {/* DÜZELTİLDİ: Tüm kategoriler footer'da — sadece Gündem+Spor değil */}
                  <div className="md:col-span-3 flex flex-col gap-3">
                    <h4 className="text-red-600 font-black italic text-sm mb-2 uppercase">Kategoriler</h4>
                    {TUM_KATEGORILER.map((kat) => (
                      <Link
                        key={kat}
                        href={`/kategori/${SLUG_MAP[kat]}`}
                        className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors"
                      >
                        {kat}
                      </Link>
                    ))}
                  </div>

                  {/* Kurumsal */}
                  <div className="md:col-span-3 flex flex-col gap-3">
                    <h4 className="text-red-600 font-black italic text-sm mb-2 uppercase">Kurumsal</h4>
                    <Link href="/kunye" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Künye</Link>
                    <Link href="/iletisim" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">İletişim</Link>
                    <Link href="/kullanim-sartlari" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Kullanım Şartları</Link>
                    <Link href="/gizlilik-sozlesmesi" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Gizlilik Sözleşmesi</Link>
                    <Link href="/yayin-ilkeleri" className="text-gray-400 hover:text-white font-bold italic text-xs uppercase transition-colors">Yayın İlkeleri</Link>
                  </div>

                  {/* İhbar */}
                  <div className="md:col-span-2 flex flex-col items-start md:items-end">
                    <h4 className="text-red-600 font-black italic text-sm mb-4 uppercase">İhbar Hattı</h4>
                    <a
                      href={`https://wa.me/${(siteAyarlari.whatsapp || "").replace(/ /g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-sm font-black italic text-[10px] flex items-center gap-2 transition-all"
                    >
                      <FaIcons.FaWhatsapp size={16} /> WHATSAPP İHBAR
                    </a>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black italic text-gray-600 uppercase tracking-widest">
                  <p>© {new Date().getFullYear()} {(siteAyarlari?.siteBasligi || "HABERPİK").toUpperCase()} - TÜM HAKLARI SAKLIDIR.</p>
                  <div className="flex items-center gap-2">
                    <span>TASARIM & YAZILIM:</span>
                    <span className="text-red-600">HABERPİK TECH</span>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}
      </body>
    </html>
  );
}