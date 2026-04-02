"use client";
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from "@/lib/firebase"; // KANKA: storage buraya eklendi
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import * as FaIcons from 'react-icons/fa';
import { Line } from 'react-chartjs-2'; 
import 'chart.js/auto';
// KANKA: Video yükleme fonksiyonlarını buraya mühürledik
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 

export default function AdminPremiumV2() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]); 
  const [mansetler, setMansetler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]); // KANKA: Dikey videolar için state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ toplamHaber: 0, toplamOkunma: 0 });

  const [siteAyarlari, setSiteAyarlari] = useState({
    siteAdi: 'HABERPİK', logoUrl: '', whatsapp: '', footerMetin: '', reklam1: '', reklam2: ''
  });

  const [formData, setFormData] = useState({
    baslik: '', ozet: '', icerik: '', resim: '', kategori: 'GÜNDEM',
    mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false,
    anahtarKelimeler: '', metaAciklama: '', yazar: 'Admin', durum: 'aktif'
  });

  const [gazeteForm, setGazeteForm] = useState({ ad: '', resim: '' });
  const [dikeyVideoForm, setDikeyVideoForm] = useState({ baslik: '', videoUrl: '', kapakResmi: '' }); // KANKA: Dikey video formu

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(query(collection(db, "haberler"), orderBy("tarih", "desc")), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setHaberler(list);
          const okunma = list.reduce((acc, curr: any) => acc + (curr.okunma || 0), 0);
          setStats({ toplamHaber: list.length, toplamOkunma: okunma });
        });
        onSnapshot(query(collection(db, "yorumlar"), orderBy("tarih", "desc")), (snap) => {
          setYorumlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        onSnapshot(query(collection(db, "mansetler"), orderBy("tarih", "desc")), (snap) => {
          setMansetler(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        // KANKA: Dikey videoları anlık dinliyoruz
        onSnapshot(query(collection(db, "dikey_videolar"), orderBy("tarih", "desc")), (snap) => {
          setDikeyVideolar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
          if (docSnap.exists()) setSiteAyarlari(docSnap.data() as any);
        });
      }
    });
    return () => unsubAuth();
  }, []);

  const haberKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "haberler", editingId), { ...formData, guncellemeTarihi: new Date() });
        alert("Güncellendi kanka! 💎");
      } else {
        await addDoc(collection(db, "haberler"), { ...formData, tarih: new Date(), okunma: 0 });
        alert("Yayında kanka! 🚀");
      }
      setEditingId(null);
      setFormData({ baslik: '', ozet: '', icerik: '', resim: '', kategori: 'GÜNDEM', mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false, anahtarKelimeler: '', metaAciklama: '', yazar: 'Admin', durum: 'aktif' });
      setTab('haber-listesi');
    } catch (err) { alert("Hata!"); }
    setLoading(false);
  };

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

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-black italic uppercase">Bağlanılıyor...</div>;

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
          <button onClick={() => setTab('site-ayarlari')} className={`w-full flex items-center gap-4 p-4 rounded-xl ${tab === 'site-ayarlari' ? 'bg-red-600' : 'text-gray-400 hover:bg-white/5'}`}><FaIcons.FaTools/> Ayarlar</button>
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
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic outline-red-600 text-lg uppercase" placeholder="Başlık" value={formData.baslik} onChange={(e)=>setFormData({...formData, baslik: e.target.value})} />
                <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl italic h-24 text-sm font-bold" placeholder="Spot (Özet)" value={formData.ozet} onChange={(e)=>setFormData({...formData, ozet: e.target.value})} />
                <textarea required className="w-full p-6 bg-gray-50 border-none rounded-2xl italic min-h-[500px] text-lg font-medium" placeholder="İçerik..." value={formData.icerik} onChange={(e)=>setFormData({...formData, icerik: e.target.value})} />
              </div>
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4 font-black italic uppercase">
                <h4 className="text-xs border-b pb-2 flex items-center gap-2 text-blue-600"><FaIcons.FaSearch/> Google SEO</h4>
                <input className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px]" placeholder="ANAHTAR KELİMELER" value={formData.anahtarKelimeler} onChange={(e)=>setFormData({...formData, anahtarKelimeler: e.target.value})} />
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px] h-20" placeholder="META AÇIKLAMA" value={formData.metaAciklama} onChange={(e)=>setFormData({...formData, metaAciklama: e.target.value})} />
              </div>
            </div>
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
                <select className="w-full p-4 bg-[#111] text-white rounded-xl text-xs outline-none cursor-pointer" value={formData.kategori} onChange={(e)=>setFormData({...formData, kategori: e.target.value})}>
                  {[
                    "GÜNDEM", "SPOR", "SİYASET", "ASAYİŞ", "EKONOMİ", 
                    "TÜRKİYE HABERLERİ", "DÜNYA", "BİLİM TEKNOLOJİ", 
                    "KÜLTÜR SANAT", "EĞİTİM", "SAĞLIK", "EMLAK", 
                    "OTOMOBİL", "MAGAZİN", "HAYATIN İÇİNDEN", 
                    "VIDEO GALERI", "FOTO GALERİ"
                  ].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input className="w-full p-4 bg-gray-50 border-none rounded-xl text-xs font-bold" placeholder="Görsel URL" value={formData.resim} onChange={(e)=>setFormData({...formData, resim: e.target.value})} />
                <button disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-2xl shadow-xl hover:bg-black transition-all">
                  {loading ? "BEKLE..." : editingId ? "GÜNCELLE" : "YAYINLA"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* KANKA: DİKEY VİDEO YÖNETİM SEKİSİ (VİDEO YÜKLEME MÜHÜRLENDİ) */}
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
      // KANKA: Firebase Storage fonksiyonlarını jilet gibi buraya dikiyoruz
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
      const storage = getStorage();
      
      const storageRef = ref(storage, `reels/${Date.now()}-${file.name}`);
      
      // KANKA: En önemli kısım burası; metadata ekleyerek tarayıcıya güven veriyoruz
      const metadata = {
        contentType: 'video/mp4',
        cacheControl: 'public,max-age=3600',
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if(label) label.innerText = `YÜKLENİYOR... %${progress} 🔥`;
        }, 
        (error: any) => {
          console.error("YÜKLEME HATASI:", error);
          // KANKA: Hata gelirse bize tam sebebini söyleyecek
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

        {tab === 'site-ayarlari' && (
          <div className="max-w-4xl bg-white p-8 rounded-2xl border shadow-sm font-black italic uppercase">
             <h3 className="text-xl mb-8 border-b pb-4 flex items-center gap-2 text-red-600"><FaIcons.FaCogs/> Site Yönetimi</h3>
             <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await setDoc(doc(db, "ayarlar", "genel"), siteAyarlari); alert("Ayarlar Mühürlendi!"); setLoading(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <label className="text-[10px] text-gray-400">Site Adı</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.siteAdi} onChange={(e)=>setSiteAyarlari({...siteAyarlari, siteAdi: e.target.value})} />
                   <label className="text-[10px] text-gray-400">Logo URL</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.logoUrl} onChange={(e)=>setSiteAyarlari({...siteAyarlari, logoUrl: e.target.value})} />
                   <label className="text-[10px] text-gray-400">WhatsApp</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.whatsapp} onChange={(e)=>setSiteAyarlari({...siteAyarlari, whatsapp: e.target.value})} />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] text-gray-400">Reklam 1</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.reklam1} onChange={(e)=>setSiteAyarlari({...siteAyarlari, reklam1: e.target.value})} />
                   <label className="text-[10px] text-gray-400">Reklam 2</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.reklam2} onChange={(e)=>setSiteAyarlari({...siteAyarlari, reklam2: e.target.value})} />
                   <label className="text-[10px] text-gray-400">Footer Metni</label>
                   <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" value={siteAyarlari.footerMetin} onChange={(e)=>setSiteAyarlari({...siteAyarlari, footerMetin: e.target.value})} />
                </div>
                <button disabled={loading} className="md:col-span-2 bg-black text-white py-6 rounded-2xl hover:bg-red-600 transition-all font-black uppercase italic shadow-xl">
                  {loading ? "İŞLENİYOR..." : "AYARLARI MÜHÜRLE"}
                </button>
             </form>
          </div>
        )}

        {tab === 'haber-listesi' && (
           <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-bold uppercase italic">
             <table className="w-full text-left">
               <thead className="bg-[#111] text-white"><tr><th className="p-5">Görsel</th><th className="p-5">Başlık</th><th className="p-5 text-right">İşlem</th></tr></thead>
               <tbody className="divide-y divide-gray-100">
                 {haberler.map(h => (
                   <tr key={h.id} className="hover:bg-gray-50">
                     <td className="p-5">{h.resim ? <img src={h.resim} className="w-14 h-10 object-cover rounded shadow-sm" /> : <div className="w-14 h-10 bg-gray-100 flex items-center justify-center">YOK</div>}</td>
                     <td className="p-5 truncate max-w-md">{h.baslik}</td>
                     <td className="p-5 text-right flex justify-end gap-2 text-lg">
                       <button onClick={() => {setEditingId(h.id); setFormData({...h} as any); setTab('haber-ekle');}} className="text-blue-500 p-2"><FaIcons.FaEdit/></button>
                       <button onClick={() => deleteDoc(doc(db, "haberler", h.id))} className="text-red-500 p-2"><FaIcons.FaTrashAlt/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
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
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}