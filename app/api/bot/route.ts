import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js"; 

const bekle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET() {
  const apiKey = "AIzaSyDBggv0wSkDkW_2b-IIoo47HBeJV_ZyBm8"; 

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // KANKA: Botun yetişmesi için kategori sayısını şimdilik biraz azalttım, 
    // her şey oturduğunda tekrar artırırız.
    const kategoriler = ["GÜNDEM", "SPOR", "EKONOMİ", "SİYASET"];
    let toplamSayac = 0;

    // --- BÖLÜM 1: HABERLER ---
    for (const kat of kategoriler) {
      try {
        const rssRes = await axios.get(`https://news.google.com/rss/search?q=${kat.toLowerCase()}+türkiye&hl=tr&gl=TR&ceid=TR:tr`);
        const parser = new xml2js.Parser();
        const rssData = await parser.parseStringPromise(rssRes.data);
        const items = rssData.rss.channel[0].item.slice(0, 1); // Her kategoriden 1 tane çeksin hızlansın

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
      } catch (e) { console.log(`${kat} çekilemedi, devam ediyorum...`); }
    }

    // --- BÖLÜM 2: GAZETE MANŞETLERİ (HIZLI URL MODELİ) ---
    const bugun = new Date();
    const yil = bugun.getFullYear();
    const ay = String(bugun.getMonth() + 1).padStart(2, '0');
    const gun = String(bugun.getDate()).padStart(2, '0');
    const bugunStr = `${gun}.${ay}.${yil}`;

    const gazeteListesi = [
      { ad: "Hürriyet", slug: "hurriyet" },
      { ad: "Sözcü", slug: "sozcu" },
      { ad: "Sabah", slug: "sabah" },
      { ad: "Milliyet", slug: "milliyet" },
      { ad: "Türkiye", slug: "turkiye" },
      { ad: "Akşam", slug: "aksam" },
      { ad: "Yeni Şafak", slug: "yenisafak" },
      { ad: "Özgür Kocaeli", slug: "kocaeli-ozgur-kocaeli" },
      { ad: "Demokrat Kocaeli", slug: "kocaeli-demokrat-kocaeli" },
      { ad: "Kocaeli Gazetesi", slug: "kocaeli-kocaeli" },
      { ad: "Çağdaş Kocaeli", slug: "kocaeli-cagdas-kocaeli" }
    ];

    let gazeteSayac = 0;
    for (const g of gazeteListesi) {
      const gQuery = query(collection(db, "gazeteler"), where("slug", "==", g.slug), where("tarih_str", "==", bugunStr));
      const gSnap = await getDocs(gQuery);
      
      if (gSnap.empty) {
        // KANKA: Base64 ile botu yormuyoruz, direkt linki basıyoruz ki 2 saniyede bitmesin
        const resimUrl = `https://www.bik.gov.tr/wp-content/uploads/mansetler/${yil}/${ay}/${gun}/${g.slug}-gazetesi-manseti.jpg`;
        
        await addDoc(collection(db, "gazeteler"), {
          ad: g.ad, 
          slug: g.slug, 
          resim: resimUrl, 
          tarih: new Date(), 
          tarih_str: bugunStr
        });
        gazeteSayac++;
      }
    }

    return NextResponse.json({ 
      mesaj: "Haberpik operasyonu başarılı!", 
      eklenen_haber: toplamSayac,
      eklenen_gazete: gazeteSayac 
    });

  } catch (error: any) {
    console.error("Bot hatası:", error.message);
    return NextResponse.json({ hata: "Kanka bot yolda kaldı: " + error.message }, { status: 500 });
  }
}