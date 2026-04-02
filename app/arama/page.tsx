"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';

function AramaIcerik() {
  const searchParams = useSearchParams();
  const rawSorgu = searchParams.get('q') || "";
  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const aramaFormatla = (text: any) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .replace(/Ğ/g, "g")
      .replace(/Ü/g, "ü")
      .replace(/Ş/g, "ş")
      .replace(/Ö/g, "ö")
      .replace(/Ç/g, "ç")
      .trim();
  };

  useEffect(() => {
    const haberleriAra = async () => {
      setYukleniyor(true);
      try {
        const snapshot = await getDocs(collection(db, "haberler"));
        const formatliSorgu = aramaFormatla(rawSorgu);
        
        // KANKA: TypeScript hatasını (ts2339) önlemek için veriyi 'any' olarak mapliyoruz
        const tumHaberler = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));

        const filtrelenmis = tumHaberler.filter((h: any) => {
          const baslik = aramaFormatla(h.baslik);
          const icerik = aramaFormatla(h.icerik);
          const ozet = aramaFormatla(h.ozet);
          const kategori = aramaFormatla(h.kategori);
          
          return baslik.includes(formatliSorgu) || 
                 icerik.includes(formatliSorgu) || 
                 ozet.includes(formatliSorgu) ||
                 kategori.includes(formatliSorgu);
        });

        // KANKA: Sıralama hatasını (tarih bulunamadı) burada çözdük
        filtrelenmis.sort((a: any, b: any) => {
          const tarihA = a.tarih?.seconds || 0;
          const tarihB = b.tarih?.seconds || 0;
          return tarihB - tarihA;
        });

        setSonuclar(filtrelenmis);
      } catch (error) {
        console.error("Arama teknik hatası:", error);
      }
      setYukleniyor(false);
    };

    if (rawSorgu) {
      haberleriAra();
    } else {
      setYukleniyor(false);
    }
  }, [rawSorgu]);

  if (yukleniyor) return <div className="min-h-screen flex items-center justify-center font-black italic animate-pulse text-2xl text-red-600 uppercase tracking-tighter">ARAMA YAPILIYOR...</div>;

  return (
    <main className="max-w-[1150px] mx-auto px-2 py-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 mb-10 border-b-4 border-red-600 pb-6">
         <div className="bg-black text-white p-4 rounded-sm shadow-xl">
            <FaIcons.FaSearch size={28}/>
         </div>
         <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#111]">
               "{rawSorgu}" <span className="text-red-600 text-lg ml-2">ARAMA SONUÇLARI</span>
            </h1>
            <p className="text-gray-400 font-bold italic text-[10px] uppercase mt-1">
               TOPLAM {sonuclar.length} KAYIT BULUNDU
            </p>
         </div>
      </div>

      {sonuclar.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sonuclar.map((h) => (
            <Link href={`/haber/${h.id}`} key={h.id} className="group bg-white border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden">
              <div className="aspect-video overflow-hidden relative">
                <img src={h.resim || "https://placehold.co/600x400?text=HaberPik"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="haber" />
                <div className="absolute bottom-0 left-0 bg-red-600 text-white text-[9px] font-black px-3 py-1 italic uppercase">
                  {h.kategori}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <h3 className="text-sm font-black uppercase italic leading-tight line-clamp-3 group-hover:text-red-600 transition-colors tracking-tighter">
                  {h.baslik}
                </h3>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase italic">
                   <span><FaIcons.FaClock className="inline mr-1 text-red-600"/> {h.tarih?.seconds ? new Date(h.tarih.seconds * 1000).toLocaleDateString('tr-TR') : 'YAYINLANDI'}</span>
                   <span className="text-black font-black">OKU →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-white border border-dashed border-gray-300 rounded-xl">
           <FaIcons.FaSearchMinus size={80} className="mx-auto text-gray-100 mb-6"/>
           <p className="text-gray-500 font-black italic uppercase text-xl">Aradığınız kriterlere uygun sonuç bulunamadı.</p>
           <Link href="/" className="inline-block mt-8 bg-red-600 text-white px-10 py-4 font-black italic uppercase text-xs hover:bg-black transition-all shadow-xl">ANA SAYFA</Link>
        </div>
      )}
    </main>
  );
}

export default function AramaSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black italic text-red-600 uppercase">YÜKLENİYOR...</div>}>
      <AramaIcerik />
    </Suspense>
  );
}