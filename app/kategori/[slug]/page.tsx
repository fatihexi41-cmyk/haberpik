"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, limit, doc } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';

export default function KategoriSayfasi() {
  const params = useParams();
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // KANKA: Spor verileri için state'ler
  const [puanDurumu, setPuanDurumu] = useState<any[]>([]);
  const [fikstur, setFikstur] = useState<any[]>([]); // KANKA: Bunu ekledik
  const [aktifSekme, setAktifSekme] = useState<'puan' | 'fikstur'>('puan'); // Sekme için
  const [sporYukleniyor, setSporYukleniyor] = useState(false);

  const slugRaw = params?.slug ? decodeURIComponent(params.slug as string) : "";
  const isSpor = slugRaw.toLowerCase().includes("spor");
  const isFotoGaleri = slugRaw.includes("foto-galeri");
  const isVideoGaleri = slugRaw.includes("video-galeri");

  useEffect(() => {
    if (!slugRaw) return;
    setYukleniyor(true);

    const fetchData = async () => {
      try {
        const slugLower = slugRaw.toLowerCase();
        const q = query(
          collection(db, "haberler"),
          orderBy("tarih", "desc"),
          limit(100)
        );

        const snapshot = await getDocs(q);
        const tumHaberler = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filtrelenmis = tumHaberler.filter((h: any) => {
  const slugUpper = slugRaw.toUpperCase().trim(); // Süzülen kategori adını büyüt

  const yeniKategoriler = Array.isArray(h.kategoriler) 
    ? h.kategoriler.map((k:any) => k.toUpperCase().trim()) 
    : [];

  const eskiKategori = (h.kategori || "").toUpperCase().trim();

  // KANKA: Artık her iki taraf da büyük harf, kaçışı yok!
  return yeniKategoriler.includes(slugUpper) || eskiKategori === slugUpper;
});

        setHaberler(filtrelenmis);
      } catch (error) {
        console.error("Firebase hatası kanka:", error);
      } finally {
        setYukleniyor(false);
      }
    };

    fetchData();

    // SPOR VERİSİ TAKİBİ (Firebase Canlı Bağlantı)
    let unsubSpor: (() => void) | undefined;

    if (isSpor) {
      setSporYukleniyor(true);
      // Kanka RapidAPI bitti, artık direkt bizim botun yazdığı 'hizmetler' dökümanına bakıyoruz
      unsubSpor = onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPuanDurumu(data.lig_durumu || []);
          // KANKA: Botun getirdiği fikstürü buraya bağlıyoruz
          setFikstur(data.super_lig_fikstur || data.fikstur || []); 
        }
        setSporYukleniyor(false);
      });
    }

    return () => {
      if (unsubSpor) unsubSpor();
    };
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
                      <span className="text-red-600 font-black uppercase">{h.kategori === "VİDEO GALERİ" ? "İZLE →" : "İNCELE →"}</span>
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
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white border-t-4 border-red-600 shadow-xl overflow-hidden rounded-sm">
              {/* SEKMELER */}
              <div className="flex bg-[#111] border-b border-white/10">
                <button 
                  onClick={() => setAktifSekme('puan')}
                  className={`flex-1 py-3 text-[10px] font-black italic transition-all ${aktifSekme === 'puan' ? 'text-white bg-red-600' : 'text-gray-500 hover:text-white'}`}>
                  PUAN DURUMU
                </button>
                <button 
                  onClick={() => setAktifSekme('fikstur')}
                  className={`flex-1 py-3 text-[10px] font-black italic transition-all ${aktifSekme === 'fikstur' ? 'text-white bg-red-600' : 'text-gray-500 hover:text-white'}`}>
                  FİKSTÜR
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                {aktifSekme === 'puan' ? (
                  <table className="w-full text-[10px] text-left uppercase font-black italic">
                    <thead className="bg-gray-100 text-gray-500 border-b">
                      <tr>
                        <th className="p-2 text-center">#</th>
                        <th className="p-2">TAKIM</th>
                        <th className="p-2 text-center">O</th>
                        <th className="p-2 text-center text-red-600">P</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puanDurumu.length > 0 ? puanDurumu.map((takim: any, index: number) => (
                        <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${takim.team.name.includes('Kocaeli') ? 'bg-green-50' : ''}`}>
                          <td className="p-2 text-center text-gray-400">{index + 1}</td>
                          <td className="p-2 flex items-center gap-2">
                            <span className={`truncate max-w-[120px] ${takim.team.name.includes('Kocaeli') ? 'text-green-700 font-extrabold' : 'text-gray-800'}`}>
                              {takim.team.name.replace('A.Ş.', '').trim()}
                            </span>
                          </td>
                          <td className="p-2 text-center">{takim.played}</td>
                          <td className="p-2 text-center font-black text-red-600 bg-red-50">{takim.points}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="p-10 text-center animate-pulse text-gray-400 font-black italic">VERİLER MÜHÜRLENİYOR...</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="divide-y divide-gray-100 bg-white">
                    {fikstur.length > 0 ? fikstur.map((mac: any, index: number) => (
                      <div key={index} className="p-3 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-red-600">
                        <p className="text-[8px] text-gray-400 font-black italic mb-1 uppercase">{mac.time || "SÜPER LİG"}</p>
                        <div className="flex justify-between items-center text-[10px] font-black italic text-gray-800 tracking-tighter">
                          <span className={mac.home.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.home}</span>
                          <span className="text-red-600 px-2">VS</span>
                          <span className={mac.away.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.away}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center text-gray-400 font-black italic uppercase">FİKSTÜR BEKLENİYOR...</div>
                    )}
                  </div>
                )}
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