"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";

// SEO — "use client" olduğundan metadata export edilemiyor.
// Bu sayfalar için SEO'yu sağlamak adına
// app/gizlilik-sozlesmesi/metadata.ts adında ayrı dosya oluştur:
//
//   import type { Metadata } from "next";
//   export const metadata: Metadata = {
//     title: "Gizlilik Sözleşmesi | HABERPİK",
//     description: "HABERPİK gizlilik sözleşmesi ve KVKK aydınlatma metni.",
//   };
//
// Ama bu sadece Server Component'lerde çalışır.
// Kalıcı çözüm: Bu dosyayı "use client" olmayan bir wrapper'a taşı,
// veri çekmeyi ayrı bir Client Component'e devret.

export default function GizlilikPage() {
  const [data, setData] = useState<any>(null);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setYuklendi(true);
    });
    return () => unsub();
  }, []);

  const icerik = data?.gizlilik;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* BREADCRUMB */}
      <div className="bg-[#111] border-b border-red-600">
        <div className="max-w-[1150px] mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-black italic uppercase text-gray-400">
          <Link href="/" className="hover:text-red-500 transition-colors">Ana Sayfa</Link>
          <FaIcons.FaChevronRight size={8} />
          <span className="text-white">Gizlilik Sözleşmesi</span>
        </div>
      </div>

      <div className="max-w-[1150px] mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-4">
            GİZLİLİK SÖZLEŞMESİ
          </h1>
          <p className="text-gray-500 text-sm font-bold italic mt-2 pl-4">
            KVKK Kapsamında Kişisel Verilerin Korunması ve Gizlilik Politikası
          </p>
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-sm overflow-hidden">
          {/* BAŞLIK BANDI */}
          <div className="bg-[#111] px-8 py-4 flex items-center gap-3">
            <FaIcons.FaShieldAlt className="text-red-600" size={20} />
            <span className="text-white font-black italic uppercase text-sm tracking-wider">HABERPİK — Gizlilik ve Veri Politikası</span>
          </div>

          <div className="p-8">
            {!yuklendi ? (
              /* YÜKLENIYOR */
              <div className="space-y-3 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            ) : icerik ? (
              /* FİREBASE'DEN GELEN İÇERİK */
              <div className="whitespace-pre-wrap font-bold text-sm leading-relaxed text-gray-800 italic">
                {icerik}
              </div>
            ) : (
              /* FİREBASE BOŞ — VARSAYILAN KVKK METNİ */
              <div className="font-bold text-sm leading-relaxed text-gray-800 space-y-6">
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">1. VERİ SORUMLUSU</h2>
                  <p className="italic">HABERPİK Medya olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz. Darıca / Kocaeli adresinde faaliyet gösteren HABERPİK, bu politika kapsamında kişisel verilerinizi aşağıda açıklanan amaç ve yöntemlerle işlemektedir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">2. TOPLANAN VERİLER</h2>
                  <p className="italic">Sitemizi ziyaret ettiğinizde IP adresi, tarayıcı bilgisi, ziyaret edilen sayfalar ve ziyaret süresi gibi teknik veriler otomatik olarak toplanabilir. İletişim formunu doldurduğunuzda ad, e-posta adresi ve mesaj içeriği toplanır. Bu veriler reklam takibi amacıyla üçüncü taraflarla paylaşılmaz.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">3. ÇEREZ POLİTİKASI</h2>
                  <p className="italic">Sitemiz, kullanıcı deneyimini iyileştirmek amacıyla çerez (cookie) kullanmaktadır. Oturum çerezleri, tercih çerezleri ve analitik çerezler kullanılabilir. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">4. VERİLERİN SAKLANMASI</h2>
                  <p className="italic">Kişisel verileriniz yalnızca işleme amacının gerektirdiği süre boyunca saklanır. Yasal yükümlülükler kapsamında zorunlu tutulan veriler ilgili mevzuatta öngörülen süreler boyunca muhafaza edilir.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">5. HAKLARINIZ</h2>
                  <p className="italic">KVKK'nın 11. maddesi uyarınca; verilerinize erişim, düzeltme, silme, işlemeye itiraz ve aktarımın kısıtlanmasını talep etme haklarına sahipsiniz. Talepleriniz için <strong>info@haberpik.com</strong> adresine yazabilirsiniz.</p>
                </section>
                <section>
                  <h2 className="text-base font-black uppercase text-gray-900 border-b border-gray-200 pb-2 mb-3">6. DEĞİŞİKLİKLER</h2>
                  <p className="italic">Bu politika zaman zaman güncellenebilir. Değişiklikler bu sayfada yayımlandığı tarihten itibaren geçerlidir. Sitemizi düzenli olarak ziyaret ederek güncel politikayı takip etmenizi öneririz.</p>
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