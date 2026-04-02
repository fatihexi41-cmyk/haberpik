import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
import { getStorage } from "firebase/storage"; // KANKA: Storage modülünü içeri aldık

const firebaseConfig = {
  apiKey: "AIzaSyDPBCVpJETt8jpYLV4PP8XpMI_-JKTcJyE",
  authDomain: "kocaelihaber-e779e.firebaseapp.com",
  projectId: "kocaelihaber-e779e",
  storageBucket: "kocaelihaber-e779e.firebasestorage.app",
  messagingSenderId: "980487271491",
  appId: "1:980487271491:web:9cbd1898a59d441d2350f6"
};

// Uygulamanın zaten başlatılıp başlatılmadığını kontrol ediyoruz
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// KANKA: Burası dükkanın anahtarları; db, auth ve ARTIK storage dışarıya mühürlendi!
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // KANKA: Bu satırla storage'ı dünyaya açtık