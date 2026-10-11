# AI-Powered Financial Stock Analysis Dashboard - Geliştirme Yönergesi

## 1. Projenin Amacı ve Özeti
Bu projenin amacı, Borsa İstanbul (BIST) hisselerinin (örneğin THYAO.IS, PGSUS.IS) geçmiş verilerini çekerek analiz eden, finansal indikatörler (RSI, SMA, MACD) hesaplayan ve Scikit-Learn tabanlı bir Makine Öğrenmesi modeli ile kısa vadeli trend/fiyat tahminleri üreten bir web platformu geliştirmektir. 
Sistem; Python tabanlı bir veri/ML backend'i, Next.js tabanlı modern bir arayüz ve tüm bu yapıyı kapsayan Docker mimarisinden oluşacaktır.

## 2. Kullanılacak Teknoloji Yığını (Tech Stack)
- **Veri Sağlayıcı:** `yfinance`
- **Veri İşleme & ML:** `pandas`, `numpy`, `scikit-learn`, `joblib` (modeli kaydetmek için)
- **Backend:** `FastAPI` (Python), `uvicorn`
- **Frontend:** `Next.js` (React, TypeScript), `Tailwind CSS`, `Recharts` (veya `react-financial-charts`)
- **Altyapı:** `Docker`, `docker-compose`

## 3. Sistem Mimarisi ve Klasör Yapısı
Projeyi aşağıdaki klasör yapısına sadık kalarak inşa etmelisin:
```text
/finance-ai-dashboard
  ├── /backend
  │    ├── data_pipeline.py      # yfinance ile veri çekme ve Pandas temizleme işlemleri
  │    ├── ml_model.py           # Modelin eğitilmesi, test edilmesi ve .pkl olarak kaydedilmesi
  │    ├── main.py               # FastAPI uygulamasının giriş noktası ve endpoint'ler
  │    ├── requirements.txt      # Python bağımlılıkları
  │    └── Dockerfile            # Backend Docker yapılandırması
  ├── /frontend
  │    ├── /src/components       # Dashboard, Chart ve Prediction UI bileşenleri
  │    ├── /src/app              # Next.js App Router sayfaları
  │    ├── package.json          
  │    └── Dockerfile            # Frontend Docker yapılandırması
  └── docker-compose.yml         # Tüm servisleri orkestre eden dosya
```

## 4. Yapay zeka Ajanı İçin Genel Geliştirme Kuralları (Agent Instructions)
1. **Modülerlik:** Kodu asla tek bir dosyaya yığma. Belirtilen klasör yapısına tam olarak uy.
2. **Hata Yönetimi:** FastAPI endpoint'lerinde `try-except` bloklarını kullan. `yfinance` veri çekemezse (HTTP 404/500) anlamlı JSON hata mesajları döndür.
3. **Tip Güvenliği:** Next.js tarafında mutlaka TypeScript arayüzlerini (Interface/Type) tanımla (örneğin API'den dönecek hisse verisi için `StockData` tipi). Backend tarafında Pydantic modelleri kullan.
4. **Adım Adım İlerleme:** Aşağıdaki fazları (Phase) sırasıyla tamamla. Bir fazı tamamen çalışır duruma getirmeden ve test etmeden diğerine geçme.

---

## 5. Geliştirme Fazları (Genişletilmiş Görev Tanımları)

### Phase 1: Veri Boru Hattı (Data Pipeline) ve Özellik Çıkarımı
**Dosya:** `backend/data_pipeline.py`
- Görev: `yfinance` kullanarak verilen bir hisse sembolü (örneğin "THYAO.IS") için son 5 yıllık günlük veriyi çeken bir fonksiyon yaz.
- İşlem: Gelen verideki eksik değerleri (NaN) Pandas kullanarak doldur/temizle.
- Özellik Çıkarımı (Feature Engineering): Veri setine 20 günlük (SMA_20) ve 50 günlük (SMA_50) hareketli ortalamaları, RSI (14 günlük) ve MACD göstergelerini hesaplayıp yeni kolonlar olarak ekle.
- Çıktı: Temizlenmiş ve indikatörleri eklenmiş bir Pandas DataFrame döndür.

### Phase 2: Makine Öğrenmesi Modelinin Kurulması
**Dosya:** `backend/ml_model.py`
- Görev: `data_pipeline.py`'den gelen veriyi kullanarak bir tahmin modeli eğit.
- Model Tipi: Gelecek 1 günün kapanış fiyatını tahmin etmek için `RandomForestRegressor` veya trend yönünü tahmin etmek için `RandomForestClassifier` kullanabilirsin. Hedef değişkeni (Target Variable) buna göre oluştur (Shift operasyonu ile 1 gün sonrasının fiyatı).
- İşlem: Veriyi eğitim (%80) ve test (%20) olarak ayır. Modeli eğit.
- Kayıt: Eğitilmiş modeli `joblib` kullanarak `model.pkl` adıyla kaydet. Sadece model yoksa veya manuel tetiklenirse eğitim yapacak bir mantık kur (API her çağrıldığında baştan eğitim yapılmamalı).

### Phase 3: FastAPI Backend Entegrasyonu
**Dosya:** `backend/main.py`
- Görev: İki adet REST API endpoint'i oluştur. CORS ayarlarını Next.js uygulamasının erişebileceği şekilde (`localhost:3000`) yapılandır.
- `GET /api/historical/{ticker}`: İlgili hissenin geçmiş verilerini ve hesaplanan indikatörlerini JSON formatında döndür. (Tarih, Açılış, Kapanış, Yüksek, Düşük, Hacim, RSI, SMA vb.)
- `GET /api/predict/{ticker}`: Kaydedilmiş `model.pkl` dosyasını yükle. Hissenin güncel verilerini kullanarak modelden bir tahmin al ve kullanıcıya JSON olarak döndür (Örn: `{"ticker": "THYAO.IS", "predicted_price": 285.50, "trend": "BULLISH"}`).

### Phase 4: Next.js Frontend (Dashboard)
**Dizin:** `/frontend`
- Görev: Next.js ve Tailwind CSS kullanarak modern, hem karanlık hem de aydınlık temanın (dark mode ve light mode) bulunacağı, kullanıcı tarafından seçilebilen bir finans paneli yap.
- Bileşenler:
  1. **Arama Çubuğu:** Kullanıcının hisse kodunu girebileceği bir alan.
  2. **Grafik Paneli:** `Recharts` kütüphanesini kullanarak API'den gelen tarih, fiyat, SMA_20 ve SMA_50 verilerini gösteren bir çizgi veya mum grafik çiz. Altında veya aynı grafik üzerinde RSI seviyesini de göster.
  3. **Yapay Zeka Analiz Kartı:** FastAPI'nin `/predict` ucundan gelen veriyi gösteren şık bir kart. Tahmin "Yükseliş" ise yeşil, "Düşüş" ise kırmızı renk tonları kullan.

### Phase 5: Dockerizasyon ve Orkestrasyon
**Dosyalar:** `Dockerfile` (x2), `docker-compose.yml`
- Görev: Projenin tek tuşla ayağa kalkmasını sağla.
- İşlem: Backend için Python 3.10+, Frontend için Node.js 18+ imajlarını kullan. Portları `8000:8000` (Backend) ve `3000:3000` (Frontend) olarak ayarla. `docker-compose up --build` komutu verildiğinde her iki servisin de hatasız çalışmasını garanti altına al.