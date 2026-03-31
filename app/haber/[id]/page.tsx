"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as FaIcons from 'react-icons/fa';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function HaberDetay() {
  const { id } = useParams();
  const router = useRouter();
  const [haber, setHaber] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    const haberCek = async () => {
      if (!id) return;
      const docRef = doc(db, "haberler", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setHaber(docSnap.data());
      setYukleniyor(false);
    };
    haberCek();
  }, [id]);

  const linkiKopyala = () => {
    navigator.clipboard.writeText(window.location.href);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  if (yukleniyor) return <div className="min-h-screen flex items-center justify-center font-black italic text-red-600 animate-bounce">HABER YÜKLENİYOR...</div>;
  if (!haber) return <div className="min-h-screen flex items-center justify-center">Haber bulunamadı kanka!</div>;

  const paylasimMesaji = encodeURIComponent(`${haber.baslik}\n${window.location.href}`);

  return (
    <div className="min-h-screen bg-white text-[#111] pb-20">
      {/* ÜST BAR */}
      <div className="bg-[#1a1a1a] text-white py-4 px-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
           <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:text-red-500">
             <FaIcons.FaArrowLeft /> ANA SAYFA
           </button>
           <span>{haber.kategori} HABERLERİ</span>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-4xl mt-10">
        <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block">KOCAELİ GAZETESİ 24</span>
        <h1 className="text-3xl md:text-5xl font-black leading-tight uppercase mb-6 tracking-tighter">{haber.baslik}</h1>
        
        <p className="text-xl font-bold text-gray-500 border-l-4 border-red-600 pl-6 mb-10 italic">{haber.ozet}</p>

        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-xl">
          <img src={haber.resim} className="w-full h-full object-cover" alt="haber" />
        </div>

        {/* SOSYAL PAYLAŞIM BUTONLARI (KANKA BURASI ÖNEMLİ) */}
        <div className="flex flex-wrap gap-4 mb-10 border-y py-6 border-gray-100 items-center">
           <span className="text-[10px] font-black uppercase text-gray-400 mr-2">Haberi Paylaş:</span>
           
           {/* WhatsApp */}
           <a href={`https://api.whatsapp.com/send?text=${paylasimMesaji}`} target="_blank" className="bg-[#25D366] text-white p-3 rounded-full hover:scale-110 transition-transform">
              <FaIcons.FaWhatsapp size={20} />
           </a>

           {/* Twitter/X */}
           <a href={`https://twitter.com/intent/tweet?text=${paylasimMesaji}`} target="_blank" className="bg-black text-white p-3 rounded-full hover:scale-110 transition-transform">
              <FaIcons.FaTwitter size={20} />
           </a>

           {/* Facebook */}
           <a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`} target="_blank" className="bg-[#1877F2] text-white p-3 rounded-full hover:scale-110 transition-transform">
              <FaIcons.FaFacebookF size={20} />
           </a>

           {/* Instagram için Kopyala Butonu */}
           <button onClick={linkiKopyala} className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-black text-[10px] hover:scale-105 transition-all">
              <FaIcons.FaInstagram size={18} /> {kopyalandi ? "LİNK KOPYALANDI!" : "INSTAGRAM'DA PAYLAŞ"}
           </button>
        </div>

        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed text-xl whitespace-pre-wrap font-medium">
           {haber.icerik || "Haber detayı hazırlanıyor kanka..."}
        </div>
      </main>
    </div>
  );
}