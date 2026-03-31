import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Kanka buraya Firebase konsolundan alacağın anahtarlar gelecek
  apiKey: "AIza...", 
  authDomain: "kocaeli-haber.firebaseapp.com",
  projectId: "kocaeli-haber",
  storageBucket: "kocaeli-haber.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);