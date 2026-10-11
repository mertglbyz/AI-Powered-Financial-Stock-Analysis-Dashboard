"""
BIST hisse listesi (sembol -> şirket adı).

Arama/otomatik tamamlama için kullanılır. Listede olmayan geçerli bir
BIST sembolü de API'ye doğrudan yazılabilir (örn. "XXXXX" -> "XXXXX.IS").
Liste zamanla güncellenebilir; delist olmuş bir sembol API'de 404 döndürür.
"""

from __future__ import annotations

# BIST 30 – modelin eğitiminde kullanılan likit hisse sepeti
BIST30: list[str] = [
    "AKBNK", "ALARK", "ARCLK", "ASELS", "ASTOR", "BIMAS", "DOAS", "EKGYO",
    "ENKAI", "EREGL", "FROTO", "GARAN", "GUBRF", "HEKTS", "ISCTR", "KCHOL",
    "KONTR", "KRDMD", "MGROS", "OYAKC", "PETKM", "PGSUS", "SAHOL",
    "SASA", "SISE", "TCELL", "THYAO", "TOASO", "TUPRS", "YKBNK",
]

_RAW = """
ACSEL|Acıselsan Acıpayam Selüloz
ADEL|Adel Kalemcilik
ADESE|Adese Gayrimenkul
AEFES|Anadolu Efes
AFYON|Afyon Çimento
AGHOL|AG Anadolu Grubu Holding
AGROT|Agrotech Yüksek Teknoloji
AHGAZ|Ahlatcı Doğal Gaz
AKBNK|Akbank
AKCNS|Akçansa Çimento
AKENR|Akenerji
AKFGY|Akfen GYO
AKFYE|Akfen Yenilenebilir Enerji
AKGRT|Aksigorta
AKMGY|Akmerkez GYO
AKSA|Aksa Akrilik
AKSEN|Aksa Enerji
AKSUE|Aksu Enerji
ALARK|Alarko Holding
ALBRK|Albaraka Türk
ALCTL|Alcatel Lucent Teletaş
ALFAS|Alfa Solar Enerji
ALGYO|Alarko GYO
ALKA|Alkim Kağıt
ALKIM|Alkim Kimya
ALMAD|Altınyağ Madencilik
ANELE|Anel Elektrik
ANHYT|Anadolu Hayat Emeklilik
ANSGR|Anadolu Sigorta
ARASE|Doğu Aras Enerji
ARCLK|Arçelik
ARDYZ|ARD Bilişim
ARENA|Arena Bilgisayar
ARSAN|Arsan Tekstil
ASELS|Aselsan
ASGYO|Asce GYO
ASTOR|Astor Enerji
ASUZU|Anadolu Isuzu
ATAKP|Atakey Patates
ATATP|ATP Yazılım
ATEKS|Akın Tekstil
AVOD|A.V.O.D. Kurutulmuş Gıda
AVPGY|Avrupakent GYO
AYCES|Altın Yunus Çeşme
AYDEM|Aydem Enerji
AYEN|Ayen Enerji
AYGAZ|Aygaz
BAGFS|Bagfaş
BAKAB|Bak Ambalaj
BANVT|Banvit
BASGZ|Başkent Doğalgaz
BAYRK|Bayrak EBT
BERA|Bera Holding
BEYAZ|Beyaz Filo
BFREN|Bosch Fren Sistemleri
BIENY|Bien Yapı Ürünleri
BIGCH|Büyük Şefler Gıda
BIMAS|BİM Birleşik Mağazalar
BIOEN|Biotrend Çevre ve Enerji
BJKAS|Beşiktaş Futbol
BLCYT|Bilici Yatırım
BMSTL|BMS Birleşik Metal
BNTAS|Bantaş Ambalaj
BOBET|Boğaziçi Beton
BORLS|Borlease Otomotiv
BORSK|Bor Şeker
BOSSA|Bossa
BRISA|Brisa Bridgestone
BRKSN|Berkosan Yalıtım
BRKVY|Birikim Varlık Yönetim
BRMEN|Birlik Mensucat
BRSAN|Borusan Boru
BRYAT|Borusan Yatırım
BSOKE|Batısöke Çimento
BTCIM|Batı Çimento
BUCIM|Bursa Çimento
BURCE|Burçelik
BURVA|Burçelik Vana
BVSAN|Bülbüloğlu Vinç
CANTE|Çan2 Termik
CCOLA|Coca-Cola İçecek
CEMTS|Çemtaş Çelik
CEOEM|CEO Event Medya
CIMSA|Çimsa Çimento
CLEBI|Çelebi Hava Servisi
CMBTN|Çimbeton
CMENT|Çimentaş
CONSE|Consus Enerji
COSMO|Cosmos Yatırım Holding
CRDFA|Creditwest Faktoring
CRFSA|CarrefourSA
CUSAN|Çuhadaroğlu Metal
CVKMD|CVK Maden
CWENE|CW Enerji
DAGI|Dagi Giyim
DAPGM|DAP Gayrimenkul
DARDL|Dardanel Önentaş
DENGE|Denge Yatırım Holding
DERHL|Derlüks Yatırım Holding
DERIM|Derimod
DESA|Desa Deri
DESPC|Despec Bilgisayar
DEVA|Deva Holding
DGATE|Datagate Bilgisayar
DGNMO|Doğanlar Mobilya
DITAS|Ditaş Doğan
DMSAS|Demisaş Döküm
DNISI|Dinamik Isı
DOAS|Doğuş Otomotiv
DOCO|DO & CO
DOGUB|Doğusan Boru
DOHOL|Doğan Holding
DURDO|Duran Doğan Basım
DYOBY|DYO Boya
DZGYO|Deniz GYO
EBEBK|Ebebek Mağazacılık
ECILC|Eczacıbaşı İlaç
ECZYT|Eczacıbaşı Yatırım
EDATA|E-Data Teknoloji
EDIP|Edip Gayrimenkul
EGEEN|Ege Endüstri
EGGUB|Ege Gübre
EGPRO|Ege Profil
EKGYO|Emlak Konut GYO
EKIZ|Ekiz Kimya
EKSUN|Eksun Gıda
ELITE|Elite Naturel Organik
EMKEL|Emek Elektrik
EMNIS|Eminiş Ambalaj
ENERY|Enerya Enerji
ENJSA|Enerjisa Enerji
ENKAI|Enka İnşaat
ENSRI|Ensari Deri
EPLAS|Egeplast
ERBOS|Erbosan
ERCB|Erciyas Çelik Boru
EREGL|Ereğli Demir Çelik
ERSU|Ersu Gıda
ESCOM|Escort Teknoloji
ESEN|Esenboğa Elektrik
ETILR|Etiler Gıda
EUPWR|Europower Enerji
EUREN|Europen Endüstri
FADE|Fade Gıda
FENER|Fenerbahçe Futbol
FLAP|Flap Kongre Toplantı
FMIZP|Federal-Mogul İzmit Piston
FONET|Fonet Bilgi Teknolojileri
FORMT|Formet Metal ve Cam
FRIGO|Frigo-Pak Gıda
FROTO|Ford Otosan
FZLGY|Fuzul GYO
GARAN|Garanti BBVA
GARFA|Garanti Faktoring
GEDIK|Gedik Yatırım Menkul
GEDZA|Gediz Ambalaj
GENIL|Gen İlaç
GENTS|Gentaş
GEREL|Gersan Elektrik
GESAN|Girişim Elektrik
GLRYH|Güler Yatırım Holding
GLYHO|Global Yatırım Holding
GMTAS|Gimat Mağazacılık
GOKNR|Göknur Gıda
GOLTS|Göltaş Çimento
GOODY|Goodyear Lastikleri
GRSEL|Gür-Sel Turizm
GRTHO|Grainturk Holding
GSDDE|GSD Denizcilik
GSDHO|GSD Holding
GSRAY|Galatasaray Sportif
GUBRF|Gübre Fabrikaları
GWIND|Galata Wind Enerji
GZNMI|Gezinomi Seyahat
HALKB|Türkiye Halk Bankası
HATSN|Hat-San Gemi
HDFGS|Hedef Girişim Sermayesi
HEDEF|Hedef Holding
HEKTS|Hektaş
HLGYO|Halk GYO
HRKET|Hareket Proje Taşımacılığı
HTTBT|Hitit Bilgisayar
HUBVC|Hub Girişim Sermayesi
HUNER|Hun Yenilenebilir Enerji
ICBCT|ICBC Turkey Bank
IDGYO|İdealist GYO
IEYHO|Işıklar Enerji Yapı Holding
IHEVA|İhlas Ev Aletleri
IHGZT|İhlas Gazetecilik
IHLAS|İhlas Holding
IHLGM|İhlas Gayrimenkul
IHYAY|İhlas Yayın Holding
IMASM|İmaş Makina
INDES|İndeks Bilgisayar
INFO|İnfo Yatırım Menkul
INTEM|İntema İnşaat
INVEO|Inveo Yatırım Holding
IPEKE|İpek Doğal Enerji
ISBIR|İşbir Holding
ISCTR|Türkiye İş Bankası (C)
ISDMR|İskenderun Demir Çelik
ISFIN|İş Finansal Kiralama
ISGSY|İş Girişim Sermayesi
ISGYO|İş GYO
ISKPL|Işık Plastik
ISMEN|İş Yatırım Menkul
IZENR|İzdemir Enerji
IZFAS|İzmir Fırça
IZINV|İz Yatırım Holding
IZMDC|İzmir Demir Çelik
JANTS|Jantsa Jant
KAPLM|Kaplamin Ambalaj
KAREL|Karel Elektronik
KARSN|Karsan Otomotiv
KARTN|Kartonsan
KARYE|Kartal Yenilenebilir Enerji
KATMR|Katmerciler
KAYSE|Kayseri Şeker
KBORU|Kuzey Boru
KCAER|Kocaer Çelik
KCHOL|Koç Holding
KENT|Kent Gıda
KFEIN|Kafein Yazılım
KGYO|Koray GYO
KLKIM|Kalekim
KLMSN|Klimasan Klima
KLRHO|Kiler Holding
KLSER|Kaleseramik
KMPUR|Kimteks Poliüretan
KNFRT|Konfrut Gıda
KONTR|Kontrolmatik Teknoloji
KONYA|Konya Çimento
KORDS|Kordsa Teknik Tekstil
KOZAA|Koza Anadolu Metal
KRDMD|Kardemir (D)
KRGYO|Körfez GYO
KRONT|Kron Teknoloji
KRPLS|Koroplast
KRSTL|Kristal Kola
KRTEK|Karsu Tekstil
KRVGD|Kervan Gıda
KTLEV|Katılımevim Tasarruf
KUTPO|Kütahya Porselen
KUYAS|Kuyaş Yatırım
KZBGY|Kızılbük GYO
LIDER|Lider Faktoring
LINK|Link Bilgisayar
LKMNH|Lokman Hekim Sağlık
LMKDC|Limak Doğu Anadolu Çimento
LOGO|Logo Yazılım
LUKSK|Lüks Kadife
MAALT|Marmaris Altınyunus
MACKO|Mackolik İnternet
MAGEN|Margün Enerji
MAKTK|Makina Takım
MANAS|Manas Enerji
MARKA|Marka Yatırım Holding
MARTI|Martı Otel
MAVI|Mavi Giyim
MEDTR|Meditera Tıbbi Malzeme
MEGAP|Mega Polietilen
MEPET|Mepet Metro Petrol
MERCN|Mercan Kimya
MERIT|Merit Turizm
MERKO|Merko Gıda
METRO|Metro Ticari ve Mali Yatırımlar
MGROS|Migros
MIATK|Mia Teknoloji
MNDRS|Menderes Tekstil
MNDTR|Mondi Turkey
MOGAN|Mogan Enerji
MPARK|MLP Sağlık
MRSHL|Marshall Boya
MSGYO|Mistral GYO
MTRKS|Matriks Bilgi
MZHLD|Mazhar Zorlu Holding
NATEN|Naturel Yenilenebilir Enerji
NETAS|Netaş Telekomünikasyon
NIBAS|Niğbaş Niğde Beton
NTGAZ|Naturelgaz
NTHOL|Net Holding
NUGYO|Nurol GYO
NUHCM|Nuh Çimento
OBAMS|Oba Makarnacılık
ODAS|Odaş Elektrik
ONCSM|Oncosem Onkolojik
ORGE|Orge Enerji Elektrik
OSMEN|Osmanlı Yatırım Menkul
OTKAR|Otokar
OTTO|Otto Holding
OYAKC|Oyak Çimento
OYLUM|Oylum Sınai Yatırımlar
OYYAT|Oyak Yatırım Menkul
OZGYO|Özderici GYO
OZKGY|Özak GYO
OZRDN|Özerden Ambalaj
PAGYO|Panora GYO
PAMEL|Pamel Yenilenebilir Elektrik
PAPIL|Papilon Savunma
PARSN|Parsan Makina
PASEU|Pasifik Eurasia Lojistik
PCILT|PC İletişim
PEKGY|Peker GYO
PENGD|Penguen Gıda
PENTA|Penta Teknoloji
PETKM|Petkim
PETUN|Pınar Entegre Et ve Un
PGSUS|Pegasus Hava Taşımacılığı
PINSU|Pınar Su
PKART|Plastikkart
PKENT|Petrokent Turizm
PNLSN|Panelsan Çatı Cephe
PNSUT|Pınar Süt
POLHO|Polisan Holding
PRDGS|Pardus Girişim Sermayesi
PRKAB|Türk Prysmian Kablo
PRKME|Park Elektrik Madencilik
PRZMA|Prizma Pres Matbaacılık
PSGYO|Pasifik GYO
QUAGR|QUA Granite
RALYH|Ral Yatırım Holding
REEDR|Reeder Teknoloji
RGYAS|Rönesans Gayrimenkul
RNPOL|Rainbow Polikarbonat
RODRG|Rodrigo Tekstil
ROYAL|Royal Halı
RTALB|RTA Laboratuvarları
RUBNS|Rubenis Tekstil
RYGYO|Reysaş GYO
RYSAS|Reysaş Lojistik
SAFKR|Safkar Ege Soğutmacılık
SAHOL|Sabancı Holding
SAMAT|Saray Matbaacılık
SANEL|San-El Mühendislik
SANFM|Sanifoam Sünger
SANKO|Sanko Pazarlama
SARKY|Sarkuysan
SASA|Sasa Polyester
SAYAS|Say Yenilenebilir Enerji
SDTTR|SDT Uzay ve Savunma
SEKFK|Şeker Finansal Kiralama
SEKUR|Sekuro Plastik
SELEC|Selçuk Ecza Deposu
SELGD|Selçuk Gıda
SEYKM|Seyitler Kimya
SILVR|Silverline Endüstri
SISE|Şişecam
SKBNK|Şekerbank
SKTAS|Söktaş Tekstil
SMART|Smartiks Yazılım
SMRTG|Smart Güneş Enerjisi
SNGYO|Sinpaş GYO
SNICA|Sanica Isı Sanayi
SODSN|Sodaş Sodyum
SOKM|Şok Marketler
SONME|Sönmez Filament
SUNTK|Sun Tekstil
SUWEN|Suwen Tekstil
TABGD|TAB Gıda
TARKM|Tarkim Bitki Koruma
TATGD|Tat Gıda
TAVHL|TAV Havalimanları
TBORG|Türk Tuborg
TCELL|Turkcell
TDGYO|Trend GYO
TEKTU|Tek-Art İnşaat Turizm
TERA|Tera Yatırım Menkul
TEZOL|Europap Tezol Kağıt
TGSAS|TGS Dış Ticaret
THYAO|Türk Hava Yolları
TKFEN|Tekfen Holding
TKNSA|Teknosa
TLMAN|Trabzon Liman
TMPOL|Temapol Polimer
TMSN|Tümosan Motor
TNZTP|Tapdi Oksijen
TOASO|Tofaş Otomobil
TRCAS|Turcas Holding
TRGYO|Torunlar GYO
TRILC|Türk İlaç ve Serum
TSKB|Türkiye Sınai Kalkınma Bankası
TSPOR|Trabzonspor Sportif
TTKOM|Türk Telekom
TTRAK|Türk Traktör
TUCLK|Tuğçelik
TUKAS|Tukaş Gıda
TUPRS|Tüpraş
TUREX|Tureks Turizm
TURSG|Türkiye Sigorta
UFUK|Ufuk Yatırım
ULAS|Ulaşlar Turizm
ULKER|Ülker Bisküvi
ULUFA|Ulusal Faktoring
ULUSE|Ulusoy Elektrik
ULUUN|Ulusoy Un
UNLU|Ünlü Yatırım Holding
USAK|Uşak Seramik
VAKBN|Türkiye Vakıflar Bankası
VAKFN|Vakıf Finansal Kiralama
VAKKO|Vakko Tekstil
VANGD|Vanet Gıda
VBTYZ|VBT Yazılım
VERTU|Verusaturk Girişim
VERUS|Verusa Holding
VESBE|Vestel Beyaz Eşya
VESTL|Vestel Elektronik
VKGYO|Vakıf GYO
VKING|Viking Kağıt
VSNMD|Visne Madencilik
YAPRK|Yaprak Süt
YATAS|Yataş Yatak
YBTAS|Yibitaş Yozgat İşçi Birliği
YEOTK|Yeo Teknoloji Enerji
YGYO|Yeşil GYO
YIGIT|Yiğit Akü
YKBNK|Yapı ve Kredi Bankası
YKSLN|Yükselen Çelik
YONGA|Yonga Mobilya
YUNSA|Yünsa Yünlü Sanayi
YYLGD|Yayla Agro Gıda
ZEDUR|Zedur Enerji
ZOREN|Zorlu Enerji
ZRGYO|Ziraat GYO
EFORC|Efor Çay Sanayi
SURGY|Sur Tatil Evleri GYO
HOROZ|Horoz Lojistik
ONRYT|Onur Yüksek Teknoloji
OZATD|Özata Denizcilik
KOCMT|Koç Metalurji
LILAK|Lila Kağıt
RGYAS|Rönesans Gayrimenkul Yatırım
ENTRA|IC Enterra Yenilenebilir Enerji
MOGAN|Mogan Enerji
ARTMS|Artemis Halı
ALVES|Alves Kablo
OBAMS|Oba Makarnacılık
LMKDC|Limak Doğu Anadolu Çimento
KBORU|Kuzey Boru
MEKAG|Meka Beton Santralleri
DOFER|Dofer Yapı Malzemeleri
MHRGY|MHR Gayrimenkul Yatırım
TABGD|TAB Gıda Sanayi
VRGYO|Vera Konsept GYO
PATEK|Pasifik Teknoloji
ALTNY|Altınay Savunma Teknolojileri
HRKET|Hareket Proje Taşımacılığı
DURKN|Durukan Şekerleme
KOTON|Koton Mağazacılık
BEGYO|Batı Ege GYO
CATES|Çates Elektrik
BINHO|1000 Yatırımlar Holding
MARBL|Tureks Turunç Madencilik
EKOS|Ekos Teknoloji ve Elektrik
EBEBK|Ebebek Mağazacılık
TARKM|Tarkim Bitki Koruma
GIPTA|Gıpta Ofis Kırtasiye
REEDR|Reeder Teknoloji
HATSN|Hatsan Gemi İnşaa
ADGYO|Adra GYO
DMRGD|DMR Unlu Mamuller (Simit Sarayı)
MEGMT|Mega Metal Sanayi
BAHKM|Bahadır Kimya
A1CAP|A1 Capital Yatırım Menkul Değerler
FORTE|Forte Bilgi İletişim Teknolojileri
CVKMD|CVK Maden İşletmeleri
KOPOL|Koza Polyester Sanayi
EUPWR|Europower Enerji
CWENE|CW Enerji Mühendislik
KAYSE|Kayseri Şeker Fabrikası
PASEU|Pasifik Eurasia Lojistik
SDTTR|SDT Uzay ve Savunma Teknolojileri
SOKE|Söke Değirmencilik
TETMT|Tetamat Gıda
GOKNR|Göknur Gıda
EKSUN|Eksun Gıda Tarım
GZNMI|Gezinomi Seyahat
EDIP|Edip Gayrimenkul
ENERY|Enerya Enerji
TATEN|Tatlıpınar Enerji Üretim
IZENR|İzdemir Enerji Elektrik Üretim
OFSYM|Ofis Yem Gıda Sanayi
BYDNR|Baydöner Restoranları
ASGYO|Asce Gayrimenkul Yatırım
DCTTR|DCT Ticaret
GUNDG|Gündoğdu Gıda
CEMZY|Cem Zeytin
KLYSN|Kalyon Güneş Teknolojileri
SEGMN|Seyidoğlu Gıda
"""


def _parse(raw: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in raw.strip().splitlines():
        code, _, name = line.partition("|")
        if code.strip():
            out[code.strip().upper()] = name.strip()
    return out


BIST_TICKERS: dict[str, str] = _parse(_RAW)


def _fold(s: str) -> str:
    """Türkçe karakter duyarsız arama için sadeleştirme."""
    table = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    return s.translate(table).lower()


def search_tickers(query: str = "", limit: int = 25) -> list[dict[str, str]]:
    """Sembol veya şirket adına göre arama. Sembol başı eşleşmeleri önce gelir."""
    raw_query = query.strip()
    clean_code = raw_query.upper().replace(".IS", "")
    q = _fold(clean_code)

    items = [{"symbol": f"{c}.IS", "code": c, "name": n} for c, n in BIST_TICKERS.items()]
    if not q:
        bist30 = set(BIST30)
        return [i for i in items if i["code"] in bist30][:limit]

    def score(item: dict[str, str]) -> int | None:
        code, name = _fold(item["code"]), _fold(item["name"])
        if code == q:
            return 0
        if code.startswith(q):
            return 1
        if name.startswith(q):
            return 2
        if q in code or q in name:
            return 3
        return None

    scored = [(s, i) for i in items if (s := score(i)) is not None]
    scored.sort(key=lambda x: (x[0], x[1]["code"]))
    results = [i for _, i in scored[:limit]]

    # Eğer kullanıcı doğrudan geçerli bir BIST kodu girdiyse (örn: yeni halka arz kodu)
    # ve sonuç listesinde tam eşleşme yoksa dinamik olarak en başa ekle:
    if len(clean_code) >= 3 and clean_code.isalnum():
        if not any(r["code"] == clean_code for r in results):
            results.insert(
                0,
                {
                    "symbol": f"{clean_code}.IS",
                    "code": clean_code,
                    "name": BIST_TICKERS.get(clean_code, f"{clean_code} (Borsa İstanbul / Yahoo)"),
                },
            )

    return results[:limit]


def company_name(symbol: str) -> str | None:
    clean = symbol.upper().replace(".IS", "")
    return BIST_TICKERS.get(clean, f"{clean} Pay Senedi")
