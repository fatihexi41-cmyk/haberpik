import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default async function sitemap() {
  const baseUrl = "https://haberpik.com"; // Kanka burayı kendi domaininle değiştir

  // Haberleri çek
  const snap = await getDocs(collection(db, "haberler"));
  const haberUrls = snap.docs.map((doc) => ({
    url: `${baseUrl}/haber/${doc.id}`,
    lastModified: new Date(),
  }));

  return [
    { url: baseUrl, lastModified: new Date() },
    ...haberUrls,
  ];
}