import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit, doc, setDoc, orderBy } from "firebase/firestore";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js"; 
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// KANKA: Haberin içine dalıp resim ve tam metni söküp alan operasyon merkezi!
async function habereSizVeVeriyiCek(haberUrl: string) {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: isLocal ? null : (chromium as any).defaultViewport,
      executablePath: isLocal 
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : await chromium.executablePath(),
      headless: isLocal ? true : (chromium as any).headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    // habereSizVeVeriyiCek içindeki page.goto satırını şöyle değiştir:
    await page.goto(haberUrl, { 
      waitUntil: 'domcontentloaded', // 'networkidle2' yerine bunu yaz, sayfa tamamen yüklenmeden metni çeksin kanka
      timeout: 60000 // Süreyi 60 saniye yaptık, bot pes etmesin
    });
    
    const haberVerisi = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:image"]');
      let img = og ? og.getAttribute('content') : null;
      
      if (!img) {
        const allImgs = Array.from(document.querySelectorAll('img'));
        const filteredImgs = allImgs.filter(i => {
          const src = i.src.toLowerCase();
          return src.startsWith('http') && !src.includes('logo') && !src.includes('banner') && i.width > 200;
        });
        img = filteredImgs[0] ? (filteredImgs[0] as HTMLImageElement).src : null;
      }

      const selectors = ['article p', '.content p', '.haber-detay p', '.entry-content p', '#haber-metni p'];
      const paragraphs = Array.from(document.querySelectorAll(selectors.join(',')));
      const tamMetin = paragraphs.map(p => p.textContent?.trim()).filter(t => t && t.length > 20).join('\n').substring(0, 4000);

      return { img, tamMetin };
    });

    return haberVerisi;
  } catch (error: any) {
    console.log("Sızma operasyonu hatası:", error.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
// 📍 BURADAN BAŞLA DEĞİŞTİRMEYE (resmiBase64Cek fonksiyonunun altı)

// KANKA: Etkinlikleri vitrinden cımbızla çeken özel operasyon
async function etkinlikKaziyici() {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: isLocal ? null : (chromium as any).defaultViewport,
      executablePath: isLocal 
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : await chromium.executablePath(),
      headless: isLocal ? true : (chromium as any).headless,
    });

    const page = await browser.newPage();
    // Kanka o "totoş" sitenin etkinlik sayfasına sızıyoruz
    await page.goto('https://mansetmarmara.com/etkinlikler/', { waitUntil: 'networkidle2', timeout: 30000 });

    const etkinlikler = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.post-item, .card, [class*="etkinlik"]')); 
      return items.slice(0, 6).map(el => {
        const baslik = el.querySelector('h2, h3, .title')?.textContent?.trim() || "Kocaeli Etkinlik";
        const mekan = el.querySelector('.mekan, .venue, .meta-item')?.textContent?.trim() || "Kocaeli Kültür Merkezi";
        const tarihHam = el.querySelector('.tarih, .date, .time-item')?.textContent?.trim() || "15 Nisan 2026";
        
        const parts = tarihHam.split(' ');
        return {
          baslik: baslik,
          mekan: mekan,
          saat: "20:00",
          gun: parts[0] || "15",
          ay: (parts[1] || "NİSAN").toUpperCase()
        };
      });
    });
    return etkinlikler;
  } catch (error) {
    console.log("❌ Etkinlik sızma hatası kanka:", error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) return NextResponse.json({ hata: "Kanka anahtar yok!" }, { status: 500 });

  let toplamSayac = 0;

  try {
async function resmiBase64Cek(url: string) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36' },
      timeout: 10000 
    });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) { 
    console.log("Resim çekilemedi kanka, pas geçiyorum:", url);
    return null; 
  }
}

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const sonHaberlerSnap = await getDocs(query(collection(db, "haberler"), orderBy("tarih", "desc"), limit(30)));
    const mevcutBasliklar = sonHaberlerSnap.docs.map(d => d.data().baslik.toLowerCase());

const RSS_KAYNAKLARI = [
      // YEREL KUVVETLER
      { ad: "Onay TV", url: "https://www.onaytv.com.tr/rss.xml" },
      { ad: "Kocaeli Nabız", url: "https://kocaelinabiz.com/rss.xml" },
      { ad: "Anibal Gazete", url: "https://anibalgazete.com/rss.xml" },
      { ad: "Çağdaş Kocaeli", url: "https://www.cagdaskocaeli.com.tr/rss.xml" },
      { ad: "Kocaeli Gazetesi", url: "https://www.kocaeligazetesi.com.tr/rss.xml" },
      { ad: "Özgür Kocaeli", url: "https://www.ozgurkocaeli.com.tr/rss.xml" },
      { ad: "Demokrat Kocaeli", url: "https://demokratkocaeli.com/rss.xml" },
      // GENEL KUVVETLER (CNN Türk)
      { ad: "CNN Türkiye", url: "https://www.cnnturk.com/feed/rss/turkiye/news" },
      { ad: "CNN Dünya", url: "https://www.cnnturk.com/feed/rss/dunya/news" },
      { ad: "CNN Magazin", url: "https://www.cnnturk.com/feed/rss/magazin/news" },
      { ad: "CNN Teknoloji", url: "https://www.cnnturk.com/feed/rss/bilim-teknoloji/news" }
    ];

// --- KANKA: RSS SIZMA OPERASYONU (HAYALET MODU) ---
    // Önce döngünün dışına bekleme fonksiyonunu koyalım
    const bekle = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (const kaynak of RSS_KAYNAKLARI) {
      let rssBrowser = null;
      try {
        console.log(`${kaynak.ad} RSS taranıyor (Sızma Operasyonu)...`);
        await bekle(2000); // Kanka acele etme, siteler anlamasın!

        const isLocal = process.env.NODE_ENV === 'development';
        rssBrowser = await puppeteer.launch({
          args: [
            ...(isLocal ? [] : chromium.args),
            '--disable-blink-features=AutomationControlled', // Kanka: "Ben bot değilim" mühürü!
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ],
          executablePath: isLocal ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : await chromium.executablePath(),
          headless: isLocal ? true : (chromium as any).headless,
        });

        const rssPage = await rssBrowser.newPage();
        
        // Kanka: Gerçek bir insan tarayıcısı kimliği veriyoruz
        await rssPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
        
        // Güvenlik duvarlarını aşmak için ekstra headerlar
        await rssPage.setExtraHTTPHeaders({
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        });

        // Kanka XML kodunu çekiyoruz ama bu sefer daha sabırlıyız
        await rssPage.goto(kaynak.url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Bazı siteler XML'i body içine gömer, bazıları ham verir. İkisini de kapsayalım:
        const xmlContent = await rssPage.evaluate(() => {
          return document.body ? document.body.innerText : document.documentElement.outerHTML;
        });

        await rssBrowser.close();

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const rssData = await parser.parseStringPromise(xmlContent);
        
        // Kanka: Esnek yakalama modu (Hangi formatta gelirse gelsin yakalarız)
        const items = rssData.rss?.channel?.item || rssData.feed?.entry || rssData.rss?.item || [];
        const limitedItems = Array.isArray(items) ? items.slice(0, 3) : [items];

        for (const item of items) {
          const link = Array.isArray(item.link) ? item.link[0] : item.link;
          const hamBaslik = Array.isArray(item.title) ? item.title[0] : item.title;
          
          if (mevcutBasliklar.some(b => hamBaslik.toLowerCase().includes(b.substring(0, 15)))) continue;

          let resimUrl = null;
          if (item.enclosure && item.enclosure[0].$.url) {
            resimUrl = item.enclosure[0].$.url;
          } else if (item['media:content'] && item['media:content'][0].$.url) {
            resimUrl = item['media:content'][0].$.url;
          }

          const sızmaVerisi = await habereSizVeVeriyiCek(link);
          if (!resimUrl) resimUrl = sızmaVerisi?.img;
          const finalMetin = sızmaVerisi?.tamMetin || (item.description ? item.description[0] : "");

          if (!resimUrl || finalMetin.length < 150) continue;

          const base64Resim = await resmiBase64Cek(resimUrl);
          if (!base64Resim) continue;

          // KANKA: Botun beynine giden eski satırı sil, bu akıllı editörü mühürle
          const prompt = `
          Aşağıdaki haberi analiz et ve bir baş editör gibi yeniden yaz.
          
          Haber Metni: ${finalMetin}
          Kaynak Bilgisi: ${kaynak.ad} - ${link}

 KURALLAR:
          1. KELİME OYUNU: Haberi kopyala-yapıştır yapma. Kendi cümlelerinle, daha vurucu ve profesyonel bir dille yeniden kurgula.
          2. KATEGORİ MÜHÜRLEME (KESİN KURAL - SLUGLAR ÖNEMLİ): 
             - Futbol, basketbol, voleybol, transfer, maç, Kocaelispor, stadyum varsa -> {"kategori": "Spor", "kategori_slug": "spor"}
             - Ünlü, konser, magazin, dizi, sinema, gala, aşk, podyum varsa -> {"kategori": "Magazin", "kategori_slug": "magazin"}
             - Belediye, başkan, seçim, meclis, siyaset, parti varsa -> {"kategori": "Siyaset", "kategori_slug": "siyaset"}
             - Ekonomi, altın, borsa, zam, maaş, banka varsa -> {"kategori": "Ekonomi", "kategori_slug": "ekonomi"}
             - Diğer genel haberler, asayiş, trafik, yangın için -> {"kategori": "Gündem", "kategori_slug": "gundem"}
          3. RESİM KONTROLÜ: Eğer haber metni ile resim içeriği tamamen alakasızsa "uyumluluk": "ALAKASIZ" döndür.
          Yanıtı sadece bu JSON formatında ver:
          {
            "uyumluluk": "UYUMLU" veya "ALAKASIZ",
            "baslik": "Vurucu kısa başlık",
            "ozet": "Merak uyandırıcı en fazla 2 cümle",
            "icerik": "Haberin profesyonelce yeniden yazılmış hali",
            "kategori": "...",
            "kategori_slug": "...",
            "manset": true
          }`;

          const result = await model.generateContent(prompt);
          const rawResponse = await result.response.text();
          const cleanJson = rawResponse.match(/\{.*\}/s)![0];
          const data = JSON.parse(cleanJson);
          
          if (data.uyumluluk === "ALAKASIZ") continue;

          delete data.uyumluluk;
          data.resim = base64Resim;
          data.tarih = new Date();
          data.kaynak = link;
          data.goruntulenme = 0;

          await addDoc(collection(db, "haberler"), data);
          toplamSayac++;
          if (toplamSayac >= 15) break;
        }
      } catch (e: any) { 
        console.log(`${kaynak.ad} kilitlendi kanka.`); 
      }
      if (toplamSayac >= 15) break;
    }

    // --- KANKA: HİZMET MOTORU (HAVA, SPOR, SİNEMA, CIMBIZLANMIŞ ETKİNLİK) ---
    try {
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      const tmdbKey = process.env.TMDB_API_KEY || "BURAYA_KENDI_ANAHTARINI_YAZ";

      // Önce cımbızla etkinliklere sızıyoruz
      const cekilenEtkinlikler = await etkinlikKaziyici();

      // KANKA: Sabah gazete manşetlerini söküp alan özel sızma motoru
async function mansetCekici() {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: isLocal ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://www.haber7.com/gazete-mansetleri', { 
      waitUntil: 'domcontentloaded', // networkidle2 yerine bunu kullan, daha hızlı sızar
      timeout: 60000 
    });

    const mansetler = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.newspaper-list li a'));
      return items.slice(0, 10).map(item => ({
        ad: (item as any).title || "Gazete",
        img: (item.querySelector('img') as any).src.replace('140x190', '750x1100') // Fotoğrafı büyütüyoruz kanka
      }));
    });
    return mansetler;
  } catch (error) { return null; }
  finally { if (browser) await browser.close(); }
}

      const [hava, kurlar, ligRes, fiksturRes, filmlerRes] = await Promise.allSettled([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kocaeli&units=metric&lang=tr&appid=8f27806f155940c6a394f4a36f4f2c0b`),
        axios.get(`https://api.exchangerate-api.com/v4/latest/TRY`),
        axios.get('https://api-football-v1.p.rapidapi.com/v3/standings?league=203&season=2025', {
          headers: { 'x-rapidapi-key': rapidApiKey || '', 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' }
        }),
        axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures?team=611&season=2025&next=5', {
          headers: { 'x-rapidapi-key': rapidApiKey || '', 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbKey}&language=tr-TR&page=1`)
      ]);

      const hizmetVerisi: any = { guncelleme: new Date().toISOString() };

      if (hava.status === 'fulfilled') hizmetVerisi.hava = { derece: Math.round(hava.value.data.main.temp), durum: hava.value.data.weather[0].description.toUpperCase() };
      if (kurlar.status === 'fulfilled') hizmetVerisi.kurlar = { dolar: (1 / kurlar.value.data.rates.USD).toFixed(2), euro: (1 / kurlar.value.data.rates.EUR).toFixed(2) };
      if (ligRes.status === 'fulfilled') hizmetVerisi.lig_durumu = ligRes.value.data.response[0].league.standings[0];
      if (fiksturRes.status === 'fulfilled') hizmetVerisi.kocaeli_fikstur = fiksturRes.value.data.response;

      // Sinema Mühürleme
      if (filmlerRes.status === 'fulfilled' && filmlerRes.value.data.results) {
        hizmetVerisi.filmler = filmlerRes.value.data.results.slice(0, 10).map((f: any) => ({
          baslik: f.title,
          resim: `https://image.tmdb.org/t/p/w500${f.poster_path}`,
          tarih: f.release_date ? f.release_date.split('-')[0] : "2026"
        }));
      }

      // --- ETKİNLİK CIMBIZ MÜHÜRLEME ---
      if (cekilenEtkinlikler && cekilenEtkinlikler.length > 0) {
        console.log("✅ Etkinlikler cımbızla mühürlendi!");
        hizmetVerisi.etkinlikler = cekilenEtkinlikler;
      } else {
        hizmetVerisi.etkinlikler = [
          { baslik: "Kocaelispor Maç Günü", mekan: "Yıldız Entegre Stadı", saat: "19:00", gun: "14", ay: "NİSAN" },
          { baslik: "Kocaeli Kitap Fuarı", mekan: "Kocaeli Kongre Merkezi", saat: "10:00", gun: "18", ay: "NİSAN" }
        ];
      }
// --- GAZETE MANŞETLERİ OPERASYONU ---
      const gunlukMansetler = await mansetCekici();
      if (gunlukMansetler && gunlukMansetler.length > 0) {
        // Kanka ayrı koleksiyona değil, direkt hizmetVerisi içine mühürlüyoruz!
        hizmetVerisi.gazeteMansetleri = gunlukMansetler; 
        console.log("✅ Gazete manşetleri hizmetler dokümanına mühürlendi!");
      }

      // Her şeyi tek seferde hizmetler dokümanına basıyoruz
      await setDoc(doc(db, "ayarlar", "hizmetler"), hizmetVerisi, { merge: true });

      return NextResponse.json({ 
        mesaj: "Haberpik Operasyonu Başarılı!", 
        haber: toplamSayac,
        hizmetler: "Mühürlendi"
      });

    } catch (e: any) { 
      console.log("❌ Hizmet motoru hatası kanka:", e.message); 
      return NextResponse.json({ hata: "Hizmet motoru patladı" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Dış hata:", error);
    return NextResponse.json({ hata: "Genel Hata: " + error.message }, { status: 500 });
  }
}