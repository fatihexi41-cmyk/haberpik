"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";

export default function KunyePage() {
  const [data, setData] = useState<any>(null);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setYuklendi(true);
    });
    return () => unsub();
  }, []);

  const serbest = data?.kunyeMetni;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-[#111] border-b border-red-600">
        <div className="max-w-[1150px] mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-black italic uppercase text-gray-400">
          <Link href="/" className="hover:text-red-500 transition-colors">Ana Sayfa</Link>
          <FaIcons.FaChevronRight size={8} />
          <span className="text-white">Künye</span>
        </div>
      </div>

      <div className="max-w-[1150px] mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-4">
            KÜNYE
          </h1>
          <p className="text-gray-500 text-sm font-bold italic mt-2 pl-4">
            Yayın Bilgileri ve Sorumlu Yönetim
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { ikon: <FaIcons.FaNewspaper />, baslik: "Yayın Adı", deger: data?.siteBasligi || "HABERPİK" },
            { ikon: <FaIcons.FaGlobe />, baslik: "İnternet Adresi", deger: "www.haberpik.com" },
            { ikon: <FaIcons.FaMapMarkerAlt />, baslik: "Adres", deger: "Darıca / Kocaeli" },
            { ikon: <FaIcons.FaEnvelope />, baslik: "E-Posta", deger: "info@haberpik.com" },
            { ikon: <FaIcons.FaPhone />, baslik: "Telefon", deger: data?.whatsapp || "0532 449 03 81" },
            { ikon: <FaIcons.FaCalendar />, baslik: "Yayın Tarihi", deger: "2024" },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="bg-red-600 text-white p-3 rounded-sm text-lg shrink-0">
                {item.ikon}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase italic text-gray-400 tracking-widest">{item.baslik}</div>
                <div className="text-sm font-black italic text-gray-900 mt-0.5">{item.deger}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-sm overflow-hidden">
          <div className="bg-[#111] px-8 py-4 flex items-center gap-3">
            <FaIcons.FaIdCard className="text-red-600" size={20} />
            <span className="text-white font-black italic uppercase text-sm tracking-wider">Detaylı Künye Bilgisi</span>
          </div>
          <div className="p-8">
            {!yuklendi ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
                ))}
              </div>
            ) : serbest ? (
              <div className="whitespace-pre-wrap font-bold text-sm leading-relaxed text-gray-800 italic">
                {serbest}
              </div>
            ) : (
              <div className="font-bold text-sm leading-relaxed text-gray-800 italic space-y-4">
                <p><strong className="text-gray-900 not-italic">Yayın Türü:</strong> İnternet Haber Sitesi</p>
                <p><strong className="text-gray-900 not-italic">Yayın Dili:</strong> Türkçe</p>
                <p><strong className="text-gray-900 not-italic">Yayın Bölgesi:</strong> Kocaeli ve Türkiye Geneli</p>
                <p><strong className="text-gray-900 not-italic">Yayın Periyodu:</strong> 7/24 Sürekli Güncellenen</p>
                <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                  Künye detayları için Firebase Admin panelinden "ayarlar → genel → kunyeMetni" alanını doldurun.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}