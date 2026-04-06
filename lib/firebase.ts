import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDPBCVpJETt8jpYLV4PP8XpMI_-JKTcJyE",
  authDomain: "kocaelihaber-e779e.firebaseapp.com",
  projectId: "kocaelihaber-e779e",
  storageBucket: "kocaelihaber-e779e.firebasestorage.app",
  messagingSenderId: "980487271491",
  appId: "1:980487271491:web:9cbd1898a59d441d2350f6"
};

// KANKA: Uygulama zaten açıksa onu kullan, değilse aç. Bu kırmızıyı bitirir.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };