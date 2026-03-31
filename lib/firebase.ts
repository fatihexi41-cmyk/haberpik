// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPBCVpJETt8jpYLV4PP8XpMI_-JKTcJyE",
  authDomain: "kocaelihaber-e779e.firebaseapp.com",
  projectId: "kocaelihaber-e779e",
  storageBucket: "kocaelihaber-e779e.firebasestorage.app",
  messagingSenderId: "980487271491",
  appId: "1:980487271491:web:9cbd1898a59d441d2350f6"
};

// Next.js'de uygulama her yenilendiğinde hata vermesin diye kontrol
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);