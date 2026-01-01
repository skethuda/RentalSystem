import { useTranslation } from 'react-i18next';

export default function TrustBadges() {
  const { t } = useTranslation();
  const badges = [
    {
      id: 'tursab',
      icon: (
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
          <div className="text-center px-1">
            <div className="text-red-600 font-bold text-xs leading-tight mb-0.5">TÜRSAB</div>
            <div className="text-[8px] text-white font-medium">SERTİFİKA</div>
          </div>
        </div>
      ),
      title: t('home.trustBadge1'),
      buttonText: t('home.explore'),
      link: '#'
    },
    {
      id: 'tatildegüven',
      icon: (
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-white shadow-md relative flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="ri-home-4-line text-white text-2xl"></i>
          </div>
          <div className="absolute bottom-0.5 right-0.5 bg-white rounded-full p-0.5">
            <i className="ri-shield-check-line text-blue-600 text-[10px]"></i>
          </div>
          <div className="absolute top-0.5 left-0.5 text-[7px] text-white font-semibold leading-tight">TatildeGüven</div>
        </div>
      ),
      title: t('home.trustBadge2'),
      buttonText: t('home.explore'),
      link: '#'
    },
    {
      id: 'tourism-ministry',
      icon: (
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-md relative flex-shrink-0">
          <div className="text-white text-center">
            <i className="ri-government-line text-2xl"></i>
          </div>
        </div>
      ),
      title: t('home.trustBadge3'),
      buttonText: t('home.explore'),
      link: '#'
    }
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#2C2C2C] via-[#D4AF37]/20 to-[#F7F7F5]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                {badge.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {badge.title}
                  </p>
                </div>
              </div>
              <a
                href={badge.link}
                className="inline-flex items-center text-[#D4AF37] font-semibold text-sm hover:text-[#B8960D] transition-colors"
              >
                {badge.buttonText}
                <i className="ri-arrow-right-line ml-1"></i>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

