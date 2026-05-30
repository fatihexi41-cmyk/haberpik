import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import HaberDetayClient from "./HaberDetayClient";

type Props = {
  params: Promise<{ id: string }>;
};

// ─── SEO META ────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!id) return { title: "Haber Bulunamadı | HABERPİK" };

  try {
    const docSnap = await getDoc(doc(db, "haberler", id));
    if (!docSnap.exists()) return { title: "Haber Bulunamadı | HABERPİK" };

    const haber = docSnap.data();
    const aciklama = haber.metaAciklama || haber.ozet || "";
    const resim = haber.resim || "https://www.haberpik.com/og-image.jpg";

    return {
      title: `${haber.baslik} | HABERPİK`,
      description: aciklama,

      // DÜZELTİLDİ: canonical URL eklendi
      alternates: {
        canonical: `https://www.haberpik.com/haber/${id}`,
      },

      openGraph: {
        type: "article",                         // DÜZELTİLDİ: "website" yerine "article"
        url: `https://www.haberpik.com/haber/${id}`,
        title: haber.baslik,
        description: aciklama,
        siteName: "HABERPİK",
        locale: "tr_TR",
        images: [{ url: resim, width: 1200, height: 630, alt: haber.baslik }],
        // DÜZELTİLDİ: Yayın tarihi varsa ekle
        publishedTime: haber.tarih?.seconds
          ? new Date(haber.tarih.seconds * 1000).toISOString()
          : undefined,
      },

      twitter: {
        card: "summary_large_image",
        title: haber.baslik,
        description: aciklama,
        images: [resim],
      },

      // DÜZELTİLDİ: schema.org NewsArticle yapılandırılmış verisi
      other: {
        "application/ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": haber.baslik,
          "description": aciklama,
          "image": resim,
          "url": `https://www.haberpik.com/haber/${id}`,
          "datePublished": haber.tarih?.seconds
            ? new Date(haber.tarih.seconds * 1000).toISOString()
            : new Date().toISOString(),
          "publisher": {
            "@type": "Organization",
            "name": "HABERPİK",
            "url": "https://www.haberpik.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.haberpik.com/logo.png",
            },
          },
          "author": {
            "@type": "Person",
            "name": haber.yazar || "HABERPİK Editör",
          },
        }),
      },
    };
  } catch {
    return { title: "Haber Detayı | HABERPİK" };
  }
}

// ─── SAYFA ───────────────────────────────────────────────────────────────────
export default async function Page({ params }: Props) {
  const { id } = await params;

  // DÜZELTİLDİ: id yoksa 404 sayfasına yönlendir
  if (!id) notFound();

  return <HaberDetayClient id={id} />;
}