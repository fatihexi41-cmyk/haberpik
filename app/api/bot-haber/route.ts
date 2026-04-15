import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, getDocs, limit, orderBy } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// --- KANKA: SLUG OLUŞTURUCU ---
const slugOlustur = (metin: string) => {
  return metin.toLowerCase().trim()
    .replace(/ /g, '-').replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
};

// --- RESİM AVCISI ---
async function akilliResimAvcisi(page: any) {
  return await page.evaluate(() => {
    const metaSelectors = ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'link[rel="image_src"]', 'meta[name="thumbnail"]'];
    for (const selector of metaSelectors) {
      const content = document.querySelector(selector)?.getAttribute('content');
      if (content && content.startsWith('http')) return content;
    }
    const selectorList = ['article img', 'figure img', '.haber_resmi img', '.content img', '.post-thumbnail img', '.wp-post-image'];
    for (const s of selectorList) {
      const img = document.querySelector(s) as HTMLImageElement;
      if (img) {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || img.getAttribute('data-original');
        if (src && src.startsWith('http')) return src;
      }
    }
    const images = Array.from(document.querySelectorAll('img'));
    const newsImage = images.find(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      const rect = img.getBoundingClientRect();
      return src && src.startsWith('http') && rect.width > 300 && rect.top < 1000;
    });
    return newsImage ? (newsImage.getAttribute('data-src') || newsImage.getAttribute('src')) : null;
  });
}

// --- LİNK TOPLAYICI ---
async function linkleriTopla(browser: any, siteUrl: string) {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => ({ link: a.href, baslik: a.innerText.trim() }))
        .filter(item => item.link.startsWith('http') && item.baslik.length > 40)
        .slice(0, 15);
    });
    await page.close();
    return links;
  } catch { return []; }
}

// --- HABER DETAYINA SIZMA ---
async function habereSizVeCek(browser: any, url: string) {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 2000));

    const resim = await akilliResimAvcisi(page);
    const icerik = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.innerText?.trim() || '';
      const metin = Array.from(document.querySelectorAll('p, article p, .haber_metni p, div.content p'))
        .map(p => p.textContent?.trim())
        .filter(t => t && t.length > 60)
        .join('\n\n');
      return { h1, metin };
    });
    await page.close();
    return { ...icerik, resim };
  } catch { return null; }
}

async function resmiBase64Yap(url: string) {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    if (res.data.length > 1024 * 1024) return null;
    return {
      inlineData: { data: Buffer.from(res.data).toString("base64"), mimeType: res.headers["content-type"] || "image/jpeg" },
    };
  } catch { return null; }
}

export async function GET() {
  console.log("🚀 HABERPİK 2.5 FLASH GÖREVDE!");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let sayac = 0;
  let browser = null;

  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: isLocal ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : await chromium.executablePath(),
      headless: true,
    });

    const snap = await getDocs(query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(50)));
    const mevcutLinkler = snap.docs.map(d => d.data().kaynak);
    const sonHaberBasliklari = snap.docs.map(d => d.data().baslik).join(" | ");

    const SITELER = [
      "https://kocaelinabiz.com", 
      "https://www.ozgurkocaeli.com.tr",
      "https://www.cagdaskocaeli.com.tr", 
      "https://www.kocaeligazetesi.com.tr",
      "https://www.cnnturk.com", 
      "https://www.haber7.com"
    ];

    // KANKA: RASTGELE SIRALAMA MÜHÜRÜ
    SITELER.sort(() => Math.random() - 0.5);

    for (const site of SITELER) {
      console.log(`🔎 Şantiyeye girildi: ${site}`);
      const linkler = await linkleriTopla(browser, site);
      
      let siteSayac = 0; // KANKA: Her site için kendi kotası

      for (const haber of linkler) {
        if (mevcutLinkler.includes(haber.link) || mevcutLinkler.includes(haber.link + "/")) continue;

        const ham = await habereSizVeCek(browser, haber.link);
        if (!ham || ham.metin.length < 400 || !ham.resim) continue;

        const resimData = await resmiBase64Yap(ham.resim);
        if (!resimData) continue;

        const prompt = `Sen Haberpik baş editörüsün. Sana gelen haberi incele.
DİKKAT: Yayındaki son haber başlıkları: [${sonHaberBasliklari}]. Eğer bu haber bunlardan biriyle içerik olarak aynıysa kesinlikle "durum": "pas" de.
KURALLAR:
1. "baslik", "ozet" ve en az 300 kelimelik zengin bir "icerik" yaz.
2. KATEGORİ LİSTESİ: [GÜNDEM, SPOR, YEREL SPOR, SİYASET, ASAYİŞ, EKONOMİ, TÜRKİYE HABERLERİ, DÜNYA, BİLİM TEKNOLOJİ, KÜLTÜR SANAT, EĞİTİM, SAĞLIK, EMLAK, OTOMOBİL, MAGAZİN, HAYATIN İÇİNDEN]. Bunlardan en uygun 1-2 tanesini seç.
3. SLAYT MANTIĞI:
   - Haber SPOR veya YEREL SPOR DEĞİLSE: sliderEkle: true, mansetEkle: true yap.
   - Haber SPOR (Ulusal) ise: sliderEkle: true, mansetEkle: true yap.
   - Haber YEREL SPOR (Kocaeli) ise: sliderEkle: false, mansetEkle: false yap.
SADECE JSON: {"baslik": "...", "ozet": "...", "icerik": "...", "kategoriler": ["..."], "mansetEkle": true/false, "sliderEkle": true/false, "sonDakika": true/false, "trendEkle": true/false, "anahtarKelimeler": "...", "metaAciklama": "...", "durum": "aktif/pas"}`;

        try {
          const result = await model.generateContent([prompt, ham.metin, resimData]);
          const cleanJson = result.response.text().match(/\{[\s\S]*\}/)?.[0];
          if (!cleanJson) continue;
          
          const data = JSON.parse(cleanJson);

          if (data.durum === "aktif") {
            const anaKategori = data.kategoriler[0] || "GÜNDEM";
            
            await addDoc(collection(db, "haberler"), { 
              baslik: data.baslik,
              ozet: data.ozet,
              icerik: data.icerik,
              kategoriler: data.kategoriler,
              kategori: anaKategori,
              kategori_slug: slugOlustur(anaKategori),
              manset: data.mansetEkle,
              slider: data.sliderEkle,
              sonDakika: data.sonDakika,
              trendEkle: data.trendEkle,
              anahtarKelimeler: data.anahtarKelimeler || "",
              metaAciklama: data.metaAciklama || "",
              resim: `data:${resimData.inlineData.mimeType};base64,${resimData.inlineData.data}`,
              tarih: new Date(),
              guncellemeTarihi: new Date(),
              kaynak: haber.link,
              yazar: "HaberPik Bot",
              durum: "aktif",
              okunma: 0,
              icerikResimleri: []
            });
            sayac++;
            siteSayac++; // KANKA: Bu siteden başarılı kayıt sayısını artır
            console.log(`✅ [${site}] -> Yayınlandı: ${data.baslik} (${anaKategori})`);
          }
        } catch (e) { console.log("⚠️ Gemini 2.5 pas geçti."); }
        
        if (siteSayac >= 5) {
          console.log(`🏠 ${site} için kota (5) doldu, diğer siteye geçiliyor...`);
          break; // KANKA: Bu siteden 5 tane aldık, diğer dükkana geçiyoruz
        }
        if (sayac >= 25) break; 
      }
      if (sayac >= 25) break;
    }
    return NextResponse.json({ mesaj: "Mühürleme tamam kanka!", eklenen: sayac });
  } catch (e: any) { return NextResponse.json({ hata: e.message }); }
  finally { if (browser) await (browser as any).close(); }
}