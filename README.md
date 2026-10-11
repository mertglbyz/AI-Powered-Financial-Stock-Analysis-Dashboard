# AI-Powered Financial Stock Analysis Dashboard

Borsa İstanbul (BIST) hisselerinin geçmiş verilerini analiz eden, teknik indikatörler (RSI, SMA, MACD) hesaplayan ve Scikit-Learn tabanlı bir ML modeliyle kısa vadeli tahminler üreten web platformu.

## Tech Stack
- **Data/ML:** yfinance, pandas, numpy, scikit-learn, joblib
- **Backend:** FastAPI, uvicorn
- **Frontend:** Next.js (TypeScript), Tailwind CSS, Recharts
- **Infra:** Docker, docker-compose

## Yol Haritası
- [x] Phase 1 – Data Pipeline & Feature Engineering
- [x] Phase 2 – ML Model
- [ ] Phase 3 – FastAPI Backend
- [ ] Phase 4 – Next.js Dashboard
- [ ] Phase 5 – Docker
- [ ] CI/CD (GitHub Actions)

> Detaylı mimari ve "nasıl çalışır" dokümantasyonu ilerleyen fazlarda eklenecek.

## Hızlı Test
```bash
cd backend
pip install -r requirements-dev.txt
python data_pipeline.py THYAO.IS        # Phase 1: veri + indikatörler
python ml_model.py --train              # Phase 2: modeli eğit -> model.pkl
python ml_model.py --predict THYAO.IS   # Phase 2: tahmin (model varsa yeniden eğitmez)
pytest -q tests                         # Birim testleri (internetsiz)
```

