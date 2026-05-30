import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { MetadataRoute } from "next";

const BASE_URL = "https://www.haberpik.com";

// DÜZELTİLDİ: MetadataRoute.Sitemap tipi eklendi — Next.js doğrulama yapar
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ─── STATİK SAYFALAR ─────────────────────────────────────────────────────
  // DÜZELTİLDİ: Sadece anasayfa değil tüm statik sayfalar eklendi
  const statikSayfalar: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                    lastModified: new Date(), changeFrequency: "always",  priority: 1.0 },
    { url: `${BASE_URL}/iletisim`,                      lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kunye`,                         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/yayin-ilkeleri`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/gizlilik-sozlesmesi`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/kullanim-sartlari`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // ─── KATEGORİ SAYFALARI ───────────────────────────────────────────────────
  const kategoriler = [
    "gundem", "siyaset", "spor", "ekonomi", "asayis",
    "dunya", "turkiye", "teknoloji", "saglik", "egitim", "yasam",
  ];
  const kategoriSayfalar: MetadataRoute.Sitemap = kategoriler.map(slug => ({
    url: `${BASE_URL}/kategori/${slug}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  // ─── HABER SAYFALARI ─────────────────────────────────────────────────────
  let haberUrls: MetadataRoute.Sitemap = [];
  try {
    // DÜZELTİLDİ: Tüm koleksiyon yerine son 1000 haber + tarih sırası
    const snap = await getDocs(
      query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(1000))
    );

    haberUrls = snap.docs.map(doc => {
      const data = doc.data();
      // DÜZELTİLDİ: new Date() yerine haberin gerçek tarihi kullanılıyor
      const tarih = data.tarih?.seconds
        ? new Date(data.tarih.seconds * 1000)
        : new Date();

      return {
        url: `${BASE_URL}/haber/${doc.id}`,
        lastModified: tarih,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
    });
  } catch (err) {
    console.error("Sitemap haber çekme hatası:", err);
    // Hata olursa haberler olmadan devam et — site tamamen kırılmasın
  }

  return [
    ...statikSayfalar,
    ...kategoriSayfalar,
    ...haberUrls,
  ];
}