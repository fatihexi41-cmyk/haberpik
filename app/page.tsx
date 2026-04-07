"use client";
import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
// Kanka buraya 'where' eklemeyi unutmuşuz, ekle hemen:
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import axios from 'axios'; 
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [fikstur, setFikstur] = useState<any[]>([]); // Fikstür verisi için
  const [aktifSekme, setAktifSekme] = useState<'puan' | 'fikstur'>('puan'); // Butonlar arası geçiş için
  // KANKA: Hataları bitirecek olan o iki meşhur satır burada:
  const [sliderIndex, setSliderIndex] = React.useState(0);
  const [puanDurumu, setPuanDurumu] = React.useState<any[]>([]);
  // --- KANKA: YENİ BÖLÜMLERİN VERİLERİ ---
  const [filmler, setFilmler] = useState<any[]>([]);
  const [etkinlikler, setEtkinlikler] = useState<any[]>([]);

  // ... geri kalan kodların (useEffect vb.)
  const [haberler, setHaberler] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); 
  const [siteAyarlari, setSiteAyarlari] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [activeKatTab, setActiveKatTab] = useState('TÜRKİYE');
  const [videoModalAcik, setVideoModalAcik] = useState(false);
  const [seciliVideo, setSeciliVideo] = useState<any>(null);
  const [gazeteModalAcik, setGazeteModalAcik] = useState(false); 
  const [seciliGazete, setSeciliGazete] = useState<any>(null);

useEffect(() => {
    // 1. MANŞET HABERLER SORGUSU
    const qHaber = query(
      collection(db, "haberler"), 
      where("manset", "==", true), 
      orderBy("tarih", "desc"), 
      limit(15)
    );

    // KANKA: Bu kısmı unutmuşuz, haberleri Firebase'den çeken asıl motor bu:
    const unsubscribeHaber = onSnapshot(qHaber, (snapshot) => {
      setHaberler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setYukleniyor(false);
    });

    // 2. GAZETE MANŞETLERİ SORGUSU
    const qGazete = query(collection(db, "mansetler"), orderBy("tarih", "desc"), limit(30));
    const unsubscribeGazete = onSnapshot(qGazete, (snapshot) => {
      setGazeteler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. DİKEY VİDEOLAR SORGUSU
    const qDikey = query(collection(db, "dikey_videolar"), orderBy("tarih", "desc"), limit(20));
    const unsubscribeDikey = onSnapshot(qDikey, (snapshot) => {
      setDikeyVideolar(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. GENEL AYARLAR
    getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
      if (docSnap.exists()) setSiteAyarlari(docSnap.data());
    });

    // 5. HİZMETLER (HAVA, FİKSTÜR, ETKİNLİK)
    const unsubHizmetler = onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lig_durumu) setPuanDurumu(data.lig_durumu);
        if (data.kocaeli_fikstur) setFikstur(data.kocaeli_fikstur);
        if (data.filmler) setFilmler(data.filmler);
        if (data.etkinlikler) setEtkinlikler(data.etkinlikler);
      }
    });

    // TEMİZLİK: Sayfadan çıkınca tüm dinleyicileri kapatıyoruz
    return () => {
      unsubscribeHaber();
      unsubscribeGazete();
      unsubscribeDikey();
      unsubHizmetler();
    };
  }, []);

  const getKat = (kat: string, l: number = 10) => haberler.filter(h => h.kategori?.toUpperCase() === kat.toUpperCase()).slice(0, l);
  const sliderHaberler = haberler.filter(h => h.sliderEkle).length > 0 ? haberler.filter(h => h.sliderEkle) : haberler.slice(0, 20);
  const sonDakikaHaberleri = haberler.filter(h => h.sonDakika);
  const trendHaberler = haberler.filter(h => h.trendEkle).slice(0, 6);
  const hayatinIcindenHaberler = haberler.filter(h => h.kategori?.toUpperCase() === "HAYATIN İÇİNDEN").slice(0, 12);

// KANKA: Ekran titremesin diye filtreleri burada sabitliyoruz
  const sporSliderData = haberler.filter(h => 
    h.kategori_slug === "yerel-spor" || 
    h.kategori_slug === "genel-spor" || 
    h.kategori?.toUpperCase() === "SPOR"
  ).slice(0, 10);

  const kocaeliSporData = haberler.filter(h => 
    h.kategori_slug === "yerel-spor"
  ).slice(0, 8);

  if (yukleniyor) return <div className="min-h-screen bg-black flex items-center justify-center font-black italic animate-pulse text-4xl text-red-600 uppercase tracking-tighter">HABERPİK...</div>;

  return (
    <main className="max-w-[1150px] mx-auto px-0 md:px-1 py-0 space-y-0.5 bg-gray-200 overflow-hidden">
      
      {/* 1. SON DAKİKA BANDI */}
      <div className="bg-[#111] py-2 overflow-hidden border-b border-red-600">
        <div className="flex items-center px-2">
            <span className="bg-red-600 text-white px-3 py-0.5 text-[11px] font-black italic mr-3 shrink-0 rounded-sm shadow-lg shadow-red-600/20">SON DAKİKA</span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee-slow whitespace-nowrap flex gap-12 font-bold text-[12px] text-white italic uppercase tracking-tighter">
                  {sonDakikaHaberleri.length > 0 ? sonDakikaHaberleri.slice(0, 10).map((h, i) => (
                    <Link key={i} href={`/haber/${h.id}`} className="hover:text-red-500 transition-colors flex items-center gap-1">• {h.baslik}</Link>
                  )) : <span className="text-gray-500">• GÜNCEL SON DAKİKA BİLGİSİ BEKLENİYOR...</span>}
              </div>
            </div>
        </div>
      </div>

{/* 2. ANA MANŞET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0.5">
        <div className="lg:col-span-8 bg-black relative">
          <Swiper 
            modules={[Autoplay, Navigation, Pagination]} 
            autoplay={{ delay: 7000 }} 
            pagination={{ 
              clickable: true, 
              // KANKA: Sayıları beyaz kutucuk yapan o meşhur yer burası
              renderBullet: (index, className) => {
                return `<span class="${className} custom-bullet">${index + 1}</span>`;
              }
            }} 
            className="h-[350px] md:h-[480px] premium-slider"
          >
            {sliderHaberler.map((h) => (
              <SwiperSlide key={h.id}>
                <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden">
                  <img src={h.resim} loading="lazy" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="m"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                  <div className="absolute inset-x-0 bottom-0 p-6 pb-16"> {/* pb-16 yaptık ki sayılarla başlık çakışmasın */}
                      <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 font-black uppercase italic mb-2 inline-block">{h.kategori}</span>
                      <h2 className="text-white text-2xl md:text-4xl font-black uppercase italic leading-tight tracking-tighter drop-shadow-2xl">{h.baslik}</h2>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-0.5">
            <div className="bg-[#111] text-red-600 text-left px-4 py-2 font-black italic text-[13px] uppercase tracking-tighter border-l-4 border-red-600">ÖNE ÇIKANLAR</div>
            {(trendHaberler.length > 0 ? trendHaberler : haberler.slice(21, 27)).map((h) => (
              <Link href={`/haber/${h.id}`} key={h.id} className="flex gap-2 bg-white p-1 hover:bg-gray-50 h-[78px] group transition-all border-b border-gray-100 last:border-0">
                <div className="w-28 h-full shrink-0 overflow-hidden relative">
                   <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-[12px] font-black leading-[1.2] line-clamp-3 uppercase italic self-center tracking-tighter group-hover:text-red-600 transition-colors">{h.baslik}</h3>
              </Link>
            ))}
        </div>
      </div>

      {/* REKLAM ALANI 1 */}
      <div className="w-full bg-[#f8f8f8] h-24 flex items-center justify-center border-y border-gray-300 relative group overflow-hidden">
          <span className="text-gray-400 font-black italic uppercase text-xs tracking-[0.3em] z-10">{siteAyarlari?.reklam1 ? 'PREMIUM REKLAM AKTİF' : 'REKLAM ALANI'}</span>
      </div>

      {/* 3. SON DAKİKA 4'LÜ SÜTUN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {sonDakikaHaberleri.slice(0, 4).map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="relative h-36 group overflow-hidden">
               <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 flex flex-col justify-end p-3">
                  <h4 className="text-white text-[11px] font-black uppercase italic line-clamp-2 tracking-tighter group-hover:text-red-500 transition-colors">{h.baslik}</h4>
               </div>
            </Link>
          ))}
      </div>

{/* 4. SPORPİK - KANKA: SEKMELİ VE HATASIZ TAM YAPI */}
      <section className="bg-gray-100 border-t-4 border-green-600 shadow-2xl overflow-hidden mt-6">
          {/* Başlık Çubuğu */}
          <div className="bg-[#111] p-3 flex justify-between items-center">
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                  <FaIcons.FaFutbol className="text-green-500 animate-spin-slow"/> SPOR<span className="text-green-500">PİK</span>
              </h3>
              <div className="flex gap-4 items-center">
                <span className="text-green-500 text-[10px] font-black italic hidden md:block animate-pulse">LİG VERİLERİ CANLI</span>
                <Link href="/kategori/spor" className="text-[10px] text-white hover:bg-green-600 font-bold italic border border-green-600 px-3 py-1 transition-all uppercase">TÜMÜNÜ GÖR</Link>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 bg-gray-300">
            {/* SOL: SLIDER (KOCAELİ + GENEL) */}
            <div className="lg:col-span-7 bg-white relative h-[480px] group overflow-hidden">
                <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" 
                     style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
                  {sporSliderData.map((h, i) => (
                    <div key={h.id} className="min-w-full h-full relative">
                       <img src={h.resim} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent flex flex-col justify-end p-8">
                          <div className="flex gap-2 mb-3">
                            <span className="bg-green-600 text-white text-[10px] font-black px-2 py-1 italic uppercase">SPORPİK GÜNCEL</span>
                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 italic uppercase">{i + 1} / 10</span>
                          </div>
                          <h4 className="text-white text-2xl md:text-4xl font-black uppercase italic leading-none tracking-tighter mb-2 group-hover:text-green-400 transition-colors drop-shadow-xl line-clamp-2">
                            {h.baslik}
                          </h4>
                       </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSliderIndex(sliderIndex === 0 ? 9 : sliderIndex - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-green-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"><FaIcons.FaChevronLeft size={24}/></button>
                <button onClick={() => setSliderIndex(sliderIndex === 9 ? 0 : sliderIndex + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-green-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"><FaIcons.FaChevronRight size={24}/></button>
            </div>

            {/* SAĞ: SEKMELİ PUAN & FİKSTÜR */}
            <div className="lg:col-span-5 bg-white flex flex-col h-[480px]">
                <div className="flex border-b bg-gray-50">
                   <button 
                     onClick={() => setAktifSekme('puan')}
                     className={`flex-1 py-4 text-[12px] font-black italic border-b-4 transition-all ${aktifSekme === 'puan' ? 'text-green-700 border-green-600' : 'text-gray-400 border-transparent'}`}>
                     PUAN DURUMU
                   </button>
                   <button 
                     onClick={() => setAktifSekme('fikstur')}
                     className={`flex-1 py-4 text-[12px] font-black italic border-b-4 transition-all ${aktifSekme === 'fikstur' ? 'text-green-700 border-green-600' : 'text-gray-400 border-transparent'}`}>
                     KOCAELİSPOR FİKSTÜR
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {aktifSekme === 'puan' ? (
                        <table className="w-full text-[10px] font-black italic uppercase text-left">
                            <thead className="bg-[#111] text-white sticky top-0 z-10">
                                <tr><th className="p-3">S</th><th className="p-3">TAKIM</th><th className="p-3 text-center">G</th><th className="p-3 text-center bg-green-900">P</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {puanDurumu.length > 0 ? puanDurumu.map((takim, index) => (
                                    <tr key={index} className={`hover:bg-green-50 ${takim.team.name.includes('Kocaeli') ? 'bg-green-100 border-l-4 border-green-600' : ''}`}>
                                        <td className="p-2 font-bold">{index + 1}</td>
                                        <td className="p-2 flex items-center gap-2">
                                            <img src={takim.team.logo} className="w-4 h-4 object-contain" alt="logo" />
                                            <span className="truncate max-w-[80px]">{takim.team.name}</span>
                                        </td>
                                        <td className="p-2 text-center">{takim.all.win}</td>
                                        <td className="p-2 text-center font-black bg-gray-100">{takim.points}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="p-20 text-center animate-pulse">VERİ BEKLENİYOR...</td></tr>}
                            </tbody>
                        </table>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {fikstur.length > 0 ? fikstur.map((mac, index) => (
                                <div key={index} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-all border-l-4 border-green-600">
                                    <div className="flex flex-col gap-1 text-left">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">{new Date(mac.fixture.date).toLocaleDateString('tr-TR')}</span>
                                        <div className="flex items-center gap-2 font-black italic text-[11px] uppercase tracking-tighter">
                                            <span className={mac.teams.home.id === 611 ? 'text-green-600' : ''}>{mac.teams.home.name}</span>
                                            <span className="text-gray-400">VS</span>
                                            <span className={mac.teams.away.id === 611 ? 'text-green-600' : ''}>{mac.teams.away.name}</span>
                                        </div>
                                    </div>
                                    <img src={mac.teams.home.id === 611 ? mac.teams.away.logo : mac.teams.home.logo} className="w-8 h-8 object-contain opacity-30" alt="rival" />
                                </div>
                            )) : <div className="p-20 text-center font-black italic text-gray-400">FİKSTÜR YÜKLENİYOR...</div>}
                        </div>
                    )}
                </div>
            </div>
          </div> {/* KANKA: Grid burada kapanıyor, o hata bitti! */}

          {/* ALT BÖLÜM: SAF KOCAELİ REYONU */}
          <div className="p-1 bg-gray-300">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                {kocaeliSporData.map(h => (
                  <Link href={`/haber/${h.id}`} key={h.id} className="relative h-60 group overflow-hidden bg-white border-b-2 border-transparent hover:border-green-600 transition-all">
                      <div className="absolute top-2 left-2 z-10 flex gap-1">
                        <span className="bg-black text-white text-[8px] font-black italic px-2 py-0.5 uppercase">KOCAELİ SPOR</span>
                      </div>
                      <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="h"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex items-end p-4 text-left">
                         <h5 className="text-white text-xs font-black uppercase italic leading-tight line-clamp-3 group-hover:text-green-400 transition-all">
                           {h.baslik}
                         </h5>
                      </div>
                  </Link>
                ))}
             </div>
          </div>
      </section>
      {/* 5. GÜNDEM */}
      <section className="bg-white p-1">
          <div className="bg-gray-900 text-white p-2 mb-0.5 font-black italic uppercase tracking-widest text-[14px] border-r-8 border-red-600">GÜNDEM ÖZETİ</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
              {getKat("GÜNDEM", 8).map(h => (
                <Link href={`/haber/${h.id}`} key={h.id} className="relative group aspect-[4/3] overflow-hidden">
                   <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black flex items-end p-3">
                       <h4 className="text-white text-[11px] font-black uppercase italic line-clamp-2 tracking-tighter">{h.baslik}</h4>
                   </div>
                </Link>
              ))}
          </div>
      </section>

      {/* 6. GAZETELER */}
      <section className="bg-[#0a0a0a] p-4 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-black italic uppercase text-white tracking-widest">GAZETE MANŞETLERİ</h3>
              <div className="h-[1px] bg-red-600 flex-1"></div>
          </div>
          <Swiper modules={[Autoplay, Navigation]} slidesPerView={3} breakpoints={{ 768: { slidesPerView: 5 }, 1024: { slidesPerView: 7 } }} spaceBetween={5} autoplay={{ delay: 3500 }} navigation className="h-64">
            {gazeteler.map((g) => (
              <SwiperSlide key={g.id}>
                  <div onClick={() => { setSeciliGazete(g); setGazeteModalAcik(true); }} className="bg-white h-full group cursor-pointer relative overflow-hidden">
                     <img src={g.resim} loading="lazy" className="w-full h-full object-cover" alt={g.ad} />
                     <div className="absolute bottom-0 left-0 w-full bg-red-600 text-white text-center text-[9px] font-black italic py-1">{g.ad}</div>
                  </div>
              </SwiperSlide>
            ))}
          </Swiper>
      </section>

      {/* 7. EKONOMİPİK - KANKA: BURASI GERİ GELDİ */}
      <section className="bg-white p-1 border-t-4 border-blue-900 shadow-lg">
          <div className="flex justify-between items-center mb-1 bg-blue-900 p-2 text-white italic font-black text-sm uppercase">
              <div className="flex items-center gap-2"><FaIcons.FaChartLine/> EKONOMİPİK</div>
              <Link href="/kategori/ekonomi" className="text-[10px]">TÜMÜ</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
              {getKat("EKONOMİ", 8).map(h => (
                 <Link href={`/haber/${h.id}`} key={h.id} className="relative h-32 group overflow-hidden border border-gray-100">
                    <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 flex items-end p-2">
                       <h4 className="text-white text-[10px] font-black uppercase italic line-clamp-2">{h.baslik}</h4>
                    </div>
                 </Link>
              ))}
          </div>
      </section>

      {/* 8. DEV TAB SLIDER - KANKA: BURASI DA TAMAM */}
      <section className="bg-white shadow-2xl overflow-hidden border-y border-gray-300">
          <div className="flex bg-[#111] overflow-x-auto no-scrollbar gap-0.5">
             {['TÜRKİYE', 'DÜNYA', 'SİYASET', 'ASAYİŞ'].map(tab => (
                <button key={tab} onClick={() => setActiveKatTab(tab)} className={`flex-1 py-4 px-6 text-[13px] font-black italic uppercase transition-all ${activeKatTab === tab ? 'bg-red-600 text-white' : 'text-gray-400'}`}>{tab}</button>
             ))}
          </div>
          <div className="h-[450px] relative">
             <Swiper key={activeKatTab} modules={[Autoplay, Pagination, Navigation]} autoplay={{ delay: 6000 }} pagination={{ clickable: true }} navigation className="h-full">
                {getKat(activeKatTab, 12).map(h => (
                   <SwiperSlide key={h.id}>
                      <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden">
                         <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[12s]" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#111] flex flex-col justify-end p-10">
                            <h4 className="text-white text-3xl md:text-5xl font-black uppercase italic leading-none tracking-tighter">{h.baslik}</h4>
                         </div>
                      </Link>
                   </SwiperSlide>
                ))}
             </Swiper>
          </div>
      </section>

      {/* 9. VİDEOPİK */}
      <section className="bg-red-600 p-3 shadow-2xl relative">
        <h3 className="text-2xl font-black italic uppercase text-white mb-4">VİDEOPİK</h3>
        <Swiper modules={[Navigation]} slidesPerView={2.2} spaceBetween={4} breakpoints={{ 1024: { slidesPerView: 6 } }} navigation className="pb-2">
          {dikeyVideolar.map((v) => (
            <SwiperSlide key={v.id}>
              <div onClick={() => { setSeciliVideo(v); setVideoModalAcik(true); }} className="relative aspect-[9/16] bg-black overflow-hidden cursor-pointer group">
                <img src={v.kapakResmi || v.resim} loading="lazy" className="w-full h-full object-cover opacity-80" />
                <div className="absolute bottom-0 p-2 w-full bg-black/40"><h4 className="text-white text-[10px] font-black uppercase italic">{v.baslik}</h4></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 10. HAYATIN İÇİNDEN - KANKA: SON PARÇA DA EKLENDİ */}
      <section className="bg-white p-1 shadow-inner">
        <div className="bg-gray-100 p-3 mb-1 flex items-center justify-between">
            <h3 className="text-lg font-black italic uppercase">HAYATIN İÇİNDEN</h3>
            <Link href="/kategori/hayatın-içinden" className="text-[10px] text-red-600 font-black border-b border-red-600">TÜMÜ</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {hayatinIcindenHaberler.map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="relative aspect-video group overflow-hidden bg-gray-900">
              <img src={h.resim} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black flex flex-col justify-end p-3 text-white">
                <h4 className="text-[11px] font-black uppercase italic line-clamp-2">{h.baslik}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. VİZYONDAKİ FİLMLER - SİNEMA AMBİYANSI */}
      <section className="bg-[#111] py-10 mt-6 shadow-inner">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-6 border-l-4 border-red-600 pl-4">
            <div>
              <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter">VİZYONDAKİ <span className="text-red-600">FİLMLER</span></h2>
              <p className="text-gray-500 text-[10px] font-bold uppercase italic">Haftalık Otomatik Güncellenir</p>
            </div>
            <FaIcons.FaFilm size={40} className="text-white/10" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {filmler.length > 0 ? filmler.map((film, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg bg-black border border-white/5 hover:border-red-600 transition-all duration-500">
                <img src={film.resim} className="w-full h-[320px] object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="film" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 p-4 w-full text-left">
                  <h3 className="text-white font-black italic text-sm uppercase leading-tight line-clamp-2 mb-1">{film.baslik}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 font-bold italic uppercase">SİNEMA</span>
                    <span className="text-gray-400 text-[9px] font-bold">{film.tarih}</span>
                  </div>
                </div>
              </div>
            )) : <div className="col-span-full py-20 text-center text-gray-700 italic animate-pulse">SİNEMA PERDESİ AÇILIYOR...</div>}
          </div>
        </div>
      </section>

      {/* 6. ETKİNLİK TAKVİMİ - KOCAELİ AJANDASI */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-green-600 p-2 text-white"><FaIcons.FaCalendarAlt size={24} /></div>
             <h2 className="text-3xl font-black italic uppercase text-gray-900 tracking-tighter">KOCAELİ <span className="text-green-600">ETKİNLİK TAKVİMİ</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {etkinlikler.length > 0 ? etkinlikler.map((etkinlik, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 border-l-4 border-green-600 hover:bg-white hover:shadow-xl transition-all group cursor-pointer">
                <div className="flex flex-col items-center justify-center bg-white border border-gray-100 px-4 py-2 rounded min-w-[70px] h-20 shadow-sm">
                  <span className="text-green-600 font-black text-2xl leading-none">{etkinlik.gun || '00'}</span>
                  <span className="text-gray-400 font-bold text-[10px] uppercase">{etkinlik.ay || 'AY'}</span>
                </div>
                <div className="flex flex-col justify-center text-left">
                  <h3 className="font-black italic text-md text-gray-800 uppercase leading-tight mb-1 group-hover:text-green-600 transition-all">{etkinlik.baslik}</h3>
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><FaIcons.FaMapMarkerAlt className="text-red-500" /> {etkinlik.mekan}</span>
                    <span className="flex items-center gap-1"><FaIcons.FaClock className="text-blue-500" /> {etkinlik.saat}</span>
                  </div>
                </div>
              </div>
            )) : <div className="col-span-full text-center text-gray-400 italic py-10 uppercase font-black">ŞEHİRDEKİ ETKİNLİKLER MÜHÜRLENİYOR...</div>}
          </div>
        </div>
      </section>

{/* KANKA: TÜM ÖZEL STİLLER BURADA BİRLEŞTİ */}
      <style jsx global>{`
        /* 1. MEVCUT ANİMASYONLARIN */
        .animate-marquee-slow { animation: marquee-slow 40s linear infinite; }
        @keyframes marquee-slow { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* 2. MANŞET SAYILARI KUTUCUK AYARI (YENİ EKLEDİĞİMİZ) */
        .premium-slider .swiper-pagination {
          bottom: 25px !important;
          left: 24px !important;
          text-align: left !important;
          width: auto !important;
          z-index: 50 !important;
        }

        .custom-bullet {
          width: 26px !important;
          height: 26px !important;
          background: white !important;
          color: black !important;
          opacity: 0.9 !important;
          border-radius: 4px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          margin-right: 8px !important;
          transition: all 0.3s !important;
          cursor: pointer !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
        }

        .custom-bullet.swiper-pagination-bullet-active {
          background: #dc2626 !important; /* Aktif olan kırmızı kutu */
          color: white !important;
          opacity: 1 !important;
          transform: scale(1.15);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
      `}</style>
    </main>
  );
}