"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as FaIcons from 'react-icons/fa';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs, addDoc, onSnapshot, orderBy } from "firebase/firestore";
import Link from 'next/link';

export default function HaberDetayClient({ id }: { id: string }) {
  const router = useRouter();
  const [haber, setHaber] = useState<any>(null);
  const [benzerHaberler, setBenzerHaberler] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]);
  const [yeniYorum, setYeniYorum] = useState({ isim: '', mesaj: '' });
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [okumaSuresi, setOkumaSuresi] = useState(0);
  const [verilenTepki, setVerilenTepki] = useState<string | null>(null); // KANKA: Kullanıcının o anki tepkisi

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }

    const haberCek = async () => {
      if (!id) return;
      
      const unsubHaber = onSnapshot(doc(db, "haberler", id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHaber(data);
          
          if (data.icerik) {
            const kelimeSayisi = data.icerik.replace(/<[^>]*>/g, '').split(/\s+/).length;
            const sure = Math.ceil(kelimeSayisi / 200);
            setOkumaSuresi(sure);
          }
        }
        setYukleniyor(false);
      });

      await updateDoc(doc(db, "haberler", id), { okunma: increment(1) });
      return unsubHaber;
    };

    const bHaberCek = async () => {
        const docRef = doc(db, "haberler", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const q = query(
                collection(db, "haberler"),
                where("kategori", "==", data.kategori),
                limit(5)
              );
              const bSnap = await getDocs(q);
              setBenzerHaberler(bSnap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() })).slice(0, 4));
        }
    }

    const qYorum = query(
      collection(db, "yorumlar"),
      where("haberId", "==", id),
      orderBy("tarih", "desc")
    );
    const unsubYorum = onSnapshot(qYorum, (snap) => {
      setYorumlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    haberCek();
    bHaberCek();
    return () => {
        unsubYorum();
    };
  }, [id]);

  // KANKA: Emoji Tepki Botu
  const tepkiVer = async (emojiKey: string) => {
    if (verilenTepki) return; // KANKA: Bir kere tepki verebilsin
    setVerilenTepki(emojiKey);
    const docRef = doc(db, "haberler", id);
    try {
      await updateDoc(docRef, {
        [`tepkiler.${emojiKey}`]: increment(1)
      });
    } catch (e) {
      console.log("Tepki mühürlenemedi!");
    }
  };

  const yorumGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniYorum.isim || !yeniYorum.mesaj) return alert("Hata: İsim ve mesaj alanları doldurulmalıdır.");
    setYorumYukleniyor(true);
    try {
      await addDoc(collection(db, "yorumlar"), {
        haberId: id,
        isim: yeniYorum.isim,
        mesaj: yeniYorum.mesaj,
        tarih: new Date(),
        onayli: true 
      });
      setYeniYorum({ isim: '', mesaj: '' });
    } catch (e) { alert("Yorum iletilemedi, lütfen tekrar deneyiniz."); }
    setYorumYukleniyor(false);
  };

  const linkiKopyala = () => {
    navigator.clipboard.writeText(currentUrl);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  if (yukleniyor) return <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black italic text-red-600 animate-pulse text-2xl uppercase tracking-tighter">HABER YÜKLENİYOR...</div>;
  if (!haber) return <div className="min-h-screen flex items-center justify-center font-black italic uppercase text-red-600">HABER BULUNAMADI.</div>;

  const paylasimMesaji = encodeURIComponent(`${haber.baslik}\n${currentUrl}`);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111] pb-20 relative font-sans">
      {/* SOL PAYLAŞIM BARI */}
      <div className="hidden xl:flex flex-col gap-4 fixed left-10 top-1/2 -translate-y-1/2 z-40 bg-white p-3 rounded-full shadow-2xl border border-gray-100">
          <a href={`https://api.whatsapp.com/send?text=${paylasimMesaji}`} target="_blank" className="text-[#25D366] hover:scale-125 transition-transform"><FaIcons.FaWhatsapp size={24} /></a>
          <a href={`https://twitter.com/intent/tweet?text=${paylasimMesaji}`} target="_blank" className="text-black hover:scale-125 transition-transform"><FaIcons.FaTwitter size={24} /></a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`} target="_blank" className="text-[#1877F2] hover:scale-125 transition-transform"><FaIcons.FaFacebookF size={24} /></a>
          <button onClick={linkiKopyala} className="text-red-600 hover:scale-125 transition-transform"><FaIcons.FaLink size={24} /></button>
          {kopyalandi && <span className="absolute -top-10 left-0 bg-black text-white text-[8px] px-2 py-1 rounded-sm animate-bounce">KOPYALANDI</span>}
      </div>

      {/* ÜST BİLGİ BARI */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 sticky top-0 z-50 shadow-sm font-black italic uppercase text-[11px]">
        <div className="container mx-auto max-w-[1150px] flex justify-between items-center">
           <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:text-red-600 transition-colors uppercase">
             <FaIcons.FaChevronLeft /> ANA SAYFAYA DÖN
           </button>
           <span className="hidden md:block text-gray-400 uppercase">HABERPİK / {haber.kategori} / {haber.baslik.slice(0, 30)}...</span>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-4xl mt-8">
        {/* METADATA BÖLÜMÜ */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="bg-red-600 text-white px-4 py-1 text-[11px] font-black uppercase italic skew-x-[-10deg]">{haber.kategori}</span>
          <span className="text-[11px] font-black text-gray-400 italic flex items-center gap-1 uppercase"><FaIcons.FaCalendarAlt/> {new Date(haber.tarih?.seconds * 1000).toLocaleDateString('tr-TR')}</span>
          <span className="text-[11px] font-black text-gray-400 italic flex items-center gap-1 uppercase border-l pl-3"><FaIcons.FaEye/> {haber.okunma || 0} OKUNMA</span>
          <span className="text-[11px] font-black text-red-600 italic flex items-center gap-1 uppercase border-l pl-3"><FaIcons.FaComments/> {yorumlar.length} YORUM</span>
          <span className="text-[11px] font-black text-blue-600 italic flex items-center gap-1 uppercase border-l pl-3">
            <FaIcons.FaStopwatch/> {okumaSuresi} DAKİKALIK OKUMA
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black leading-[1.1] uppercase mb-8 tracking-tighter italic text-[#111]">{haber.baslik}</h1>
        <p className="text-xl md:text-2xl font-bold text-gray-600 border-l-8 border-red-600 pl-6 mb-10 italic bg-white py-6 shadow-sm leading-relaxed">{haber.ozet}</p>

        <div className="relative w-full aspect-video rounded-sm overflow-hidden mb-10 shadow-2xl group border-4 border-white">
          <img src={haber.resim} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt="haber" />
          <div className="absolute top-4 right-4 bg-black/60 text-white p-2 backdrop-blur-md rounded-full"><FaIcons.FaCamera size={14}/></div>
        </div>

        {/* HABER İÇERİĞİ */}
        <article 
          className="haber-metni prose prose-red max-w-none text-[#222] leading-relaxed text-lg md:text-xl font-medium mb-12 bg-white p-6 md:p-10 shadow-sm border border-gray-100 italic"
          dangerouslySetInnerHTML={{ __html: haber.icerik || "İçerik yüklenemedi." }}
        />

        {/* KANKA: EMOJI TEPKİ BARI BURADA MÜHÜRLENDİ */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl mb-10 flex flex-col items-center">
            <p className="text-[10px] font-black italic uppercase text-gray-400 mb-4 tracking-[0.2em]">BU HABER SİZE NE HİSSETTİRDİ?</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                {[
                    { key: 'beğen', emoji: '👍', label: 'HARİKA' },
                    { key: 'sev', emoji: '😍', label: 'SEVDİM' },
                    { key: 'şaşır', emoji: '😮', label: 'OHA' },
                    { key: 'üzül', emoji: '😢', label: 'ÜZÜCÜ' },
                    { key: 'kız', emoji: '😡', label: 'KIZDIM' }
                ].map((t) => (
                    <button 
                        key={t.key} 
                        onClick={() => tepkiVer(t.key)}
                        disabled={verilenTepki !== null}
                        className={`flex flex-col items-center gap-1 transition-all transform hover:scale-125 ${verilenTepki === t.key ? 'scale-125 grayscale-0' : (verilenTepki ? 'grayscale opacity-50' : '')}`}
                    >
                        <span className="text-3xl md:text-4xl drop-shadow-md">{t.emoji}</span>
                        <span className="text-[8px] font-black text-gray-500 italic uppercase">{haber.tepkiler?.[t.key] || 0} {t.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* KANKA: YAZAR KARTINI BURAYA DİKTİK */}
        <div className="bg-[#111] text-white p-6 rounded-2xl flex items-center gap-6 mb-20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 duration-700"></div>
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center font-black italic text-2xl border-4 border-white/10 shrink-0">
            {haber.yazar?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-red-500 text-[10px] font-black italic uppercase tracking-widest mb-1">EDİTÖR / YAZAR</p>
            <h4 className="text-xl font-black italic uppercase tracking-tighter">{haber.yazar || 'HABERPİK EDİTÖR'}</h4>
            <p className="text-gray-400 text-[11px] font-bold italic uppercase mt-1">Bu içerik Haberpik medya ekibi tarafından mühürlenmiştir.</p>
          </div>
        </div>

        {/* YORUM BÖLÜMÜ */}
        <section className="mt-20 border-t-8 border-red-600 pt-10">
           <h3 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">HABERE <span className="text-red-600">YORUM</span> YAPIN</h3>
           <form onSubmit={yorumGonder} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-12">
              <div className="grid grid-cols-1 gap-4">
                 <input 
                    required 
                    className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic outline-red-600 uppercase text-xs" 
                    placeholder="ADINIZ SOYADINIZ" 
                    value={yeniYorum.isim} 
                    onChange={(e)=>setYeniYorum({...yeniYorum, isim: e.target.value})}
                 />
                 <textarea 
                    required 
                    className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic outline-red-600 h-32 text-xs" 
                    placeholder="YORUMUNUZU BURAYA YAZINIZ..." 
                    value={yeniYorum.mesaj} 
                    onChange={(e)=>setYeniYorum({...yeniYorum, mesaj: e.target.value})}
                 />
                 <button 
                    disabled={yorumYukleniyor} 
                    className="bg-red-600 text-white font-black italic uppercase py-4 rounded-xl hover:bg-black transition-all shadow-lg shadow-red-600/20"
                 >
                    {yorumYukleniyor ? "GÖNDERİLİYOR..." : "YORUMU YAYINLA"}
                 </button>
              </div>
           </form>

           <div className="space-y-6">
              <h4 className="text-xl font-black italic uppercase border-b pb-4 mb-6 text-gray-800">OKUYUCU YORUMLARI ({yorumlar.length})</h4>
              {yorumlar.length > 0 ? yorumlar.map((y) => (
                <div key={y.id} className="bg-white p-6 rounded-2xl border-l-8 border-red-600 shadow-sm animate-in slide-in-from-left duration-500">
                    <div className="flex justify-between items-center mb-3">
                       <span className="font-black italic uppercase text-red-600 text-sm">{y.isim}</span>
                       <span className="text-[10px] font-black text-gray-400 uppercase italic">
                          {new Date(y.tarih?.seconds * 1000).toLocaleDateString('tr-TR')}
                       </span>
                    </div>
                    <p className="text-gray-700 font-bold italic text-sm leading-relaxed">{y.mesaj}</p>
                </div>
              )) : (
                <p className="text-center font-black italic text-gray-400 uppercase tracking-widest py-10">HENÜZ YORUM YAPILMAMIŞ.</p>
              )}
           </div>
        </section>

        {/* BENZER HABERLER */}
        <section className="mt-20 border-t-4 border-black pt-10 pb-20">
           <h3 className="text-2xl font-black italic uppercase mb-8 tracking-tighter border-l-4 border-red-600 pl-4">İLGİNİZİ ÇEKEBİLİR</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {benzerHaberler.map(bh => (
                <Link href={`/haber/${bh.id}`} key={bh.id} className="group flex flex-col gap-2">
                   <div className="aspect-video overflow-hidden border border-gray-200">
                      <img src={bh.resim} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="haber" />
                   </div>
                   <h4 className="text-xs font-black uppercase italic leading-tight group-hover:text-red-600 transition-colors line-clamp-2">{bh.baslik}</h4>
                </Link>
              ))}
           </div>
        </section>
      </main>

      <style jsx global>{`
        .haber-metni p { margin-bottom: 2rem; }
        .haber-metni strong { font-weight: 900; color: #000; }
        .haber-metni h2, .haber-metni h3 { 
          font-weight: 900; 
          text-transform: uppercase; 
          font-style: italic; 
          margin-top: 2.5rem; 
          margin-bottom: 1.5rem; 
          color: #dc2626; 
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }
        .haber-metni ul, .haber-metni ol { margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc; font-style: italic; font-weight: bold; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}