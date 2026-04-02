"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';

export default function KategoriSayfasi() {
  const params = useParams();
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const slugRaw = params?.slug ? decodeURIComponent(params.slug as string) : "";

  // KANKA: Kategorinin galeri mi video mu olduğunu anlamak için kontrol
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

    return () => unsubscribe();
  }, [slugRaw]);

  if (yukleniyor) return <div className="min-h-screen bg-white flex items-center justify-center font-black italic animate-pulse text-2xl text-red-600 uppercase tracking-tighter">BAĞLANILIYOR...</div>;

  return (
    <main className="max-w-[1150px] mx-auto px-2 py-6 min-h-screen bg-gray-50">
      
      {/* BAŞLIK ALANI - KATEGORİYE GÖRE İKON DEĞİŞİYOR */}
      <div className="flex items-center gap-4 mb-8 border-b-4 border-red-600 pb-4">
         <div className="bg-red-600 text-white p-3 rounded-sm shadow-lg">
            {isFotoGaleri ? <FaIcons.FaCamera size={24}/> : isVideoGaleri ? <FaIcons.FaPlayCircle size={24}/> : <FaIcons.FaHashtag size={24}/>}
         </div>
         <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#111]">
            {slugRaw.replace(/-/g, ' ')} <span className="text-gray-400 text-sm font-bold">HABERLERİ</span>
         </h1>
      </div>

      {haberler.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {haberler.map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="group bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="aspect-video overflow-hidden relative">
                <img src={h.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.baslik} />
                
                {/* KANKA: GALERİ VEYA VİDEO İSE ÜZERİNE İKON ÇAKIYORUZ */}
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
           <p className="text-gray-400 font-black italic uppercase">Kriterlere uygun içerik bulunamadı.</p>
           <p className="text-[10px] text-gray-300 mt-2 uppercase italic font-bold">Aranan: {slugRaw.replace(/-/g, ' ').toUpperCase()}</p>
           <Link href="/" className="inline-block mt-6 bg-black text-white px-8 py-3 font-black italic uppercase text-xs hover:bg-red-600 transition-all">ANA SAYFA</Link>
        </div>
      )}

      <style jsx global>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}