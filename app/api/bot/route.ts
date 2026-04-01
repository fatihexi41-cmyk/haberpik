import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js"; 

const bekle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// KANKA: Bu fonksiyon BİK'e "Ben yabancı değilim" diyen gizli mühürdür.
async function resmiBase64Cek(url: string) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bik.gov.tr/', // KANKA: BİK'e "Senin içinden geliyorum" diyoruz
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 12000 
    });
    
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    // Eğer gelen veri çok küçükse (Stop resmi gibi), hata sayalım kanka
    if (buffer.length < 5000) {
      console.log("⚠️ Çekilen resim çok küçük, muhtemelen engellendi.");
      return null;
    }

    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.log("❌ Resim mühürlenemedi: " + url);
    return null;
  }
}

export async function GET() {
  const apiKey = "AIzaSyDBggv0wSkDkW_2b-IIoo47HBeJV_ZyBm8"; 

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const kategoriler = ["GÜNDEM", "SPOR", "EKONOMİ"]; 
    let toplamSayac = 0;

    // --- BÖLÜM 1: HABERLER ---
    for (const kat of kategoriler) {
      try {
        const rssRes = await axios.get(`https://news.google.com/rss/search?q=${kat.toLowerCase()}+türkiye&hl=tr&gl=TR&ceid=TR:tr`);
        const parser = new xml2js.Parser();
        const rssData = await parser.parseStringPromise(rssRes.data);
        const items = rssData.rss.channel[0].item.slice(0, 1);

        for (const item of items) {
          const baslik = item.title[0];
          const q = query(collection(db, "haberler"), where("baslik", "==", baslik), limit(1));
          const snap = await getDocs(q);
          
          if (snap.empty) {
            const prompt = `Haber Başlığı: ${baslik}. Bu haberi profesyonel bir haber editörü gibi 3 paragraf yaz. SADECE JSON VER. JSON: {"baslik": "${baslik.replace(/"/g, "'")}", "ozet": "...", "icerik": "...", "kategori": "${kat}", "resim": "https://picsum.photos/seed/${Math.random()}/800/500", "sonDakika": ${Math.random() > 0.4}, "manset": true}`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const startJson = responseText.indexOf('{');
            const endJson = responseText.lastIndexOf('}') + 1;
            const cleanJson = responseText.substring(startJson, endJson);
            
            const data = JSON.parse(cleanJson);
            await addDoc(collection(db, "haberler"), { ...data, tarih: new Date(), goruntulenme: 0 });
            toplamSayac++;
          }
        }
      } catch (e) { console.log(`${kat} haber hatası.`); }
    }

    // --- BÖLÜM 2: GAZETELER ---
    const bugun = new Date();
    const yil = bugun.getFullYear();
    const ay = String(bugun.getMonth() + 1).padStart(2, '0');
    const gun = String(bugun.getDate()).padStart(2, '0');
    const bugunStr = `${gun}.${ay}.${yil}`;

    const gazeteListesi = [
      { ad: "Hürriyet", slug: "hurriyet" },
      { ad: "Sözcü", slug: "sozcu" },
      { ad: "Sabah", slug: "sabah" },
      { ad: "Özgür Kocaeli", slug: "kocaeli-ozgur-kocaeli" },
      { ad: "Demokrat Kocaeli", slug: "kocaeli-demokrat-kocaeli" },
      { ad: "Kocaeli Gazetesi", slug: "kocaeli-kocaeli" }
    ];

    let gazeteSayac = 0;
    for (const g of gazeteListesi) {
      const gQuery = query(collection(db, "gazeteler"), where("slug", "==", g.slug), where("tarih_str", "==", bugunStr));
      const gSnap = await getDocs(gQuery);
      
      if (gSnap.empty) {
        const resimUrl = `https://www.bik.gov.tr/wp-content/uploads/mansetler/${yil}/${ay}/${gun}/${g.slug}-gazetesi-manseti.jpg`;
        const base64Resim = await resmiBase64Cek(resimUrl);
        
        if (base64Resim) {
          await addDoc(collection(db, "gazeteler"), {
            ad: g.ad, slug: g.slug, resim: base64Resim, tarih: new Date(), tarih_str: bugunStr
          });
          gazeteSayac++;
        }
      }
    }

    return NextResponse.json({ mesaj: "Bütün engeller aşıldı kanka!", haber: toplamSayac, gazete: gazeteSayac });

  } catch (error: any) {
    return NextResponse.json({ hata: "Bot yoruldu: " + error.message }, { status: 500 });
  }
}