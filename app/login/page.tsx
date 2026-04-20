"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin"); 
    } catch (error) {
      alert("Hatalı giriş kanka! Bilgileri kontrol et.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: 'white' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '350px', padding: '30px', border: '1px solid #333', borderRadius: '10px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Haberpik Giriş</h2>
        <input type="email" placeholder="Admin Email" onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#222', color: 'white', border: '1px solid #444' }} />
        <input type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#222', color: 'white', border: '1px solid #444' }} />
        <button type="submit" style={{ padding: '12px', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Giriş Yap</button>
      </form>
    </div>
  );
}