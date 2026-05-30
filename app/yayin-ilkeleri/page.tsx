"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";

export default function YayinIlkeleriPage() {
  const [data, setData] = useState<any>(null);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setYuklendi(true);
    });
    return () => unsub();
  }, []);

  const icerik = data?.yayinIlkeleri;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-[#111] border-b border-red-600">
        <div className="max-w-[1150px] mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-black italic uppercase text-gray-400">
          <Link href="/" className="hover:text-red-500 transition-colors">Ana Sayfa</Link>
          <FaIcons.FaChevronRight size={8} />
          <span className="text-white">Yayın İlkeleri</span>
        </div>
      </div>

      <div className="max-w-[1150px] mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-4">
            YAYIN İLKELERİ
          </h1>
          <p className="text-gray-500 text-sm font-bold italic mt-2 pl-4">
            HABERPİK'in Habercilik Anlayışı ve Editoryal Standartları
          </p>
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-sm overflow-hidden">
          <div className="bg-[#111] px-8 py-4 flex items-center gap-3">
            <FaIcons.FaNewspaper className="text-red-600" size={20} />
            <span className="text-white font-black italic uppercase text-sm tracking-wider">HABERPİK — Editoryal Politika</span>
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
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">1. TEMEL İLKELER</h2>
                  <p className="italic">HABERPİK; doğruluk, tarafsızlık, bağımsızlık ve kamuya hesap verebilirlik ilkelerini temel alır. Her haberin kaynağı doğrulanmadan yayımlanmaz; birden fazla kaynaktan teyit alınması esastır.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">2. DOĞRULUK VE DÜZELTME</h2>
                  <p className="italic">Yanlış veya eksik yayımlanan haberler fark edildiği anda düzeltilir. Düzeltme haberi açıkça belirtilir ve silme yoluna gidilmez. Okuyucular hata bildirimi için iletişim kanallarımızı kullanabilir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">3. AYRIMCILIK KARŞITLIĞI</h2>
                  <p className="italic">Dil, din, ırk, cinsiyet, siyasi görüş veya sosyal statü farkı gözetmeksizin tüm bireylere eşit mesafede yaklaşılır. Nefret söylemi, ayrımcı ve aşağılayıcı içeriklere yer verilmez.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">4. KAYNAK GİZLİLİĞİ</h2>
                  <p className="italic">Kimliğinin gizli tutulmasını talep eden kaynakların bilgileri hiçbir koşulda açıklanmaz. Gizli kaynaktan gelen bilgiler özellikle titizlikle doğrulanır.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">5. REKLAM VE YAYIN BAĞIMSIZLIĞI</h2>
                  <p className="italic">Reklam ve ticari içerikler haber içeriğinden açıkça ayrılır. Reklam verenler editoryal kararlarda herhangi bir etkiye sahip değildir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">6. ÖZEL HAYATIN GİZLİLİĞİ</h2>
                  <p className="italic">Kamu yararı bulunmadıkça bireylerin özel hayatlarına ilişkin haberlere yer verilmez. Çocukların kimliğini açık eden haberler hiçbir koşulda yayımlanmaz.</p>
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