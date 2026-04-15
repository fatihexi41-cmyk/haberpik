"use client";
import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// KANKA: BU CSS IMPORTLARI SIRA OLARAK EN ÜSTTE KALMALI
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import axios from 'axios';

export default function Home() {
  const [fikstur, setFikstur] = useState<any[]>([]);
  const [aktifSekme, setAktifSekme] = useState<'puan' | 'fikstur'>('puan');
  const [sliderIndex, setSliderIndex] = React.useState(0);
  const [puanDurumu, setPuanDurumu] = React.useState<any[]>([]);
  const [filmler, setFilmler] = useState<any[]>([]);
  const [etkinlikler, setEtkinlikler] = useState<any[]>([]);
  const [haberler, setHaberler] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); 
  const [siteAyarlari, setSiteAyarlari] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [activeKatTab, setActiveKatTab] = useState('TÜRKİYE HABERLERİ');
  const [videoModalAcik, setVideoModalAcik] = useState(false);
  const [seciliVideo, setSeciliVideo] = useState<any>(null);
  const [gazeteModalAcik, setGazeteModalAcik] = useState(false); 
  const [seciliGazete, setSeciliGazete] = useState<any>(null);
  const [kurVerileri, setKurVerileri] = useState<any>(null);

  useEffect(() => {
    const qHaber = query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(50));
    const unsubscribeHaber = onSnapshot(qHaber, (snapshot) => {
      setHaberler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setYukleniyor(false);
    });

    const qDikey = query(collection(db, "dikey_videolar"), orderBy("tarih", "desc"), limit(20));
    const unsubscribeDikey = onSnapshot(qDikey, (snapshot) => {
      setDikeyVideolar(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
      if (docSnap.exists()) setSiteAyarlari(docSnap.data());
    });

    const unsubHizmetler = onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // KANKA: İŞTE SİHİRLİ DOKUNUŞ BURASI
        // Firebase'de hem 'puanDurumu' hem 'lig_durumu' var, ikisine de bak diyoruz
        const tazePuan = data.puanDurumu || data.lig_durumu || [];
        const tazeFikstur = data.super_lig_fikstur || data.fikstur || [];

        setPuanDurumu(tazePuan);
        setFikstur(tazeFikstur);
        
        // Diğerleri zaten sende var, kontrol et yeter
        if (data.gazeteMansetleri) setGazeteler(data.gazeteMansetleri);
        if (data.filmler) setFilmler(data.filmler);
        if (data.etkinlikler) setEtkinlikler(data.etkinlikler);
        if (data.kur_bilgileri) setKurVerileri(data.kur_bilgileri);
      }
    });

    return () => { unsubscribeHaber(); unsubscribeDikey(); unsubHizmetler(); };
  }, []);

  // KANKA: Ana filtreleme fonksiyonu artık diziyi tarıyor
  const getKat = (kat: string, l: number = 10) => 
  haberler.filter(h => 
    h.kategoriler?.some((k: string) => k.trim().toUpperCase() === kat.toUpperCase())
  ).slice(0, l);

  const sliderHaberler = haberler.filter(h => h.sliderEkle).length > 0 ? haberler.filter(h => h.sliderEkle) : haberler.slice(0, 20);
  const sonDakikaHaberleri = haberler.filter(h => h.sonDakika);
  const trendHaberler = haberler.filter(h => h.trendEkle).slice(0, 6);
  
  // HAYATIN İÇİNDEN
  const hayatinIcindenHaberler = getKat("HAYATIN İÇİNDEN", 12);

  // KANKA: SPOR SLIDER (Genel Spor Etiketi olanları çeker)
  const sporSliderData = haberler.filter(h => 
  h.kategoriler?.some(k => k.trim().toUpperCase() === "SPOR")
).slice(0, 10);

  // KANKA: KOCAELİ SPOR REYONU (Sadece YEREL SPOR etiketi olanları çeker)
  const kocaeliSporData = haberler.filter(h => 
  h.kategoriler?.some(k => k.trim().toUpperCase() === "YEREL SPOR")
).slice(0, 8);

  if (yukleniyor) return <div className="min-h-screen bg-black flex items-center justify-center font-black italic animate-pulse text-4xl text-red-600 uppercase">HABERPİK...</div>;

  return (
    /* KANKA: REKLAMLARI VE ANA İÇERİĞİ YAN YANA DİZEN EN DIŞ KATMAN */
    <div className="flex justify-center items-start gap-4 bg-gray-200 min-h-screen w-full">
      
      {/* SOL DİKİNE REKLAM */}
      {siteAyarlari?.solReklam && (
        <div className="hidden xl:block sticky top-4 w-[160px] h-[600px] shrink-0 bg-white shadow-md mt-4 overflow-hidden">
          <img src={siteAyarlari.solReklam} className="w-full h-full object-cover" alt="sol-reklam" />
        </div>
      )}
    
    <main className="max-w-[1150px] mx-auto px-0 md:px-1 py-0 space-y-0.5 bg-gray-200 overflow-hidden">
      {/* KANKA: KUR BİLGİSİ ŞERİDİ (EKSTRADAN EKLENDİ) */}
<div className="bg-white border-b border-gray-300 py-1 px-2 flex gap-4 overflow-x-auto no-scrollbar shadow-sm">
  {puanDurumu && ( // Kanka buraya kur verilerini (dolar, euro) bağlayacağız
    <div className="flex gap-4 text-[11px] font-black italic uppercase tracking-tighter whitespace-nowrap">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">USD/TL:</span>
        <span className="text-green-600">32.45</span> {/* Veri botdan gelecek */}
        <FaIcons.FaCaretUp className="text-green-500" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">EUR/TL:</span>
        <span className="text-green-600">35.12</span>
        <FaIcons.FaCaretUp className="text-green-500" />
      </div>
      <div className="flex items-center gap-1 border-l pl-4">
        <span className="text-gray-500">ALTIN (GR):</span>
        <span className="text-red-600">2450</span>
        <FaIcons.FaCaretDown className="text-red-500" />
      </div>
    </div>
  )}
</div>
      
      {/* 1. SON DAKİKA BANDI */}
<div className="bg-[#111] py-2 overflow-hidden border-b border-red-600">
  <div className="flex items-center px-2">
    <span className="bg-red-600 text-white px-3 py-0.5 text-[11px] font-black italic mr-3 shrink-0 rounded-sm z-10">SON DAKİKA</span>
    <div className="flex-1 overflow-hidden relative">
      <div 
        className="flex gap-12 font-bold text-[12px] text-white italic uppercase whitespace-nowrap"
        style={{
          display: 'inline-flex',
          animation: 'marquee 60s linear infinite'
        }}
      >
        {/* KANKA: Haberi iki kere basıyoruz ki boşluk kalmadan sürekli dönsün */}
        {[...(sonDakikaHaberleri.length > 0 ? sonDakikaHaberleri.slice(0, 10) : [])].map((h, i) => (
          <Link key={`a-${i}`} href={`/haber/${h.id}`} className="hover:text-red-500 transition-colors flex items-center gap-1 shrink-0">• {h.baslik}</Link>
        ))}
        {sonDakikaHaberleri.length > 0 ? sonDakikaHaberleri.slice(0, 10).map((h, i) => (
          <Link key={`b-${i}`} href={`/haber/${h.id}`} className="hover:text-red-500 transition-colors flex items-center gap-1 shrink-0">• {h.baslik}</Link>
        )) : <span className="text-gray-500">• GÜNCEL SON DAKİKA BİLGİSİ BEKLENİYOR...</span>}
      </div>

      {/* KANKA: Animasyonu buraya gömüyoruz, config ile uğraşma */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  </div>
</div>

      {/* 2. ANA MANŞET GRID - GÖLGE ÜSTÜ MÜHÜRLÜ VERSİYON */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-0.5 relative">
  
  <div className="lg:col-span-8 bg-black relative h-[350px] md:h-[480px] overflow-hidden group">
    
    <Swiper 
  modules={[Autoplay, Navigation, Pagination]} 
  autoplay={{ delay: 7000 }} 
  pagination={{ 
    clickable: true,
    renderBullet: (index, className) => {
      // KANKA: Sınıf isminin sonuna 'custom-bullet' ekliyoruz
      return `<span class="${className} custom-bullet">${index + 1}</span>`;
    }
  }} 
  // BURASI KRİTİK: premium-slider ismini sakın unutma
  className="h-full w-full premium-slider relative"
>
      {sliderHaberler.slice(0, 20).map((h) => (
        <SwiperSlide key={h.id}>
          <Link href={`/haber/${h.id}`} className="relative block h-full overflow-hidden">
            <img src={h.resim} loading="lazy" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="haber"/>
            
            {/* GÖLGE: Bu arkadaş z-10'da kalsın */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
            
            {/* METİN: Bu z-20'de kalsın */}
            <div className="absolute inset-x-0 bottom-0 p-6 pb-24 z-20"> 
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 font-black uppercase italic mb-2 inline-block shadow-lg">
                  {h.kategori}
                </span>
                <h2 className="text-white text-2xl md:text-4xl font-black uppercase italic leading-tight tracking-tighter drop-shadow-2xl">
                  {h.baslik}
                </h2>
            </div>
          </Link>
        </SwiperSlide>
      ))}

      {/* KANKA: İŞTE BOMBA BURASI! */}
      {/* Bu div SwiperSlide'ların dışında, Slider'ın içinde en üstte (z-50) */}
      <div className="hp-super-pagination absolute bottom-6 left-6 z-50 flex gap-2 pointer-events-auto"></div>
    </Swiper>
  </div>

  {/* SAĞ TARAF: ÖNE ÇIKANLAR (DEĞİŞMEDİ) */}
  <div className="lg:col-span-4 flex flex-col gap-0.5 bg-gray-100 h-[350px] md:h-[480px]">
      <div className="bg-[#111] text-red-600 text-left px-4 py-2.5 font-black italic text-[13px] uppercase border-l-4 border-red-600">
        ÖNE ÇIKANLAR
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {(trendHaberler.length > 0 ? trendHaberler : haberler.slice(20, 26)).map((h) => (
          <Link href={`/haber/${h.id}`} key={h.id} className="flex gap-2 bg-white p-1.5 hover:bg-gray-50 h-[76px] group transition-all shrink-0">
            <div className="w-24 h-full shrink-0 overflow-hidden relative shadow-sm">
               <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h3 className="text-[12px] font-black leading-[1.1] line-clamp-3 uppercase italic tracking-tighter group-hover:text-red-600 self-center">
              {h.baslik}
            </h3>
          </Link>
        ))}
      </div>
  </div>
</div>

      {/* REKLAM ALANI 1 - KANKA: BURASI ARTIK CANLI SLAYT */}
<div className="w-full bg-white h-24 border-y border-gray-300 relative overflow-hidden my-2">
  {siteAyarlari?.anaSayfaReklamlar && siteAyarlari.anaSayfaReklamlar.length > 0 ? (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      loop={true}
      className="h-full w-full"
    >
      {siteAyarlari.anaSayfaReklamlar.map((rek, index) => (
        <SwiperSlide key={index}>
          <a href={rek.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            <img 
              src={rek.resim} 
              className="w-full h-full object-contain md:object-fill" 
              alt={`reklam-${index}`} 
            />
          </a>
        </SwiperSlide>
      ))}
    </Swiper>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400 font-black italic uppercase text-xs tracking-[0.3em]">
      REKLAM ALANI
    </div>
  )}
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
                
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                    {aktifSekme === 'puan' ? (
                        <table className="w-full text-[10px] font-black italic uppercase text-left border-collapse">
                            <thead className="bg-[#111] text-gray-400 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 text-center w-10 border-r border-white/10">#</th>
                                    <th className="p-3">TAKIM ADI</th>
                                    <th className="p-3 text-center w-10">O</th>
                                    <th className="p-3 text-center w-10 text-green-500 font-black">G</th>
                                    <th className="p-3 text-center w-10">B</th>
                                    <th className="p-3 text-center w-10 text-red-500">M</th>
                                    <th className="p-3 text-center w-12 bg-red-600 text-white font-black">P</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {puanDurumu && puanDurumu.length > 0 ? (
                                    puanDurumu.map((takim, index) => (
                                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${takim.team.name.toUpperCase().includes('KOCAELİ') ? 'bg-green-100/50' : ''}`}>
                                            <td className="p-3 text-center font-bold text-gray-400 border-r bg-gray-50/50">{index + 1}</td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className={`font-black tracking-tighter text-[12px] ${takim.team.name.includes('Kocaeli') ? 'text-green-700' : 'text-gray-900'}`}>
                                                        {takim.team.name.replace('A.Ş.', '').replace('SK', '').trim()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-gray-600 font-bold">{takim.played}</td>
                                            <td className="p-3 text-center text-green-600 font-black">{takim.won}</td>
                                            <td className="p-3 text-center text-orange-600 font-bold">{takim.draw}</td>
                                            <td className="p-3 text-center text-red-500 font-bold">{takim.lost}</td>
                                            <td className="p-3 text-center font-black bg-red-50 text-red-600 border-l border-red-100">{takim.points}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center animate-pulse text-gray-400 italic font-black uppercase tracking-tighter">PUAN DURUMU GÜNCELLENİYOR...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* FİKSTÜR BÖLÜMÜ - BURASI DA SADE VE ŞIK */
                        <div className="divide-y divide-gray-100">
                            {fikstur && fikstur.length > 0 ? (
                                fikstur.map((mac, index) => (
                                    <div key={index} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-all border-l-4 border-green-600">
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="text-[10px] text-gray-400 font-black uppercase italic tracking-widest">{mac.time}</span>
                                            <div className="flex items-center gap-3 font-black italic text-[13px] uppercase tracking-tighter text-gray-900">
                                                <span className={mac.home.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.home}</span>
                                                <span className="text-red-600 text-[10px] px-2 bg-gray-100 rounded-full">VS</span>
                                                <span className={mac.away.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.away}</span>
                                            </div>
                                        </div>
                                        <div className="bg-black text-white px-3 py-1 rounded-sm text-[10px] font-black italic uppercase tracking-tighter">FİKSTÜR</div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center font-black italic text-gray-400 uppercase tracking-tighter">MAÇ TAKVİMİ BEKLENİYOR...</div>
                            )}
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
                        <span className="bg-black text-white text-[8px] font-black italic px-2 py-0.5 uppercase">YEREL SPOR</span>
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
              {getKat("GÜNDEM", 16).map(h => (
                <Link href={`/haber/${h.id}`} key={h.id} className="relative group aspect-[4/3] overflow-hidden">
                   <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black flex items-end p-3">
                       <h4 className="text-white text-[11px] font-black uppercase italic line-clamp-2 tracking-tighter">{h.baslik}</h4>
                   </div>
                </Link>
              ))}
          </div>
      </section>

      {/* 6. GAZETELER - KANKA: PREMİUM VE HATASIZ VERSİYON */}
<section className="bg-[#0a0a0a] py-8 px-4 shadow-2xl relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
  
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="bg-red-600 p-2 rounded-sm text-white shadow-lg shadow-red-600/20">
        <FaIcons.FaNewspaper size={20} />
      </div>
      <h3 className="text-xl font-black italic uppercase text-white tracking-widest">GÜNÜN MANŞETLERİ</h3>
    </div>
    <span className="text-[10px] text-gray-500 font-bold italic uppercase tracking-tighter hidden md:block">
      Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
    </span>
  </div>

  <Swiper 
    modules={[Autoplay, Navigation]} 
    slidesPerView={2.5} 
    breakpoints={{ 768: { slidesPerView: 5 }, 1024: { slidesPerView: 7 } }} 
    spaceBetween={12} 
    autoplay={{ delay: 3500 }} 
    navigation 
    className="h-72 gazete-swiper"
  >
    {gazeteler && gazeteler.length > 0 ? (
      gazeteler.map((g, index) => (
        <SwiperSlide key={index}>
          <div 
            onClick={() => { setSeciliGazete(g); setGazeteModalAcik(true); }} 
            className="bg-white h-full group cursor-pointer relative overflow-hidden rounded-sm border-2 border-transparent hover:border-red-600 transition-all duration-300 shadow-lg"
          >
            <img 
              src={g.img} 
              loading="lazy" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              alt={g.ad} 
              onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/400x600?text=Gazete+Yuklenemedi' }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm text-white text-center text-[9px] font-black italic py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {g.ad}
            </div>
          </div>
        </SwiperSlide>
      ))
    ) : (
      [1,2,3,4,5,6,7].map((i) => (
        <SwiperSlide key={i}>
          <div className="bg-gray-800 animate-pulse h-full rounded-sm"></div>
        </SwiperSlide>
      ))
    )}
  </Swiper>

  {/* GAZETE MODAL - KANKA: TIKLAYINCA DEV GİBİ AÇILAN VE KAYDIRILAN YER */}
  {gazeteModalAcik && seciliGazete && (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      
      {/* KAPAT BUTONU */}
      <button 
        onClick={() => setGazeteModalAcik(false)}
        className="fixed top-6 right-6 text-white hover:text-red-600 transition-colors z-[100] bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20"
      >
        <FaIcons.FaTimes size={32} />
      </button>
      
      <div className="relative w-full max-w-5xl px-4 py-12 flex flex-col items-center">
        {/* GAZETE GÖRSELİ */}
        <div className="relative w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10">
          <img 
            src={seciliGazete.img} 
            className="w-full h-auto animate-in zoom-in-95 duration-500" 
            alt={seciliGazete.ad} 
          />
        </div>

        {/* GAZETE BİLGİSİ */}
        <div className="mt-10 mb-20 text-center">
          <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter drop-shadow-lg">
            {seciliGazete.ad}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="h-px w-10 bg-red-600"></span>
            <p className="text-gray-400 text-sm font-bold uppercase italic tracking-[0.3em]">
              {new Date().toLocaleDateString('tr-TR')} GÜNLÜK MANŞET
            </p>
            <span className="h-px w-10 bg-red-600"></span>
          </div>
          <button 
            onClick={() => setGazeteModalAcik(false)}
            className="mt-8 px-10 py-3 bg-white text-black font-black italic uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all rounded-full shadow-2xl"
          >
            KAPAT VE DÖN
          </button>
        </div>
      </div>
    </div>
  )}
</section>

      {/* 7. EKONOMİPİK - KANKA: BURASI GERİ GELDİ */}
      <section className="bg-white p-1 border-t-4 border-blue-900 shadow-lg">
          <div className="flex justify-between items-center mb-1 bg-blue-900 p-2 text-white italic font-black text-sm uppercase">
              <div className="flex items-center gap-2"><FaIcons.FaChartLine/> EKONOMİPİK</div>
              <Link href="/kategori/ekonomi" className="text-[10px]">TÜMÜ</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
              {getKat("EKONOMİ", 12).map(h => (
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
             {['TÜRKİYE HABERLERİ', 'DÜNYA', 'SİYASET', 'ASAYİŞ'].map(tab => (
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

      {/* 6. ETKİNLİK TAKVİMİ - KOCAELİ AJANDASI (SCROLLABLE PREMIUM) */}
<section className="bg-white py-12 border-t border-gray-200">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="bg-green-600 p-2 text-white shadow-lg">
          <FaIcons.FaCalendarAlt size={24} />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-gray-900 tracking-tighter">
          KOCAELİ <span className="text-green-600">ETKİNLİK TAKVİMİ</span>
        </h2>
      </div>
      <div className="flex items-center gap-2">
         <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
         <span className="text-[10px] font-black italic text-gray-500 uppercase tracking-widest">
           Canlı Ajanda
         </span>
      </div>
    </div>
    
    {/* KANKA: Kaydırmalı alan burada başlıyor */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {etkinlikler && etkinlikler.length > 0 ? (
        etkinlikler.map((etkinlik, i) => (
          <a 
            key={i} 
            href={etkinlik.url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex gap-4 p-3 bg-gray-50 border-l-4 border-green-600 hover:bg-white hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden rounded-r-lg"
          >
            {/* AFİŞ BÖLÜMÜ */}
            <div className="relative w-24 h-24 min-w-[96px] overflow-hidden rounded shadow-sm border border-gray-100 bg-gray-200 flex-shrink-0">
              {etkinlik.afis ? (
                <img 
                  src={etkinlik.afis} 
                  alt={etkinlik.baslik} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <FaIcons.FaImage size={20} />
                  <span className="text-[8px] font-black uppercase mt-1">Görsel Yok</span>
                </div>
              )}
            </div>

            {/* DETAYLAR */}
            <div className="flex flex-col justify-center text-left flex-grow overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-600 font-black text-sm">{etkinlik.gun || '15'} {etkinlik.ay || 'NIS'}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{etkinlik.saat || '20:00'}</span>
              </div>
              
              <h3 className="font-black italic text-md text-gray-800 uppercase leading-tight mb-2 group-hover:text-green-600 transition-all line-clamp-1">
                {etkinlik.baslik || 'Kocaeli Kültür Etkinliği'}
              </h3>
              
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <FaIcons.FaMapMarkerAlt className="text-red-500" size={12} /> 
                <span className="truncate">{etkinlik.mekan || 'Kocaeli'}</span>
              </div>
            </div>

            {/* HOVER OKU */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
               <FaIcons.FaArrowRight size={20} />
            </div>
          </a>
        ))
      ) : (
        <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
           <p className="text-gray-400 italic font-black uppercase tracking-tighter animate-pulse">
             Şehirdeki Etkinlikler Mühürleniyor... ⏳
           </p>
        </div>
      )}
    </div>

    {/* ALT BİLGİ */}
    <div className="mt-6 flex justify-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Daha fazla etkinlik için aşağı kaydır kanka <FaIcons.FaChevronDown className="inline animate-bounce ml-1" />
        </p>
    </div>
  </div>
</section>

</main>

      {/* SAĞ DİKİNE REKLAM */}
      {siteAyarlari?.sagReklam && (
        <div className="hidden xl:block sticky top-4 w-[160px] h-[600px] shrink-0 bg-white shadow-md mt-4 overflow-hidden">
          <img src={siteAyarlari.sagReklam} className="w-full h-full object-cover" alt="sag-reklam" />
        </div>
      )}

    </div>
  );
} // <--- HOME FONKSİYONUNU BİTİREN SON SÜSLÜ PARANTEZ