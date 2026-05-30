"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, storage } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy,
  limit, updateDoc, getDoc, setDoc, onSnapshot, serverTimestamp, increment
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import * as FaIcons from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// ─── TİPTAP EDİTÖR ───────────────────────────────────────────────────────────
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

// TipTap Toolbar
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const ekleResim = () => {
    const url = window.prompt('Resim URL girin:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const ekleLink = () => {
    const url = window.prompt('Link URL girin:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const butonClass = (aktif: boolean) =>
    `p-2 rounded text-xs font-black transition-all ${aktif ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;

  return (
    <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border-b border-gray-200 rounded-t-xl sticky top-0 z-10">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={butonClass(editor.isActive('bold'))} title="Kalın">
        <FaIcons.FaBold />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={butonClass(editor.isActive('italic'))} title="İtalik">
        <FaIcons.FaItalic />
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={butonClass(editor.isActive('heading', { level: 2 }))} title="Başlık 2">
        <FaIcons.FaHeading />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={butonClass(editor.isActive('heading', { level: 3 }))} title="Başlık 3">
        <span className="text-[10px] font-black">H3</span>
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={butonClass(editor.isActive('bulletList'))} title="Madde Listesi">
        <FaIcons.FaListUl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={butonClass(editor.isActive('orderedList'))} title="Numaralı Liste">
        <FaIcons.FaListOl />
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={butonClass(editor.isActive('blockquote'))} title="Alıntı">
        <FaIcons.FaQuoteLeft />
      </button>
      <button type="button" onClick={ekleLink} className={butonClass(editor.isActive('link'))} title="Link Ekle">
        <FaIcons.FaLink />
      </button>
      <button type="button" onClick={ekleResim} className={butonClass(false)} title="Resim Ekle">
        <FaIcons.FaImage />
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={butonClass(false)} title="Geri Al">
        <FaIcons.FaUndo />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={butonClass(false)} title="Yeniden Yap">
        <FaIcons.FaRedo />
      </button>
      <div className="w-px bg-gray-300 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className="p-2 rounded text-[9px] font-black bg-gray-100 text-gray-500 hover:bg-gray-200" title="Paragraf Temizle">
        Temizle
      </button>
    </div>
  );
}

// TipTap CSS — globals.css'e taşıyabilirsin ama inline da çalışır
const editorStyle = `
  .tiptap-editor .ProseMirror {
    min-height: 400px;
    padding: 1.5rem;
    outline: none;
    font-size: 1rem;
    line-height: 1.8;
    color: #1a1a1a;
  }
  .tiptap-editor .ProseMirror p { margin-bottom: 1rem; }
  .tiptap-editor .ProseMirror h2 { font-size: 1.5rem; font-weight: 900; margin: 1.5rem 0 0.75rem; color: #dc2626; text-transform: uppercase; font-style: italic; }
  .tiptap-editor .ProseMirror h3 { font-size: 1.25rem; font-weight: 900; margin: 1.25rem 0 0.5rem; color: #111; }
  .tiptap-editor .ProseMirror strong { font-weight: 900; }
  .tiptap-editor .ProseMirror em { font-style: italic; }
  .tiptap-editor .ProseMirror ul { list-style: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
  .tiptap-editor .ProseMirror ol { list-style: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
  .tiptap-editor .ProseMirror li { margin-bottom: 0.25rem; }
  .tiptap-editor .ProseMirror blockquote { border-left: 4px solid #dc2626; padding-left: 1rem; margin: 1rem 0; color: #555; font-style: italic; }
  .tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
  .tiptap-editor .ProseMirror a { color: #dc2626; text-decoration: underline; }
  .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before { color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
`;

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ mesaj: string; tip: 'basari' | 'hata' | 'bilgi' } | null>(null);
  const goster = (mesaj: string, tip: 'basari' | 'hata' | 'bilgi' = 'basari') => {
    setToast({ mesaj, tip });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, goster };
}

function Toast({ toast }: { toast: any }) {
  if (!toast) return null;
  const renkler = { basari: 'bg-green-600', hata: 'bg-red-600', bilgi: 'bg-blue-600' };
  return (
    <div className={`fixed bottom-8 right-8 z-[99999] ${renkler[toast.tip]} text-white px-6 py-4 rounded-xl shadow-2xl font-black italic uppercase text-sm flex items-center gap-3`}>
      {toast.tip === 'basari' ? <FaIcons.FaCheck /> : toast.tip === 'hata' ? <FaIcons.FaTimes /> : <FaIcons.FaInfo />}
      {toast.mesaj}
    </div>
  );
}

// ─── ONAY MODAL ───────────────────────────────────────────────────────────────
function OnayModal({ mesaj, onEvet, onHayir }: { mesaj: string; onEvet: () => void; onHayir: () => void }) {
  return (
    <div className="fixed inset-0 z-[99998] bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 font-black italic uppercase">
        <p className="text-gray-800 text-sm mb-6">{mesaj}</p>
        <div className="flex gap-3">
          <button onClick={onEvet} className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-black transition-all">EVET, SİL</button>
          <button onClick={onHayir} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all">İPTAL</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPremiumV2() {
  const { toast, goster } = useToast();
  const [onayModal, setOnayModal] = useState<{ mesaj: string; onEvet: () => void } | null>(null);
  const onayIste = (mesaj: string, onEvet: () => void) => setOnayModal({ mesaj, onEvet });
  const onayKapat = () => setOnayModal(null);

  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [haberler, setHaberler] = useState<any[]>([]);
  const [yorumlar, setYorumlar] = useState<any[]>([]);
  const [mansetler, setMansetler] = useState<any[]>([]);
  const [dikeyVideolar, setDikeyVideolar] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ toplamHaber: 0, toplamOkunma: 0 });
  const [iletisimMesajlari, setIletisimMesajlari] = useState<any[]>([]);
  const [gazeteler, setGazeteler] = useState<any[]>([]);
  const [puanDurumu, setPuanDurumu] = useState<any[]>([]);
  const [fikstur, setFikstur] = useState<any[]>([]);
  const [ekstraResimUrl, setEkstraResimUrl] = useState('');

  const [siteAyarlari, setSiteAyarlari] = useState<any>({
    siteBasligi: 'HABERPİK', siteKisaBasligi: 'HABERPİK',
    siteAciklamasi: '', siteAnahtarKelimeler: '',
    altbilgiMetni: '', copyrightMetni: 'Copyright 2026 © Tüm Hakları Saklıdır.',
    logoUrl: '', faviconUrl: '', anaRenk: '#dc2626',
    whatsapp: '0532 449 03 81',
    solReklam: '', solReklamUrl: '', sagReklam: '', sagReklamUrl: '',
    facebook: '', twitter: '', instagram: '', youtube: '',
    kunyeMetni: '', yayinIlkeleri: '', gizlilik: '', kullanimSartlari: '',
    anaSayfaReklamlar: [],
  });

  const [formData, setFormData] = useState<any>({
    baslik: '', ozet: '', icerik: '', resim: '',
    kategoriler: [], kategori: '',
    mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false,
    seo_kelimeler: '', meta_aciklama: '', yazar: 'Admin', durum: 'aktif',
    icerikResimleri: [],
  });

  const [gazeteForm, setGazeteForm] = useState({ ad: '', resim: '' });
  const [dikeyVideoForm, setDikeyVideoForm] = useState({ baslik: '', videoUrl: '', kapakResmi: '' });
  const [videoYuklemeEtiketi, setVideoYuklemeEtiketi] = useState('VİDEO DOSYASI YÜKLE (MP4)');

  // ─── TİPTAP EDITOR KURULUMU ───────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Haber içeriğini buraya yazın... Paragraflar, başlıklar, listeler ekleyebilirsiniz.' }),
    ],
    content: formData.icerik || '',
    onUpdate: ({ editor }) => {
      setFormData((prev: any) => ({ ...prev, icerik: editor.getHTML() }));
    },
    editorProps: {
      attributes: { class: 'tiptap-content' },
    },
  });

  // Düzenleme modunda editörü doldur
  useEffect(() => {
    if (editor && formData.icerik !== editor.getHTML()) {
      editor.commands.setContent(formData.icerik || '');
    }
  }, [editingId]); // eslint-disable-line

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) { window.location.href = "/login"; return; }
      setUser(u);

      onSnapshot(query(collection(db, "haberler"), orderBy("tarih", "desc")), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHaberler(list);
        setStats({ toplamHaber: list.length, toplamOkunma: list.reduce((acc, curr: any) => acc + (curr.okunma || 0), 0) });
      });
      onSnapshot(query(collection(db, "yorumlar"), orderBy("tarih", "desc")), (snap) => {
        setYorumlar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      onSnapshot(query(collection(db, "mansetler"), orderBy("tarih", "desc")), (snap) => {
        setMansetler(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      onSnapshot(doc(db, "ayarlar", "hizmetler"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGazeteler(data.gazeteMansetleri || []);
          setPuanDurumu(data.lig_durumu || data.puanDurumu || []);
          setFikstur(data.super_lig_fikstur || data.fikstur || []);
        }
      });
      onSnapshot(query(collection(db, "dikey_videolar"), orderBy("tarih", "desc")), (snap) => {
        setDikeyVideolar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      onSnapshot(query(collection(db, "iletisim_mesajlari"), orderBy("tarih", "desc")), (snap) => {
        setIletisimMesajlari(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      getDoc(doc(db, "ayarlar", "genel")).then(docSnap => {
        if (docSnap.exists()) setSiteAyarlari((prev: any) => ({ ...prev, ...docSnap.data() }));
      });
    });
    return () => unsubAuth();
  }, []);

  // ─── HABER KAYDET ─────────────────────────────────────────────────────────
  const haberKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slugOlustur = (metin: string) =>
      metin.toLowerCase().trim()
        .replace(/ /g, '-').replace(/ı/g, 'i').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');

    const kategoriler = Array.isArray(formData.kategoriler) && formData.kategoriler.length > 0
      ? formData.kategoriler.map((k: string) => k.toUpperCase().trim())
      : [formData.kategori?.toUpperCase().trim()].filter(Boolean);

    // Editörden HTML al
    const icerikHTML = editor ? editor.getHTML() : formData.icerik;

    const muhurluVeri = {
      ...formData,
      icerik: icerikHTML,
      kategoriler,
      kategori: kategoriler[0] || 'GÜNDEM',
      kategori_slug: slugOlustur(kategoriler[0] || 'gundem'),
      mansetEkle: formData.mansetEkle || false,
      slider: formData.sliderEkle || false,
      guncellemeTarihi: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "haberler", editingId), muhurluVeri);
        goster('Haber güncellendi! ✅');
      } else {
        await addDoc(collection(db, "haberler"), { ...muhurluVeri, tarih: serverTimestamp(), okunma: 0 });
        goster('Haber yayınlandı! 🚀');
      }
      setEditingId(null);
      const bosForm = { baslik: '', ozet: '', icerik: '', resim: '', kategoriler: [], kategori: '', mansetEkle: false, sliderEkle: false, sonDakika: false, trendEkle: false, seo_kelimeler: '', meta_aciklama: '', yazar: 'Admin', durum: 'aktif', icerikResimleri: [] };
      setFormData(bosForm);
      editor?.commands.clearContent();
      setTab('haber-listesi');
    } catch (err) {
      console.error(err);
      goster('Hata oluştu!', 'hata');
    } finally {
      setLoading(false);
    }
  };

  const gazeteKaydet = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const docRef = doc(db, "ayarlar", "hizmetler");
      const docSnap = await getDoc(docRef);
      const guncelListe = docSnap.exists() ? (docSnap.data().gazeteMansetleri || []) : [];
      await updateDoc(docRef, { gazeteMansetleri: [{ ad: gazeteForm.ad, img: gazeteForm.resim, tarih: new Date().toISOString() }, ...guncelListe] });
      setGazeteForm({ ad: '', resim: '' });
      goster('Gazete manşeti eklendi! 📰');
    } catch { goster('Hata oluştu!', 'hata'); }
    setLoading(false);
  };

  const gazeteSil = async (index: number) => {
    onayIste('Bu manşeti listeden silelim mi?', async () => {
      onayKapat(); setLoading(true);
      try {
        const docRef = doc(db, "ayarlar", "hizmetler");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await updateDoc(docRef, { gazeteMansetleri: (docSnap.data().gazeteMansetleri || []).filter((_: any, i: number) => i !== index) });
          goster('Manşet silindi!');
        }
      } catch { goster('Silme hatası!', 'hata'); }
      setLoading(false);
    });
  };

  const dikeyVideoKaydet = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "dikey_videolar"), { ...dikeyVideoForm, tarih: serverTimestamp() });
      setDikeyVideoForm({ baslik: '', videoUrl: '', kapakResmi: '' });
      setVideoYuklemeEtiketi('VİDEO DOSYASI YÜKLE (MP4)');
      goster('Dikey video eklendi! 📱');
    } catch { goster('Video eklenemedi!', 'hata'); }
    setLoading(false);
  };

  const mesajSil = (id: string) => onayIste('Mesajı silelim mi?', async () => { onayKapat(); await deleteDoc(doc(db, "iletisim_mesajlari", id)); goster('Mesaj silindi!'); });
  const haberSil = (id: string) => onayIste('Bu haberi silelim mi?', async () => { onayKapat(); await deleteDoc(doc(db, "haberler", id)); goster('Haber silindi!'); });
  const yorumOnayla = async (id: string) => { await updateDoc(doc(db, "yorumlar", id), { onayli: true }); goster('Yorum onaylandı! ✅'); };
  const yorumSil = (id: string) => onayIste('Yorumu silelim mi?', async () => { onayKapat(); await deleteDoc(doc(db, "yorumlar", id)); goster('Yorum silindi!'); });

  if (!user) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-black italic uppercase">
      <div className="animate-spin mb-4 text-red-600 text-4xl"><FaIcons.FaSpinner /></div>
      Giriş Yetkisi Kontrol Ediliyor...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-sans fixed inset-0 z-[9999] overflow-hidden text-black">
      {/* TipTap CSS */}
      <style dangerouslySetInnerHTML={{ __html: editorStyle }} />
      <Toast toast={toast} />
      {onayModal && <OnayModal mesaj={onayModal.mesaj} onEvet={onayModal.onEvet} onHayir={onayKapat} />}

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1a1c1e] text-white flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-2xl font-black italic uppercase text-center text-red-600">HABERPİK</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 text-[11px] font-black italic uppercase">
          {[
            { key: 'dashboard', ikon: <FaIcons.FaChartLine />, label: 'Analiz' },
            { key: 'haber-ekle', ikon: <FaIcons.FaPlusSquare />, label: editingId ? 'Düzenle' : 'Haber Ekle' },
            { key: 'haber-listesi', ikon: <FaIcons.FaListUl />, label: 'Haber Yönet' },
            { key: 'dikey-video', ikon: <FaIcons.FaPlayCircle />, label: 'Dikey Video' },
            { key: 'yorum-yonetimi', ikon: <FaIcons.FaComments />, label: `Yorumlar (${yorumlar.filter(y => !y.onayli).length} bekliyor)` },
            { key: 'gazete-mansetleri', ikon: <FaIcons.FaNewspaper />, label: 'Gazeteler' },
            { key: 'mesajlar', ikon: <FaIcons.FaInbox />, label: `Gelen Kutusu (${iletisimMesajlari.length})` },
            { key: 'site-ayarlari', ikon: <FaIcons.FaTools />, label: 'Ayarlar' },
            { key: 'lig-merkezi', ikon: <FaIcons.FaFutbol />, label: 'Lig Merkezi', renk: 'green' },
          ].map(({ key, ikon, label, renk }: any) => (
            <button key={key} onClick={() => { setTab(key); if (key === 'haber-ekle') setEditingId(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${tab === key ? (renk === 'green' ? 'bg-green-600' : 'bg-red-600') : 'text-gray-400 hover:bg-white/5'}`}>
              {ikon} {label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => signOut(auth)} className="w-full text-red-500 font-black italic uppercase text-[10px] flex items-center justify-center gap-2">
            <FaIcons.FaSignOutAlt /> Çıkış
          </button>
        </div>
      </aside>

      {/* ANA ALAN */}
      <main className="flex-1 p-10 overflow-y-auto h-screen bg-gray-50">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Toplam Haber', deger: stats.toplamHaber, renk: '' },
              { label: 'Toplam Okunma', deger: stats.toplamOkunma, renk: 'text-red-600' },
              { label: 'Dikey Video', deger: dikeyVideolar.length, renk: 'text-purple-600' },
              { label: 'Gazeteler', deger: gazeteler.length, renk: 'text-green-600' },
            ].map(({ label, deger, renk }) => (
              <div key={label} className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-gray-400 text-[10px] font-black mb-1">{label}</p>
                <h3 className={`text-3xl font-black italic ${renk}`}>{deger}</h3>
              </div>
            ))}
          </div>
        )}

        {/* HABER EKLE — TİPTAP EDİTÖR ENTEGRE EDİLDİ */}
        {tab === 'haber-ekle' && (
          <form onSubmit={haberKaydet} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4">
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic outline-red-600 text-lg uppercase" placeholder="Başlık" value={formData.baslik} onChange={(e) => setFormData({ ...formData, baslik: e.target.value })} />
                <textarea required className="w-full p-4 bg-gray-50 border-none rounded-xl italic h-24 text-sm font-bold" placeholder="Spot (Özet)" value={formData.ozet} onChange={(e) => setFormData({ ...formData, ozet: e.target.value })} />

                {/* ── TİPTAP EDİTÖR (textarea'nın yerini aldı) ── */}
                <div className="tiptap-editor border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-4 font-black italic uppercase">
                <h4 className="text-xs border-b pb-2 flex items-center gap-2 text-blue-600"><FaIcons.FaSearch /> Google SEO</h4>
                <input className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px]" placeholder="ANAHTAR KELİMELER" value={formData.seo_kelimeler || ""} onChange={(e) => setFormData({ ...formData, seo_kelimeler: e.target.value })} />
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-lg text-[10px] h-20" placeholder="META AÇIKLAMA" value={formData.meta_aciklama || ""} onChange={(e) => setFormData({ ...formData, meta_aciklama: e.target.value })} />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6 font-black italic uppercase">
              <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
                <h4 className="border-b pb-4 text-xs">Ayarlar</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  {['mansetEkle', 'sliderEkle', 'sonDakika', 'trendEkle'].map((key) => (
                    <div key={key} onClick={() => setFormData({ ...formData, [key]: !formData[key] })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${formData[key] ? 'border-red-600 bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                      {key.replace('Ekle', '').toUpperCase()}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-dashed border-gray-300">
                  <label className="text-[10px] font-black text-gray-500">HABER İÇİ RESİMLER</label>
                  <div className="flex gap-2">
                    <input className="flex-1 p-3 bg-white border rounded-lg text-xs font-bold" placeholder="Resim URL..." value={ekstraResimUrl} onChange={(e) => setEkstraResimUrl(e.target.value)} />
                    <button type="button" onClick={() => { if (ekstraResimUrl) { setFormData({ ...formData, icerikResimleri: [...(formData.icerikResimleri || []), ekstraResimUrl] }); setEkstraResimUrl(''); } }} className="bg-blue-600 text-white px-4 rounded-lg text-[10px] font-black">EKLE</button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {formData.icerikResimleri?.map((url: string, i: number) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-12 h-12 object-cover rounded-lg border" alt="icerik" />
                        <button type="button" onClick={() => setFormData({ ...formData, icerikResimleri: formData.icerikResimleri.filter((_: any, idx: number) => idx !== i) })} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">X</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-dashed">
                  <h4 className="text-[10px] text-red-600 font-black italic flex items-center gap-2"><FaIcons.FaTags /> KATEGORİLER</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {["GÜNDEM","SPOR","YEREL SPOR","SİYASET","ASAYİŞ","EKONOMİ","TÜRKİYE HABERLERİ","DÜNYA","BİLİM TEKNOLOJİ","KÜLTÜR SANAT","EĞİTİM","SAĞLIK","EMLAK","OTOMOBİL","MAGAZİN","HAYATIN İÇİNDEN"].map((k) => {
                      const secili = formData.kategoriler?.includes(k);
                      return (
                        <div key={k} onClick={() => {
                          const yeni = secili ? formData.kategoriler.filter((x: string) => x !== k) : [...(formData.kategoriler || []), k];
                          setFormData({ ...formData, kategoriler: yeni, kategori: yeni[0] || '' });
                        }} className={`p-3 rounded-lg border-2 text-[10px] text-center cursor-pointer font-black italic uppercase transition-all ${secili ? 'border-red-600 bg-red-600 text-white' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}>
                          {k}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <input className="w-full p-4 bg-gray-50 border-none rounded-xl text-xs font-bold" placeholder="ANA GÖRSEL URL" value={formData.resim} onChange={(e) => setFormData({ ...formData, resim: e.target.value })} />
                  <button disabled={loading} type="submit" className="w-full bg-red-600 text-white py-6 rounded-2xl shadow-xl hover:bg-black transition-all font-black italic uppercase">
                    {loading ? "KAYDEDİLİYOR..." : editingId ? "GÜNCELLE" : "YAYINLA"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* HABER LİSTESİ */}
        {tab === 'haber-listesi' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-bold uppercase italic text-black">
            <table className="w-full text-left">
              <thead className="bg-[#111] text-white">
                <tr><th className="p-5">Görsel</th><th className="p-5">Başlık</th><th className="p-5 text-right">İşlem</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {haberler.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="p-5">{h.resim ? <img src={h.resim} className="w-14 h-10 object-cover rounded shadow-sm border" alt={h.baslik} /> : <div className="w-14 h-10 bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 rounded border border-dashed">YOK</div>}</td>
                    <td className="p-5 truncate max-w-md font-bold">{h.baslik}</td>
                    <td className="p-5 text-right flex justify-end gap-2 text-lg">
                      <button onClick={() => {
                        setEditingId(h.id);
                        setFormData({ ...h, kategoriler: Array.isArray(h.kategoriler) ? h.kategoriler : (h.kategori ? [h.kategori] : []), icerikResimleri: h.icerikResimleri || [] });
                        // Editörü doldur
                        editor?.commands.setContent(h.icerik || '');
                        setTab('haber-ekle');
                      }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full"><FaIcons.FaEdit /></button>
                      <button onClick={() => haberSil(h.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><FaIcons.FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {haberler.length === 0 && <div className="p-10 text-center text-gray-400 italic">Henüz haber yok.</div>}
          </div>
        )}

        {/* YORUM YÖNETİMİ */}
        {tab === 'yorum-yonetimi' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-bold italic uppercase">
            <div className="p-4 bg-gray-50 border-b flex gap-4">
              <span className="text-gray-600 font-black">Toplam: {yorumlar.length}</span>
              <span className="text-orange-600 font-black">Bekleyen: {yorumlar.filter(y => !y.onayli).length}</span>
              <span className="text-green-600 font-black">Onaylı: {yorumlar.filter(y => y.onayli).length}</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-[#111] text-white"><tr><th className="p-4">Durum</th><th className="p-4">Yorumcu</th><th className="p-4">Mesaj</th><th className="p-4 text-right">İşlem</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {yorumlar.map(y => (
                  <tr key={y.id} className={`hover:bg-gray-50 ${!y.onayli ? 'bg-orange-50' : ''}`}>
                    <td className="p-4">{y.onayli ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[9px] font-black">ONAYLANDI</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[9px] font-black animate-pulse">BEKLİYOR</span>}</td>
                    <td className="p-4 text-red-600">{y.isim}</td>
                    <td className="p-4 truncate max-w-xs normal-case font-medium">{y.mesaj}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {!y.onayli && <button onClick={() => yorumOnayla(y.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-full"><FaIcons.FaCheck /></button>}
                      <button onClick={() => yorumSil(y.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><FaIcons.FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {yorumlar.length === 0 && <div className="p-10 text-center text-gray-400 italic">Henüz yorum yok.</div>}
          </div>
        )}

        {/* GAZETE MANŞETLERİ */}
        {tab === 'gazete-mansetleri' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-2xl font-black italic uppercase">
              <h3 className="text-xl mb-6 text-red-600">Gazete Manşeti Ekle</h3>
              <form onSubmit={gazeteKaydet} className="space-y-4">
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl" placeholder="GAZETE ADI" value={gazeteForm.ad} onChange={(e) => setGazeteForm({ ...gazeteForm, ad: e.target.value })} />
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl" placeholder="RESİM URL" value={gazeteForm.resim} onChange={(e) => setGazeteForm({ ...gazeteForm, resim: e.target.value })} />
                <button disabled={loading} className="bg-black text-white w-full py-4 rounded-xl hover:bg-red-600 transition-all">{loading ? 'EKLENİYOR...' : 'MANŞETİ EKLE'}</button>
              </form>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {gazeteler.map((m: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-2xl border relative group">
                  <img src={m.img} className="w-full aspect-[3/4] object-cover rounded-xl" alt={m.ad} />
                  <div className="mt-2 text-[10px] font-black italic">{m.ad}</div>
                  <button onClick={() => gazeteSil(index)} className="absolute top-6 right-6 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><FaIcons.FaTrashAlt /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DİKEY VİDEO */}
        {tab === 'dikey-video' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border shadow-sm max-w-2xl font-black italic uppercase">
              <h3 className="text-xl mb-6 text-purple-600">Dikey Video Ekle (Reels)</h3>
              <form onSubmit={dikeyVideoKaydet} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 ml-2">{videoYuklemeEtiketi}</label>
                  <input type="file" accept="video/mp4" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setVideoYuklemeEtiketi('YÜKLENİYOR... %0');
                    try {
                      const storageRef = ref(storage, `reels/${Date.now()}-${file.name}`);
                      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: 'video/mp4', cacheControl: 'public,max-age=3600' });
                      uploadTask.on('state_changed',
                        (snap) => setVideoYuklemeEtiketi(`YÜKLENİYOR... %${Math.round((snap.bytesTransferred / snap.totalBytes) * 100)}`),
                        (err) => { goster('Yükleme hatası: ' + err.code, 'hata'); setVideoYuklemeEtiketi('HATA OLUŞTU ❌'); },
                        async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setDikeyVideoForm(prev => ({ ...prev, videoUrl: url })); setVideoYuklemeEtiketi('VİDEO YÜKLENDİ ✅'); goster('Video yüklendi! 🚀'); }
                      );
                    } catch (err: any) { goster('Sistem hatası: ' + err.message, 'hata'); }
                  }} className="w-full p-4 bg-purple-50 text-purple-600 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer text-[10px] font-black italic uppercase" />
                </div>
                <input required className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic uppercase" placeholder="VİDEO BAŞLIĞI" value={dikeyVideoForm.baslik} onChange={(e) => setDikeyVideoForm({ ...dikeyVideoForm, baslik: e.target.value })} />
                <input className="w-full p-4 bg-gray-50 border-none rounded-xl text-[10px] font-bold italic" placeholder="VİDEO URL (OTOMATİK DOLAR)" value={dikeyVideoForm.videoUrl} readOnly />
                <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold italic" placeholder="KAPAK RESMİ URL" value={dikeyVideoForm.kapakResmi} onChange={(e) => setDikeyVideoForm({ ...dikeyVideoForm, kapakResmi: e.target.value })} />
                <button disabled={loading} className="bg-purple-600 text-white w-full py-4 rounded-xl hover:bg-black transition-all font-black italic uppercase">{loading ? 'KAYDEDİLİYOR...' : 'VİDEOYU KAYDET'}</button>
              </form>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {dikeyVideolar.map((v) => (
                <div key={v.id} className="bg-white p-2 rounded-2xl border relative group aspect-[9/16] overflow-hidden shadow-sm">
                  <img src={v.kapakResmi} className="w-full h-full object-cover rounded-xl" alt={v.baslik} />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4"><p className="text-white text-[10px] font-black italic uppercase line-clamp-2">{v.baslik}</p></div>
                  <button onClick={() => onayIste('Bu videoyu silelim mi?', async () => { onayKapat(); await deleteDoc(doc(db, "dikey_videolar", v.id)); goster('Video silindi!'); })} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><FaIcons.FaTrashAlt /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESAJLAR */}
        {tab === 'mesajlar' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-[11px] font-black italic uppercase text-black">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg text-red-600 italic">📩 Gelen İletişim Mesajları</h3>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px]">{iletisimMesajlari.length} MESAJ</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-[#111] text-white"><tr><th className="p-5">Gönderen</th><th className="p-5">İletişim</th><th className="p-5">Konu / Mesaj</th><th className="p-5 text-right">İşlem</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {iletisimMesajlari.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-5 font-bold"><div className="text-red-600">{m.ad || m.adSoyad}</div><div className="text-gray-400 text-[9px]">{m.tarih?.toDate ? m.tarih.toDate().toLocaleString('tr-TR') : 'Yeni'}</div></td>
                    <td className="p-5 italic text-[10px]"><div>📧 {m.email}</div></td>
                    <td className="p-5"><div className="text-blue-600 mb-1">{m.konu}</div><div className="normal-case font-medium text-gray-700 line-clamp-2 max-w-xs">{m.mesaj}</div></td>
                    <td className="p-5 text-right"><button onClick={() => mesajSil(m.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full text-lg"><FaIcons.FaTrashAlt /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {iletisimMesajlari.length === 0 && <div className="p-10 text-center text-gray-400 italic">Henüz mesaj yok.</div>}
          </div>
        )}

        {/* SİTE AYARLARI */}
        {tab === 'site-ayarlari' && (
          <div className="max-w-6xl bg-white p-8 rounded-3xl border shadow-sm font-black italic uppercase text-black space-y-10 pb-24">
            <h3 className="text-2xl border-b pb-4 flex items-center gap-2 text-red-600"><FaIcons.FaCogs /> Site Yönetim Merkezi</h3>
            <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await setDoc(doc(db, "ayarlar", "genel"), siteAyarlari); goster('Tüm ayarlar kaydedildi! 🚀'); setLoading(false); }} className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-7 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] text-gray-400">Site Başlığı</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold italic" value={siteAyarlari.siteBasligi} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, siteBasligi: e.target.value })} /></div>
                  <div className="space-y-1"><label className="text-[10px] text-gray-400">WhatsApp</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold italic" value={siteAyarlari.whatsapp} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, whatsapp: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] text-gray-400">Site Açıklaması (Meta)</label><textarea className="w-full p-4 bg-gray-50 rounded-xl font-bold italic h-20" value={siteAyarlari.siteAciklamasi} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, siteAciklamasi: e.target.value })} /></div>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs text-blue-600 border-b pb-2 flex items-center gap-2"><FaIcons.FaShareAlt /> Sosyal Medya</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: 'facebook', ikon: <FaIcons.FaFacebook className="text-blue-700" />, placeholder: 'Facebook Link' }, { key: 'instagram', ikon: <FaIcons.FaInstagram className="text-pink-600" />, placeholder: 'Instagram Link' }, { key: 'twitter', ikon: <FaIcons.FaTwitter className="text-sky-500" />, placeholder: 'Twitter Link' }, { key: 'youtube', ikon: <FaIcons.FaYoutube className="text-red-600" />, placeholder: 'YouTube Link' }].map(({ key, ikon, placeholder }) => (
                      <div key={key} className="flex items-center gap-2 bg-white p-2 rounded-xl border">{ikon}<input className="flex-1 bg-transparent text-[10px] outline-none normal-case font-bold" placeholder={placeholder} value={siteAyarlari[key] || ''} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} /></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  {[{ label: 'KÜNYE METNİ', key: 'kunyeMetni' }, { label: 'YAYIN İLKELERİ', key: 'yayinIlkeleri' }, { label: 'GİZLİLİK SÖZLEŞMESİ', key: 'gizlilik' }, { label: 'KULLANIM ŞARTLARI', key: 'kullanimSartlari' }].map(({ label, key }) => (
                    <div key={key} className="space-y-1"><label className="text-[10px] text-red-600 font-black">{label}</label><textarea className="w-full p-4 bg-gray-50 rounded-xl h-24 text-[11px] normal-case font-medium border" value={siteAyarlari[key] || ''} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, [key]: e.target.value })} /></div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-5 space-y-6">
                <div className="space-y-2"><label className="text-[10px] text-gray-400">LOGO URL</label>
                  <div className="flex gap-2"><input className="flex-1 p-4 bg-gray-50 rounded-xl text-[10px]" value={siteAyarlari.logoUrl} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, logoUrl: e.target.value })} />{siteAyarlari.logoUrl && <img src={siteAyarlari.logoUrl} className="h-12 w-12 object-contain bg-gray-100 rounded-xl border" alt="logo" />}</div>
                </div>
                <div className="space-y-2"><label className="text-[10px] text-gray-400">TEMA RENGİ</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border"><input type="color" className="w-10 h-10 border-none bg-transparent cursor-pointer" value={siteAyarlari.anaRenk} onChange={(e) => setSiteAyarlari({ ...siteAyarlari, anaRenk: e.target.value })} /><span className="text-[10px]">{siteAyarlari.anaRenk}</span></div>
                </div>
                <button disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-2xl hover:bg-black transition-all font-black uppercase italic shadow-xl flex items-center justify-center gap-4 text-lg">
                  {loading ? <FaIcons.FaSpinner className="animate-spin" /> : <><FaIcons.FaSave /> TÜMÜNÜ KAYDET</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LİG MERKEZİ */}
        {tab === 'lig-merkezi' && (
          <div className="space-y-8 font-black italic uppercase text-black">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border-l-8 border-green-600">
              <div><h3 className="text-2xl font-black italic">LİG VERİ MERKEZİ</h3><p className="text-[10px] text-gray-400 font-bold">Bot tarafından Firebase'e kaydedilen canlı veriler</p></div>
              <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full text-xs animate-pulse font-black">BOT SİSTEMİ AKTİF</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-[#111] p-4 text-white text-xs flex items-center gap-2"><FaIcons.FaListOl className="text-green-500" /> PUAN DURUMU</div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-[10px] font-bold">
                    <thead className="bg-gray-50 sticky top-0 border-b"><tr><th className="p-3 text-center">#</th><th className="p-3">TAKIM</th><th className="p-3 text-center">O</th><th className="p-3 text-center">G</th><th className="p-3 text-center text-red-600">P</th></tr></thead>
                    <tbody className="divide-y">{puanDurumu.map((t: any, i: number) => (<tr key={i} className={t.team?.name?.includes('Kocaeli') ? 'bg-green-50' : ''}><td className="p-3 text-center text-gray-400 border-r">{i + 1}</td><td className="p-3 font-black text-[11px]">{t.team?.name}</td><td className="p-3 text-center">{t.played}</td><td className="p-3 text-center text-green-600">{t.won}</td><td className="p-3 text-center font-black text-white bg-red-600">{t.points}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-[#111] p-4 text-white text-xs flex items-center gap-2"><FaIcons.FaCalendarAlt className="text-blue-500" /> KOCAELİSPOR FİKSTÜR</div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y">
                  {fikstur.map((mac: any, i: number) => (<div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50"><div className="flex flex-col gap-1"><span className="text-[9px] text-gray-400 tracking-widest">{mac.time}</span><div className="flex items-center gap-2 text-[11px] font-black italic"><span className={mac.home?.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.home}</span><span className="text-red-600 text-[8px] bg-gray-100 px-1 rounded">VS</span><span className={mac.away?.includes('Kocaeli') ? 'text-green-600' : ''}>{mac.away}</span></div></div><div className="bg-green-600 text-white px-3 py-1 rounded text-[8px] font-black">MAÇ GÜNÜ</div></div>))}
                  {fikstur.length === 0 && <div className="p-10 text-center text-gray-400 animate-pulse">FİKSTÜR BEKLENİYOR...</div>}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}