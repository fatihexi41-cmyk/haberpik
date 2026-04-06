"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';
import axios from 'axios';

export default function KategoriSayfasi() {
  const params = useParams();
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // KANKA: Spor verileri için yeni state'ler
  const [puanDurumu, setPuanDurumu] = useState<any[]>([]);
  const [sporYukleniyor, setSporYukleniyor] = useState(false);

  const slugRaw = params?.slug ? decodeURIComponent(params.slug as string) : "";
  const isSpor = slugRaw.toLowerCase().includes("spor");
  const isFotoGaleri = slugRaw.includes("foto-galeri");
  const isVideoGaleri = slugRaw.includes("video-galeri");

  useEffect(() => {
    if (!slugRaw) return;
    setYukleniyor(true);

    const formatKategoriForFirebase = (text: string) => {
      return text
        .replace(/-/g, ' ')
        .replace(/i/g, 'İ')
        .replace(/ı/g, 'I')
        .toUpperCase()
        .trim();
    };

    const hedefKategori = formatKategoriForFirebase(slugRaw);

    const q = query(
      collection(db, "haberler"),
      where("kategori", "==", hedefKategori),
      orderBy("tarih", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHaberler(list);
      setYukleniyor(false);
    }, (error) => {
      console.log("Firebase Hatası kanka:", error);
      setYukleniyor(false);
    });

    // KANKA: Eğer kategori SPOR ise botu çalıştırıp puan durumunu çekiyoruz
    if (isSpor) {
      setSporYukleniyor(true);
      // Not: Bu API key geçicidir, dükkan büyüyünce kendi key'ini mühürlersin kanka
      axios.get('https://api-football-v1.p.rapidapi.com/v3/standings?league=203&season=2025', {
        headers: { 'X-RapidAPI-Key': '8f27806f155940c6a394f4a36f4f2c0b' } // Örnek key
      }).then(res => {
        setPuanDurumu(res.data.response[0].league.standings[0]);
        setSporYukleniyor(false);
      }).catch(() => setSporYukleniyor(false));
    }

    return () => unsubscribe();
  }, [slugRaw, isSpor]);

  if (yukleniyor) return <div className="min-h-screen bg-white flex items-center justify-center font-black italic animate-pulse text-2xl text-red-600 uppercase tracking-tighter">BAĞLANILIYOR...</div>;

  return (
    <main className="max-w-[1150px] mx-auto px-2 py-6 min-h-screen bg-gray-50">
      
      <div className="flex items-center gap-4 mb-8 border-b-4 border-red-600 pb-4">
         <div className="bg-red-600 text-white p-3 rounded-sm shadow-lg">
            {isFotoGaleri ? <FaIcons.FaCamera size={24}/> : isVideoGaleri ? <FaIcons.FaPlayCircle size={24}/> : <FaIcons.FaHashtag size={24}/>}
         </div>
         <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#111]">
            {slugRaw.replace(/-/g, ' ')} <span className="text-gray-400 text-sm font-bold">HABERLERİ</span>
         </h1>
      </div>

      <div className={`grid grid-cols-1 ${isSpor ? 'lg:grid-cols-12' : 'md:grid-cols-1'} gap-8`}>
        
        {/* SOL TARAF: HABER LİSTESİ */}
        <div className={`${isSpor ? 'lg:col-span-8' : ''}`}>
          {haberler.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isSpor ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
              {haberler.map((h) => (
                <Link href={`/haber/${h.id}`} key={h.id} className="group bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                  <div className="aspect-video overflow-hidden relative">
                    <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.baslik} />
                    
                    {(isFotoGaleri || h.kategori === "FOTO GALERİ") && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 p-3 rounded-full text-red-600 shadow-xl">
                          <FaIcons.FaCamera size={20} />
                        </div>
                      </div>
                    )}
                    {(isVideoGaleri || h.kategori === "VİDEO GALERİ") && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-red-600 p-3 rounded-full text-white shadow-xl group-hover:scale-125 transition-transform">
                          <FaIcons.FaPlay size={18} className="ml-0.5" />
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 italic uppercase shadow-lg">
                      {h.kategori}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                    <h3 className="text-sm font-black uppercase italic leading-tight line-clamp-3 group-hover:text-red-600 transition-colors tracking-tighter">
                      {h.baslik}
                    </h3>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase italic">
                      <span><FaIcons.FaCalendarAlt className="inline mr-1"/> {h.tarih?.seconds ? new Date(h.tarih.seconds * 1000).toLocaleDateString('tr-TR') : 'YENİ'}</span>
                      <span className="text-red-600 font-black uppercase">{isVideoGaleri ? "İZLE →" : "İNCELE →"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
               <FaIcons.FaRegFolderOpen size={64} className="mx-auto text-gray-200 mb-4"/>
               <p className="text-gray-400 font-black italic uppercase">İçerik bulunamadı kanka.</p>
            </div>
          )}
        </div>

        {/* SAĞ TARAF: SPOR BÖLÜMÜNE ÖZEL PUAN DURUMU & FİKSTÜR */}
        {isSpor && (
          <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-right duration-500">
            
            {/* SÜPER LİG TABLOSU */}
            <div className="bg-white border-t-4 border-red-600 shadow-xl overflow-hidden rounded-sm">
              <div className="bg-[#111] text-white p-4 flex justify-between items-center">
                <span className="text-[10px] font-black italic italic uppercase tracking-widest">SÜPER LİG PUAN DURUMU</span>
                <FaIcons.FaTrophy className="text-yellow-500"/>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left uppercase font-black italic">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-3">S</th>
                      <th className="p-3">TAKIM</th>
                      <th className="p-3">O</th>
                      <th className="p-3 text-red-600">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puanDurumu.length > 0 ? puanDurumu.slice(0, 20).map((takim, index) => (
                      <tr key={index} className={`border-b hover:bg-gray-50 transition-colors ${takim.team.name.includes('Kocaeli') ? 'bg-green-100 border-green-600' : ''}`}>
                        <td className="p-3 font-bold">{index + 1}</td>
                        <td className="p-3 flex items-center gap-2">
                          <img src={takim.team.logo} className="w-4 h-4 object-contain" alt="logo" />
                          <span className={takim.team.name.includes('Kocaeli') ? 'text-green-800' : ''}>{takim.team.name.replace('SK', '').trim()}</span>
                        </td>
                        <td className="p-3">{takim.all.played}</td>
                        <td className="p-3 font-black text-red-600">{takim.points}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-10 text-center animate-pulse">VERİLER MÜHÜRLENİYOR...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KOCAELİSPOR ÖZEL FİKSTÜR */}
            <div className="bg-[#1a1a1a] text-white p-5 rounded-sm border-l-8 border-green-600 shadow-2xl">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black italic uppercase tracking-tighter">KOCAELİSPOR FİKSTÜR</h4>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
               </div>
               <div className="space-y-4">
                  <div className="bg-white/5 p-3 rounded border border-white/5">
                     <p className="text-[8px] text-gray-500 mb-2 uppercase font-black">Sıradaki Randevu</p>
                     <div className="flex justify-between items-center text-[10px] font-black italic">
                        <span className="text-green-500">KOCAELİSPOR</span>
                        <span className="bg-red-600 px-2 py-0.5 rounded text-[8px] italic">VS</span>
                        <span className="text-gray-300">FENERBAHÇE</span>
                     </div>
                     <p className="text-[8px] text-center mt-3 text-gray-400">🏟️ YILDIZ ENTEGRE STADYUMU</p>
                  </div>
               </div>
            </div>

          </div>
        )}

      </div>

      <style jsx global>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}