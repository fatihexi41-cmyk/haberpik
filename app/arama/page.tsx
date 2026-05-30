"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';

// Türkçe karakter normalize — küçük harf + aksansız karşılık
function normalize(text: any): string {
  if (!text) return "";
  return text.toString()
    .toLowerCase()
    .replace(/İ/g, "i").replace(/I/g, "ı")
    .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç").trim();
}

// DÜZELTİLDİ: Tüm koleksiyonu çekmek yerine son 500 haberi çek.
// Firestore full-text search desteklemez; gerçek arama için Algolia/Typesense
// entegrasyonu önerilir. Bu çözüm küçük-orta ölçekli siteler için yeterli.
const ARAMA_LIMIT = 500;

function AramaIcerik() {
  const searchParams = useSearchParams();
  const rawSorgu = searchParams.get('q') || "";

  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [toplamDoc, setToplamDoc] = useState(0); // kaç dokümana bakıldı

  useEffect(() => {
    if (!rawSorgu.trim()) {
      setYukleniyor(false);
      return;
    }

    const haberleriAra = async () => {
      setYukleniyor(true);
      try {
        // Son ARAMA_LIMIT haberi çek — getDocs(collection(...)) yerine
        const q = query(
          collection(db, "haberler"),
          orderBy("tarih", "desc"),
          limit(ARAMA_LIMIT)
        );
        const snapshot = await getDocs(q);
        setToplamDoc(snapshot.size);

        const formatliSorgu = normalize(rawSorgu);
        const kelimeler = formatliSorgu.split(/\s+/).filter(Boolean);

        const filtrelenmis = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(h => {
            const metin = [
              normalize(h.baslik),
              normalize(h.ozet),
              normalize(h.kategori),
              // icerik HTML tag'lerini temizle, sonra normalize et
              normalize((h.icerik || '').replace(/<[^>]*>/g, ' ')),
            ].join(' ');
            // Tüm kelimeler metinde geçmeli (AND mantığı)
            return kelimeler.every(k => metin.includes(k));
          });

        // Tarihe göre sırala (güvenli)
        filtrelenmis.sort((a, b) =>
          (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0)
        );

        setSonuclar(filtrelenmis);
      } catch (error) {
        console.error("Arama hatası:", error);
      }
      setYukleniyor(false);
    };

    haberleriAra();
  }, [rawSorgu]);

  if (yukleniyor) return (
    <div className="min-h-screen flex items-center justify-center font-black italic animate-pulse text-2xl text-red-600 uppercase tracking-tighter">
      ARAMA YAPILIYOR...
    </div>
  );

  return (
    <main className="max-w-[1150px] mx-auto px-2 py-8 min-h-screen bg-gray-50">

      {/* BAŞLIK */}
      <div className="flex items-center gap-4 mb-10 border-b-4 border-red-600 pb-6">
        <div className="bg-black text-white p-4 rounded-sm shadow-xl">
          <FaIcons.FaSearch size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#111]">
            "{rawSorgu}"
            <span className="text-red-600 text-lg ml-2">ARAMA SONUÇLARI</span>
          </h1>
          <p className="text-gray-400 font-bold italic text-[10px] uppercase mt-1">
            {sonuclar.length > 0
              ? `SON ${toplamDoc} HABERDEN ${sonuclar.length} SONUÇ BULUNDU`
              : `SON ${toplamDoc} HABER TARANDILAR, SONUÇ YOK`}
          </p>
        </div>
      </div>

      {sonuclar.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sonuclar.map((h) => (
            <Link
              href={`/haber/${h.id}`}
              key={h.id}
              className="group bg-white border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden"
            >
              <div className="aspect-video overflow-hidden relative">
                <img
                  src={h.resim || "https://placehold.co/600x400?text=HABERPİK"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={h.baslik || 'Haber görseli'}
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 bg-red-600 text-white text-[9px] font-black px-3 py-1 italic uppercase">
                  {h.kategori}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <h3 className="text-sm font-black uppercase italic leading-tight line-clamp-3 group-hover:text-red-600 transition-colors tracking-tighter">
                  {h.baslik}
                </h3>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase italic">
                  <span>
                    <FaIcons.FaClock className="inline mr-1 text-red-600" />
                    {h.tarih?.seconds
                      ? new Date(h.tarih.seconds * 1000).toLocaleDateString('tr-TR')
                      : 'YAYINLANDI'}
                  </span>
                  <span className="text-black font-black">OKU →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : rawSorgu ? (
        <div className="py-24 text-center bg-white border border-dashed border-gray-300 rounded-xl">
          <FaIcons.FaSearchMinus size={80} className="mx-auto text-gray-100 mb-6" />
          <p className="text-gray-500 font-black italic uppercase text-xl mb-2">
            Sonuç bulunamadı.
          </p>
          <p className="text-gray-400 text-xs font-bold italic">
            "{rawSorgu}" için eşleşen haber yok. Farklı kelimeler deneyin.
          </p>
          <Link
            href="/"
            className="inline-block mt-8 bg-red-600 text-white px-10 py-4 font-black italic uppercase text-xs hover:bg-black transition-all shadow-xl"
          >
            ANA SAYFA
          </Link>
        </div>
      ) : (
        /* Sorgu boşsa */
        <div className="py-24 text-center">
          <FaIcons.FaSearch size={80} className="mx-auto text-gray-200 mb-6" />
          <p className="text-gray-400 font-black italic uppercase">
            Aramak istediğiniz kelimeyi navbar'daki arama kutusuna yazın.
          </p>
        </div>
      )}
    </main>
  );
}

export default function AramaSayfasi() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-black italic text-red-600 uppercase animate-pulse">
        YÜKLENİYOR...
      </div>
    }>
      <AramaIcerik />
    </Suspense>
  );
}