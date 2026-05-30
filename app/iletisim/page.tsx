"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as FaIcons from "react-icons/fa";
import Link from "next/link";

export default function IletisimPage() {
  // DÜZELTİLDİ: Telefon artık Firebase'den geliyor — sabit 0552 kaldırıldı
  const [siteAyarlari, setSiteAyarlari] = useState<any>(null);

  const [form, setForm] = useState({ ad: "", email: "", konu: "", mesaj: "" });
  const [durum, setDurum] = useState<"bos" | "gonderiyor" | "basarili" | "hata">("bos");
  const [hataMesaji, setHataMesaji] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "ayarlar", "genel"), (snap) => {
      if (snap.exists()) setSiteAyarlari(snap.data());
    });
    return () => unsub();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.ad.trim() || !form.mesaj.trim()) {
      setHataMesaji("Ad ve mesaj alanları zorunludur.");
      setDurum("hata");
      return;
    }

    setDurum("gonderiyor");
    setHataMesaji("");

    try {
      // Firebase'e iletişim mesajı kaydediliyor
      await addDoc(collection(db, "iletisim_mesajlari"), {
        ad: form.ad.trim(),
        email: form.email.trim(),
        konu: form.konu.trim(),
        mesaj: form.mesaj.trim(),
        tarih: serverTimestamp(),
        okundu: false,
      });

      setDurum("basarili");
      setForm({ ad: "", email: "", konu: "", mesaj: "" });
    } catch (err) {
      setHataMesaji("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
      setDurum("hata");
    }
  };

  const telefon = siteAyarlari?.whatsapp || "0532 449 03 81";
  const telefonTemiz = telefon.replace(/ /g, "");

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* BREADCRUMB */}
      <div className="bg-[#111] border-b border-red-600">
        <div className="max-w-[1150px] mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-black italic uppercase text-gray-400">
          <Link href="/" className="hover:text-red-500 transition-colors">Ana Sayfa</Link>
          <FaIcons.FaChevronRight size={8} />
          <span className="text-white">İletişim</span>
        </div>
      </div>

      <div className="max-w-[1150px] mx-auto px-4 py-12 font-black italic uppercase">
        <div className="mb-10">
          <h1 className="text-4xl tracking-tighter text-gray-900 border-l-8 border-red-600 pl-4">
            İLETİŞİM
          </h1>
          <p className="text-gray-500 text-sm mt-2 pl-4 not-italic normal-case tracking-normal">
            Haber ihbarı, düzeltme talebi veya reklam için bize ulaşın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* SOL — BİLGİ KARTLARI */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            <a
              href={`https://wa.me/${telefonTemiz}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:border-green-500 hover:shadow-md transition-all group"
            >
              <div className="bg-green-500 text-white p-4 rounded-sm text-2xl shrink-0 group-hover:scale-110 transition-transform">
                <FaIcons.FaWhatsapp />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 tracking-widest mb-1">WHATSAPP / TELEFON</div>
                <div className="text-lg text-gray-900 tracking-tighter">{telefon}</div>
                <div className="text-[10px] text-green-600 not-italic normal-case mt-0.5">Tıkla, WhatsApp'ta yaz →</div>
              </div>
            </a>

            <a
              href="mailto:info@haberpik.com"
              className="bg-white border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:border-red-500 hover:shadow-md transition-all group"
            >
              <div className="bg-red-600 text-white p-4 rounded-sm text-2xl shrink-0 group-hover:scale-110 transition-transform">
                <FaIcons.FaEnvelope />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 tracking-widest mb-1">E-POSTA</div>
                <div className="text-base text-gray-900 tracking-tighter">info@haberpik.com</div>
                <div className="text-[10px] text-red-600 not-italic normal-case mt-0.5">Tıkla, mail gönder →</div>
              </div>
            </a>

            <div className="bg-white border border-gray-200 shadow-sm p-6 flex items-center gap-5">
              <div className="bg-gray-800 text-white p-4 rounded-sm text-2xl shrink-0">
                <FaIcons.FaMapMarkerAlt />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 tracking-widest mb-1">ADRES</div>
                <div className="text-base text-gray-900 tracking-tighter">DARICA / KOCAELİ</div>
              </div>
            </div>

            {/* SOSYAL MEDYA */}
            {(siteAyarlari?.facebook || siteAyarlari?.twitter || siteAyarlari?.instagram || siteAyarlari?.youtube) && (
              <div className="bg-[#111] p-6">
                <div className="text-[10px] text-gray-500 tracking-widest mb-4">SOSYAL MEDYA</div>
                <div className="flex gap-3">
                  {siteAyarlari?.facebook && (
                    <a href={siteAyarlari.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                      className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center hover:bg-blue-600 transition-all">
                      <FaIcons.FaFacebookF className="text-white" size={16} />
                    </a>
                  )}
                  {siteAyarlari?.twitter && (
                    <a href={siteAyarlari.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                      className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center hover:bg-sky-500 transition-all">
                      <FaIcons.FaTwitter className="text-white" size={16} />
                    </a>
                  )}
                  {siteAyarlari?.instagram && (
                    <a href={siteAyarlari.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                      className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center hover:bg-pink-600 transition-all">
                      <FaIcons.FaInstagram className="text-white" size={16} />
                    </a>
                  )}
                  {siteAyarlari?.youtube && (
                    <a href={siteAyarlari.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                      className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center hover:bg-red-600 transition-all">
                      <FaIcons.FaYoutube className="text-white" size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SAĞ — FORM */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-[#111] px-8 py-4 flex items-center gap-3">
                <FaIcons.FaPaperPlane className="text-red-600" size={18} />
                <span className="text-white font-black italic uppercase text-sm tracking-wider">Mesaj Gönder</span>
              </div>

              {durum === "basarili" ? (
                /* BAŞARI EKRANI */
                <div className="p-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FaIcons.FaCheck className="text-green-600" size={28} />
                  </div>
                  <h2 className="text-xl text-gray-900 tracking-tighter">MESAJINIZ GÖNDERİLDİ!</h2>
                  <p className="text-gray-500 text-xs not-italic normal-case tracking-normal font-bold">
                    En kısa sürede size geri döneceğiz.
                  </p>
                  <button
                    onClick={() => setDurum("bos")}
                    className="mt-4 bg-red-600 text-white px-8 py-3 text-xs hover:bg-black transition-all"
                  >
                    YENİ MESAJ GÖNDER
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGonder} className="p-8 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500 tracking-widest">ADINIZ SOYADINIZ *</label>
                      <input
                        name="ad"
                        value={form.ad}
                        onChange={handleChange}
                        className="p-3 bg-gray-100 border border-transparent focus:border-red-600 focus:bg-white outline-none text-xs transition-all"
                        placeholder="Ad Soyad"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500 tracking-widest">E-POSTA</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="p-3 bg-gray-100 border border-transparent focus:border-red-600 focus:bg-white outline-none text-xs transition-all"
                        placeholder="ornek@mail.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 tracking-widest">KONU</label>
                    <select
                      name="konu"
                      value={form.konu}
                      onChange={handleChange}
                      className="p-3 bg-gray-100 border border-transparent focus:border-red-600 focus:bg-white outline-none text-xs transition-all"
                    >
                      <option value="">Konu Seçin</option>
                      <option value="Haber İhbarı">Haber İhbarı</option>
                      <option value="Düzeltme Talebi">Düzeltme Talebi</option>
                      <option value="Reklam">Reklam</option>
                      <option value="İşbirliği">İşbirliği</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 tracking-widest">MESAJINIZ *</label>
                    <textarea
                      name="mesaj"
                      value={form.mesaj}
                      onChange={handleChange}
                      rows={5}
                      className="p-3 bg-gray-100 border border-transparent focus:border-red-600 focus:bg-white outline-none text-xs transition-all resize-none"
                      placeholder="Mesajınızı buraya yazın..."
                      required
                    />
                  </div>

                  {durum === "hata" && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 not-italic normal-case tracking-normal font-bold flex items-center gap-2">
                      <FaIcons.FaExclamationCircle size={14} />
                      {hataMesaji}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={durum === "gonderiyor"}
                    className="bg-red-600 text-white py-4 text-sm hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {durum === "gonderiyor" ? (
                      <>
                        <FaIcons.FaSpinner className="animate-spin" size={16} />
                        GÖNDERİLİYOR...
                      </>
                    ) : (
                      <>
                        <FaIcons.FaPaperPlane size={14} />
                        GÖNDER
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 not-italic normal-case tracking-normal text-center">
                    * ile işaretli alanlar zorunludur. Mesajınız Firebase veritabanına kaydedilir.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}