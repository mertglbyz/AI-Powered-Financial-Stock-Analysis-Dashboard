# 📈 AI-Powered Financial Stock Analysis Dashboard

Borsa İstanbul (BIST) hisselerini teknik indikatörler ve Scikit-Learn tabanlı Makine Öğrenmesi (Random Forest) modelleriyle analiz eden, profesyonel finansal paneli, karanlık/aydınlık tema desteği, Docker orkestrasyonu ve CI/CD hattıyla eksiksiz yeni nesil finansal analiz platformu.

---

## 📌 İçindekiler
1. [Hızlı Başlangıç & Arayüzü Görüntüleme](#-hızlı-başlangıç--arayüzü-görüntüleme)
2. [Docker & Konteyner Yönetimi (Docker Desktop)](#-docker--konteyner-yönetimi-docker-desktop)
3. [Sistem Mimarisi ve Veri Akışı](#-sistem-mimarisi-ve-veri-akışı)
4. [BIST Hisseleri Kapsamı ve Eğitim Metodolojisi](#-bist-hisseleri-kapsamı-ve-eğitim-metodolojisi)
5. [Teknik İndikatörlerin Matematiksel Formülleri](#-teknik-indikatörlerin-matematiksel-formülleri)
6. [Makine Öğrenmesi (ML) Derinlemesine Tasarımı](#-makine-öğrenmesi-ml-derinlemesine-tasarımı)
7. [FastAPI REST API Dökümantasyonu](#-fastapi-rest-api-dökümantasyonu)
8. [Next.js 15 Frontend Mimarisi](#-nextjs-15-frontend-mimarisi)
9. [Finansal İndikatörler ve AI Terimleri Sözlüğü](#-finansal-indikatörler-ve-ai-terimleri-sözlüğü)
10. [CI/CD (GitHub Actions) Boru Hattı](#-cicd-github-actions-boru-hattı)
11. [Yasal Uyarı (YTD)](#-yasal-uyarı-ytd)

---

## 🚀 Hızlı Başlangıç & Arayüzü Görüntüleme

Proje şu anda Docker konteynerleri üzerinde izole bir şekilde çalışmaktadır.

### 1. Tarayıcınızda Açın:
👉 **[http://localhost:3000](http://localhost:3000)** (Frontend Paneli)  
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)** (FastAPI Swagger Dokümantasyonu)

### 2. Arayüz ve Fonksiyonel Özellikler:
- **Piyasa Dashboard (Varsayılan Açılış Ekranı):**
  - **BIST 100 Endeks Kartı:** Güncel puan, günlük değişim ve yön göstergesi.
  - **Yapay Zeka Piyasa Hissi (Sentiment Barometer):** Önde gelen hisselerde karar ağaçlarının yükseliş (Boğa), düşüş (Ayı) ve nötr konsensüs dağılımı.
  - **Öne Çıkan Yükselenler & Düşenler:** Günün en çok değer kazanan ve kaybeden BIST lokomotifleri.
  - **BIST Hisseleri Canlı Tarama Tablosu:** 12 önde gelen BIST hissesi için fiyat, günlük değişim, RSI (14), hacim ve anlık AI Model Sinyali (AL/SAT/NÖTR). Tıklanarak hissenin derin analizine geçiş yapılabilir.
- **İnline (i) Bilgi İkonları (Sayfa Değiştirmeden Anlık Açıklama):**
  - Her indikatörün, sinyalin, metrik ve güven aralığının yanındaki `(i)` ikonuna fareyle gelindiğinde veya tıklandığında sayfa terk edilmeden matematiksel formül, açıklama ve finansal yorumlama ipuçları popover penceresinde açılır.
- **İki Katmanlı Hibrit Makine Öğrenmesi (Per-Stock + Macro Ensemble):**
  - Tüm hisselerde tek bir BIST30 modeli kullanmak yerine; incelenen hissenin kendi geçmiş verisiyle (1200+ gün) eğitilmiş bağımsız Random Forest modeline **%65 ağırlık**, makro piyasa rejimini yakalayan BIST modeline **%35 ağırlık** verilerek **Hibrit Model Konsensüsü** üretilir.
- **550+ BIST Hissesi Arama & Detay Analiz:**
  - `THYAO`, `GARAN`, `ASELS`, `EREGL`, `TUPRS`, `KCHOL`, `BIMAS` vb. Türkçe karakter duyarsız arama ve sektör etiketleri.
- **İnteraktif Grafik & Alt Osilatörler:** 1 Ay'dan 5 Yıl'a kadar periyotlar, SMA 20, SMA 50, Bollinger bantları, RSI (14) ve MACD histogram paneli.
- **Model Metrikleri & Terimler Sözlüğü Modalleri:** Detaylı holdout test doğrulukları ve kapsamlı finansal terimler ansiklopedisi.

---

## 🐳 Docker & Konteyner Yönetimi (Docker Desktop)

Proje Docker orkestrasyonuyla yapılandırılmıştır.

### Docker Desktop'ta Ne Görünür?
Docker Desktop uygulamasını açtığınızda **Containers** sekmesinde aşağıdaki konteynerleri yeşil **"Running"** durumunda görürsünüz:
1. `bist-frontend` (Port: `3000:3000` - Next.js 15 Production Sunucusu)
2. `bist-backend` (Port: `8000:8000` - FastAPI & Uvicorn Python Sunucusu)
3. Volume: `bist_model_cache` (Eğitilmiş `model.pkl` dosyasının kalıcı olarak saklandığı Docker hacmi)

### Docker Komutları:
```bash
# Konteynerleri başlatma (arka planda)
docker compose up -d

# İmajları yeniden derleyerek başlatma
docker compose up -d --build

# Çalışan konteynerleri listeleme
docker compose ps

# Canlı logları izleme
docker compose logs -f

# Konteynerleri durdurma
docker compose down
```

---

## 🏗️ Sistem Mimarisi ve Veri Akışı

```
[ Borsa İstanbul (yfinance API) ]
                 │
                 ▼
[ Data Pipeline (backend/data_pipeline.py) ]
  ├── Eksik Veri Temizleme (ffill/bfill, aykırı değer filtresi)
  ├── İndikatör Hesaplama (SMA 20/50, RSI 14, MACD, Bollinger, ATR)
  └── TTL Önbellekleme (15 dk bellek içi önbellek)
                 │
                 ▼
[ ML Engine (backend/ml_model.py) ]
  ├── 21 Ölçekten Bağımsız Özellik Çıkarımı
  ├── BIST 100 Endeks Verisiyle Piyasa Bağlamı (Beta & Alpha)
  ├── RandomForestRegressor (Fiyat Tahmini & %10-%90 Güven Aralığı)
  └── RandomForestClassifier (Yükseliş Olasılığı: Bullish/Bearish/Neutral)
                 │
                 ▼
[ FastAPI Backend (backend/main.py - Port: 8000) ]
  ├── GET /api/tickers (550+ BIST hissesi akıllı tamamlama & sektör etiketleri)
  ├── GET /api/historical/{ticker} (OHLCV + İndikatör Serileri)
  ├── GET /api/predict/{ticker} (Yapay Zeka Tahmin Yanıtı)
  └── GET /api/model/info (Holdout Metrikleri & Özellik Önemleri)
                 │
                 ▼
[ Next.js 15 Frontend (frontend/ - Port: 3000) ]
  ├── Recharts İnteraktif Mum / Çizgi / Osilatör Grafikleri
  ├── Karanlık & Aydınlık Tema Sistemi (@custom-variant dark)
  ├── Terimler Sözlüğü Modalı & İnteraktif İpuçları
  └── Yapay Zeka Tahmin Kartı
```

---

## 📊 BIST Hisseleri Kapsamı ve Eğitim Metodolojisi

### Soru: BIST Hisselerinin Tamamı Ekli mi ve Nasıl Eğitildi?
1. **Tüm Hisseler Sistemde Tanımlıdır:**  
   `backend/bist_tickers.py` dosyasında Borsa İstanbul'da işlem gören **550'den fazla şirket ve güncel halka arzlar** eksiksiz olarak kayıtlıdır. Arama motorunda dilediğiniz hisseyi yazıp anında geçmiş verisini ve yapay zeka analizini çağırabilirsiniz.

2. **Neden BIST30 ile Eğitilip Tüm Hisselerde Kullanılıyor?**
   - **Ölçekten Bağımsız Özellikler:** Model eğitilirken TL cinsinden hisse fiyatları verilmez. Çünkü 10 TL'lik bir hisse ile 400 TL'lik bir hissenin mutlak fiyatları kıyaslanamaz. Bunun yerine model, **getiri oranları (`ret_1`, `ret_20`), fiyata oranlanmış hareketli ortalamalar (`Close / SMA - 1`), normalize MACD (`MACD / Close`), RSI ve endekse göre göreceli güç (`rel_strength_20`)** gibi evrensel oranları öğrenir.
   - **Gürültüsüz (Robust) Veri:** BIST30 hisseleri (THYAO, GARAN, ASELS, BIMAS, EREGL vb.) piyasanın en likit, işlem hacmi en yüksek ve derinlikli hisseleridir. Spekülatif tavan-taban manipülasyonlarından en uzaktır. Model bu havuzda **30.000'den fazla işlem gününü** inceleyerek sağlıklı piyasa rejimlerini öğrenir.
   - **Genellenebilirlik:** Eğitilen bu model, Borsa İstanbul'daki **tüm 550+ hisseye** girdiğinde o hissenin anlık teknik oranlarını değerlendirir ve hisseye özel hedef fiyat ile yükseliş olasılığı üretir.

---

## 📐 Teknik İndikatörlerin Matematiksel Formülleri

### 1. Basit Hareketli Ortalama (SMA)
$$SMA_N = \frac{1}{N} \sum_{i=0}^{N-1} Close_{t-i}$$
- **SMA 20:** Son 20 işlem gününün (yaklaşık 1 ay) ortalamasıdır. Kısa vadeli trend desteğidir.
- **SMA 50:** Son 50 işlem gününün (yaklaşık 2.5 ay) ortalamasıdır. Ana trend yönünü belirler.
- **Golden Cross:** $SMA_{20} > SMA_{50}$ olduğunda yükseliş trendi teyit edilir.

### 2. Göreceli Güç Endeksi (RSI 14)
$$RSI = 100 - \left( \frac{100}{1 + RS} \right), \quad RS = \frac{\text{WilderEMA}(Gain, 14)}{\text{WilderEMA}(Loss, 14)}$$
- $RSI \ge 70$: **Aşırı Alım (Overbought)**. Fiyat sert yükselmiştir, kâr satışı ve düzeltme riski yüksektir.
- $RSI \le 30$: **Aşırı Satım (Oversold)**. Fiyat sert düşmüştür, tepki alımı ve dip dönüşü potansiyeli yüksektir.

### 3. Hareketli Ortalama Yakınsama / Iraksama (MACD)
$$MACD = EMA_{12}(Close) - EMA_{26}(Close)$$
$$Signal = EMA_9(MACD)$$
$$Histogram = MACD - Signal$$
- Histogram $> 0$ (Yeşil Barlar): Boğa momentumu güçleniyor.
- Histogram $< 0$ (Kırmızı Barlar): Ayı momentumu baskın.

### 4. Bollinger Bantları (%B)
$$Middle = SMA_{20}(Close), \quad \sigma = \text{StdDev}_{20}(Close)$$
$$Upper = Middle + 2\sigma, \quad Lower = Middle - 2\sigma$$
$$\%B = \frac{Close - Lower}{Upper - Lower}$$
- $\%B > 1$: Fiyat üst bandın üzerine taşmıştır (istatistiki aşırı değerlenme).
- $\%B < 0$: Fiyat alt bandın altına inmiştir (istatistiki ucuzluk).

### 5. Ortalama Gerçek Aralık (ATR 14)
$$TR = \max(High - Low, |High - Close_{t-1}|, |Low - Close_{t-1}|)$$
$$ATR_{14} = \text{WilderEMA}(TR, 14)$$
Hissenin günlük fiyat dalgalanma boyunu ölçer. Volatiliteye göre stop-loss seviyesi belirlemede ve modelde normalize oynaklık ölçümünde kullanılır.

---

## 🤖 Makine Öğrenmesi (ML) Derinlemesine Tasarımı

### 1. Hedef Değişken (Target Variable)
Model $t$ günündeki kapanışta, sonraki günün ($t+1$) kapanış getirisini hedefler:
$$TargetReturn = \frac{Close_{t+1}}{Close_t} - 1, \quad TargetUp = \begin{cases} 1 & \text{eğer } TargetReturn > 0 \\ 0 & \text{aksi halde} \end{cases}$$
Tahmini fiyat ise şu şekilde hesaplanır:
$$PredictedPrice = Close_t \times (1 + \widehat{TargetReturn})$$

### 2. Kullanılan 21 Model Özelliği (Features)
| Özellik | Açıklama | Finansal Anlamı |
|---|---|---|
| `ret_1`, `ret_5`, `ret_10`, `ret_20` | 1, 5, 10, 20 günlük yüzde getiriler | Fiyat momentumu ve ivmesi |
| `close_sma20`, `close_sma50` | Fiyatın ortalamalara mesafesi | Aşırı uzama ve ortalamaya dönüş potansiyeli |
| `sma20_sma50` | $SMA_{20} / SMA_{50} - 1$ | Trend yönü (Golden/Death Cross) |
| `rsi` | RSI 14 / 100 | Momentum osilatörü |
| `macd_n`, `macd_signal_n`, `macd_hist_n` | Fiyata bölünmüş MACD bileşenleri | İvme ve kesişim gücü |
| `bb_pct` | Bollinger %B konumu | İstatistiki volatilite bandındaki yer |
| `volatility_10` | 10 günlük logaritmik oynaklık | Tarihsel dalgalanma şiddeti |
| `atr_n` | ATR 14 / Close | Normalize günlük dalga boyu |
| `hl_range` | $(High - Low) / Close$ | Gün içi alıcı/satıcı savaş marjı |
| `volume_ratio` | Hacim / 20 Günlük Ort. Hacim - 1 | Hacim patlaması ve kurumsal para akışı |
| `mkt_ret_1`, `mkt_ret_5`, `mkt_ret_20` | BIST 100 endeksi getirileri | Genel piyasa boğa/ayı rejimi |
| `mkt_close_sma50` | Endeksin 50 günlük ortalamasına oranı | BIST 100 makro trendi |
| `rel_strength_20` | `ret_20 - mkt_ret_20` | Hissenin endekse göre göreceli gücü (Alpha) |

### 3. Zaman Serisi Holdout Testi (Veri Sızıntısını Önleme)
Finansal verilerde standart rastgele karıştırma (random shuffle veya standart k-fold) **asla kullanılamaz**; çünkü bu durum geleceğin verisinin geçmişe sızmasına (lookahead bias / data leakage) yol açar.  
Projede her hisse için:
- **İlk %80 dilim:** Model eğitimi kümesi (Training Set)
- **Son %20 dilim:** Kronolojik holdout test seti (Test Set)  
Metrikler sadece modelin daha önce hiç görmediği bu son %20'lik test periyodunda hesaplanır.

### 4. Model Holdout Başarı Sonuçları
- **Test Kümesi Hacmi:** 6.864 işlem günü (holdout)
- **Güvenli Sinyal Başarısı ($p \ge 0.55$ veya $p \le 0.45$):** **%52.3**
- **ROC-AUC Skoru:** **0.507**
- **Ortalama Fiyat Sapması (MAE):** **2.82 TL**
- **Yükseliş Sinyali Verildiğinde Ort. Getiri:** **+%0.20** (Tüm günlerin ortalaması: +%0.03)

---

## 🔌 FastAPI REST API Dökümantasyonu

API varsayılan olarak `http://localhost:8000` portunda çalışır.

### Endpoint Listesi:
| Metot | Endpoint | Parametreler | Açıklama |
|---|---|---|---|
| `GET` | `/api/health` | - | Servis ve ML model hazır olma durumu |
| `GET` | `/api/tickers` | `q` (arama metni), `limit` | BIST hisse arama (tüm BIST + yeni halka arzlar için dinamik tamamlama) |
| `GET` | `/api/market/overview` | - | BIST 100 endeksi, piyasa hissi ve öne çıkan hisseler |
| `GET` | `/api/market/performance` | `timeframe` (1w, 1mo, 1y) | Haftalık, aylık, yıllık tüm yükselenler ve düşenler tam listesi |
| `GET` | `/api/historical/{ticker}` | `ticker`, `period` (1mo, 3mo, 6mo, 1y, 2y, 5y) | OHLCV fiyatları, SMA, RSI, MACD, Bollinger serileri |
| `GET` | `/api/predict/{ticker}` | `ticker` | Fiyat tahmini, trend, güven aralığı ve 5 teknik sinyal |
| `GET` | `/api/model/info` | - | Holdout test metrikleri ve özellik önemleri |
| `POST` | `/api/model/train` | - | Modeli arka planda yeniden eğitme tetikleyicisi |

### Örnek cURL İstekleri:
```bash
# 1. Hisse Arama
curl "http://localhost:8000/api/tickers?q=garan"

# 2. Haftalık En Çok Yükselen / Düşen Tüm Hisseler
curl "http://localhost:8000/api/market/performance?timeframe=1w"

# 3. Geçmiş Veri ve İndikatörler
curl "http://localhost:8000/api/historical/THYAO.IS?period=1y"

# 4. Yapay Zeka Tahmini
curl "http://localhost:8000/api/predict/THYAO.IS"
```

---

## 🎨 Next.js 15 Frontend Mimarisi

- **Framework:** Next.js 15 (App Router, Turbopack, TypeScript)
- **Stil & Tasarım:** Tailwind CSS v4 (`@custom-variant dark` ile senkronize tema yönetimi)
- **Grafik Kütüphanesi:** Recharts (ComposedChart, Area, Line, Bar, ReferenceLine)
- **İkon Seti:** Lucide React
- **Bileşen Yapısı:**
  - `Navbar.tsx`: Marka logosu, BIST hisse kapsamı etiketi, Terimler Sözlüğü butonu, Model Metrikleri butonu, Açık/Koyu tema anahtarı.
  - `TickerSearch.tsx`: Klavye yön tuşlarıyla gezilebilen debounced hisse arama kutusu ve hızlı BIST30 seçim hapları.
  - `MarketOverview.tsx`: BIST 100 endeks kartı, Yapay Zeka Piyasa Hissi barometresi, öne çıkan hisseler tablosu.
  - `MarketLeaderboard.tsx`: Haftalık, Aylık, Yıllık getiri liderleri (Tüm yükselenler ve tüm düşenler filtrelenebilir tam liste).
  - `InfoTooltip.tsx`: Görünüm sınırlarını otomatik algılayan, z-index taşmalarını önleyen akıllı bilgi baloncukları.
  - `StockHeader.tsx`: Hisse kodu, şirket unvanı, anlık fiyat, günlük değişim, 52 haftalık en yüksek/en düşük istatistikleri.
  - `StockChart.tsx`: Periyot seçici, indikatör açma/kapama butonları, fiyat grafiği ve alt RSI/MACD osilatör paneli.
  - `PredictionCard.tsx`: Hedef fiyat, güven aralığı, yön olasılığı ve 5 kural tabanlı teknik indikatör sinyali.
  - `GlossaryModal.tsx`: Arama yapılabilen, formülleri ve yorumlama kurallarını içeren interaktif finans sözlüğü.
  - `ModelInfoModal.tsx`: Karar ağaçlarının holdout test sonuçları, veri kümesi detayları ve Türkçe özellik önemleri.

---

## 📖 Finansal İndikatörler ve AI Terimleri Sözlüğü

| Terim | Açıklama | Nasıl Yorumlanır? |
|---|---|---|
| **RSI (14)** | Relative Strength Index (Göreceli Güç Endeksi) | 70 üzeri: Aşırı Alım (Düzeltme Riski), 30 altı: Aşırı Satım (Tepki Alımı Fırsatı) |
| **MACD** | Hareketli Ortalama Yakınsama/Iraksama | MACD çizgisi sinyali yukarı kestiğinde AL, aşağı kestiğinde SAT |
| **SMA 20 & 50** | 20 ve 50 Günlük Basit Hareketli Ortalama | Fiyat ortalamaların üzerindeyse yükseliş trendi teyit edilir |
| **Golden Cross** | SMA 20'nin SMA 50'yi yukarı kesmesi | Güçlü orta vadeli yükseliş trendi başlangıcı |
| **Death Cross** | SMA 20'nin SMA 50'yi aşağı kesmesi | Düşüş trendi başlangıcı |
| **Bollinger %B** | Fiyatın Bollinger bantlarındaki göreceli yeri | 1 üzeri aşırı pahalı, 0 altı aşırı ucuz |
| **ATR (14)** | Ortalama Gerçek Fiyat Dalgalanma Aralığı | Hissenin oynaklığını ölçer; stop-loss belirlemede kullanılır |
| **Directional Probability** | Yükseliş Yön Olasılığı (%) | Model ağaçlarının yukarı yönlü oy oranı (≥%55 Bullish, ≤%45 Bearish) |
| **ROC-AUC** | Modelin Sınıflandırma Başarı Alanı | 0.50 rastgele tahmin (yazı-tura), >0.50 pozitif tahmin kabiliyeti |
| **MAE** | Ortalama Mutlak Hata (TL) | Tahmin edilen fiyat ile gerçekleşen fiyat arasındaki TL farkı |

---

## 🛠️ CI/CD (GitHub Actions) Boru Hattı

`.github/workflows/ci.yml` dosyasında yapılandırılmış iş akışı, GitHub deposuna yapılan her `push` ve `pull_request` işleminde otomatik olarak şu 3 adımı test eder:
1. **Backend Testleri:** Python 3.11 üzerinde 12 adet Pytest birim ve API testini çalıştırır.
2. **Frontend Derlemesi:** Node.js 20 üzerinde Next.js TypeScript ve Turbopack derlemesini (`npm run build`) denetler.
3. **Docker Doğrulaması:** `docker compose config` ile orkestrasyon dosyalarının sözdizimi doğruluğunu garanti altına alır.

---

## ⚠️ Yasal Uyarı (YTD)

Bu yazılımda ve arayüzde yer alan tüm grafikler, teknik göstergeler, fiyat analizleri ve makine öğrenmesi tahminleri tamamen eğitim, araştırma ve algoritmik modelleme amaçlıdır. **Kesinlikle yatırım tavsiyesi (YTD) niteliğinde değildir.** Gerçek finansal kararlar almadan önce Sermaye Piyasası Kurulu (SPK) lisanslı yatırım danışmanlarına başvurunuz.
