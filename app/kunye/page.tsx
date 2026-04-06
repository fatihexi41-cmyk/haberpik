"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function KunyePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      if (snap.exists()) setData(snap.data());
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-[1150px] mx-auto px-4 py-20 min-h-screen">
      <h1 className="text-4xl font-black italic uppercase border-b-4 border-red-600 inline-block mb-10">KÜNYE</h1>
{/* KANKA: FIREBASE'DEKİ kunyeMetni İSMİYLE BURAYI MÜHÜRLEDİK */}
<div className="bg-white dark:bg-[#1a1a1a] p-8 shadow-xl border border-gray-200 dark:border-white/5 whitespace-pre-wrap font-bold text-sm leading-relaxed uppercase italic">
  {data ? (data.kunyeMetni || "Künye metni veritabanında boş kanka!") : "YÜKLENİYOR..."}
</div>
    </div>
  );
}