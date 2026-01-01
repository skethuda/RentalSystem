// Türkiye Şehirleri ve İlçeleri
export interface City {
  name: string;
  districts: string[];
}

export const TURKEY_CITIES: City[] = [
  {
    name: "Adana",
    districts: ["Seyhan", "Yüreğir", "Çukurova", "Sarıçam", "Ceyhan", "Kozan", "İmamoğlu", "Karaisalı", "Pozantı", "Aladağ", "Feke", "Saimbeyli", "Tufanbeyli", "Yumurtalık", "Karataş"]
  },
  {
    name: "Adıyaman",
    districts: ["Merkez", "Kahta", "Besni", "Gölbaşı", "Gerger", "Samsat", "Çelikhan", "Sincik", "Tut"]
  },
  {
    name: "Afyonkarahisar",
    districts: ["Merkez", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ", "Çay", "Sultandağı", "Şuhut", "Sinanpaşa", "İhsaniye", "İscehisar", "Başmakçı", "Bayat", "Çobanlar", "Dazkırı", "Evciler", "Hocalar", "Kızılören"]
  },
  {
    name: "Ağrı",
    districts: ["Merkez", "Doğubayazıt", "Patnos", "Eleşkirt", "Diyadin", "Tutak", "Taşlıçay", "Hamur"]
  },
  {
    name: "Aksaray",
    districts: ["Merkez", "Ortaköy", "Eskil", "Gülağaç", "Güzelyurt", "Sarıyahşi", "Ağaçören", "Sultanhanı"]
  },
  {
    name: "Amasya",
    districts: ["Merkez", "Merzifon", "Suluova", "Gümüşhacıköy", "Taşova", "Göynücek", "Hamamözü"]
  },
  {
    name: "Ankara",
    districts: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut", "Sincan", "Altındağ", "Pursaklar", "Gölbaşı", "Polatlı", "Beypazarı", "Çubuk", "Haymana", "Şereflikoçhisar", "Kızılcahamam", "Nallıhan", "Elmadağ", "Ayaş", "Bala", "Evren", "Güdül", "Kalecik", "Kazan", "Akyurt"]
  },
  {
    name: "Antalya",
    districts: ["Muratpaşa", "Konyaaltı", "Kepez", "Aksu", "Döşemealtı", "Alanya", "Manavgat", "Serik", "Kaş", "Kumluca", "Kemer", "Finike", "Gazipaşa", "Demre", "Elmalı", "Korkuteli", "Akseki", "Gündoğmuş", "İbradı"]
  },
  {
    name: "Ardahan",
    districts: ["Merkez", "Göle", "Çıldır", "Posof", "Hanak", "Damal"]
  },
  {
    name: "Artvin",
    districts: ["Merkez", "Hopa", "Borçka", "Arhavi", "Şavşat", "Yusufeli", "Ardanuç", "Murgul"]
  },
  {
    name: "Aydın",
    districts: ["Efeler", "Nazilli", "Söke", "Kuşadası", "Didim", "İncirliova", "Germencik", "Çine", "Sultanhisar", "Köşk", "Bozdoğan", "Karacasu", "Kuyucak", "Buharkent", "Yenipazar", "Koçarlı", "Karpuzlu"]
  },
  {
    name: "Balıkesir",
    districts: ["Altıeylül", "Karesi", "Bandırma", "Edremit", "Gönen", "Burhaniye", "Ayvalık", "Susurluk", "Bigadiç", "Dursunbey", "Erdek", "Havran", "İvrindi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Balya"]
  },
  {
    name: "Bartın",
    districts: ["Merkez", "Amasra", "Kurucaşile", "Ulus"]
  },
  {
    name: "Batman",
    districts: ["Merkez", "Kozluk", "Sason", "Beşiri", "Gercüş", "Hasankeyf"]
  },
  {
    name: "Bayburt",
    districts: ["Merkez", "Demirözü", "Aydıntepe"]
  },
  {
    name: "Bilecik",
    districts: ["Merkez", "Bozüyük", "Söğüt", "Osmaneli", "Pazaryeri", "Gölpazarı", "İnhisar", "Yenipazar"]
  },
  {
    name: "Bingöl",
    districts: ["Merkez", "Genç", "Solhan", "Karlıova", "Adaklı", "Kiğı", "Yayladere", "Yedisu"]
  },
  {
    name: "Bitlis",
    districts: ["Merkez", "Tatvan", "Ahlat", "Adilcevaz", "Güroymak", "Hizan", "Mutki"]
  },
  {
    name: "Bolu",
    districts: ["Merkez", "Gerede", "Mudurnu", "Mengen", "Göynük", "Yeniçağa", "Dörtdivan", "Seben", "Kıbrıscık"]
  },
  {
    name: "Burdur",
    districts: ["Merkez", "Bucak", "Gölhisar", "Yeşilova", "Tefenni", "Ağlasun", "Altınyayla", "Çavdır", "Çeltikçi", "Karamanlı", "Kemer"]
  },
  {
    name: "Bursa",
    districts: ["Osmangazi", "Nilüfer", "Yıldırım", "Gemlik", "Mudanya", "İnegöl", "Karacabey", "Mustafakemalpaşa", "Orhangazi", "İznik", "Kestel", "Gürsu", "Yenişehir", "Büyükorhan", "Harmancık", "Keles", "Orhaneli"]
  },
  {
    name: "Çanakkale",
    districts: ["Merkez", "Biga", "Çan", "Gelibolu", "Ezine", "Ayvacık", "Bayramiç", "Lapseki", "Yenice", "Eceabat", "Gökçeada", "Bozcaada"]
  },
  {
    name: "Çankırı",
    districts: ["Merkez", "Çerkeş", "Ilgaz", "Kurşunlu", "Şabanözü", "Yapraklı", "Atkaracalar", "Bayramören", "Eldivan", "Kızılırmak", "Korgun", "Orta"]
  },
  {
    name: "Çorum",
    districts: ["Merkez", "Sungurlu", "Osmancık", "Alaca", "İskilip", "Kargı", "Mecitözü", "Bayat", "Ortaköy", "Boğazkale", "Dodurga", "Laçin", "Oğuzlar", "Uğurludağ"]
  },
  {
    name: "Denizli",
    districts: ["Pamukkale", "Merkezefendi", "Çivril", "Acıpayam", "Tavas", "Sarayköy", "Buldan", "Kale", "Honaz", "Çal", "Çameli", "Güney", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Babadağ", "Serinhisar", "Akkoy"]
  },
  {
    name: "Diyarbakır",
    districts: ["Bağlar", "Kayapınar", "Yenişehir", "Sur", "Bismil", "Ergani", "Çermik", "Silvan", "Çınar", "Dicle", "Eğil", "Hani", "Hazro", "Kocaköy", "Kulp", "Lice"]
  },
  {
    name: "Düzce",
    districts: ["Merkez", "Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Yığılca"]
  },
  {
    name: "Edirne",
    districts: ["Merkez", "Keşan", "Uzunköprü", "İpsala", "Havsa", "Enez", "Süloğlu", "Lalapaşa", "Meriç"]
  },
  {
    name: "Elazığ",
    districts: ["Merkez", "Kovancılar", "Karakoçan", "Baskil", "Maden", "Palu", "Sivrice", "Arıcak", "Keban", "Ağın", "Alacakaya"]
  },
  {
    name: "Erzincan",
    districts: ["Merkez", "Tercan", "Üzümlü", "Refahiye", "Çayırlı", "İliç", "Kemah", "Kemaliye", "Otlukbeli"]
  },
  {
    name: "Erzurum",
    districts: ["Yakutiye", "Palandöken", "Aziziye", "Oltu", "Horasan", "Pasinler", "Hınıs", "Karayazı", "Aşkale", "İspir", "Tortum", "Şenkaya", "Tekman", "Çat", "Köprüköy", "Narman", "Olur", "Pazaryolu", "Karaçoban", "Uzundere"]
  },
  {
    name: "Eskişehir",
    districts: ["Odunpazarı", "Tepebaşı", "Çifteler", "Sivrihisar", "Mahmudiye", "Seyitgazi", "Alpu", "Beylikova", "Günyüzü", "Han", "İnönü", "Mihalgazi", "Mihalıççık", "Sarıcakaya"]
  },
  {
    name: "Gaziantep",
    districts: ["Şahinbey", "Şehitkamil", "Nizip", "İslahiye", "Nurdağı", "Oğuzeli", "Araban", "Yavuzeli", "Karkamış"]
  },
  {
    name: "Giresun",
    districts: ["Merkez", "Bulancak", "Espiye", "Görele", "Tirebolu", "Keşap", "Dereli", "Şebinkarahisar", "Piraziz", "Eynesil", "Yağlıdere", "Alucra", "Güce", "Çamoluk", "Çanakçı", "Doğankent"]
  },
  {
    name: "Gümüşhane",
    districts: ["Merkez", "Kelkit", "Şiran", "Torul", "Köse", "Kürtün"]
  },
  {
    name: "Hakkari",
    districts: ["Merkez", "Yüksekova", "Çukurca", "Şemdinli"]
  },
  {
    name: "Hatay",
    districts: ["Antakya", "İskenderun", "Defne", "Samandağ", "Dörtyol", "Kırıkhan", "Reyhanlı", "Arsuz", "Payas", "Altınözü", "Belen", "Erzin", "Hassa", "Kumlu", "Yayladağı"]
  },
  {
    name: "Iğdır",
    districts: ["Merkez", "Tuzluca", "Aralık", "Karakoyunlu"]
  },
  {
    name: "Isparta",
    districts: ["Merkez", "Yalvaç", "Eğirdir", "Şarkikaraağaç", "Gelendost", "Senirkent", "Keçiborlu", "Gönen", "Uluborlu", "Atabey", "Sütçüler", "Aksu", "Yenişarbademli"]
  },
  {
    name: "İstanbul",
    districts: ["Kadıköy", "Üsküdar", "Beşiktaş", "Şişli", "Beyoğlu", "Fatih", "Bakırköy", "Ataşehir", "Maltepe", "Kartal", "Pendik", "Tuzla", "Ümraniye", "Beykoz", "Sarıyer", "Eyüpsultan", "Kağıthane", "Gaziosmanpaşa", "Bağcılar", "Bahçelievler", "Güngören", "Esenler", "Bayrampaşa", "Zeytinburnu", "Küçükçekmece", "Avcılar", "Esenyurt", "Beylikdüzü", "Büyükçekmece", "Başakşehir", "Sultanbeyli", "Sancaktepe", "Çekmeköy", "Sultangazi", "Arnavutköy", "Silivri", "Çatalca", "Şile", "Adalar"]
  },
  {
    name: "İzmir",
    districts: ["Konak", "Karşıyaka", "Bornova", "Buca", "Bayraklı", "Çiğli", "Gaziemir", "Karabağlar", "Balçova", "Narlıdere", "Güzelbahçe", "Urla", "Çeşme", "Seferihisar", "Menderes", "Torbalı", "Ödemiş", "Tire", "Bergama", "Aliağa", "Menemen", "Foça", "Dikili", "Kemalpaşa", "Kiraz", "Beydağ", "Bayındır", "Selçuk", "Karaburun", "Kınık"]
  },
  {
    name: "Kahramanmaraş",
    districts: ["Onikişubat", "Dulkadiroğlu", "Elbistan", "Afşin", "Göksun", "Pazarcık", "Türkoğlu", "Andırın", "Çağlayancerit", "Ekinözü", "Nurhak"]
  },
  {
    name: "Karabük",
    districts: ["Merkez", "Safranbolu", "Eskipazar", "Yenice", "Ovacık", "Eflani"]
  },
  {
    name: "Karaman",
    districts: ["Merkez", "Ermenek", "Sarıveliler", "Kazımkarabekir", "Ayrancı", "Başyayla"]
  },
  {
    name: "Kars",
    districts: ["Merkez", "Sarıkamış", "Kağızman", "Selim", "Susuz", "Arpaçay", "Digor", "Akyaka"]
  },
  {
    name: "Kastamonu",
    districts: ["Merkez", "Tosya", "Taşköprü", "İnebolu", "Araç", "Cide", "Daday", "Devrekani", "Çatalzeytin", "Abana", "Küre", "Azdavay", "Pınarbaşı", "Seydiler", "Şenpazar", "Hanönü", "İhsangazi", "Bozkurt", "Ağlı", "Doğanyurt"]
  },
  {
    name: "Kayseri",
    districts: ["Melikgazi", "Kocasinan", "Talas", "Develi", "Yahyalı", "Bünyan", "Pınarbaşı", "Sarıoğlan", "Tomarza", "Yeşilhisar", "İncesu", "Hacılar", "Akkışla", "Felahiye", "Özvatan", "Sarız"]
  },
  {
    name: "Kırıkkale",
    districts: ["Merkez", "Yahşihan", "Keskin", "Delice", "Sulakyurt", "Balışeyh", "Bahşili", "Çelebi", "Karakeçili"]
  },
  {
    name: "Kırklareli",
    districts: ["Merkez", "Lüleburgaz", "Babaeski", "Vize", "Pınarhisar", "Demirköy", "Kofçaz", "Pehlivanköy"]
  },
  {
    name: "Kırşehir",
    districts: ["Merkez", "Kaman", "Mucur", "Çiçekdağı", "Akpınar", "Akçakent", "Boztepe"]
  },
  {
    name: "Kilis",
    districts: ["Merkez", "Musabeyli", "Elbeyli", "Polateli"]
  },
  {
    name: "Kocaeli",
    districts: ["İzmit", "Gebze", "Darıca", "Körfez", "Gölcük", "Derince", "Çayırova", "Dilovası", "Kartepe", "Başiskele", "Kandıra", "Karamürsel"]
  },
  {
    name: "Konya",
    districts: ["Selçuklu", "Meram", "Karatay", "Ereğli", "Akşehir", "Beyşehir", "Seydişehir", "Cihanbeyli", "Kulu", "Karapınar", "Çumra", "Ilgın", "Bozkır", "Sarayönü", "Hadim", "Kadınhanı", "Doğanhisar", "Hüyük", "Tuzlukçu", "Altınekin", "Derebucak", "Emirgazi", "Güneysınır", "Halkapınar", "Taşkent", "Yalıhüyük", "Ahırlı", "Akören", "Çeltik", "Derbent", "Yunak"]
  },
  {
    name: "Kütahya",
    districts: ["Merkez", "Tavşanlı", "Simav", "Gediz", "Emet", "Domaniç", "Altıntaş", "Aslanapa", "Çavdarhisar", "Dumlupınar", "Hisarcık", "Pazarlar", "Şaphane"]
  },
  {
    name: "Malatya",
    districts: ["Battalgazi", "Yeşilyurt", "Darende", "Akçadağ", "Doğanşehir", "Hekimhan", "Arapgir", "Yazıhan", "Arguvan", "Pütürge", "Kuluncak", "Kale", "Doğanyol"]
  },
  {
    name: "Manisa",
    districts: ["Şehzadeler", "Yunusemre", "Akhisar", "Turgutlu", "Salihli", "Soma", "Alaşehir", "Saruhanlı", "Kırkağaç", "Sarıgöl", "Demirci", "Gördes", "Kula", "Selendi", "Ahmetli", "Gölmarmara", "Köprübaşı"]
  },
  {
    name: "Mardin",
    districts: ["Artuklu", "Kızıltepe", "Midyat", "Nusaybin", "Derik", "Mazıdağı", "Ömerli", "Savur", "Dargeçit", "Yeşilli"]
  },
  {
    name: "Mersin",
    districts: ["Akdeniz", "Mezitli", "Toroslar", "Yenişehir", "Tarsus", "Erdemli", "Silifke", "Anamur", "Mut", "Gülnar", "Bozyazı", "Aydıncık", "Çamlıyayla"]
  },
  {
    name: "Muğla",
    districts: ["Menteşe", "Bodrum", "Fethiye", "Marmaris", "Milas", "Ortaca", "Dalaman", "Köyceğiz", "Datça", "Yatağan", "Ula", "Kavaklıdere", "Seydikemer"]
  },
  {
    name: "Muş",
    districts: ["Merkez", "Bulanık", "Malazgirt", "Varto", "Hasköy", "Korkut"]
  },
  {
    name: "Nevşehir",
    districts: ["Merkez", "Ürgüp", "Avanos", "Gülşehir", "Kozaklı", "Hacıbektaş", "Derinkuyu", "Acıgöl"]
  },
  {
    name: "Niğde",
    districts: ["Merkez", "Bor", "Çiftlik", "Ulukışla", "Altunhisar", "Çamardı"]
  },
  {
    name: "Ordu",
    districts: ["Altınordu", "Ünye", "Fatsa", "Perşembe", "Ulubey", "Akkuş", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye"]
  },
  {
    name: "Osmaniye",
    districts: ["Merkez", "Kadirli", "Düziçi", "Bahçe", "Toprakkale", "Hasanbeyli", "Sumbas"]
  },
  {
    name: "Rize",
    districts: ["Merkez", "Ardeşen", "Çayeli", "Pazar", "Fındıklı", "Güneysu", "İkizdere", "Kalkandere", "Derepazarı", "Hemşin", "İyidere"]
  },
  {
    name: "Sakarya",
    districts: ["Adapazarı", "Serdivan", "Erenler", "Arifiye", "Hendek", "Akyazı", "Geyve", "Karasu", "Sapanca", "Kocaali", "Pamukova", "Ferizli", "Söğütlü", "Kaynarca", "Taraklı", "Karapürçek"]
  },
  {
    name: "Samsun",
    districts: ["Atakum", "İlkadım", "Canik", "Tekkeköy", "Bafra", "Çarşamba", "Terme", "Vezirköprü", "Havza", "Ladik", "Kavak", "Alaçam", "Asarcık", "Ayvacık", "Salıpazarı", "Yakakent", "19 Mayıs"]
  },
  {
    name: "Siirt",
    districts: ["Merkez", "Kurtalan", "Pervari", "Baykan", "Eruh", "Şirvan", "Tillo"]
  },
  {
    name: "Sinop",
    districts: ["Merkez", "Boyabat", "Gerze", "Ayancık", "Durağan", "Türkeli", "Erfelek", "Dikmen", "Saraydüzü"]
  },
  {
    name: "Sivas",
    districts: ["Merkez", "Şarkışla", "Yıldızeli", "Gemerek", "Suşehri", "Zara", "Kangal", "Divriği", "Hafik", "Koyulhisar", "Gürün", "İmranlı", "Akıncılar", "Altınyayla", "Doğanşar", "Gölova", "Ulaş"]
  },
  {
    name: "Şanlıurfa",
    districts: ["Eyyübiye", "Haliliye", "Karaköprü", "Siverek", "Viranşehir", "Suruç", "Birecik", "Akçakale", "Hilvan", "Bozova", "Ceylanpınar", "Halfeti", "Harran"]
  },
  {
    name: "Şırnak",
    districts: ["Merkez", "Cizre", "Silopi", "İdil", "Uludere", "Beytüşşebap", "Güçlükonak"]
  },
  {
    name: "Tekirdağ",
    districts: ["Süleymanpaşa", "Çorlu", "Çerkezköy", "Kapaklı", "Ergene", "Saray", "Hayrabolu", "Malkara", "Muratlı", "Şarköy", "Marmaraereğlisi"]
  },
  {
    name: "Tokat",
    districts: ["Merkez", "Erbaa", "Turhal", "Zile", "Niksar", "Reşadiye", "Almus", "Artova", "Pazar", "Başçiftlik", "Sulusaray", "Yeşilyurt"]
  },
  {
    name: "Trabzon",
    districts: ["Ortahisar", "Akçaabat", "Yomra", "Arsin", "Of", "Araklı", "Sürmene", "Maçka", "Vakfıkebir", "Beşikdüzü", "Çarşıbaşı", "Tonya", "Şalpazarı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı"]
  },
  {
    name: "Tunceli",
    districts: ["Merkez", "Pertek", "Çemişgezek", "Hozat", "Ovacık", "Mazgirt", "Nazımiye", "Pülümür"]
  },
  {
    name: "Uşak",
    districts: ["Merkez", "Banaz", "Eşme", "Sivaslı", "Ulubey", "Karahallı"]
  },
  {
    name: "Van",
    districts: ["İpekyolu", "Tuşba", "Edremit", "Erciş", "Özalp", "Çaldıran", "Başkale", "Muradiye", "Gevaş", "Gürpınar", "Çatak", "Saray", "Bahçesaray"]
  },
  {
    name: "Yalova",
    districts: ["Merkez", "Çınarcık", "Altınova", "Armutlu", "Çiftlikköy", "Termal"]
  },
  {
    name: "Yozgat",
    districts: ["Merkez", "Sorgun", "Akdağmadeni", "Yerköy", "Boğazlıyan", "Çayıralan", "Sarıkaya", "Şefaatli", "Çekerek", "Aydıncık", "Kadışehri", "Saraykent", "Yenifakılı", "Çandır"]
  },
  {
    name: "Zonguldak",
    districts: ["Merkez", "Ereğli", "Çaycuma", "Devrek", "Alaplı", "Gökçebey", "Kilimli", "Kozlu"]
  }
];

// Şehir adına göre ilçeleri getir
export const getDistrictsByCity = (cityName: string): string[] => {
  const city = TURKEY_CITIES.find(c => c.name === cityName);
  return city ? city.districts : [];
};

// Tüm şehir isimlerini getir
export const getCityNames = (): string[] => {
  return TURKEY_CITIES.map(city => city.name);
};



