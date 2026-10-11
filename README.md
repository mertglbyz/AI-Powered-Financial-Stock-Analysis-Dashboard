# 📈 AI-Powered Financial Stock Analysis Dashboard

Borsa İstanbul (BIST) hisselerini teknik indikatörler ve Scikit-Learn tabanlı Makine Öğrenmesi (Random Forest) modelleriyle analiz eden, modern, karanlık ve aydınlık tema destekli yeni nesil finansal analiz platformu.

---

## 🚀 Arayüzü Hemen Görmek İçin Ne Yapmalısınız?

Backend ve Frontend servisleri şu an geliştirme ortamınızda arka planda çalışmaktadır. Arayüzü hemen görüntülemek için:

### 1. Tarayıcınızı Açın
Tarayıcınızın adres çubuğuna şu adresi girin:
👉 **[http://localhost:3000](http://localhost:3000)**

### 2. Yapabilecekleriniz
- **Hisse Arama:** Arama kutusuna `THYAO`, `GARAN`, `ASELS`, `EREGL`, `TUPRS`, `KCHOL` veya şirket adı yazarak 420+ BIST hissesi arasından anında arama yapın.
- **Grafik İnceleme:** 1 Ay, 3 Ay, 6 Ay, 1 Yıl, 2 Yıl veya 5 Yıllık dönemleri seçin; SMA 20, SMA 50 ve Bollinger bantlarını açıp kapatın.
- **Alt Göstergeler:** Grafiğin altındaki sekmeden **RSI (14)** veya **MACD** göstergelerine geçin.
- **Yapay Zeka Analiz Kartı:** Sağ panelde modelin sonraki işlem günü için ürettiği **hedef fiyatı**, **yükseliş olasılığını** ve **teknik indikatör sinyallerini** inceleyin.
- **Model Metrikleri:** Sağ üstteki **"Model Metrikleri"** butonuna tıklayarak modelin gerçek test seti doğruluğunu, ROC-AUC skorunu ve en önemli faktörleri görüntüleyin.
- **Tema:** Güneş / Ay butonuna tıklayarak Karanlık veya Aydınlık temaya geçin.

---

## 🛠️ Proje Mimarisi & Geliştirme Günlüğü (Vibe Coding Guide)

Bu proje modüler bir mimariyle, her aşaması test edilerek adım adım inşa edilmiştir:

```text
/Hisse_Senedi_Analiz_Paneli
  ├── /backend
  │    ├── data_pipeline.py      # yfinance ile veri çekme, temizleme, indikatörler (SMA, RSI, MACD, BB, ATR)
  │    ├── bist_tickers.py       # 420+ BIST hissesi ve Türkçe duyarsız hızlı arama
  │    ├── ml_model.py           # RandomForest Regressor & Classifier (Holdout test, feature importance)
  │    ├── main.py               # FastAPI REST API (Pydantic şemaları, CORS, TTL önbellek)
  │    ├── requirements.txt      # Python üretim bağımlılıkları
  │    ├── requirements-dev.txt  # Pytest ve geliştirme bağımlılıkları
  │    ├── Dockerfile            # Python 3.11-slim backend imajı
  │    └── /tests                # Pytest birim ve API test paketi (12 test)
  ├── /frontend
  │    ├── /src/components       # Navbar, TickerSearch, StockHeader, StockChart, PredictionCard, ModelInfoModal
  │    ├── /src/lib/api.ts       # Type-safe FastAPI istemcisi
  │    ├── /src/types/stock.ts   # TypeScript arayüz ve tipleri
  │    ├── /src/app              # Next.js 15 App Router ve Tailwind CSS stilleri
  │    ├── package.json          # Next.js, React 19, Recharts, Lucide Icons
  │    └── Dockerfile            # Node.js 20 multi-stage üretim imajı
  ├── docker-compose.yml         # Tek komutla orkestrasyon
  └── .github/workflows/ci.yml   # GitHub Actions CI/CD iş akışı
```

---

## 🧠 Proje Ne Yapıyor, Nasıl Yapıyor, Ne Aracılığıyla Yapıyor?

### 1. Ne Yapıyor? (Amaç ve Kapsam)
BIST hisselerinin (örn. `THYAO.IS`, `GARAN.IS`) son 5 yıllık geçmiş verilerini analiz ederek:
- Trend yönünü (Yükseliş / Düşüş / Nötr) belirler,
- Sonraki işlem günü için hedef kapanış fiyatını ve %10-%90 güven aralığını hesaplar,
- RSI, MACD, Bollinger Bantları, SMA 20/50 ve ATR göstergelerini çıkarır,
- Kullanıcıya interaktif ve profesyonel bir panel sunar.

### 2. Nasıl Yapıyor? (Yöntem & Matematiksel Altyapı)
- **Veri Boru Hattı:** Ham veriler çekildikten sonra eksik günler `ffill/bfill` ile onarılır, sıfır veya negatif fiyatlar ayıklanır.
- **Ölçekten Bağımsız Özellikler:** Model, ham TL fiyatları yerine oranları ve yüzdeleri öğrenir (örn. `Close / SMA_20 - 1`, `RSI / 100`, `MACD / Close`, BIST100 endeksine göre göreceli güç `rel_strength_20`). Bu sayede tek bir genel model tüm BIST hisselerinde çalışabilir.
- **Zaman Serisi Holdout Testi:** Veri seti rastgele karıştırılmaz (veri sızıntısı engellenir); her hisse için ilk %80 eğitim, son %20 holdout test seti olarak ayrılır.
- **İki Katmanlı Model:**
  1. `RandomForestRegressor`: Ertesi günün getirisini tahmin eder.
  2. `RandomForestClassifier`: Yükseliş olasılığını (`probability_up`) tahmin eder.

### 3. Ne Aracılığıyla Yapıyor? (Tech Stack)
| Alan | Kullanılan Teknolojiler |
|---|---|
| **Veri & İndikatörler** | `yfinance`, `pandas`, `numpy` |
| **Makine Öğrenmesi** | `scikit-learn` (Random Forest), `joblib` |
| **Backend API** | `FastAPI`, `uvicorn`, `pydantic` |
| **Frontend UI** | `Next.js 15` (App Router), `TypeScript`, `Tailwind CSS`, `Recharts`, `Lucide React` |
| **Altyapı & Dağıtım** | `Docker`, `docker-compose`, `GitHub Actions CI/CD` |

---

## ⚡ Yerel Olarak Çalıştırma

### Yöntem A: Doğrudan Ortamınızda Çalıştırma

#### 1. Backend'i Başlatın:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows (Linux/Mac: source .venv/bin/activate)
pip install -r requirements-dev.txt

# Testleri çalıştırın (12 test)
pytest -q tests

# API sunucusunu başlatın
uvicorn main:app --reload --port 8000
```
API Dokümantasyonu: **[http://localhost:8000/docs](http://localhost:8000/docs)**

#### 2. Frontend'i Başlatın:
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
Uygulama: **[http://localhost:3000](http://localhost:3000)**

---

### Yöntem B: Docker & Docker Compose ile Tek Tuşla Çalıştırma

```bash
docker compose up --build
```
Bu komut hem backend'i (`8000:8000`) hem de frontend'i (`3000:3000`) izole konteynerlar içinde ayağa kaldırır ve modeli `bist_model_cache` hacminde kalıcı olarak saklar.

---

## 📡 API Endpoint Referansı

| Metot | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/health` | Servis ve ML model hazır olma durumu |
| `GET` | `/api/tickers?q=thy` | BIST hisse arama (otomatik tamamlama) |
| `GET` | `/api/historical/{ticker}?period=1y` | OHLCV, SMA, RSI, MACD, Bollinger verileri |
| `GET` | `/api/predict/{ticker}` | Fiyat tahmini, trend, güven aralığı ve sinyaller |
| `GET` | `/api/model/info` | Holdout doğruluk metrikleri ve özellik önemleri |
| `POST` | `/api/model/train` | Modeli arka planda yeniden eğitme tetikleyicisi |

---

## 🛡️ CI/CD Entegrasyonu

`.github/workflows/ci.yml` dosyasında yapılandırılmış GitHub Actions iş akışı her `push` ve `pull_request` işleminde otomatik olarak:
1. Python 3.11 üzerinde backend birim ve API testlerini (`pytest`) çalıştırır.
2. Node.js 20 üzerinde Next.js derlemesini (`npm run build`) doğrular.
3. Docker Compose sözdizimini kontrol eder.

---

## ⚠️ Yasal Uyarı (YTD)

Bu yazılımda sunulan tüm veriler, teknik göstergeler ve yapay zeka tahminleri eğitim ve araştırma amaçlıdır. **Kesinlikle yatırım tavsiyesi niteliğinde değildir.** Gerçek finansal kararlar almadan önce lisanslı yatırım danışmanlarına başvurunuz.
