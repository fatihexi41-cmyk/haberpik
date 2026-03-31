import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js"; 

const bekle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// KANKA: Resim indirme ve Base64 mühürleme fonksiyonu
async function resmiBase64Yap(url: string) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000 
    });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    return null;
  }
}

export async function GET() {
  const apiKey = "AIzaSyDBggv0wSkDkW_2b-IIoo47HBeJV_ZyBm8"; 

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const kategoriler = ["GÜNDEM", "SPOR", "SİYASET", "EKONOMİ", "DÜNYA", "TÜRKİYE", "TEKNOLOJİ", "MAGAZİN", "ASAYİŞ", "EMLAK"];
    let toplamSayac = 0;

    // --- BÖLÜM 1: HABERLER (DOKUNMADIM KANKA) ---
    for (const kat of kategoriler) {
      const rssRes = await axios.get(`https://news.google.com/rss/search?q=${kat.toLowerCase()}+türkiye&hl=tr&gl=TR&ceid=TR:tr`);
      const parser = new xml2js.Parser();
      const rssData = await parser.parseStringPromise(rssRes.data);
      const items = rssData.rss.channel[0].item.slice(0, 2);

      for (const item of items) {
        const baslik = item.title[0];
        const q = query(collection(db, "haberler"), where("baslik", "==", baslik), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await bekle(2000); 
          const prompt = `Haber Başlığı: ${baslik}. Bu haberi profesyonel bir haber editörü gibi 3 paragraf yaz. SADECE JSON VER. JSON: {"baslik": "...", "ozet": "...", "icerik": "...", "kategori": "${kat}", "resim": "https://picsum.photos/seed/${Math.random()}/800/500", "sonDakika": ${Math.random() > 0.4}, "manset": true}`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const startJson = responseText.indexOf('{');
          const endJson = responseText.lastIndexOf('}') + 1;
          const cleanJson = responseText.substring(startJson, endJson);
          try {
            const data = JSON.parse(cleanJson);
            await addDoc(collection(db, "haberler"), { ...data, tarih: new Date(), goruntulenme: 0 });
            toplamSayac++;
          } catch (e) { console.log("Haber JSON hatası."); }
        }
      }
    }

    // --- BÖLÜM 2: DEV GAZETE MANŞETLERİ (ULUSAL + KOCAELİ YEREL) ---
    const bugun = new Date();
    const yil = bugun.getFullYear();
    const ay = String(bugun.getMonth() + 1).padStart(2, '0');
    const gun = String(bugun.getDate()).padStart(2, '0');
    const bugunStr = `${gun}.${ay}.${yil}`;

    // KANKA: Buraya tüm devleri ve Kocaeli yerellerini ekledim
    const gazeteListesi = [
      // Ulusallar
      { ad: "Hürriyet", slug: "hurriyet" },
      { ad: "Sözcü", slug: "sozcu" },
      { ad: "Sabah", slug: "sabah" },
      { ad: "Milliyet", slug: "milliyet" },
      { ad: "Türkiye", slug: "turkiye" },
      { ad: "Akşam", slug: "aksam" },
      { ad: "Yeni Şafak", slug: "yenisafak" },
      { ad: "Karar", slug: "karar" },
      { ad: "Korkusuz", slug: "korkusuz" },
      { ad: "Cumhuriyet", slug: "cumhuriyet" },
      // Kocaeli Yereller (BİK üzerindeki slugları güncelledim kanka)
      { ad: "Özgür Kocaeli", slug: "kocaeli-ozgur-kocaeli" },
      { ad: "Demokrat Kocaeli", slug: "kocaeli-demokrat-kocaeli" },
      { ad: "Kocaeli Gazetesi", slug: "kocaeli-kocaeli" },
      { ad: "Çağdaş Kocaeli", slug: "kocaeli-cagdas-kocaeli" }
    ];

    for (const g of gazeteListesi) {
      const gQuery = query(collection(db, "gazeteler"), where("slug", "==", g.slug), where("tarih_str", "==", bugunStr));
      const gSnap = await getDocs(gQuery);
      
      if (gSnap.empty) {
        // KANKA: BİK'in en garanti resim link yapısını buraya mühürledim
        const resimUrl = `https://www.bik.gov.tr/wp-content/uploads/mansetler/${yil}/${ay}/${gun}/${g.slug}-gazetesi-manseti.jpg`;
        const base64Data = await resmiBase64Yap(resimUrl);
        
        if (base64Data) {
          await addDoc(collection(db, "gazeteler"), {
            ad: g.ad, 
            slug: g.slug, 
            resim: base64Data, 
            tarih: new Date(), 
            tarih_str: bugunStr
          });
          console.log(`✅ ${g.ad} Manşeti mühürlendi!`);
        } else {
          // Eğer BİK'te yoksa yedek kaynaktan (Gazetemanşetleri) deniyoruz kanka
          const yedekUrl = `https://www.gazetemanşetleri.com/images/gazeteler/${g.slug.replace('kocaeli-', '')}.jpg`;
          const yedekBase64 = await resmiBase64Yap(yedekUrl);
          if(yedekBase64) {
            await addDoc(collection(db, "gazeteler"), {
              ad: g.ad, slug: g.slug, resim: yedekBase64, tarih: new Date(), tarih_str: bugunStr
            });
          }
        }
      }
    }

    return NextResponse.json({ mesaj: "Haberler ve Gazeteler jilet gibi mühürlendi kanka!" });
  } catch (error: any) {
    return NextResponse.json({ hata: "Bot yoruldu: " + error.message }, { status: 500 });
  }
}