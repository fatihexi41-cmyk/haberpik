import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, getDocs, limit, orderBy, where } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// --- KANKA: RESMİ EN TEPEDEN VE EN BÜYÜK OLARAK GONDIKLEYEN AJAN ---
async function akilliResimAvcisi(page: any) {
  return await page.evaluate(() => {
    // Önce meta etiketlerine bir bakalım (Garanti olsun diye)
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImg && ogImg.startsWith('http')) return ogImg;

    // Eğer meta yoksa, sayfadaki tüm resimleri tara
    const images = Array.from(document.querySelectorAll('img'));
    const newsImage = images.find(img => {
      const rect = img.getBoundingClientRect();
      // Kanka: Sayfanın üst kısmında olan (y < 600) ve belli bir boyuttan büyük resmi seç
      return rect.width > 300 && rect.height > 200 && rect.top < 600;
    });

    return newsImage ? newsImage.src : null;
  });
}

async function linkleriTopla(siteUrl: string) {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--no-sandbox'],
      executablePath: isLocal ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => ({ link: a.href, baslik: a.innerText.trim() }))
        .filter(item => item.link.startsWith('http') && item.baslik.length > 35)
        .slice(0, 15);
    });
  } catch { return []; } finally { if (browser) await browser.close(); }
}

async function habereSizVeCek(url: string) {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--no-sandbox'],
      executablePath: isLocal ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    const resim = await akilliResimAvcisi(page);
    const icerik = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.innerText?.trim() || '';
      const spot = document.querySelector('.spot, .summary, h2')?.textContent?.trim() || '';
      const metin = Array.from(document.querySelectorAll('p, .haber_metni, article'))
        .map(p => p.textContent?.trim())
        .filter(t => t && t.length > 50)
        .join('\n\n');
      return { h1, spot, metin };
    });

    return { ...icerik, resim };
  } catch { return null; } finally { if (browser) await browser.close(); }
}

async function resmiBase64Yap(url: string) {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    if (res.data.length > 900000) return null; // Firestore limit kontrolü
    return {
      inlineData: {
        data: Buffer.from(res.data).toString("base64"),
        mimeType: res.headers["content-type"] || "image/jpeg",
      },
    };
  } catch { return null; }
}

export async function GET() {
  console.log("🚀 HABERPİK AKILLI EDİTÖR BOTU GÖREVE BAŞLADI...");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let sayac = 0;

  try {
    // HAFIZA KONTROLÜ: Son 100 haberi linkine göre çek
    const snap = await getDocs(query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(100)));
    const mevcutLinkler = snap.docs.map(d => d.data().kaynak);

    const SITELER = ["https://www.onaytv.com.tr", "https://kocaelinabiz.com", "https://www.ozgurkocaeli.com.tr"];

    for (const site of SITELER) {
      const linkler = await linkleriTopla(site);
      for (const haber of linkler) {
        if (mevcutLinkler.includes(haber.link)) continue; // Link varsa salla kanka!

        const ham = await habereSizVeCek(haber.link);
        if (!ham || ham.metin.length < 300) continue;

        const resimData = await resmiBase64Yap(ham.resim);
        if (!resimData) continue;

        // KANKA: GEMINI EDİTÖR MASASINDA! (Hem metni hem resmi veriyoruz)
        const prompt = `Sen Haberpik sitesinin baş editörüsün. Sana bir haber metni ve bir resim gönderiyorum.
        1. Haberi profesyonel, merak uyandırıcı ve özgün şekilde yeniden yaz.
        2. GÖNDERDİĞİM RESMİ İNCELE: Eğer resim haberle tamamen alakasızsa, reklam görseliyse veya kalitesizse "durum": "pas" de.
        3. Yanıtı SADECE saf JSON olarak ver: {"baslik": "...", "ozet": "...", "kategori": "...", "durum": "aktif/pas"}`;

        try {
          const result = await model.generateContent([prompt, ham.metin, resimData]);
          const cleanJson = result.response.text().match(/\{[\s\S]*\}/)?.[0];
          if (!cleanJson) continue;
          
          const data = JSON.parse(cleanJson);

          if (data.durum === "aktif") {
            await addDoc(collection(db, "haberler"), { 
              ...data, 
              resim: `data:${resimData.inlineData.mimeType};base64,${resimData.inlineData.data}`, 
              tarih: new Date(), 
              kaynak: haber.link, 
              manset: true,
              okunma: 0 
            });
            sayac++;
            console.log(`✅ Editör Onayladı ve Mühürledi: ${data.baslik}`);
          } else {
            console.log(`❌ Editör Resimi/İçeriği Reddetti: ${haber.link}`);
          }
        } catch (e) { console.log("⚠️ Gemini hatası:", e); }
        if (sayac >= 15) break;
      }
      if (sayac >= 15) break;
    }
    return NextResponse.json({ mesaj: "Editör Görevini Tamamladı!", eklenen: sayac });
  } catch (e: any) { return NextResponse.json({ hata: e.message }); }
}