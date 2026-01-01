import { useTranslation } from 'react-i18next';

interface RegionCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
}

export default function PopularRegions() {
  const { t } = useTranslation();
  const regions: RegionCard[] = [
    {
      id: 'antalya',
      title: 'Antalya & Kaş / Kalkan',
      subtitle: "Akdeniz'in En Popüler Villaları",
      description:
        'Özel havuzlu, deniz manzaralı lüks villalar ve ailelere uygun geniş konaklama seçenekleri.',
      image:
        'https://readdy.ai/api/search-image?query=antalya%20kalkan%20luxury%20villa%20sea%20view%20sunset%20professional%20real%20estate%20photo&width=1200&height=800&seq=popular-region-antalya&orientation=landscape',
      tag: 'En Çok Tercih Edilen',
    },
    {
      id: 'mugla',
      title: 'Muğla & Bodrum / Fethiye',
      subtitle: "Ege'nin En Özel Koyları",
      description:
        'Butik tatil kasabaları, denize yakın villalar ve bungalow konseptli doğa içi konaklamalar.',
      image:
        'https://readdy.ai/api/search-image?query=bodrum%20fethiye%20aerial%20view%20turquoise%20sea%20luxury%20villas&width=1200&height=800&seq=popular-region-mugla&orientation=landscape',
      tag: 'Aileler İçin İdeal',
    },
    {
      id: 'izmir',
      title: 'İzmir & Çeşme / Alaçatı',
      subtitle: 'Şehirden Kaçış Noktaları',
      description:
        'Taş evler, butik oteller ve Alaçatı ruhunu yansıtan tasarım odaklı konaklama seçenekleri.',
      image:
        'https://readdy.ai/api/search-image?query=alacati%20cesme%20stone%20houses%20narrow%20streets%20colorful%20doors&width=1200&height=800&seq=popular-region-izmir&orientation=landscape',
      tag: 'Hafta Sonu Kaçamağı',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-gray-500 uppercase mb-2">
              {t('home.popularRegions')}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-2">
              {t('home.popularRegionsTitle')}
            </h2>
            <p className="text-gray-600 max-w-2xl text-sm md:text-base">
              {t('home.popularRegionsDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {regions.map((region) => (
            <article
              key={region.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-44 md:h-52 w-full overflow-hidden">
                <img
                  src={region.image}
                  alt={region.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#D4AF37] shadow-sm">
                  {region.tag}
                </span>
              </div>

              <div className="p-5 flex flex-col gap-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{region.title}</h3>
                <p className="text-sm font-semibold text-gray-600">{region.subtitle}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{region.description}</p>

                <button className="mt-3 inline-flex items-center text-sm font-semibold text-[#D4AF37] group-hover:text-[#B8960D] transition-colors self-start">
                  {t('home.exploreVillas')}
                  <i className="ri-arrow-right-line ml-1 text-base" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
