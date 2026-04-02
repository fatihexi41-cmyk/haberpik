import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. Önce Auth modülünü içeri al

const firebaseConfig = {
  // Buradaki senin kendi config bilgilerin aynen kalsın kanka, dokunma
  apiKey: "AIzaSyDPBCVpJETt8jpYLV4PP8XpMI_-JKTcJyE",
  authDomain: "kocaelihaber-e779e.firebaseapp.com",
  projectId: "kocaelihaber-e779e",
  storageBucket: "kocaelihaber-e779e.firebasestorage.app",
  messagingSenderId: "980487271491",
  appId: "1:980487271491:web:9cbd1898a59d441d2350f6"
};

// Next.js SSR uyumluluğu için uygulama kontrolü
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Mühürlü değişkenleri dışarı aktar
export const db = getFirestore(app);
export const auth = getAuth(app); // İŞTE HATA BURADAYDI, BUNU EKLEDİK