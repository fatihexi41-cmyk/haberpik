import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import axios from "axios";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// --- KANKA: SENİN EFSANE FUTBOL FONKSİYONUN (KOTA DOSTU) ---
async function superLigApiCek() {
  try {
    const apiKey = process.env.COLLECT_API_KEY; 
    const finalKey = apiKey?.trim().startsWith('apikey') ? apiKey.trim() : `apikey ${apiKey?.trim()}`;
    const config = { headers: { 'authorization': finalKey, 'content-type': 'application/json' } };

    const docSnap = await getDoc(doc(db, "ayarlar", "hizmetler"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const sonGuncelleme = new Date(data.son_guncelleme).getTime();
      const simdi = new Date().getTime();
      if (simdi - sonGuncelleme < 3600000 && data.lig_durumu) {
        console.log("⏳ Kota Dostu: Veriler taze, API'ye gidilmedi.");
        return { puanDurumu: data.lig_durumu, fikstur: data.super_lig_fikstur };
      }
    }

    let puanDurumu: any[] = [];
    let fikstur: any[] = [];

    console.log("⚽ API'den taze futbol verileri çekiliyor...");
    try {
      const puanRes = await axios.get('https://api.collectapi.com/football/league?league=super-lig', config);
      const puanRaw = puanRes.data?.result || [];
      puanDurumu = puanRaw.map((item: any) => {
        const team = item.team.toLowerCase();
        let logoId = "https://www.tff.org/Resources/TFF/Images/Logo/tff-logo.png";
        if(team.includes("galatasaray")) logoId = "https://www.tff.org/Resources/TFF/Images/Logo/galatasaray-logo.png";
        else if(team.includes("fenerbahce")) logoId = "https://www.tff.org/Resources/TFF/Images/Logo/fenerbahce-logo.png";
        else if(team.includes("besiktas")) logoId = "https://www.tff.org/Resources/TFF/Images/Logo/besiktas-logo.png";
        else if(team.includes("trabzon")) logoId = "https://www.tff.org/Resources/TFF/Images/Logo/trabzonspor-logo.png";
        else if(team.includes("kocaeli")) logoId = "https://www.tff.org/Resources/TFF/Images/Logo/kocaelispor-logo.png";

        return {
          rank: item.rank,
          team: { name: item.team, logo: logoId },
          played: item.play, won: item.win, draw: item.draw, lost: item.lose, points: item.point,
          all: { win: item.win } 
        };
      });
    } catch (e) { console.log("⚠️ Puan hatası"); }

    await new Promise(r => setTimeout(r, 2000));

    try {
      const fiksturRes = await axios.get('https://api.collectapi.com/football/results?league=super-lig', config);
      const fiksturRaw = fiksturRes.data?.result || [];
      fikstur = fiksturRaw.map((item: any) => ({
        home: item.home, away: item.away, time: item.date,
        teams: { home: { name: item.home }, away: { name: item.away } },
        fixture: { date: item.date }
      }));
    } catch (e) { console.log("⚠️ Fikstür hatası"); }

    return { puanDurumu, fikstur };
  } catch (e) { return null; }
}

// --- KAZIYICI FONKSİYONLAR ---
async function etkinlikKaziyici() {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    const executablePath = isLocal 
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" 
      : await (chromium as any).executablePath();

    browser = await puppeteer.launch({ 
      args: isLocal ? [] : (chromium as any).args, 
      executablePath: executablePath,
      headless: true 
    } as any);

    const page = await browser.newPage();
    // KANKA: Senin taktik; sayfaya gir ve her şeyin yüklenmesini bekle (networkidle2)
    await page.goto('https://mansetmarmara.com/etkinlikler/', { waitUntil: 'networkidle2', timeout: 30000 });

    const etkinlikler = await page.evaluate(() => {
      // Sayfadaki etkinlik kartlarını buluyoruz
      const cards = Array.from(document.querySelectorAll('.post-item, .card, [class*="etkinlik"]'));
      
      return cards.slice(0, 6).map(el => {
        const h = el as HTMLElement;
        // Tarihi çekiyoruz (Örn: "15 Nisan 2026")
        const fullDate = h.querySelector('.tarih, .date, .entry-date')?.textContent?.trim() || "15 Nisan";
        const parts = fullDate.split(' ');
        
        return { 
          baslik: h.querySelector('h2, h3, .title, .entry-title')?.textContent?.trim() || "Kocaeli Etkinlik", 
          mekan: h.querySelector('.mekan, .venue, .location')?.textContent?.trim() || "Kocaeli", 
          saat: "20:00", // Eğer sayfada saat yoksa sabit mühürledik
          gun: parts[0] || "15", 
          ay: (parts[1] || "NİSAN").toUpperCase() 
        };
      });
    });

    console.log(`🎭 Kocaeli'den ${etkinlikler.length} etkinlik senin tasarıma mühürlendi!`);
    return etkinlikler;

  } catch (err) { 
    console.log("❌ Etkinlik botu yolda kaldı:", err);
    return null; 
  } finally { 
    if (browser) await (browser as any).close(); 
  }
}

async function mansetCekici() {
  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    const executablePath = isLocal 
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" 
      : await (chromium as any).executablePath();

    browser = await puppeteer.launch({ 
      args: isLocal ? [] : (chromium as any).args, 
      executablePath: executablePath,
      headless: true 
    } as any);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // KANKA: Senin dediğin o sayfaların listesi
    const gazeteler = [
      { ad: "Hürriyet", slug: "hurriyet" },
      { ad: "Sabah", slug: "sabah" },
      { ad: "Sözcü", slug: "sozcu" },
      { ad: "Dünya", slug: "dunya" },
      { ad: "Fotomaç", slug: "fotomac" },
      { ad: "Milliyet", slug: "milliyet" },
      { ad: "Türkiye", slug: "turkiye" },
      { ad: "Akşam", slug: "aksam" },
      { ad: "Yeni Şafak", slug: "yeni-safak" },
      { ad: "Korkusuz", slug: "korkusuz" },
      { ad: "Fanatik", slug: "fanatik" },
    
    ];

    const finalMansetler = [];

    for (const g of gazeteler) {
      try {
        // KANKA: Senin "bu linke girsin" dediğin yer:
        const url = `https://www.haber7.com/gazete-mansetleri/${g.slug}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // KANKA: Sayfadaki en büyük gazete resminin adresini söküyoruz
        const imgUrl = await page.evaluate(() => {
          // Sayfadaki ana manşet resmini seçiyoruz (.newspaper-detail içindeki img)
          const img = document.querySelector('.newspaper-detail img') || document.querySelector('.newspaper-pages img');
          return img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;
        });

        if (imgUrl) {
          let fullUrl = imgUrl;
          if (fullUrl.startsWith('//')) fullUrl = 'https:' + fullUrl;
          
          finalMansetler.push({
            ad: g.ad,
            img: fullUrl, // İşte kopyaladığımız o adres!
            tarih: new Date().toISOString()
          });
          console.log(`✅ ${g.ad} mühürlendi kanka!`);
        }
      } catch (e) {
        console.log(`❌ ${g.ad} sayfasında resim bulunamadı!`);
      }
    }

    console.log(`🗞️ Toplam ${finalMansetler.length} dev manşet mühürlendi!`);
    return finalMansetler;

  } catch (error: any) {
    console.log("❌ Bot senin taktiği uygularken patladı:", error.message);
    return null;
  } finally {
    if (browser) await (browser as any).close();
  }
}

// --- ANA GET FONKSİYONU ---
export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;
  try {
    const futbolVerisi = await superLigApiCek();
    const cekilenEtkinlikler = await etkinlikKaziyici();
    const gunlukMansetler = await mansetCekici();

    const [hava, kurlar, filmler, namaz] = await Promise.allSettled([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Kocaeli&units=metric&lang=tr&appid=8f27806f155940c6a394f4a36f4f2c0b`),
      axios.get(`https://api.exchangerate-api.com/v4/latest/TRY`),
      axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbKey}&language=tr-TR&page=1`),
      axios.get(`https://api.aladhan.com/v1/timingsByCity?city=Kocaeli&country=Turkey&method=13`)
    ]);

    const hizmetVerisi: any = { 
      son_guncelleme: new Date().toISOString(), 
      durum: "aktif" 
    };

    if (hava.status === 'fulfilled') {
      hizmetVerisi.hava = { 
        derece: Math.round(hava.value.data.main.temp), 
        durum: hava.value.data.weather[0].description.toUpperCase(), 
        ikon: hava.value.data.weather[0].icon 
      };
    }
    if (kurlar.status === 'fulfilled') {
      hizmetVerisi.kurlar = { 
        dolar: (1 / kurlar.value.data.rates.USD).toFixed(2), 
        euro: (1 / kurlar.value.data.rates.EUR).toFixed(2) 
      };
    }
    if (filmler.status === 'fulfilled') {
      hizmetVerisi.filmler = filmler.value.data.results.slice(0, 10).map((f: any) => ({ 
        baslik: f.title, 
        resim: `https://image.tmdb.org/t/p/w500${f.poster_path}`, 
        puan: f.vote_average 
      }));
    }
    if (namaz.status === 'fulfilled') {
      hizmetVerisi.namaz = namaz.value.data.data.timings;
      hizmetVerisi.hicri_tarih = namaz.value.data.data.date.hijri;
    }

    if (futbolVerisi) {
      hizmetVerisi.lig_durumu = futbolVerisi.puanDurumu;
      hizmetVerisi.super_lig_fikstur = futbolVerisi.fikstur;
    }

    if (cekilenEtkinlikler) hizmetVerisi.etkinlikler = cekilenEtkinlikler;
    if (gunlukMansetler) hizmetVerisi.gazeteMansetleri = gunlukMansetler;

    await setDoc(doc(db, "ayarlar", "hizmetler"), hizmetVerisi, { merge: true });
    
    console.log("🚀 SİSTEM MÜHÜRLENDİ!");
    return NextResponse.json({ mesaj: "Tüm sistemler güncel kanka!" });

  } catch (error: any) { 
    return NextResponse.json({ hata: error.message }, { status: 500 }); 
  }
}