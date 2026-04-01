import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Menü */}
      <div className="w-64 bg-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">Haberpik Admin</h2>
        <nav className="space-y-4">
          <button className="w-full text-left p-3 hover:bg-slate-800 rounded transition">📊 Dashboard</button>
          <button className="w-full text-left p-3 hover:bg-slate-800 rounded transition">📰 Haberleri Yönet</button>
          <button className="w-full text-left p-3 hover:bg-slate-800 rounded transition">🗞️ Gazeteleri Yönet</button>
          <button className="w-full text-left p-3 hover:bg-slate-800 rounded transition">⚙️ Bot Ayarları</button>
        </nav>
      </div>

      {/* Main Content - İçerik */}
      <div className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Genel Durum</h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">Admin: Kanka</div>
        </header>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">Toplam Haber</p>
            <h3 className="text-2xl font-bold">124</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Bugünkü Gazeteler</p>
            <h3 className="text-2xl font-bold text-red-500">Eksik!</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Bot Durumu</p>
            <h3 className="text-2xl font-bold text-green-600">Aktif</h3>
          </div>
        </div>
      </div>
    </div>
  );
}