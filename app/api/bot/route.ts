import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js"; 
import * as cheerio from "cheerio"; 

const bekle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// KANKA: Base64 fonksiyonunu optimize ettim, hata verirse boş dönmez, hata basar.
async function resmiBase64Yap(url: string) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000 // 15 saniye mühlet tanıdık
    });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.log("❌ Resim indirilemedi: " + url);
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

    // --- BÖLÜM 1: HABER ÇEKME (AYNEN DURUYOR) ---
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
          await bekle(3000); 
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

    // --- BÖLÜM 2: GAZETE MANŞETLERİ (BASE64) ---
    const bugun = new Date();
    const yil = bugun.getFullYear();
    const ay = String(bugun.getMonth() + 1).padStart(2, '0');
    const gun = String(bugun.getDate()).padStart(2, '0');
    const bugunStr = `${gun}.${ay}.${yil}`;

    const bikListesi = [
      { ad: "Hürriyet", slug: "hurriyet" }, { ad: "Sabah", slug: "sabah" }, { ad: "Sözcü", slug: "sozcu" },
      { ad: "Özgür Kocaeli", slug: "ozgur-kocaeli" }, { ad: "Kocaeli Gazetesi", slug: "kocaeli" }, { ad: "Demokrat Kocaeli", slug: "demokrat-kocaeli" }
    ];

    for (const b of bikListesi) {
      const bQuery = query(collection(db, "gazeteler"), where("slug", "==", b.slug), where("tarih_str", "==", bugunStr));
      const bSnap = await getDocs(bQuery);
      
      if (bSnap.empty) {
        const bikResimUrl = `https://www.bik.gov.tr/wp-content/uploads/mansetler/${yil}/${ay}/${gun}/${b.slug}-gazetesi-manseti.jpg`;
        const base64Bik = await resmiBase64Yap(bikResimUrl);
        
        if (base64Bik) {
          await addDoc(collection(db, "gazeteler"), {
            ad: b.ad, slug: b.slug, resim: base64Bik, tarih: new Date(), tarih_str: bugunStr
          });
          console.log(`✅ ${b.ad} Base64 olarak mühürlendi!`);
        }
      }
    }

    return NextResponse.json({ mesaj: "Her şey mühürlendi kanka!" });
  } catch (error: any) {
    return NextResponse.json({ hata: "Bot yoruldu: " + error.message }, { status: 500 });
  }
}