import React from 'react';

// Kanka şimdilik bu listeyi Firebase'den geliyormuş gibi düşün, 
// mühürü buraya bastık.
const GAZETE_LISTESI = [
  { id: '1', ad: 'Hürriyet', kod: 'hurriyet' },
  { id: '2', ad: 'Sözcü', kod: 'sozcu' },
  { id: '3', ad: 'Sabah', kod: 'sabah' },
  { id: '4', ad: 'Milliyet', kod: 'milliyet' },
];

const GazeteMansetleri = () => {
  return (
    <section className="w-full py-6 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-2">
          Günün Gazete Manşetleri
        </h2>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {GAZETE_LISTESI.map((gazete) => (
            <div key={gazete.id} className="min-w-[150px] flex-shrink-0 group">
              <div className="border rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <img 
                  src={`https://www.gazetemanşetleri.com/images/gazeteler/${gazete.kod}.jpg`} 
                  alt={gazete.ad}
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-center mt-2 text-sm font-medium">{gazete.ad}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GazeteMansetleri;