"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, limit, where, doc, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import Link from 'next/link';
import * as FaIcons from 'react-icons/fa';

// ─── KATEGORİ HARİTASI — merkezi tanım, iki yerde kopyalanmıştı ───────────
const KATEGORI_HARITASI: Record<string, string> = {
  "gundem": "GÜNDEM",
  "spor": "SPOR",
  "siyaset": "SİYASET",
  "asayis": "ASAYİŞ",
  "ekonomi": "EKONOMİ",
  "turkiye": "TÜRKİYE HABERLERİ",
  "dunya": "DÜNYA",
  "teknoloji": "BİLİM TEKNOLOJİ",
  "kultur-sanat": "KÜLTÜR SANAT",
  "egitim": "EĞİTİM",
  "saglik": "SAĞLIK",        // DÜZELTİLDİ: "saglak" değil
  "emlak": "EMLAK",
  "otomobil": "OTOMOBİL",
  "magazin": "MAGAZİN",
  "yasam": "HAYATIN İÇİNDEN",
  "hayatin-icinden": "HAYATIN İÇİNDEN",
};

// Slug → Türkçe görünen başlık (URL decode + harita)
function slugToBaslik(slug: string): string {
  return KATEGORI_HARITASI[slug] || slug.toUpperCase().replace(/-/g, ' ');
}

export default function KategoriSayfasi() {
  const params = useParams();
  const slugRaw = params?.slug ? decodeURIComponent(params.slug as string) : "";

  const [haberler, setHaberler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [dahaYukleniyor, setDahaYukleniyor] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [bittiMi, setBittiMi] = useState(false);

  const [puanDurumu, setPuanDurumu] = useState<any[]>([]);
  const [fikstur, setFikstur] = useState<any[]>([]);
  const [aktifSekme, setAktifSekme] = useState<'puan' | 'fikstur'>('puan');
  const [sporYukleniyor, setSporYukleniyor] = useState(false);

  const isSpor = slugRaw.toLowerCase().includes("spor");
  const isFotoGaleri = slugRaw.includes("foto-galeri");
  const isVideoGaleri = slugRaw.includes("video-galeri");

  // DÜZELTİLDİ: fetchData useCallback ile sarmalandı — stale closure hatası giderildi
  const fetchData = useCallback(async (isMore = false) => {
    if (!slugRaw) return;
    if (isMore) setDahaYukleniyor(true);
    else setYukleniyor(true);

    try {
      const slugUpper = KATEGORI_HARITASI[slugRaw] || slugRaw.toUpperCase().replace(/-/g, ' ');

      let q = query(
        collection(db, "haberler"),
        where("kategoriler", "array-contains", slugUpper),
        orderBy("tarih", "desc"),
        limit(12)
      );

      if (isMore && lastDoc) {
        q = query(
          collection(db, "haberler"),
          where("kategoriler", "array-contains", slugUpper),
          orderBy("tarih", "desc"),
          startAfter(lastDoc),
          limit(12)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setBittiMi(true);
      } else {
        const yeniHaberler = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        if (isMore) {
          setHaberler(prev => [...prev, ...yeniHaberler]);
        } else {
          setHaberler(yeniHaberler);
          setBittiMi(snapshot.docs.length < 12);
        }
      }
    } catch (error) {
      console.error("Firebase hatası:", error);
    } finally {
      setYukleniyor(false);
      setDahaYukleniyor(false);
    }
  }, [slugRaw, lastDoc]);

  useEffect(() => {
    if (!slugRaw) return;
    setHaberler([]);
    setLastDoc(null);
    setBittiMi(false);
    fetchData();

    if (!isSpor) return;
    setSporYukleniyor(true);
    const unsubSpor = onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPuanDurumu(data.lig_durumu || data.puanDurumu || []);
        setFikstur(data.super_lig_fikstur || data.fikstur || []);
      }
      setSporYukleniyor(false);
    });
    return () => unsubSpor();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugRaw, isSpor]);

  // DÜZELTİLDİ: Başlık artık Türkçe karakterlerle doğru gösteriyor
  const sayfaBasligi = slugToBaslik(slugRaw);

  if (yukleniyor) return (
    <div className="min-h-screen bg-white flex items-center justify-center font-black italic animate-pulse text-2xl text-red-600 uppercase tracking-tighter">
      BAĞLANILIYOR...
    </div>
  );

  return (
    <main className="max-w-[1150px] mx-auto px-2 py-6 min-h-screen bg-gray-50">

      {/* BAŞLIK */}
      <div className="flex items-center gap-4 mb-8 border-b-4 border-red-600 pb-4">
        <div className="bg-red-600 text-white p-3 rounded-sm shadow-lg">
          {isFotoGaleri
            ? <FaIcons.FaCamera size={24} />
            : isVideoGaleri
              ? <FaIcons.FaPlayCircle size={24} />
              : <FaIcons.FaHashtag size={24} />}
        </div>
        {/* DÜZELTİLDİ: slugRaw yerine sayfaBasligi — "gundem" → "GÜNDEM" */}
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#111]">
            {sayfaBasligi}
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-black italic text-gray-400 uppercase mt-1">
            <Link href="/" className="hover:text-red-600 transition-colors">Ana Sayfa</Link>
            <FaIcons.FaChevronRight size={8} />
            <span>{sayfaBasligi} Haberleri</span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isSpor ? 'lg:grid-cols-12' : ''} gap-8`}>

        {/* HABER LİSTESİ */}
        <div className={isSpor ? 'lg:col-span-8' : ''}>
          {haberler.length > 0 ? (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isSpor ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
                {haberler.map((h) => (
                  <Link
                    href={`/haber/${h.id}`}
                    key={h.id}
                    className="group bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    <div className="aspect-video overflow-hidden relative">
                      {/* DÜZELTİLDİ: alt etiketi eklendi */}
                      <img
                        src={h.resim}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={h.baslik || 'Haber görseli'}
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 italic uppercase shadow-lg">
                        {h.kategori}
                      </div>
                      {h.sonDakika && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 italic uppercase animate-pulse">
                          SON DAKİKA
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                      <h3 className="text-sm font-black uppercase italic leading-tight line-clamp-3 group-hover:text-red-600 transition-colors tracking-tighter">
                        {h.baslik}
                      </h3>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase italic">
                        <span>
                          <FaIcons.FaCalendarAlt className="inline mr-1" />
                          {h.tarih?.seconds
                            ? new Date(h.tarih.seconds * 1000).toLocaleDateString('tr-TR')
                            : 'YENİ'}
                        </span>
                        <span className="text-red-600 font-black uppercase">
                          {h.kategori === "VİDEO GALERİ" ? "İZLE →" : "İNCELE →"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* DAHA FAZLA BUTONU */}
              {!bittiMi && haberler.length >= 12 && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => fetchData(true)}
                    disabled={dahaYukleniyor}
                    className="bg-[#111] text-white px-10 py-4 font-black italic uppercase tracking-tighter hover:bg-red-600 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                  >
                    {dahaYukleniyor ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        YÜKLENİYOR...
                      </>
                    ) : (
                      <>
                        <FaIcons.FaPlus /> DAHA FAZLA HABER
                      </>
                    )}
                  </button>
                </div>
              )}

              {bittiMi && haberler.length > 0 && (
                <p className="text-center text-gray-400 font-black italic mt-10 uppercase tracking-widest text-sm">
                  BU KATEGORİNİN SONUNA GELDİNİZ 🏁
                </p>
              )}
            </>
          ) : (
            <div className="py-20 text-center bg-white border border-gray-200 rounded-sm">
              <FaIcons.FaRegFolderOpen size={64} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-black italic uppercase text-lg">Bu kategoride henüz haber yok.</p>
              <Link href="/" className="inline-block mt-6 bg-red-600 text-white px-6 py-3 text-xs font-black italic uppercase hover:bg-black transition-all">
                ANA SAYFAYA DÖN
              </Link>
            </div>
          )}
        </div>

        {/* SPOR SIDEBAR */}
        {isSpor && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border-t-4 border-red-600 shadow-xl overflow-hidden rounded-sm">
              <div className="flex bg-[#111] border-b border-white/10">
                <button
                  onClick={() => setAktifSekme('puan')}
                  className={`flex-1 py-3 text-[10px] font-black italic transition-all ${aktifSekme === 'puan' ? 'text-white bg-red-600' : 'text-gray-500 hover:text-white'}`}
                >
                  PUAN DURUMU
                </button>
                <button
                  onClick={() => setAktifSekme('fikstur')}
                  className={`flex-1 py-3 text-[10px] font-black italic transition-all ${aktifSekme === 'fikstur' ? 'text-white bg-red-600' : 'text-gray-500 hover:text-white'}`}
                >
                  FİKSTÜR
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                {aktifSekme === 'puan' ? (
                  sporYukleniyor ? (
                    <div className="p-10 text-center animate-pulse text-gray-400 font-black italic text-xs uppercase">
                      VERİLER YÜKLENİYOR...
                    </div>
                  ) : (
                    <table className="w-full text-[10px] text-left uppercase font-black italic">
                      <thead className="bg-gray-100 text-gray-500 border-b sticky top-0">
                        <tr>
                          <th className="p-2 text-center">#</th>
                          <th className="p-2">TAKIM</th>
                          <th className="p-2 text-center">O</th>
                          <th className="p-2 text-center">G</th>
                          <th className="p-2 text-center">B</th>
                          <th className="p-2 text-center">M</th>
                          <th className="p-2 text-center text-red-600">P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puanDurumu.length > 0 ? puanDurumu.map((takim: any, index: number) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${takim.team?.name?.includes('Kocaeli') ? 'bg-green-50' : ''}`}
                          >
                            <td className="p-2 text-center text-gray-400">{index + 1}</td>
                            <td className="p-2">
                              <span className={`truncate max-w-[100px] block ${takim.team?.name?.includes('Kocaeli') ? 'text-green-700 font-extrabold' : 'text-gray-800'}`}>
                                {takim.team?.name?.replace('A.Ş.', '').replace('SK', '').trim()}
                              </span>
                            </td>
                            <td className="p-2 text-center text-gray-600">{takim.played}</td>
                            <td className="p-2 text-center text-green-600">{takim.won}</td>
                            <td className="p-2 text-center text-orange-500">{takim.draw}</td>
                            <td className="p-2 text-center text-red-400">{takim.lost}</td>
                            <td className="p-2 text-center font-black text-red-600 bg-red-50">{takim.points}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={7} className="p-10 text-center animate-pulse text-gray-400 font-black italic">
                              VERİLER YÜKLENİYOR...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )
                ) : (
                  <div className="divide-y divide-gray-100 bg-white">
                    {fikstur.length > 0 ? fikstur.map((mac: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-red-600"
                      >
                        <p className="text-[8px] text-gray-400 font-black italic mb-1 uppercase">{mac.time || "SÜPER LİG"}</p>
                        <div className="flex justify-between items-center text-[10px] font-black italic text-gray-800 tracking-tighter">
                          <span className={mac.home?.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.home}</span>
                          <span className="text-red-600 px-2 text-[8px] bg-gray-100 rounded-full">VS</span>
                          <span className={mac.away?.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.away}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center text-gray-400 font-black italic uppercase animate-pulse text-xs">
                        FİKSTÜR BEKLENİYOR...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}