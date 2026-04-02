"use client";
import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [haberler, setHaberler] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); // KANKA: Admin'den gelen Reels'lar
  const [siteAyarlari, setSiteAyarlari] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [activeKatTab, setActiveKatTab] = useState('TÜRKİYE');
  
  const [videoModalAcik, setVideoModalAcik] = useState(false);
  const [seciliVideo, setSeciliVideo] = useState<any>(null);
  const [gazeteModalAcik, setGazeteModalAcik] = useState(false); 
  const [seciliGazete, setSeciliGazete] = useState<any>(null);

  useEffect(() => {
    // 1. HABERLERİ ÇEK
    const q = query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(300));
    const unsubscribeHaber = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setHaberler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setYukleniyor(false);
    });

    // 2. GAZETELERİ ÇEK
    const qGazete = query(collection(db, "mansetler"), orderBy("tarih", "desc"), limit(30));
    const unsubscribeGazete = onSnapshot(qGazete, (snapshot) => {
      setGazeteler(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. DİKEY VİDEOLARI ÇEK (KANKA: Admin'deki yeni koleksiyonu bağladık)
    const qDikey = query(collection(db, "dikey_videolar"), orderBy("tarih", "desc"), limit(20));
    const unsubscribeDikey = onSnapshot(qDikey, (snapshot) => {
      setDikeyVideolar(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. SİTE AYARLARINI ÇEK
    getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
      if (docSnap.exists()) setSiteAyarlari(docSnap.data());
    });

    return () => { unsubscribeHaber(); unsubscribeGazete(); unsubscribeDikey(); };
  }, []);

  // KANKA: Admin'deki "mansetEkle", "sliderEkle" vb. ayarları burada filtreliyoruz
  const getKat = (kat: string, l: number = 10) => haberler.filter(h => h.kategori?.toUpperCase() === kat.toUpperCase()).slice(0, l);
  const mansetHaberler = haberler.filter(h => h.mansetEkle).slice(0, 20);
  const sliderHaberler = haberler.filter(h => h.sliderEkle).length > 0 ? haberler.filter(h => h.sliderEkle) : haberler.slice(0, 20);
  const sonDakikaHaberleri = haberler.filter(h => h.sonDakika);
  const trendHaberler = haberler.filter(h => h.trendEkle).slice(0, 6);
  const hayatinIcindenHaberler = haberler.filter(h => h.kategori?.toUpperCase() === "HAYATIN İÇİNDEN").slice(0, 12);

  if (yukleniyor) return <div className="min-h-screen bg-black flex items-center justify-center font-black italic animate-pulse text-4xl text-red-600 uppercase tracking-tighter">HABERPİK...</div>;

  return (
    <main className="max-w-[1150px] mx-auto px-0 md:px-1 py-0 space-y-0.5 bg-gray-200">
      
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
                  <img src={h.resim} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="m"/>
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
                   <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-[12px] font-black leading-[1.2] line-clamp-3 uppercase italic self-center tracking-tighter group-hover:text-red-600 transition-colors">{h.baslik}</h3>
              </Link>
            ))}
        </div>
      </div>

      {/* REKLAM ALANI 1 */}
      <Link href={siteAyarlari?.reklam1 || "#"} target="_blank" className="w-full bg-[#f8f8f8] h-24 flex items-center justify-center border-y border-gray-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <span className="text-gray-400 font-black italic uppercase text-xs group-hover:text-red-600 transition-colors tracking-[0.3em] z-10">{siteAyarlari?.reklam1 ? 'PREMIUM REKLAM AKTİF' : 'REKLAM ALANI MÜHÜRLE'}</span>
          <div className="absolute top-0 left-0 bg-gray-200 text-[9px] px-2 font-bold text-gray-500 italic">HABERPİK AD</div>
      </Link>

      {/* 3. SON DAKİKA 4'LÜ SÜTUN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {sonDakikaHaberleri.slice(0, 4).map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="relative h-36 group overflow-hidden shadow-inner">
               <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                  <h4 className="text-white text-[11px] font-black uppercase italic leading-tight line-clamp-2 tracking-tighter group-hover:text-red-500 transition-colors">{h.baslik}</h4>
               </div>
            </Link>
          ))}
      </div>

      {/* 4. SPORPİK */}
      <section className="bg-white border-t-4 border-green-600 shadow-xl overflow-hidden">
          <div className="bg-[#111] p-2 flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
                  <FaIcons.FaFutbol className="text-green-500 animate-spin-slow"/> SPOR<span className="text-green-500">PİK</span>
              </h3>
              <Link href="/kategori/spor" className="text-[10px] text-gray-400 hover:text-white font-bold italic border border-gray-700 px-2 py-1 transition-all uppercase">TÜMÜNÜ GÖR</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0.5 p-0.5 bg-gray-200">
            <div className="lg:col-span-3 flex flex-col gap-0.5">
                {getKat("SPOR", 6).map((h, i) => (
                  <Link href={`/haber/${h.id}`} key={h.id} className="flex items-center gap-3 bg-white p-2 hover:bg-green-50 transition-all h-[58px] border-b border-gray-100 last:border-0">
                      <span className="text-3xl font-black text-gray-100 italic leading-none">{i+1}</span>
                      <h5 className="text-[10px] font-black uppercase italic line-clamp-2 leading-tight tracking-tighter">{h.baslik}</h5>
                  </Link>
                ))}
            </div>
            <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-0.5">
                {getKat("SPOR", 6).map(h => (
                  <Link href={`/haber/${h.id}`} key={h.id} className="relative h-40 group overflow-hidden">
                      <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 flex items-end p-3">
                         <h5 className="text-white text-[11px] font-black uppercase italic leading-tight line-clamp-2 tracking-tighter group-hover:text-green-400 transition-all">{h.baslik}</h5>
                      </div>
                  </Link>
                ))}
            </div>
          </div>
      </section>

      {/* REKLAM ALANI 2 */}
      <Link href={siteAyarlari?.reklam2 || "#"} target="_blank" className="w-full bg-[#111] h-28 flex flex-col items-center justify-center border-y-2 border-red-600 relative group cursor-pointer shadow-2xl">
          <span className="text-white font-black italic uppercase text-xs tracking-[0.8em] animate-pulse">BU ALAN REKLAMA MÜHÜRLENDİ</span>
          <div className="text-red-600 font-black italic text-[10px] mt-2 border border-red-600 px-4 py-1 group-hover:bg-red-600 group-hover:text-white transition-all uppercase">İLETİŞİM</div>
      </Link>

      {/* 5. GÜNDEM */}
      <section className="bg-white p-1">
          <div className="bg-gray-900 text-white p-2 mb-0.5 font-black italic uppercase tracking-widest text-[14px] border-r-8 border-red-600">GÜNDEM ÖZETİ</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
             {getKat("GÜNDEM", 8).map(h => (
               <Link href={`/haber/${h.id}`} key={h.id} className="relative group aspect-[4/3] overflow-hidden bg-black">
                  <img src={h.resim} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-3">
                      <h4 className="text-white text-[11px] font-black uppercase italic leading-tight line-clamp-2 group-hover:text-red-500 transition-colors tracking-tighter">{h.baslik}</h4>
                  </div>
               </Link>
             ))}
          </div>
      </section>

      {/* 6. GAZETELER */}
      <section className="bg-[#0a0a0a] p-4 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
             <h3 className="text-lg font-black italic uppercase text-white tracking-widest shrink-0">GAZETE MANŞETLERİ</h3>
             <div className="h-[1px] bg-red-600 flex-1"></div>
          </div>
          <Swiper modules={[Autoplay, Navigation]} slidesPerView={3} breakpoints={{ 768: { slidesPerView: 5 }, 1024: { slidesPerView: 7 } }} spaceBetween={5} autoplay={{ delay: 3500 }} navigation className="h-64">
            {gazeteler.map((g, i) => (
              <SwiperSlide key={g.id || i}>
                 <div onClick={() => { setSeciliGazete(g); setGazeteModalAcik(true); }} className="bg-white p-0.5 shadow-2xl h-full border-x border-gray-300 group hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <img src={g.resim} className="w-full h-full object-cover" alt={g.ad} />
                    <div className="absolute bottom-0 left-0 w-full bg-red-600/90 text-white text-center text-[9px] font-black italic uppercase py-1 backdrop-blur-sm group-hover:bg-black transition-colors">{g.ad}</div>
                 </div>
              </SwiperSlide>
            ))}
          </Swiper>
      </section>

      {/* 7. EKONOMİPİK */}
      <section className="bg-white p-1 border-t-4 border-blue-900 shadow-lg">
          <div className="flex justify-between items-center mb-1 bg-blue-900 p-2 text-white italic font-black text-sm tracking-tighter uppercase">
              <div className="flex items-center gap-2"><FaIcons.FaChartLine className="text-blue-300"/> EKONOMİPİK</div>
              <Link href="/kategori/ekonomi" className="text-[10px] text-blue-200 hover:text-white uppercase font-bold italic">TÜMÜ</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
             {getKat("EKONOMİ", 8).map(h => (
                <Link href={`/haber/${h.id}`} key={h.id} className="relative h-32 group overflow-hidden border border-gray-100">
                   <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all flex items-end p-2">
                      <h4 className="text-white text-[10px] font-black uppercase italic leading-tight line-clamp-2 tracking-tighter group-hover:text-blue-400">{h.baslik}</h4>
                   </div>
                </Link>
             ))}
          </div>
      </section>

      {/* 8. DEV TAB SLIDER */}
      <section className="bg-white shadow-2xl overflow-hidden border-y border-gray-300">
          <div className="flex bg-[#111] overflow-x-auto no-scrollbar gap-0.5">
             {['TÜRKİYE', 'DÜNYA', 'SİYASET', 'ASAYİŞ'].map(tab => (
                <button key={tab} onClick={() => setActiveKatTab(tab)} className={`flex-1 py-4 px-6 text-[13px] font-black italic uppercase transition-all duration-300 ${activeKatTab === tab ? 'bg-red-600 text-white shadow-[inset_0_-4px_0_0_#991b1b]' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'}`}>{tab}</button>
             ))}
          </div>
          <div className="h-[450px] relative">
             <Swiper key={activeKatTab} modules={[Autoplay, Pagination, Navigation]} autoplay={{ delay: 6000 }} pagination={{ clickable: true }} navigation className="h-full">
                {getKat(activeKatTab, 12).map(h => (
                   <SwiperSlide key={h.id}>
                      <Link href={`/haber/${h.id}`} className="relative block h-full group overflow-hidden">
                         <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[12s] ease-linear" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent flex flex-col justify-end p-10">
                            <span className="bg-red-600 text-white w-fit px-3 py-1 text-xs font-black italic mb-4 uppercase">{activeKatTab} GÜNDEMİ</span>
                            <h4 className="text-white text-3xl md:text-5xl font-black uppercase italic leading-none tracking-tighter drop-shadow-2xl">{h.baslik}</h4>
                         </div>
                      </Link>
                   </SwiperSlide>
                ))}
             </Swiper>
          </div>
      </section>

      {/* 9. VİDEOPİK (KANKA: ARTIK REELS'LAR BURADAN AKIYOR) */}
      <section className="bg-red-600 p-3 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="bg-white p-2 rounded-full text-red-600 shadow-xl"><FaIcons.FaPlay size={18}/></div>
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">VİDEO<span className="text-black">PİK</span></h3>
          <Link href="/kategori/video-galeri" className="ml-auto text-white/80 text-[10px] font-black italic border-b border-white/40 uppercase">TÜMÜ</Link>
        </div>
        <Swiper modules={[Navigation]} slidesPerView={2.2} spaceBetween={4} breakpoints={{ 640: { slidesPerView: 3.8 }, 1024: { slidesPerView: 6 } }} navigation className="pb-2">
          {(dikeyVideolar.length > 0 ? dikeyVideolar : haberler.filter(h => h.kategori?.toUpperCase() === "VIDEO GALERI").slice(0, 10)).map((v) => (
            <SwiperSlide key={v.id}>
              <div onClick={() => { setSeciliVideo(v); setVideoModalAcik(true); }} className="relative aspect-[9/16] bg-black overflow-hidden cursor-pointer group border border-white/10 hover:border-white transition-all">
                <img src={v.kapakResmi || v.resim} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 p-2 w-full bg-black/40 backdrop-blur-sm">
                  <h4 className="text-white text-[10px] font-black uppercase italic leading-tight line-clamp-3 tracking-tighter">{v.baslik}</h4>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 10. HAYATIN İÇİNDEN */}
      <section className="bg-white p-1 shadow-inner">
        <div className="bg-gray-100 p-3 mb-1 flex items-center justify-between">
           <h3 className="text-lg font-black italic uppercase text-gray-900 tracking-tighter">HAYATIN İÇİNDEN</h3>
           <Link href="/kategori/hayatın-içinden" className="text-[10px] text-red-600 font-black border-b border-red-600 uppercase">TÜMÜ</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {hayatinIcindenHaberler.map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="relative aspect-video group overflow-hidden bg-gray-900">
              <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 opacity-90 hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black flex flex-col justify-end p-3 text-white">
                <h4 className="text-[11px] font-black uppercase italic line-clamp-2 leading-tight tracking-tighter group-hover:text-red-500 transition-colors">{h.baslik}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MODAL: GAZETE BÜYÜTME */}
      {gazeteModalAcik && seciliGazete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <button onClick={() => setGazeteModalAcik(false)} className="absolute top-4 right-4 text-white bg-red-600 p-4 rounded-full z-[2001] shadow-2xl transition-transform hover:rotate-90"><FaIcons.FaTimes size={24}/></button>
          <div className="max-w-4xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide rounded-xl shadow-[0_0_100px_rgba(255,255,255,0.1)] border border-white/10">
            <img src={seciliGazete.resim} className="w-full h-auto object-contain bg-white" />
            <div className="bg-white p-4 text-center font-black italic uppercase border-t-8 border-red-600 sticky bottom-0 z-10">{seciliGazete.ad} - GÜNLÜK MANŞET</div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL (KANKA: YENİ VİDEO MOTORU MÜHÜRLENDİ) */}
      {videoModalAcik && seciliVideo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <button onClick={() => setVideoModalAcik(false)} className="absolute top-4 right-4 text-white hover:text-red-600 z-[1001] bg-white/10 p-4 rounded-full transition-all border border-white/10 hover:rotate-90"><FaIcons.FaTimes size={24}/></button>
          
          <div className="relative w-full max-w-[420px] h-[85vh] md:h-[90vh] bg-black shadow-[0_0_100px_rgba(255,0,0,0.2)] border border-white/20 rounded-3xl overflow-hidden flex flex-col justify-center">
            
            {/* KANKA: MP4 (Firebase), Instagram veya YouTube otomatik algılanıyor */}
            {seciliVideo.videoUrl?.includes('.mp4') || seciliVideo.videoUrl?.includes('firebasestorage') ? (
                <video 
                  src={seciliVideo.videoUrl} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay 
                  loop
                />
            ) : seciliVideo.videoUrl?.includes('instagram.com') ? (
                <iframe 
                  src={`${seciliVideo.videoUrl.split('?')[0]}embed`} 
                  className="w-full h-full" 
                  frameBorder="0" 
                  scrolling="no" 
                  allowTransparency={true}
                ></iframe>
            ) : seciliVideo.videoUrl?.includes('youtube.com') || seciliVideo.videoUrl?.includes('youtu.be') ? (
                <iframe 
                  src={seciliVideo.videoUrl.replace('watch?v=', 'embed/').split('&')[0]} 
                  className="w-full h-full" 
                  allowFullScreen
                ></iframe>
            ) : (
                <img src={seciliVideo.kapakResmi || seciliVideo.resim} className="w-full h-full object-cover opacity-40" />
            )}

            {/* ALT BİLGİ ALANI */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-black italic text-white text-xl shadow-2xl border-2 border-white/20">P</div>
                <div>
                  <h5 className="text-white font-black italic uppercase tracking-widest text-base">{siteAyarlari?.siteAdi || 'HABERPİK'}</h5>
                  <p className="text-red-500 text-[10px] font-bold animate-pulse uppercase italic tracking-tighter">CANLI YAYIN / REELS</p>
                </div>
              </div>
              <h2 className="text-white text-lg md:text-xl font-black uppercase italic leading-tight tracking-tighter drop-shadow-lg line-clamp-2">{seciliVideo.baslik}</h2>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-marquee-slow { animation: marquee-slow 40s linear infinite; }
        @keyframes marquee-slow { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .premium-slider .swiper-pagination-bullet { width: 28px !important; height: 28px !important; border-radius: 0 !important; background: rgba(0,0,0,0.8) !important; color: #fff !important; opacity: 1 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; font-size: 11px !important; font-weight: 900 !important; border: 1px solid rgba(255,255,255,0.1) !important; transition: all 0.3s; }
        .premium-slider .swiper-pagination-bullet-active { background: #dc2626 !important; border-color: #dc2626 !important; transform: translateY(-4px); box-shadow: 0 4px 10px rgba(220,38,38,0.5); }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </main>
  );
}