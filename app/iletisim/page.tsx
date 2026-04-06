"use client";
import React from 'react';
import * as FaIcons from 'react-icons/fa';

export default function Iletisim() {
  return (
    <main className="max-w-[1150px] mx-auto px-4 py-20 min-h-screen font-black italic uppercase">
      <h1 className="text-5xl mb-12 border-l-8 border-red-600 pl-6 tracking-tighter">İLETİŞİM</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-10 shadow-2xl">
        <div className="space-y-8">
          <div className="flex items-center gap-6 text-2xl"><FaIcons.FaWhatsapp className="text-green-500"/> 0552 073 07 07</div>
          <div className="flex items-center gap-6 text-2xl"><FaIcons.FaEnvelope className="text-red-600"/> info@haberpik.com</div>
          <div className="flex items-center gap-6 text-2xl"><FaIcons.FaMapMarkerAlt/> DARICA / KOCAELİ</div>
        </div>
        <div className="flex flex-col gap-4">
          <input className="p-4 bg-gray-100 border-none outline-red-600 text-xs" placeholder="ADINIZ"/>
          <textarea className="p-4 bg-gray-100 border-none outline-red-600 text-xs h-32" placeholder="MESAJINIZ"></textarea>
          <button className="bg-red-600 text-white py-4 hover:bg-black transition-all">GÖNDER MÜHÜRLE</button>
        </div>
      </div>
    </main>
  );
}