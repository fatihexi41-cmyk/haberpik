"use client";
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from "@/lib/firebase"; 
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import * as FaIcons from 'react-icons/fa';
import { Line } from 'react-chartjs-2'; 
import 'chart.js/auto';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; 

export default function AdminPremiumV2() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]); 
  const [mansetler, setMansetler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ toplamHaber: 0, toplamOkunma: 0 });
  const [iletisimMesajlari, setIletisimMesajlari] = useState<any[]>([]); // Gelen kutusu için
  const [gazeteler, setGazeteler] = useState([]);
  const [puanDurumu, setPuanDurumu] = useState([]);
  const [fikstur, setFikstur] = useState([]);
  const [havaDurumu, setHavaDurumu] = useState(null);
  const [namazVakitleri, setNamazVakitleri] = useState(null);
  const [filmler, setFilmler] = useState([]);
  const [etkinlikler, setEtkinlikler] = useState([]);
  const [kurlar, setKurlar] = useState(null);
  const [solReklam, setSolReklam] = useState("");
  const [sagReklam, setSagReklam] = useState("");
// siteAyarlari state'inin içine şunları da ekle:
// facebook: '', twitter: '', instagram: '', youtube: '', kunyeMetni: '', yayinIlkeleri: '', gizlilikSozlesmesi: ''

  // KANKA: İstediğin Onay TV tarzı detaylı ayar yapısı burası
  const [siteAyarlari, setSiteAyarlari] = useState<any>({
    siteBasligi: 'Haberpik - Güvenilir Bilgi',
    siteKisaBasligi: 'Haberpik',
    siteAciklaması: '',
    siteAnahtarKelimeler: '',
    altbilgiMetni: '',
    copyrightMetni: 'Copyright 2026 © Tüm Hakları Saklıdır.',
    logoUrl: '',
    faviconUrl: '',
    anaRenk: '#ff0000',
    whatsapp: '',
    reklam1: '',
    reklam2: '',
    solReklam: '', // KANKA: Sol dikine reklam buraya
    sagReklam: '', // KANKA: Sağ dikine reklam buraya
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    kunyeMetni: '',
    yayinIlkeleri: '',
    gizlilikSozlesmesi: ''
  });

  const [formData, setFormData] = useState<any>({
    baslik: '', ozet: '', icerik: '', resim: '', 
    kategoriler: [], // Kanka burayı 'any' yaparak TS'yi susturduk
    mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false,
    anahtarKelimeler: '', metaAciklama: '', yazar: 'Admin', durum: 'aktif',
    icerikResimleri: []
  });

const [ekstraResimUrl, setEkstraResimUrl] = useState(''); // Input için geçici kutu

  const [gazeteForm, setGazeteForm] = useState({ ad: '', resim: '' });
  const [dikeyVideoForm, setDikeyVideoForm] = useState({ baslik: '', videoUrl: '', kapakResmi: '' });

useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, (u) => {
    if (!u) {
      // KANKA: Eğer kullanıcı yoksa direkt login'e şutla
      window.location.href = "/login"; 
      return;
    }
      setUser(u);
      if (u) {
        // 1. Haberler
        onSnapshot(query(collection(db, "haberler"), orderBy("tarih", "desc")), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setHaberler(list);
          const okunma = list.reduce((acc, curr: any) => acc + (curr.okunma || 0), 0);
          setStats({ toplamHaber: list.length, toplamOkunma: okunma });
        });

        // 2. Yorumlar
        onSnapshot(query(collection(db, "yorumlar"), orderBy("tarih", "desc")), (snap) => {
          setYorumlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Elle Girilen Manşetler (Slayt)
        onSnapshot(query(collection(db, "mansetler"), orderBy("tarih", "desc")), (snap) => {
          setMansetler(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

// 4. BOTUN GETİRDİĞİ GAZETE MANŞETLERİ
onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Yeni tanımladığımız state'lere veriyi basıyoruz
    setGazeteler(data.gazeteMansetleri || []);
    setPuanDurumu(data.lig_durumu || []);
    setFikstur(data.super_lig_fikstur || []);
    console.log("✅ Admin Paneli Bot Verileriyle Güncellendi!");
  }
});

        // 5. Videolar ve Mesajlar
        onSnapshot(query(collection(db, "dikey_videolar"), orderBy("tarih", "desc")), (snap) => {
          setDikeyVideolar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        onSnapshot(query(collection(db, "iletisim_mesajlari"), orderBy("tarih", "desc")), (snap) => {
          setIletisimMesajlari(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
          if (docSnap.exists()) setSiteAyarlari(prev => ({ ...prev, ...docSnap.data() }));
        });
      }
    });
    return () => unsubAuth();
  }, []);

const haberKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const slugOlustur = (metin: string) => {
      return metin.toLowerCase().trim()
        .replace(/ /g, '-').replace(/ı/g, 'i').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
    };

    // KANKA KONUM: Burası çok kritik. Ana sayfanın tanıdığı isimleri buraya mühürlüyoruz.
    // KANKA KONUM: Çoklu kategori ve Slider/Sütun ayrımı için mühürleme burası
    const mühürlüVeri = { 
  ...formData, 
  // KANKA: Hem dizi hem tekil alanı BÜYÜK HARF yapıyoruz
  kategoriler: formData.kategoriler.map((k: string) => k.toUpperCase().trim()),
  kategori: formData.kategoriler?.[0]?.toUpperCase().trim() || 'GÜNDEM', 
  kategori_slug: slugOlustur(formData.kategoriler?.[0] || 'gundem'),
  manset: formData.mansetEkle || false, 
  slider: formData.sliderEkle || false,
  guncellemeTarihi: new Date() 
};

    try {
      if (editingId) {
        await updateDoc(doc(db, "haberler", editingId), mühürlüVeri);
        alert("Güncellendi ve mühürlendi kanka! 💎");
      } else {
        await addDoc(collection(db, "haberler"), { 
          ...mühürlüVeri, 
          tarih: new Date(), 
          okunma: 0 
        });
        alert("Yayında ve mühürlü kanka! 🚀");
      }
      
      // Formu temizle ve listeye dön
      setEditingId(null);
      setFormData({ baslik: '', ozet: '', icerik: '', resim: '', kategori: 'GÜNDEM', mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false, anahtarKelimeler: '', metaAciklama: '', yazar: 'Admin', durum: 'aktif',icerikResimleri: [] });
      setTab('haber-listesi');
    } catch (err) { 
      console.error(err);
      alert("Hata oluştu kanka!"); 
    } finally {
      setLoading(false);
    }
  }; // İŞTE O MEŞHUR PARANTEZ BURADA KAPANMALI!

  const gazeteKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addDoc(collection(db, "mansetler"), { ...gazeteForm, tarih: new Date() });
    setGazeteForm({ ad: '', resim: '' });
    setLoading(false);
    alert("Manşet Mühürlendi! 📰");
  };

  const dikeyVideoKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "dikey_videolar"), { ...dikeyVideoForm, tarih: new Date() });
      setDikeyVideoForm({ baslik: '', videoUrl: '', kapakResmi: '' });
      alert("Dikey Video Mühürlendi! 📱");
    } catch (err) { alert("Video eklenemedi!"); }
    setLoading(false);
  };

  const mesajSil = async (id: string) => {
    if(confirm("Mesajı çöpe atalım mı kanka? 🗑️")) {
      await deleteDoc(doc(db, "iletisim_mesajlari", id));
      alert("Mesaj imha edildi! 🔥");
    }
  };

  if (!user) return (
  <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-black italic uppercase">
    <div className="animate-spin mb-4 text-red-600 text-4xl"><FaIcons.FaSpinner /></div>
    Giriş Yetkisi Kontrol Ediliyor kanka...
  </div>
);

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-sans fixed inset-0 z-[9999] overflow-hidden text-black">
      <aside className="w-72 bg-[#1a1c1e] text-white flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5"><h1 className="text-2xl font-black italic uppercase text-center text-red-600">HABERPİK</h1></div>
        <nav className="flex-1 p-4 space-y-2 mt-4 text-[11px] font-black italic uppercase">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'dashboard' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaChartLine/> Analiz</button>
          <button onClick={() => {setTab('haber-ekle'); setEditingId(null);}} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'haber-ekle' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaPlusSquare/> {editingId ? 'Düzenle' : 'Ekle'}</button>
          <button onClick={() => setTab('haber-listesi')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'haber-listesi' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaListUl/> Yönet</button>
          <button onClick={() => setTab('dikey-video')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'dikey-video' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaPlayCircle/> Dikey Video</button>
          <button onClick={() => setTab('yorum-yonetimi')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'yorum-yonetimi' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaComments/> Yorumlar</button>
          <button onClick={() => setTab('gazete-mansetleri')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'gazete-mansetleri' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaNewspaper/> Gazeteler</button>
          <button onClick={() => setTab('mesajlar')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'mesajlar' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaInbox/> Gelen Kutusu</button>
          <button onClick={() => setTab('site-ayarlari')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'site-ayarlari' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaTools/> Ayarlar</button>
          <button onClick={() => setTab('lig-merkezi')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'lig-merkezi' ? 'bg-green-600' : 'text-gray-400 hover:bg-white/5'}`}>
  <FaIcons.FaFutbol/> Lig Merkezi
</button>
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={() => signOut(auth)} className="w-full text-red-500 font-black italic uppercase text-[10px] flex items-center justify-center gap-2"><FaIcons.FaSignOutAlt/> Çıkış</button></div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto h-screen bg-gray-50">
        {tab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm"><p className="text-gray-400 text-[10px] font-black mb-1">Toplam Haber</p><h3 className="text-3xl font-black italic">{stats.toplamHaber}</h3></div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm"><p className="text-gray-400 text-[10px] font-black mb-1">Toplam Okunma</p><h3 className="text-3xl font-black italic text-red-600">{stats.toplamOkunma}</h3></div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm"><p className="text-gray-400 text-[10px] font-black mb-1">Dikey Video</p><h3 className="text-3xl font-black italic text-purple-600">{dikeyVideolar.length}</h3></div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm"><p className="text-gray-400 text-[10px] font-black mb-1">Gazeteler</p><h3 className="text-3xl font-black italic text-green-600">{mansetler.length}</h3></div>
           </div>
        )}

        {tab === 'haber-ekle' && (
          <form onSubmit={haberKaydet} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
            {/* SOL KOLON: BAŞLIK, ÖZET, İÇERİK */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic outline-red-600 text-lg uppercase" placeholder="Başlık" value={formData.baslik} onChange={(e)=>setFormData({...formData, baslik: e.target.value})} />
                <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl italic h-24 text-sm font-bold" placeholder="Spot (Özet)" value={formData.ozet} onChange={(e)=>setFormData({...formData, ozet: e.target.value})} />
                <textarea required className="w-full p-6 bg-gray-50 border-none rounded-2xl italic min-h-[500px] text-lg font-medium" placeholder="İçerik..." value={formData.icerik} onChange={(e)=>setFormData({...formData, icerik: e.target.value})} />
              </div>

              {/* SEO AYARLARI */}
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4 font-black italic uppercase">
                <h4 className="text-xs border-b pb-2 flex items-center gap-2 text-blue-600"><FaIcons.FaSearch/> Google SEO</h4>
                <input className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px]" placeholder="ANAHTAR KELİMELER" value={formData.anahtarKelimeler} onChange={(e)=>setFormData({...formData, anahtarKelimeler: e.target.value})} />
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px] h-20" placeholder="META AÇIKLAMA" value={formData.metaAciklama} onChange={(e)=>setFormData({...formData, metaAciklama: e.target.value})} />
              </div>
            </div>

            {/* SAĞ KOLON: AYARLAR VE KATEGORİLER */}
            <div className="lg:col-span-4 space-y-6 font-black italic uppercase">
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
                <h4 className="border-b pb-4 text-xs">Ayarlar</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  {['mansetEkle', 'sliderEkle', 'sonDakika', 'trendEkle'].map((key) => (
                    <div key={key} onClick={() => setFormData({...formData, [key]: !(formData as any)[key]})} className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${(formData as any)[key] ? 'border-red-600 bg-red-50 text-red-600 shadow-sm' : 'bg-gray-50 text-gray-400'}`}>
                       {key.replace('Ekle', '').toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* HABER İÇİ RESİMLER (ZATEN VARDI) */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 mt-4 border border-dashed border-gray-300 uppercase italic">
                  <label className="text-[10px] font-black text-gray-500 uppercase italic">HABER İÇİ RESİMLER (URL)</label>
                  <div className="flex gap-2">
                    <input className="flex-1 p-3 bg-white border rounded-lg text-xs font-bold" placeholder="Ekstra Resim URL..." value={ekstraResimUrl} onChange={(e) => setEkstraResimUrl(e.target.value)} />
                    <button type="button" onClick={() => { if(ekstraResimUrl) { setFormData({...formData, icerikResimleri: [...(formData.icerikResimleri || []), ekstraResimUrl]}); setEkstraResimUrl(''); } }} className="bg-blue-600 text-white px-4 rounded-lg text-[10px] font-black">EKLE</button>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {formData.icerikResimleri?.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img src={url} className="w-12 h-12 object-cover rounded-lg border shadow-sm" alt="icerik" />
                        <button type="button" onClick={() => { const yeniDizi = formData.icerikResimleri?.filter((_:any, i:number) => i !== index); setFormData({...formData, icerikResimleri: yeniDizi}); }} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">X</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KANKA: İŞTE O YENİ ÇOKLU KATEGORİ BÖLÜMÜ */}
                <div className="space-y-3 pt-4 border-t border-dashed">
                  <h4 className="text-[10px] text-red-600 font-black italic flex items-center gap-2">
                    <FaIcons.FaTags/> KATEGORİLER (ÇOKLU SEÇİM)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {[
  "GÜNDEM", "SPOR", "YEREL SPOR", "SİYASET", "ASAYİŞ", "EKONOMİ", 
  "TÜRKİYE HABERLERİ", "DÜNYA", "BİLİM TEKNOLOJİ", "KÜLTÜR SANAT", 
  "EĞİTİM", "SAĞLIK", "EMLAK", "OTOMOBİL", "MAGAZİN", "HAYATIN İÇİNDEN"
].map((k: string) => {
  
  // KANKA: BURASI KRİTİK! Botun getirdiği 'kategoriler' dizisinde bu kategori var mı diye bakıyoruz.
  // Eğer dizi yoksa (eski haber), tekil 'kategori' alanına bakıyoruz.
  const seciliMi = formData.kategoriler?.includes(k) || formData.kategori === k;
  
  return (
    <div key={k} onClick={() => {
        const yeniListe = seciliMi 
          ? (formData.kategoriler || []).filter((item: string) => item !== k) 
          : [...(formData.kategoriler || []), k];
        
        // KANKA: Tıkladığında hem diziyi hem de ilk seçileni tekil kategori alanına mühürlüyoruz
        setFormData({
          ...formData, 
          kategoriler: yeniListe,
          kategori: yeniListe[0] || '' // İlk seçileni ana kategori yap
        });
      }}
      className={`p-3 rounded-lg border-2 text-[10px] text-center cursor-pointer transition-all font-black italic uppercase
        ${seciliMi ? 'border-red-600 bg-red-600 text-white shadow-md scale-[0.98]' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}
    >
      {k}
    </div>
  );
})}
                  </div>
                </div>

                {/* ANA GÖRSEL VE YAYINLA BUTONU */}
                <div className="space-y-4 pt-4 border-t">
                  <input className="w-full p-4 bg-gray-50 border-none rounded-xl text-xs font-bold" placeholder="ANA GÖRSEL URL" value={formData.resim} onChange={(e)=>setFormData({...formData, resim: e.target.value})} />
                  <button disabled={loading} type="submit" className="w-full bg-red-600 text-white py-6 rounded-2xl shadow-xl hover:bg-black transition-all font-black italic uppercase">
                    {loading ? "BEKLE..." : editingId ? "GÜNCELLE" : "YAYINLA"}
                  </button>
                </div>

              </div>
            </div>
          </form>
        )}

        {tab === 'dikey-video' && (
           <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-2xl font-black italic uppercase">
                 <h3 className="text-xl mb-6 text-purple-600 font-black italic uppercase">Dikey Video Ekle (Reels)</h3>
                 
                 <form onSubmit={dikeyVideoKaydet} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 ml-2 uppercase font-black italic">VİDEO DOSYASI YÜKLE (MP4)</label>
                     <input 
  type="file" 
  accept="video/mp4"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const label = e.target.parentElement?.querySelector('label');
    if(label) label.innerText = "YÜKLENİYOR... %0 ⏳";

    try {
      const storageRef = ref(storage, `reels/${Date.now()}-${file.name}`);
      const metadata = { contentType: 'video/mp4', cacheControl: 'public,max-age=3600' };
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if(label) label.innerText = `YÜKLENİYOR... %${progress} 🔥`;
        }, 
        (error: any) => {
          console.error("YÜKLEME HATASI:", error);
          alert("HATA: " + error.code + "\nMesaj: " + error.message);
          if(label) label.innerText = "HATA OLUŞTU ❌";
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setDikeyVideoForm({...dikeyVideoForm, videoUrl: url});
          if(label) label.innerText = "VİDEO BAŞARIYLA YÜKLENDİ ✅";
          alert("Video dükkana indi kanka! 🚀");
        }
      );
    } catch (err: any) {
      alert("Sistem patladı: " + err.message);
    }
  }}
  className="w-full p-4 bg-purple-50 text-purple-600 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer text-[10px] font-black italic uppercase" 
/>
                    </div>

                    <input required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic uppercase" placeholder="VİDEO BAŞLIĞI" value={dikeyVideoForm.baslik} onChange={(e)=>setDikeyVideoForm({...dikeyVideoForm, baslik: e.target.value})} />
                    <input className="w-full p-4 bg-gray-50 border-none rounded-xl text-[10px] font-bold italic" placeholder="VİDEO URL (OTOMATİK DOLAR)" value={dikeyVideoForm.videoUrl} readOnly />
                    <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" placeholder="KAPAK RESMİ URL" value={dikeyVideoForm.kapakResmi} onChange={(e)=>setDikeyVideoForm({...dikeyVideoForm, kapakResmi: e.target.value})} />
                    
                    <button disabled={loading} className="bg-purple-600 text-white w-full py-4 rounded-xl hover:bg-black transition-all font-black italic uppercase">
                      {loading ? "MÜHÜRLENİYOR..." : "VİDEOYU SİSTEME MÜHÜRLE"}
                    </button>
                 </form>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                 {dikeyVideolar.map((v) => (
                   <div key={v.id} className="bg-white p-2 rounded-2xl border relative group aspect-[9/16] overflow-hidden shadow-sm">
                      <img src={v.kapakResmi} className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                         <p className="text-white text-[10px] font-black italic uppercase line-clamp-2">{v.baslik}</p>
                      </div>
                      <button onClick={async () => await deleteDoc(doc(db, "dikey_videolar", v.id))} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><FaIcons.FaTrashAlt/></button>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {tab === 'gazete-mansetleri' && (
           <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-2xl font-black italic uppercase">
                 <h3 className="text-xl mb-6 text-red-600">Gazete Manşeti Ekle</h3>
                 <form onSubmit={gazeteKaydet} className="space-y-4">
                    <input className="w-full p-4 bg-gray-50 border-none rounded-xl" placeholder="GAZETE ADI" value={gazeteForm.ad} onChange={(e)=>setGazeteForm({...gazeteForm, ad: e.target.value})} />
                    <input className="w-full p-4 bg-gray-50 border-none rounded-xl" placeholder="RESİM URL" value={gazeteForm.resim} onChange={(e)=>setGazeteForm({...gazeteForm, resim: e.target.value})} />
                    <button className="bg-black text-white w-full py-4 rounded-xl hover:bg-red-600 transition-all">MANŞETİ EKLE</button>
                 </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {mansetler.map((m) => (
                   <div key={m.id} className="bg-white p-4 rounded-2xl border relative group">
                      <img src={m.resim} className="w-full aspect-[3/4] object-cover rounded-xl" />
                      <button onClick={async () => await deleteDoc(doc(db, "mansetler", m.id))} className="absolute top-6 right-6 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><FaIcons.FaTrashAlt/></button>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* KANKA: İSTEDİĞİN DETAYLI AYARLAR PANELİ BURADA */}
{tab === 'site-ayarlari' && (
          <div className="max-w-6xl bg-white p-8 rounded-3xl border shadow-sm font-black italic uppercase text-black space-y-10 pb-24">
              <h3 className="text-2xl border-b pb-4 flex items-center gap-2 text-red-600 uppercase italic"><FaIcons.FaCogs/> Site Yönetim Merkezi</h3>
              
              <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await setDoc(doc(db, "ayarlar", "genel"), siteAyarlari); alert("Tüm Ayarlar Mühürlendi! 🚀 ✅"); setLoading(false); }} className="grid grid-cols-1 md:grid-cols-12 gap-10">
                
                {/* SOL KOLON: GENEL & SOSYAL MEDYA */}
                <div className="md:col-span-7 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] text-gray-400 font-black">Site Başlığı (SEO)</label><input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.siteBasligi} onChange={(e)=>setSiteAyarlari({...siteAyarlari, siteBasligi: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[10px] text-gray-400 font-black">Site Kısa Adı</label><input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.siteKisaBasligi} onChange={(e)=>setSiteAyarlari({...siteAyarlari, siteKisaBasligi: e.target.value})} /></div>
                    </div>

                    <div className="space-y-1"><label className="text-[10px] text-gray-400 font-black">Site Açıklaması (Meta Description)</label><textarea className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic h-20" value={siteAyarlari.siteAciklaması} onChange={(e)=>setSiteAyarlari({...siteAyarlari, siteAciklaması: e.target.value})} /></div>

                    {/* SOSYAL MEDYA PANELİ */}
                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs text-blue-600 border-b pb-2 flex items-center gap-2"><FaIcons.FaShareAlt/> Sosyal Medya Linkleri</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border"><FaIcons.FaFacebook className="text-blue-700"/><input className="flex-1 bg-transparent text-[10px] outline-none normal-case font-bold" placeholder="Facebook Link" value={siteAyarlari.facebook || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, facebook: e.target.value})} /></div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border"><FaIcons.FaInstagram className="text-pink-600"/><input className="flex-1 bg-transparent text-[10px] outline-none normal-case font-bold" placeholder="Instagram Link" value={siteAyarlari.instagram || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, instagram: e.target.value})} /></div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border"><FaIcons.FaTwitter className="text-sky-500"/><input className="flex-1 bg-transparent text-[10px] outline-none normal-case font-bold" placeholder="Twitter Link" value={siteAyarlari.twitter || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, twitter: e.target.value})} /></div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border"><FaIcons.FaYoutube className="text-red-600"/><input className="flex-1 bg-transparent text-[10px] outline-none normal-case font-bold" placeholder="Youtube Link" value={siteAyarlari.youtube || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, youtube: e.target.value})} /></div>
                      </div>
                    </div>

                    {/* KANKA: DİKİNE REKLAM YÖNETİM PANELİ */}
<div className="bg-red-50 p-6 rounded-2xl space-y-6 border border-red-100">
  <h4 className="text-xs text-red-600 border-b border-red-200 pb-2 flex items-center gap-2">
    <FaIcons.FaAd/> Dikine Reklam Ayarları (160x600)
  </h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    {/* SOL REKLAM AYARLARI */}
    <div className="space-y-3 p-3 bg-white/50 rounded-xl border border-red-50">
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 font-black">SOL REKLAM GÖRSEL (URL)</label>
        <input 
          className="w-full p-3 bg-white border rounded-xl font-bold text-[10px] normal-case" 
          placeholder="https://... resim linki" 
          value={siteAyarlari.solReklam || ''} 
          onChange={(e)=>setSiteAyarlari({...siteAyarlari, solReklam: e.target.value})} 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-red-600 font-black">SOL REKLAM TIKLAMA LİNKİ</label>
        <input 
          className="w-full p-3 bg-white border-red-200 border-2 rounded-xl font-bold text-[10px] normal-case" 
          placeholder="url ekle" 
          value={siteAyarlari.solReklamUrl || ''} 
          onChange={(e)=>setSiteAyarlari({...siteAyarlari, solReklamUrl: e.target.value})} 
        />
      </div>
    </div>

    {/* SAĞ REKLAM AYARLARI */}
    <div className="space-y-3 p-3 bg-white/50 rounded-xl border border-red-50">
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 font-black">SAĞ REKLAM GÖRSEL (URL)</label>
        <input 
          className="w-full p-3 bg-white border rounded-xl font-bold text-[10px] normal-case" 
          placeholder="https://... resim linki" 
          value={siteAyarlari.sagReklam || ''} 
          onChange={(e)=>setSiteAyarlari({...siteAyarlari, sagReklam: e.target.value})} 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-red-600 font-black">SAĞ REKLAM TIKLAMA LİNKİ</label>
        <input 
          className="w-full p-3 bg-white border-red-200 border-2 rounded-xl font-bold text-[10px] normal-case" 
          placeholder="url ekle" 
          value={siteAyarlari.sagReklamUrl || ''} 
          onChange={(e)=>setSiteAyarlari({...siteAyarlari, sagReklamUrl: e.target.value})} 
        />
      </div>
    </div>

  </div>
  <p className="text-[9px] text-red-400 font-bold italic">NOT: Görsel URL'sini boş bırakırsan alan kapanır, Tıklama Linkini boş bırakırsan reklam sadece resim olarak kalır kanka!</p>
</div>

{/* KANKA: BURASI YENİ REKLAM SLİDER YÖNETİM ALANI */}
<div className="bg-blue-50 p-6 rounded-2xl space-y-4 border border-blue-100 mt-6">
  <h4 className="text-xs text-blue-600 border-b border-blue-200 pb-2 flex items-center gap-2 uppercase font-black italic">
    <FaIcons.FaAd/> Ana Sayfa Slider Reklamlar (Linkli & Hareketli)
  </h4>
  
  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
    <div className="md:col-span-5">
      <label className="text-[9px] text-gray-400 font-black ml-1 uppercase">REKLAM GÖRSEL URL</label>
      <input id="newResim" className="w-full p-3 bg-white border rounded-xl text-[10px] font-bold" placeholder="https://... resim linki" />
    </div>
    <div className="md:col-span-5">
      <label className="text-[9px] text-gray-400 font-black ml-1 uppercase">TIKLANINCA GİDİLECEK LİNK</label>
      <input id="newLink" className="w-full p-3 bg-white border rounded-xl text-[10px] font-bold" placeholder="https://... hedef site" />
    </div>
    <div className="md:col-span-2 flex items-end">
      <button 
        type="button"
        onClick={() => {
          const resim = (document.getElementById('newResim') as HTMLInputElement).value;
          const link = (document.getElementById('newLink') as HTMLInputElement).value;
          if(resim && link) {
            setSiteAyarlari({
              ...siteAyarlari, 
              anaSayfaReklamlar: [...(siteAyarlari.anaSayfaReklamlar || []), { resim, link }]
            });
            (document.getElementById('newResim') as HTMLInputElement).value = '';
            (document.getElementById('newLink') as HTMLInputElement).value = '';
            alert("Reklam listeye eklendi kanka! 'Tümünü Mühürle' demeyi unutma. 🚀");
          }
        }}
        className="w-full bg-blue-600 text-white font-black text-[10px] h-[42px] rounded-xl hover:bg-black transition-all uppercase italic"
      >
        LİSTEYE EKLE
      </button>
    </div>
  </div>

  {/* Ekli Reklamları Listeleme ve Silme */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
    {siteAyarlari.anaSayfaReklamlar?.map((rek: any, i: number) => (
      <div key={i} className="group relative bg-white p-2 border rounded-xl shadow-sm hover:border-red-500 transition-all overflow-hidden">
        <img src={rek.resim} className="h-16 w-full object-cover rounded-lg mb-1" />
        <div className="text-[8px] font-bold text-gray-400 truncate uppercase italic">{rek.link}</div>
        <button 
          type="button"
          onClick={() => {
            const yeniList = siteAyarlari.anaSayfaReklamlar.filter((_: any, index: number) => index !== i);
            setSiteAyarlari({...siteAyarlari, anaSayfaReklamlar: yeniList});
          }}
          className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <FaIcons.FaTrashAlt size={10}/>
        </button>
      </div>
    ))}
  </div>
  <p className="text-[9px] text-blue-400 font-bold italic uppercase tracking-tighter">* Listeye ekledikten sonra en alttaki 'TÜMÜNÜ MÜHÜRLE' butonuna basman lazım kanka!</p>
</div>

                    {/* KURUMSAL METİNLER */}
                    <div className="space-y-4 pt-4 border-t">
                       <div className="space-y-1"><label className="text-[10px] text-red-600 font-black">KÜNYE METNİ</label><textarea className="w-full p-4 bg-gray-50 rounded-xl h-24 text-[11px] normal-case font-medium border" value={siteAyarlari.kunyeMetni || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, kunyeMetni: e.target.value})} /></div>
                       <div className="space-y-1"><label className="text-[10px] text-red-600 font-black">YAYIN İLKELERİ</label><textarea className="w-full p-4 bg-gray-50 rounded-xl h-24 text-[11px] normal-case font-medium border" value={siteAyarlari.yayinIlkeleri || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, yayinIlkeleri: e.target.value})} /></div>
                       <div className="space-y-1"><label className="text-[10px] text-red-600 font-black">GİZLİLİK SÖZLEŞMESİ</label><textarea className="w-full p-4 bg-gray-50 rounded-xl h-24 text-[11px] normal-case font-medium border" value={siteAyarlari.gizlilikSozlesmesi || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, gizlilikSozlesmesi: e.target.value})} /></div>
                       <div className="space-y-1"><label className="text-[10px] text-red-600 font-black">KULLANIM ŞARTLARI</label><textarea className="w-full p-4 bg-gray-50 rounded-xl h-24 text-[11px] normal-case font-medium border" value={(siteAyarlari as any).kullanimSartlari || ''} onChange={(e)=>setSiteAyarlari({...siteAyarlari, kullanimSartlari: e.target.value} as any)} /></div>
                    </div>
                </div>

                {/* SAĞ KOLON: LOGO, RENK & FOOTER */}
                <div className="md:col-span-5 space-y-6">
                    <div className="space-y-2"><label className="text-[10px] text-gray-400 font-black">LOGO URL</label><div className="flex gap-2"><input className="flex-1 p-4 bg-gray-50 rounded-xl font-bold italic text-[10px]" value={siteAyarlari.logoUrl} onChange={(e)=>setSiteAyarlari({...siteAyarlari, logoUrl: e.target.value})} />{siteAyarlari.logoUrl && <img src={siteAyarlari.logoUrl} className="h-12 w-12 object-contain bg-gray-100 rounded-xl border" />}</div></div>
                    <div className="space-y-2"><label className="text-[10px] text-gray-400 font-black">FAVICON URL</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold text-[10px]" value={siteAyarlari.faviconUrl} onChange={(e)=>setSiteAyarlari({...siteAyarlari, faviconUrl: e.target.value})} /></div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-[10px] text-gray-400 font-black">TEMA ANA RENGİ</label><div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border"><input type="color" className="w-10 h-10 border-none bg-transparent cursor-pointer" value={siteAyarlari.anaRenk} onChange={(e)=>setSiteAyarlari({...siteAyarlari, anaRenk: e.target.value})} /><span className="text-[10px]">{siteAyarlari.anaRenk}</span></div></div>
                      <div className="space-y-2"><label className="text-[10px] text-gray-400 font-black">WHATSAPP İHBAR</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold italic" value={siteAyarlari.whatsapp} onChange={(e)=>setSiteAyarlari({...siteAyarlari, whatsapp: e.target.value})} /></div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                       <label className="text-[10px] text-gray-400 font-black">ALT BİLGİ (FOOTER) METNİ</label>
                       <input className="w-full p-4 bg-gray-50 rounded-xl font-bold italic" value={siteAyarlari.altbilgiMetni} onChange={(e)=>setSiteAyarlari({...siteAyarlari, altbilgiMetni: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-400 font-black">COPYRIGHT METNİ</label>
                       <input className="w-full p-4 bg-gray-50 rounded-xl font-bold italic" value={siteAyarlari.copyrightMetni} onChange={(e)=>setSiteAyarlari({...siteAyarlari, copyrightMetni: e.target.value})} />
                    </div>

                    <button disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-2xl hover:bg-black transition-all font-black uppercase italic shadow-xl flex items-center justify-center gap-4 text-lg">
                      {loading ? <FaIcons.FaSpinner className="animate-spin" /> : <><FaIcons.FaSave/> TÜMÜNÜ MÜHÜRLE</>}
                    </button>
                </div>
              </form>
          </div>
        )}

        {tab === 'haber-listesi' && (
  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-bold uppercase italic text-black">
    <table className="w-full text-left">
      <thead className="bg-[#111] text-white">
        <tr>
          <th className="p-5">Görsel</th>
          <th className="p-5">Başlık</th>
          <th className="p-5 text-right">İşlem</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {haberler.map(h => (
          <tr key={h.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-5">
              {h.resim ? (
                <img src={h.resim} className="w-14 h-10 object-cover rounded shadow-sm border" alt="haber" />
              ) : (
                <div className="w-14 h-10 bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 rounded border border-dashed">YOK</div>
              )}
            </td>
            <td className="p-5 truncate max-w-md font-bold">{h.baslik}</td>
            <td className="p-5 text-right flex justify-end gap-2 text-lg">
              {/* KANKA: İŞTE O KRİTİK DÜZENLEME BURADA! */}
              <button  
                onClick={() => {
                  setEditingId(h.id); 
                  // KANKA: Haberin içindeki kategoriler dizisini formData'ya tam uyumlu paslıyoruz
                  const haberVerisi = {
                    ...h,
                    kategoriler: Array.isArray(h.kategoriler) ? h.kategoriler : (h.kategori ? [h.kategori] : []),
                    icerikResimleri: h.icerikResimleri || []
                  };
                  setFormData(haberVerisi as any); 
                  setTab('haber-ekle');
                }}
        className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-all"
      >
        <FaIcons.FaEdit/>
      </button>
              
              <button 
                onClick={() => {
                  if(confirm("Bu haberi mühürden silelim mi kanka?")) {
                    deleteDoc(doc(db, "haberler", h.id));
                  }
                }} 
                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
              >
                <FaIcons.FaTrashAlt/>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {haberler.length === 0 && (
      <div className="p-10 text-center text-gray-400 italic">Henüz haber yok kanka, botu sal gelsinler! 🚀</div>
    )}
  </div>
)}

        {tab === 'yorum-yonetimi' && (
           <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-bold italic uppercase">
             <table className="w-full text-left">
               <thead className="bg-[#111] text-white"><tr><th className="p-5">Yorumcu</th><th className="p-5">Mesaj</th><th className="p-5 text-right">İşlem</th></tr></thead>
               <tbody className="divide-y divide-gray-100">
                 {yorumlar.map(y => (
                   <tr key={y.id} className="hover:bg-gray-50 transition-all font-bold">
                     <td className="p-5 text-red-600">{y.isim}</td><td className="p-5 truncate max-w-xs">{y.mesaj}</td>
                     <td className="p-5 text-right"><button onClick={async () => await deleteDoc(doc(db, "yorumlar", y.id))} className="text-red-500 p-2"><FaIcons.FaTrashAlt/></button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {tab === 'mesajlar' && (
           <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-[11px] font-black italic uppercase text-black">
             <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg text-red-600 italic">📩 Gelen İletişim Mesajları</h3>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px]">{iletisimMesajlari.length} MESAJ</span>
             </div>
             <table className="w-full text-left">
               <thead className="bg-[#111] text-white">
                 <tr>
                   <th className="p-5">Gönderen / Tarih</th>
                   <th className="p-5">İletişim Bilgisi</th>
                   <th className="p-5">Konu / Mesaj</th>
                   <th className="p-5 text-right">İşlem</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {iletisimMesajlari.map((m: any) => (
                   <tr key={m.id} className="hover:bg-gray-50 transition-all">
                     <td className="p-5 font-bold">
                        <div className="text-red-600">{m.adSoyad}</div>
                        <div className="text-gray-400 text-[9px]">{m.tarih?.toDate ? m.tarih.toDate().toLocaleString() : 'Yeni'}</div>
                     </td>
                     <td className="p-5 italic text-[10px]">
                        <div>📧 {m.email}</div>
                        <div>📱 {m.telefon || 'Yok'}</div>
                     </td>
                     <td className="p-5">
                        <div className="text-blue-600 mb-1">{m.konu}</div>
                        <div className="normal-case font-medium text-gray-700 line-clamp-2 max-w-xs">{m.mesaj}</div>
                     </td>
                     <td className="p-5 text-right">
                        <button onClick={() => mesajSil(m.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-all text-lg"><FaIcons.FaTrashAlt/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {iletisimMesajlari.length === 0 && <div className="p-10 text-center text-gray-400 italic">Henüz ihbar veya mesaj yok kanka! 😎</div>}
           </div>
        )}
       
        {/* KANKA: TAM BURAYA YAPIŞTIR */}
        {tab === 'lig-merkezi' && (
          <div className="space-y-8 font-black italic uppercase text-black">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border-l-8 border-green-600">
              <div>
                <h3 className="text-2xl font-black italic">LİG VERİ MERKEZİ</h3>
                <p className="text-[10px] text-gray-400 font-bold">Bot tarafından Firebase'e mühürlenen canlı veriler</p>
              </div>
              <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full text-xs animate-pulse font-black">
                BOT SİSTEMİ AKTİF
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* PUAN DURUMU */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-[#111] p-4 text-white text-xs flex items-center gap-2 font-black">
                  <FaIcons.FaListOl className="text-green-500"/> PUAN DURUMU (GÜNCEL)
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-[10px] font-bold">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b">
                        <th className="p-3 text-center w-8">#</th>
                        <th className="p-3">TAKIM</th>
                        <th className="p-3 text-center">O</th>
                        <th className="p-3 text-center">G</th>
                        <th className="p-3 text-center text-red-600">P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {puanDurumu.map((takim: any, i: number) => (
                        <tr key={i} className={takim.team.name.includes('Kocaeli') ? 'bg-green-50' : ''}>
                          <td className="p-3 text-center font-bold text-gray-400 border-r">{i + 1}</td>
                          <td className="p-3 font-black text-[11px]">{takim.team.name}</td>
                          <td className="p-3 text-center">{takim.played}</td>
                          <td className="p-3 text-center text-green-600">{takim.won}</td>
                          <td className="p-3 text-center font-black text-white bg-red-600">{takim.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FİKSTÜR */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-[#111] p-4 text-white text-xs flex items-center gap-2 font-black">
                  <FaIcons.FaCalendarAlt className="text-blue-500"/> KOCAELİSPOR MAÇ TAKVİMİ
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y">
                  {fikstur.map((mac: any, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-gray-400 font-black tracking-widest">{mac.time}</span>
                        <div className="flex items-center gap-2 text-[11px] font-black italic">
                          <span className={mac.home.includes('Kocaeli') ? 'text-green-600' : 'text-gray-800'}>{mac.home}</span>
                          <span className="text-red-600 text-[8px] bg-gray-100 px-1 rounded">VS</span>
                          <span className={mac.away.includes('Kocaeli') ? 'text-green-600' : 'text-gray-800'}>{mac.away}</span>
                        </div>
                      </div>
                      <div className="bg-green-600 text-white px-3 py-1 rounded text-[8px] font-black italic">MAÇ GÜNÜ</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}