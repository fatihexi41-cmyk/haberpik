"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";

export default function KullanimSartlariPage() {
  const [data, setData] = useState<any>(null);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setYuklendi(true);
    });
    return () => unsub();
  }, []);

  const icerik = data?.kullanimSartlari;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-[#111] border-b border-red-600">
        <div className="max-w-[1150px] mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-black italic uppercase text-gray-400">
          <Link href="/" className="hover:text-red-500 transition-colors">Ana Sayfa</Link>
          <FaIcons.FaChevronRight size={8} />
          <span className="text-white">Kullanım Şartları</span>
        </div>
      </div>

      <div className="max-w-[1150px] mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-4">
            KULLANIM ŞARTLARI
          </h1>
          <p className="text-gray-500 text-sm font-bold italic mt-2 pl-4">
            Siteyi Kullanmadan Önce Lütfen Okuyunuz
          </p>
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-sm overflow-hidden">
          <div className="bg-[#111] px-8 py-4 flex items-center gap-3">
            <FaIcons.FaFileContract className="text-red-600" size={20} />
            <span className="text-white font-black italic uppercase text-sm tracking-wider">HABERPİK — Kullanım Koşulları</span>
          </div>

          <div className="p-8">
            {!yuklendi ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            ) : icerik ? (
              <div className="whitespace-pre-wrap font-bold text-sm leading-relaxed text-gray-800 italic">
                {icerik}
              </div>
            ) : (
              <div className="font-bold text-sm leading-relaxed text-gray-800 space-y-6">
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">1. KABUL</h2>
                  <p className="italic">haberpik.com adresini ziyaret ederek veya içeriklerinden yararlanarak bu kullanım şartlarını kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız siteyi kullanmayı bırakınız.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">2. FİKRİ MÜLKİYET</h2>
                  <p className="italic">Sitede yer alan tüm metin, fotoğraf, video, grafik ve diğer içerikler HABERPİK Medya'ya aittir. İzin alınmadan ticari amaçla kullanılamaz, çoğaltılamaz veya dağıtılamaz. Kaynak gösterilerek alıntı yapılabilir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">3. SORUMLULUK SINIRLAMASI</h2>
                  <p className="italic">HABERPİK, sitede yer alan bilgilerin doğruluğunu sağlamak için azami özen gösterir; ancak haber içeriklerinden doğabilecek zararlardan sorumlu tutulamaz. Üçüncü taraf bağlantılar HABERPİK sorumluluğunda değildir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">4. YASAK İÇERİKLER</h2>
                  <p className="italic">Yorum ve ihbar kanalları aracılığıyla hakaret, nefret söylemi, yanıltıcı bilgi veya yasadışı içerik gönderilmesi kesinlikle yasaktır. Bu tür içerikler kaldırılır ve yasal işlem başlatılabilir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">5. DEĞİŞİKLİKLER</h2>
                  <p className="italic">HABERPİK, bu kullanım şartlarını önceden bildirmeksizin değiştirme hakkını saklı tutar. Değişiklikler yayımlandığı tarihten itibaren geçerlidir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">6. UYGULANACAK HUKUK</h2>
                  <p className="italic">Bu şartlardan doğan uyuşmazlıklarda Kocaeli Mahkemeleri ve İcra Daireleri yetkilidir. Türk Hukuku uygulanır.</p>
                </section>
                <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 italic">
                  Son güncelleme: {new Date().toLocaleDateString("tr-TR")} · HABERPİK Medya — Darıca / Kocaeli · info@haberpik.com
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}