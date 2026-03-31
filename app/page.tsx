"use client";
import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import axios from 'axios';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [haberler, setHaberler] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [havaDurumu, setHavaDurumu] = useState({ derece: "10", durum: "GÜNEŞLİ" });
  const [namazVakitleri, setNamazVakitleri] = useState<any>(null);
  const [piyasa, setPiyasa] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [menuAcik, setMenuAcik] = useState(false);
  const [namazVaktiHover, setNamazVaktiHover] = useState(false);
  const [activeKatTab, setActiveKatTab] = useState('TÜRKİYE');

  useEffect(() => {
    // 1. HABERLERİ ÇEK
    const q = query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(300));
    const unsubscribeHaber = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setHaberler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setYukleniyor(false);
    });

    // 2. GAZETELERİ ÇEK (MÜHÜR BURADA!)
    const qGazete = query(collection(db, "gazeteler"), orderBy("tarih", "desc"), limit(30));
    const unsubscribeGazete = onSnapshot(qGazete, (snapshot) => {
      if (!snapshot.empty) {
        setGazeteler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    // 3. HAVA DURUMU - KOCAELİ
    const fetchHava = async () => {
      try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kocaeli&units=metric&lang=tr&appid=8f27806f155940c6a394f4a36f4f2c0b`);
        setHavaDurumu({ derece: Math.round(res.data.main.temp).toString(), durum: res.data.weather[0].description.toUpperCase() });
      } catch (e) { console.log("Hava durumu çekilemedi"); }
    };

    // 4. NAMAZ VAKİTLERİ
    const fetchNamaz = async () => {
      try {
        const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=Kocaeli&country=Turkey&method=13`);
        setNamazVakitleri(res.data.data.timings);
      } catch (e) { console.log("Namaz vakti çekilemedi"); }
    };

    // 5. DÖVİZ KURLARI
    const fetchPiyasa = async () => {
      try {
        const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
        const tryRate = res.data.rates.TRY;
        setPiyasa({
          DOLAR: tryRate.toFixed(2),
          EURO: (tryRate * 1.08).toFixed(2),
          ALTIN: (tryRate * 75).toFixed(0)
        });
      } catch (e) { console.log("Piyasa verisi çekilemedi"); }
    };

    fetchHava(); fetchNamaz(); fetchPiyasa();
    return () => { unsubscribeHaber(); unsubscribeGazete(); };
  }, []);

  const getKat = (kat: string, l: number = 10) => haberler.filter(h => h.kategori === kat).slice(0, l);
  const sonDakikaHaberleri = haberler.filter(h => h.sonDakika);

  if (yukleniyor) return <div className="min-h-screen bg-white flex items-center justify-center font-black italic animate-pulse text-4xl text-red-600 uppercase tracking-tighter">HABERPİK...</div>;

  return (
    <div className="bg-[#e6e6e6] text-[#111] font-sans selection:bg-red-600 selection:text-white antialiased">
      
      {/* 1. ÜST HEADER */}
      <header className="bg-white border-b border-gray-300 py-1">
        <div className="max-w-[1150px] mx-auto px-2 flex justify-between items-center">
          <Link href="/" className="text-4xl font-black italic tracking-tighter uppercase shrink-0">HABER<span className="text-red-600">PİK</span></Link>
          <div className="hidden lg:flex items-center gap-4 font-black text-[10px] text-gray-600 uppercase italic">
            <span className="flex items-center gap-1 text-green-600 border-r pr-4 border-gray-200"><FaIcons.FaWhatsapp size={14}/> 0552 073 07 07</span>
            <span className="flex items-center gap-1 border-r pr-4 border-gray-200"><FaIcons.FaCloudSun size={14} className="text-blue-400"/> KOCAELİ {havaDurumu.derece}° ({havaDurumu.durum})</span>
            <div className="relative group" onMouseEnter={() => setNamazVaktiHover(true)} onMouseLeave={() => setNamazVaktiHover(false)}>
              <span className="flex items-center gap-1 cursor-pointer text-gray-800"><FaIcons.FaClock className="text-green-700"/> NAMAZ VAKİTLERİ</span>
              {namazVaktiHover && namazVakitleri && (
                <div className="absolute top-full left-0 w-48 bg-white shadow-2xl border border-gray-200 z-[999] p-3 mt-1 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-[10px] space-y-1">
                    {[
                      {ad: "İMSAK", v: namazVakitleri.Fajr},
                      {ad: "GÜNEŞ", v: namazVakitleri.Sunrise},
                      {ad: "ÖĞLE", v: namazVakitleri.Dhuhr},
                      {ad: "İKİNDİ", v: namazVakitleri.Asr},
                      {ad: "AKŞAM", v: namazVakitleri.Maghrib},
                      {ad: "YATSI", v: namazVakitleri.Isha}
                    ].map(v => (
                      <div key={v.ad} className="flex justify-between border-b border-gray-50 pb-0.5 uppercase italic font-bold">
                        <span>{v.ad}</span><b>{v.v}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 text-gray-400"><FaIcons.FaFacebookF/><FaIcons.FaTwitter/><FaIcons.FaInstagram/></div>
        </div>
      </header>

      {/* 2. NAVBAR */}
      <nav className="bg-[#1a1a1a] sticky top-0 z-[800] shadow-sm font-black italic">
        <div className="max-w-[1150px] mx-auto flex items-center justify-between text-[12px] uppercase tracking-tighter text-white">
          <div className="flex items-center overflow-x-auto no-scrollbar">
            <Link href="/" className="px-3 py-3 bg-red-600 text-white"><FaIcons.FaHome size={18}/></Link>
            {["SON DAKİKA", "GÜNDEM", "SİYASET", "SPOR", "EKONOMİ", "TEKNOLOJİ", "DÜNYA"].map(m => (
              <Link key={m} href={`/kategori/${m}`} className="px-3 py-3 hover:bg-white/10 border-r border-white/5 whitespace-nowrap">{m}</Link>
            ))}
          </div>
          <div className="flex items-center">
            <button className="p-3 hover:bg-white/10"><FaIcons.FaSearch size={16}/></button>
            <button onClick={() => setMenuAcik(!menuAcik)} className="px-4 py-3 bg-red-600 flex items-center gap-2 whitespace-nowrap">
              MENÜ {menuAcik ? <FaIcons.FaTimes size={16}/> : <FaIcons.FaBars size={16}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* 3. SON DAKİKA BANDI */}
      <div className="bg-[#222] py-1.5 overflow-hidden border-b border-black">
        <div className="max-w-[1150px] mx-auto px-2 flex items-center">
            <span className="bg-red-600 text-white px-3 py-0.5 text-[10px] font-black italic mr-4 shrink-0">SON DAKİKA</span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee-slow whitespace-nowrap flex gap-12 font-bold text-[11px] text-white italic uppercase tracking-tighter">
                 {sonDakikaHaberleri.slice(0, 10).map((h, i) => (
                   <Link key={i} href={`/haber/${h.id}`} className="hover:text-red-500 flex items-center gap-1">• {h.baslik}</Link>
                 ))}
              </div>
            </div>
        </div>
      </div>

      <main className="max-w-[1150px] mx-auto px-1 py-1">
        
        {/* ANA MANŞET GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 mb-1">
          <div className="lg:col-span-8 bg-black">
            <Swiper modules={[Autoplay, Navigation, Pagination]} autoplay={{ delay: 7000 }} pagination={{ clickable: true, renderBullet: (index, className) => `<span class="${className}">${index + 1}</span>` }} className="h-[350px] md:h-[450px]">
              {haberler.slice(0, 20).map((h) => (
                <SwiperSlide key={h.id}>
                  <Link href={`/haber/${h.id}`} className="relative block h-full group">
                    <img src={h.resim} className="w-full h-full object-cover" alt="m"/>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pb-12">
                        <h2 className="text-white text-xl md:text-3xl font-black uppercase italic leading-tight tracking-tighter drop-shadow-md">{h.baslik}</h2>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="lg:col-span-4 space-y-1">
             <div className="bg-red-600 text-white text-center py-1.5 font-black italic text-[11px] uppercase tracking-widest tracking-tighter">ÖNE ÇIKANLAR</div>
             {haberler.slice(21, 26).map((h) => (
               <Link href={`/haber/${h.id}`} key={h.id} className="flex gap-2 bg-white border border-gray-200 p-0.5 hover:bg-gray-50 h-[81px] group">
                  <div className="w-24 h-full shrink-0 overflow-hidden bg-gray-100">
                     <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-[11px] font-black leading-tight line-clamp-3 uppercase italic self-center tracking-tighter group-hover:text-red-600">{h.baslik}</h3>
               </Link>
             ))}
          </div>
        </div>

        {/* 4'LÜ RESİMLİ SON DAKİKA HABERLERİ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-2">
           {sonDakikaHaberleri.slice(0, 4).map((h) => (
             <Link href={`/haber/${h.id}`} key={h.id} className="relative h-32 group overflow-hidden border border-white/10 shadow-sm">
                <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] px-2 py-0.5 font-black uppercase italic z-10">SON DAKİKA</div>
                <div className="absolute bottom-0 p-2 w-full text-center">
                   <h4 className="text-white text-[10px] font-black uppercase italic leading-tight line-clamp-2 drop-shadow-md tracking-tighter">{h.baslik}</h4>
                </div>
             </Link>
           ))}
        </div>

        {/* SPOR BÖLÜMÜ */}
        <section className="mt-2 bg-white border-t-2 border-green-600 p-2 shadow-sm">
           <div className="flex justify-between items-center mb-2 border-b pb-1">
              <div className="flex items-center gap-2">
                <FaIcons.FaFutbol className="text-green-600" size={24}/>
                <h3 className="text-xl font-black italic uppercase text-green-700 tracking-tighter">SPOR<span className="text-black">PİK</span></h3>
              </div>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
              <div className="lg:col-span-3 space-y-1">
                 {getKat("SPOR", 6).map((h, i) => (
                    <Link href={`/haber/${h.id}`} key={h.id} className="flex items-center gap-2 bg-gray-50 border p-1 hover:bg-green-50 transition-all h-[52px]">
                       <span className="text-2xl font-black text-gray-200 italic leading-none">{i+1}</span>
                       <h5 className="text-[9px] font-black uppercase italic line-clamp-3">{h.baslik}</h5>
                    </Link>
                 ))}
              </div>
              <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-1">
                 {getKat("SPOR", 12).slice(6, 12).map(h => (
                    <Link href={`/haber/${h.id}`} key={h.id} className="relative h-36 group overflow-hidden border">
                       <img src={h.resim} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"/>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex items-end p-2 group-hover:from-black/60">
                          <h5 className="text-white text-[10px] font-black uppercase italic leading-tight line-clamp-2 tracking-tighter">{h.baslik}</h5>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>
        </section>

        {/* GÜNDEM */}
        <section className="mt-4">
           <div className="flex items-center gap-2 mb-2"><h3 className="text-lg font-black italic uppercase border-l-4 border-gray-900 pl-2">GÜNDEM</h3><div className="flex-1 h-[1px] bg-gray-300"></div></div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              {getKat("GÜNDEM", 8).map(h => (
                <Link href={`/haber/${h.id}`} key={h.id} className="relative group aspect-square overflow-hidden bg-black border border-white/5 text-center">
                   <img src={h.resim} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                   <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <h4 className="text-white text-[10px] font-black uppercase italic leading-tight line-clamp-3 group-hover:text-red-600 transition-colors w-full">{h.baslik}</h4>
                   </div>
                </Link>
              ))}
           </div>
        </section>

        {/* GAZETELER (KANKA MÜHÜRÜ BURAYA BASTIM!) */}
        <section className="mt-4 bg-[#1a1a1a] p-3 rounded-sm overflow-hidden shadow-xl">
           <h3 className="text-lg font-black italic uppercase text-white border-l-4 border-red-600 pl-2 mb-3 tracking-tighter">GÜNÜN GAZETE MANŞETLERİ</h3>
           <Swiper 
              modules={[Autoplay, Navigation]} 
              slidesPerView={3} 
              breakpoints={{ 768: { slidesPerView: 5 }, 1024: { slidesPerView: 6.5 } }} 
              spaceBetween={12} 
              autoplay={{ delay: 3500 }} 
              navigation 
              className="h-64"
           >
              {gazeteler.length > 0 ? gazeteler.map((g, i) => (
                <SwiperSlide key={g.id || i}>
                   <div className="bg-white p-1 shadow-2xl h-full border border-gray-400 group hover:-translate-y-3 transition-all duration-300 cursor-pointer relative">
                      <div className="w-full h-[90%] overflow-hidden bg-gray-200">
                        <img 
                          src={g.resim || "https://via.placeholder.com/300x450?text=HABERPİK"} 
                          className="w-full h-full object-cover" 
                          alt={g.ad} 
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 w-full bg-red-600 text-white text-center text-[9px] font-black italic uppercase py-1 group-hover:bg-black transition-colors">{g.ad}</div>
                   </div>
                </SwiperSlide>
              )) : [1,2,3,4,5,6,7].map(i => (
                <SwiperSlide key={i}>
                  <div className="bg-gray-800 h-full animate-pulse border border-gray-700 rounded-sm"></div>
                </SwiperSlide>
              ))}
           </Swiper>
        </section>

        {/* EKONOMİ */}
        <section className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-1 mb-4">
           <div className="lg:col-span-9 bg-white p-3 border-t-2 border-blue-900 shadow-sm">
              <h3 className="text-lg font-black italic uppercase mb-2 text-blue-900 flex items-center gap-2"><FaIcons.FaChartLine/> EKONOMİPİK</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                 {getKat("EKONOMİ", 9).map(h => (
                    <Link href={`/haber/${h.id}`} key={h.id} className="group border-b border-gray-50 last:border-0 pb-1 hover:bg-gray-50 transition-colors">
                       <h4 className="text-[10px] font-black uppercase italic leading-tight group-hover:text-blue-900 line-clamp-3">{h.baslik}</h4>
                    </Link>
                 ))}
              </div>
           </div>
           <div className="lg:col-span-3 space-y-1">
              <div className="bg-blue-900 text-white p-1.5 text-center font-black italic uppercase text-xs">PİYASA EKRANI</div>
              {piyasa ? [
                { n: "DOLAR", v: piyasa.DOLAR, d: "up", i: <FaIcons.FaDollarSign size={10}/> },
                { n: "EURO", v: piyasa.EURO, d: "up", i: <FaIcons.FaEuroSign size={10}/> },
                { n: "ALTIN", v: piyasa.ALTIN, d: "up", i: <FaIcons.FaGem size={10}/> },
                { n: "BIST", v: "12.660", d: "up", i: <FaIcons.FaChartBar size={10}/> }
              ].map(p => (
                <div key={p.n} className="bg-white p-1.5 flex justify-between items-center border-l-4 border-blue-900 shadow-sm font-black text-[10px] uppercase italic hover:bg-blue-50 transition-colors cursor-pointer">
                   <div className="flex items-center gap-2"><span className="text-blue-900">{p.i}</span><span>{p.n}</span></div>
                   <div className={p.d === "up" ? "text-green-600" : "text-red-600"}>{p.v} TL</div>
                </div>
              )) : <div className="bg-white p-4 animate-pulse">Veri alınıyor...</div>}
           </div>
        </section>

        {/* ÇİFTLİ SLIDER */}
        <section className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-1 mb-8">
           <div className="lg:col-span-6 bg-white p-1 border shadow-sm h-[320px]">
              <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 5000 }} pagination={{ clickable: true }} className="h-full">
                 {haberler.slice(50, 60).map(h => (
                    <SwiperSlide key={h.id}>
                       <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden text-center">
                          <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[5s]" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-center border-t border-red-600/50">
                             <h4 className="text-white text-[11px] font-black uppercase italic line-clamp-2 tracking-tighter">{h.baslik}</h4>
                          </div>
                       </Link>
                    </SwiperSlide>
                 ))}
              </Swiper>
           </div>
           
           <div className="lg:col-span-6 bg-white p-1 border shadow-sm h-[320px] flex flex-col text-center">
              <div className="flex bg-gray-100 mb-1">
                 {['TÜRKİYE', 'DÜNYA'].map(tab => (
                    <button 
                       key={tab}
                       onClick={() => setActiveKatTab(tab)}
                       className={`flex-1 py-2 text-[11px] font-black italic uppercase transition-all duration-300 ${activeKatTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>
              <div className="flex-1 overflow-hidden">
                 <Swiper key={activeKatTab} modules={[Autoplay, Pagination]} autoplay={{ delay: 5500 }} pagination={{ clickable: true }} className="h-full">
                    {getKat(activeKatTab, 10).map(h => (
                       <SwiperSlide key={h.id}>
                          <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden">
                             <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[5s]" />
                             <div className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-center w-full">
                                <h4 className="text-white text-[11px] font-black uppercase italic line-clamp-2 tracking-tighter">{h.baslik}</h4>
                             </div>
                          </Link>
                       </SwiperSlide>
                    ))}
                 </Swiper>
              </div>
           </div>
        </section>

      </main>

      <footer className="bg-[#0a0a0a] text-white mt-4 py-8 border-t-4 border-red-600 text-center uppercase font-black italic">
        <h2 className="text-5xl tracking-tighter mb-2">HABER<span className="text-red-600">PİK</span></h2>
        <div className="flex justify-center flex-wrap gap-8 text-[10px] font-black text-gray-500 uppercase italic tracking-widest border-y border-white/5 py-4 mb-6">
           <span>KÜNYE</span><span>İLETİŞİM</span><span>REKLAM</span><span>KVKK</span>
        </div>
        <p className="text-gray-700 text-[9px] font-bold uppercase italic tracking-[0.4em] text-center">© 2026 HABERPİK MEDYA - TÜRKİYE'NİN HABER MERKEZİ</p>
      </footer>

      <style jsx global>{`
        @keyframes marquee-slow { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee-slow { animation: marquee-slow 60s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .swiper-pagination-bullet { width: 22px !important; height: 22px !important; background: rgba(255,255,255,0.2) !important; opacity: 1 !important; border-radius: 0 !important; color: #fff !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; font-size: 10px !important; font-weight: 900 !important; margin: 0 1px !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .swiper-pagination-bullet-active { background: #cc0000 !important; border-color: #cc0000 !important; }
        .swiper-button-next, .swiper-button-prev { color: #fff !important; scale: 0.4; }
      `}</style>
    </div>
  );
}