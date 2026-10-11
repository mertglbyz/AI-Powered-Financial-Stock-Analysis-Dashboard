# AI-Powered Financial Stock Analysis Dashboard

Borsa İstanbul (BIST) hisselerinin geçmiş verilerini analiz eden, teknik indikatörler (RSI, SMA, MACD) hesaplayan ve Scikit-Learn tabanlı bir ML modeliyle kısa vadeli tahminler üreten web platformu.

## Tech Stack
- **Data/ML:** yfinance, pandas, numpy, scikit-learn, joblib
- **Backend:** FastAPI, uvicorn
- **Frontend:** Next.js (TypeScript), Tailwind CSS, Recharts
- **Infra:** Docker, docker-compose

## Yol Haritası
- [x] Phase 1 – Data Pipeline & Feature Engineering
- [ ] Phase 2 – ML Model
- [ ] Phase 3 – FastAPI Backend
- [ ] Phase 4 – Next.js Dashboard
- [ ] Phase 5 – Docker

## Phase 1 – Hızlı Test
```bash
cd backend
pip install -r requirements.txt
python data_pipeline.py THYAO.IS
```
