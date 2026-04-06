"use client";
import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import axios from 'axios'; 
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [haberler, setHaberler] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); 
  const [siteAyarlari, setSiteAyarlari] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [activeKatTab, setActiveKatTab] = useState('TÜRKİYE');
  
  const [puanDurumu, setPuanDurumu] = useState<any[]>([]);
  const [sporYukleniyor, setSporYukleniyor] = useState(false);

  const [videoModalAcik, setVideoModalAcik] = useState(false);
  const [seciliVideo, setSeciliVideo] = useState<any>(null);
  const [gazeteModalAcik, setGazeteModalAcik] = useState(false); 
  const [seciliGazete, setSeciliGazete] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(300));
    const unsubscribeHaber = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setHaberler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setYukleniyor(false);
    });

    const qGazete = query(collection(db, "mansetler"), orderBy("tarih", "desc"), limit(30));
    const unsubscribeGazete = onSnapshot(qGazete, (snapshot) => {
      setGazeteler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qDikey = query(collection(db, "dikey_videolar"), orderBy("tarih", "desc"), limit(20));
    const unsubscribeDikey = onSnapshot(qDikey, (snapshot) => {
      setDikeyVideolar(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
      if (docSnap.exists()) setSiteAyarlari(docSnap.data());
    });

    setSporYukleniyor(true);
    axios.get('https://api-football-v1.p.rapidapi.com/v3/standings?league=203&season=2025', {
      headers: { 'X-RapidAPI-Key': '8f27806f155940c6a394f4a36f4f2c0b' }
    }).then(res => {
      setPuanDurumu(res.data.response[0].league.standings[0]);
      setSporYukleniyor(false);
    }).catch(() => setSporYukleniyor(false));

    return () => { unsubscribeHaber(); unsubscribeGazete(); unsubscribeDikey(); };
  }, []);

  const getKat = (kat: string, l: number = 10) => haberler.filter(h => h.kategori?.toUpperCase() === kat.toUpperCase()).slice(0, l);
  const sliderHaberler = haberler.filter(h => h.sliderEkle).length > 0 ? haberler.filter(h => h.sliderEkle) : haberler.slice(0, 20);
  const sonDakikaHaberleri = haberler.filter(h => h.sonDakika);
  const trendHaberler = haberler.filter(h => h.trendEkle).slice(0, 6);
  const hayatinIcindenHaberler = haberler.filter(h => h.kategori?.toUpperCase() === "HAYATIN İÇİNDEN").slice(0, 12);

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
          <Swiper modules={[Autoplay, Navigation, Pagination]} autoplay={{ delay: 7000 }} pagination={{ clickable: true, renderBullet: (index, className) => `<span class="${className}">${index + 1}</span>` }} className="h-[350px] md:h-[480px] premium-slider">
            {sliderHaberler.map((h) => (
              <SwiperSlide key={h.id}>
                <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden">
                  <img src={h.resim} loading="lazy" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="m"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                  <div className="absolute inset-x-0 bottom-0 p-6 pb-14">
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

      {/* 4. SPORPİK - KANKA: DETAYLI PUAN DURUMU BURADA */}
      <section className="bg-white border-t-4 border-green-600 shadow-xl overflow-hidden">
          <div className="bg-[#111] p-2 flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                  <FaIcons.FaFutbol className="text-green-500 animate-spin-slow"/> SPOR<span className="text-green-500">PİK</span>
              </h3>
              <Link href="/kategori/spor" className="text-[10px] text-gray-400 hover:text-white font-bold italic border border-gray-700 px-2 py-1 transition-all uppercase">TÜMÜNÜ GÖR</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0.5 p-0.5 bg-gray-200">
            <div className="lg:col-span-5 bg-white flex flex-col">
                <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
                    <span className="text-[10px] font-black italic uppercase text-green-700">SÜPER LİG PUAN DURUMU</span>
                    <FaIcons.FaTrophy className="text-yellow-600" size={14}/>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
                    <table className="w-full text-[9px] font-black italic uppercase text-left">
                        <thead className="bg-gray-50 sticky top-0 border-b">
                            <tr>
                                <th className="p-2">S</th>
                                <th className="p-2">TAKIM</th>
                                <th className="p-2">O</th>
                                <th className="p-2">G</th>
                                <th className="p-2 text-red-600">P</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {puanDurumu.length > 0 ? puanDurumu.slice(0, 20).map((takim, index) => (
                                <tr key={index} className={`hover:bg-green-50 transition-colors ${takim.team.name.includes('Kocaeli') ? 'bg-green-100 border-l-4 border-green-600 font-black' : 'text-gray-600'}`}>
                                    <td className="p-2 font-bold">{index + 1}</td>
                                    <td className="p-2 flex items-center gap-1.5">
                                        <img src={takim.team.logo} loading="lazy" className="w-3.5 h-3.5 object-contain" />
                                        <span className={takim.team.name.includes('Kocaeli') ? 'text-green-800' : ''}>{takim.team.name.replace('SK', '').trim()}</span>
                                    </td>
                                    <td className="p-2">{takim.all.played}</td>
                                    <td className="p-2">{takim.all.win}</td>
                                    <td className="p-2 font-black text-red-600 bg-red-50/50">{takim.points}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-4 text-center animate-pulse">YÜKLENİYOR...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-[#111] text-white border-t-2 border-green-600">
                    <div className="flex justify-between items-center text-[10px] font-black italic">
                        <span className="text-green-500">KOCAELİSPOR</span>
                        <span className="bg-red-600 px-2 rounded tracking-tighter">VS</span>
                        <span className="text-gray-300">FENERBAHÇE</span>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-0.5">
                {getKat("SPOR", 6).map(h => (
                  <Link href={`/haber/${h.id}`} key={h.id} className="relative h-44 group overflow-hidden">
                      <img src={h.resim} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 flex items-end p-3">
                         <h5 className="text-white text-[11px] font-black uppercase italic leading-tight line-clamp-2 tracking-tighter group-hover:text-green-400 transition-all">{h.baslik}</h5>
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

      {/* MODAL GAZETE & VİDEO BÖLÜMLERİ */}
      {gazeteModalAcik && seciliGazete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300">
          <button onClick={() => setGazeteModalAcik(false)} className="absolute top-4 right-4 text-white bg-red-600 p-4 rounded-full"><FaIcons.FaTimes size={24}/></button>
          <div className="max-w-4xl w-full max-h-[95vh] overflow-y-auto rounded-xl">
            <img src={seciliGazete.resim} className="w-full h-auto bg-white" />
            <div className="bg-white p-4 text-center font-black italic uppercase border-t-8 border-red-600">{seciliGazete.ad}</div>
          </div>
        </div>
      )}

      {videoModalAcik && seciliVideo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4 animate-in fade-in zoom-in">
          <button onClick={() => setVideoModalAcik(false)} className="absolute top-4 right-4 text-white bg-white/10 p-4 rounded-full"><FaIcons.FaTimes size={24}/></button>
          <div className="relative w-full max-w-[420px] h-[85vh] bg-black rounded-3xl overflow-hidden flex flex-col justify-center">
            {seciliVideo.videoUrl?.includes('.mp4') || seciliVideo.videoUrl?.includes('firebasestorage') ? (
                <video src={seciliVideo.videoUrl} className="w-full h-full object-contain" controls autoPlay loop />
            ) : (
                <img src={seciliVideo.kapakResmi || seciliVideo.resim} className="w-full h-full object-cover opacity-40" />
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-marquee-slow { animation: marquee-slow 40s linear infinite; }
        @keyframes marquee-slow { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}