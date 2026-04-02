import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Metadata } from "next";
import HaberDetayClient from "./HaberDetayClient";

// KANKA: Next.js 15+ için params tipini Promise olarak tanımlıyoruz
type Props = {
  params: Promise<{ id: string }>;
};

// 1. SEO MÜHÜRÜ (GOOGLE BURAYI OKUR)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; // KANKA: Promise'i burada bekleyip açıyoruz (await)

  if (!id) return { title: "Haber Bulunamadı | HABERPİK" };

  try {
    const docRef = doc(db, "haberler", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { title: "Haber Bulunamadı | HABERPİK" };
    }

    const haber = docSnap.data();

    return {
      title: `${haber.baslik} | HABERPİK`,
      description: haber.metaAciklama || haber.ozet,
      openGraph: {
        images: [haber.resim],
        title: haber.baslik,
        description: haber.ozet,
      },
    };
  } catch (error) {
    return { title: "Haber Detayı | HABERPİK" };
  }
}

// 2. KULLANICI GÖSTERİMİ (TASARIM BURADAN GELİR)
export default async function Page({ params }: Props) {
  const { id } = await params; // KANKA: Burada da id'yi açtık

  // Artık id'yi Client Component'e aslanlar gibi gönderiyoruz
  return <HaberDetayClient id={id} />;
}