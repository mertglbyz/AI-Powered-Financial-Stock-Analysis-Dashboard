"use client";

import React, { useState } from "react";
import { X, BookOpen, Search, HelpCircle, Activity, TrendingUp, BarChart2, Cpu } from "lucide-react";

interface GlossaryItem {
  id: string;
  category: "Teknik Gösterge" | "Makine Öğrenmesi" | "Finansal Metrik";
  term: string;
  fullTitle: string;
  formula?: string;
  summary: string;
  interpretation: string;
  rules: string[];
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: "rsi",
    category: "Teknik Gösterge",
    term: "RSI (14)",
    fullTitle: "Relative Strength Index (Göreceli Güç Endeksi - 14 Günlük)",
    formula: "RSI = 100 - (100 / (1 + (Ortalama Kazanç / Ortalama Kayıp)))",
    summary:
      "Fiyat hareketlerinin hızını ve değişim şiddetini 0 ile 100 arasında ölçen momentum osilatörüdür. J. Welles Wilder tarafından geliştirilmiştir.",
    interpretation:
      "Aşırı alım veya aşırı satım bölgelerini tespit ederek trend dönüşü sinyalleri üretir.",
    rules: [
      "70 ve Üzeri (Aşırı Alım / Overbought): Fiyat hızlı yükselmiş olabilir, düzeltme veya kâr satışı riski yüksektir.",
      "30 ve Altı (Aşırı Satım / Oversold): Fiyat sert düşmüş olabilir, tepki alımı veya dip dönüşü fırsatı olabilir.",
      "30 - 70 Arası (Nötr Bölge): Dengeli piyasa koşullarını ifade eder.",
    ],
  },
  {
    id: "macd",
    category: "Teknik Gösterge",
    term: "MACD",
    fullTitle: "Moving Average Convergence Divergence (Hareketli Ortalama Yakınsama/Iraksama)",
    formula: "MACD = EMA(12) - EMA(26) | Sinyal = EMA(9, MACD) | Histogram = MACD - Sinyal",
    summary:
      "Gerald Appel tarafından geliştirilen, iki farklı üssel hareketli ortalama (12 ve 26 günlük) arasındaki ilişkiyi gösteren trend takip göstergesidir.",
    interpretation:
      "MACD çizgisi sinyal çizgisini yukarı kestiğinde alım momentumu, aşağı kestiğinde satım momentumu güçlenir.",
    rules: [
      "MACD > Sinyal (Pozitif Kesişim): Yükseliş yönlü momentumun güçlendiğini işaret eder.",
      "MACD < Sinyal (Negatif Kesişim): Düşüş yönlü baskının arttığını işaret eder.",
      "Histogram Barları: Sıfırın üzerinde büyüyen yeşil barlar yükseliş ivmesini, sıfırın altındaki kırmızı barlar düşüş ivmesini gösterir.",
    ],
  },
  {
    id: "sma",
    category: "Teknik Gösterge",
    term: "SMA 20 & SMA 50",
    fullTitle: "Simple Moving Average (20 ve 50 Günlük Basit Hareketli Ortalama)",
    formula: "SMA_N = (P1 + P2 + ... + PN) / N",
    summary:
      "Belirli bir zaman dilimindeki (20 gün: yaklaşık 1 ay, 50 gün: yaklaşık 2.5 ay) kapanış fiyatlarının aritmetik ortalamasıdır. Piyasa gürültüsünü filtreleyerek ana trendi görmeyi sağlar.",
    interpretation:
      "Kısa vadeli ortalamanın uzun vadeli ortalamayı kesmesi ve fiyatın ortalamalara konumu ana yönü belirler.",
    rules: [
      "Golden Cross (Altın Kesişim): SMA 20'nin SMA 50'yi yukarı yönlü kesmesi güçlü yükseliş trendi başlangıcıdır.",
      "Death Cross (Ölüm Kesişimi): SMA 20'nin SMA 50'yi aşağı yönlü kesmesi düşüş trendi başlangıcıdır.",
      "Destek / Direnç: Fiyat yükselirken SMA 20 ve 50 dinamik destek görevi görür.",
    ],
  },
  {
    id: "bollinger",
    category: "Teknik Gösterge",
    term: "Bollinger Bantları (%B)",
    fullTitle: "Bollinger Bands (20 Günlük, 2 Standart Sapma)",
    formula: "Orta Bant = SMA(20) | Üst Bant = SMA(20) + 2σ | Alt Bant = SMA(20) - 2σ",
    summary:
      "John Bollinger tarafından geliştirilen, fiyatın göreceli yüksek veya düşük olduğunu ve piyasa volatilitesini ölçen bant sistemidir.",
    interpretation:
      "Bantların daralması büyük bir fiyat patlamasının (squeeze) habercisi olabilir. Fiyatın üst veya alt banda dokunması aşırı fiyatlamayı gösterir.",
    rules: [
      "Üst Bandın Üzeri (%B > 1): İstatistiki olarak fiyat ortalamadan 2 standart sapma yukarı sapmıştır.",
      "Alt Bandın Altı (%B < 0): İstatistiki olarak aşırı ucuzlama veya sert panik satışı bölgesidir.",
      "Bant Genişliği Artışı: Yüksek volatilite; Bant Daralması: Düşük volatilite ve konsolidasyon.",
    ],
  },
  {
    id: "atr",
    category: "Teknik Gösterge",
    term: "ATR (14)",
    fullTitle: "Average True Range (Ortalama Gerçek Aralık - 14 Günlük)",
    formula: "TR = max(High - Low, |High - Close_önceki|, |Low - Close_önceki|)",
    summary:
      "Hissenin son 14 gündeki günlük fiyat dalgalanma şiddetini (volatilitesini) mutlak TL cinsinden ölçer. Trend yönü belirtmez, sadece hareket büyüklüğünü gösterir.",
    interpretation:
      "Yüksek ATR yüksek oynaklık ve risk/fırsat anlamına gelirken, düşük ATR sakin ve yatay fiyat hareketini gösterir.",
    rules: [
      "Stop-Loss Belirleme: ATR genellikle dinamik zarar durdurma (stop-loss) seviyelerini hissenin oynaklığına göre ayarlamak için kullanılır.",
      "Model Özelliği: Normalize ATR (ATR/Fiyat), modelin oynaklığa göre getiri beklentisini ayarlamasını sağlar.",
    ],
  },
  {
    id: "mkt_ret",
    category: "Makine Öğrenmesi",
    term: "Piyasa Bağlamı (mkt_ret_*)",
    fullTitle: "BIST 100 Endeksi Getirisi ve Göreceli Güç (Alpha)",
    formula: "mkt_ret_20 = Endeks_t / Endeks_{t-20} - 1 | rel_strength = ret_20 - mkt_ret_20",
    summary:
      "Borsa İstanbul'da hiçbir hisse endeksten tamamen bağımsız hareket edemez. Model, BIST 100 endeksinin 1, 5 ve 20 günlük yönünü hissenin kendi hareketiyle birlikte analiz eder.",
    interpretation:
      "Endeks yükselirken hissenin endeksten daha güçlü olup olmadığını (göreceli güç) ve genel piyasa rejimini (boğa/ayı) ölçer.",
    rules: [
      "Pozitif Göreceli Güç (rel_strength > 0): Hisse endekse liderlik ediyor (kurumsal talep yüksek).",
      "Negatif Göreceli Güç (rel_strength < 0): Hisse endekse ayak uyduramıyor (zayıf momentum).",
    ],
  },
  {
    id: "confidence",
    category: "Makine Öğrenmesi",
    term: "Yükseliş Olasılığı & Güven Aralığı",
    fullTitle: "Directional Probability & 10th-90th Percentile Confidence Interval",
    formula: "Probability = Pozitif_Ağaçlar / Toplam_Ağaç | Güven = |Probability - 0.5| * 2",
    summary:
      "Random Forest modelindeki 400 karar ağacının oylama dağılımıdır. Model sadece tek bir fiyat tahmin etmekle kalmaz, ağaçların ne kadar hemfikir olduğunu ve fiyatın düşebileceği en olası alt-üst bandı (%10-%90 persentil) verir.",
    interpretation:
      "Olasılık %50'ye çok yakın olduğunda piyasa belirsizdir (NÖTR). Olasılık %55 üzeri veya %45 altı olduğunda güvenli sinyal üretilir.",
    rules: [
      "%55 ve Üzeri: Yükseliş Beklentisi (BULLISH) - Ağaçların çoğunluğu yukarı yönlü getiri öngörüyor.",
      "%45 ve Altı: Düşüş Beklentisi (BEARISH) - Ağaçların çoğunluğu aşağı yönlü getiri öngörüyor.",
      "%45 - %55 Arası: Nötr / Yatay Beklenti (NEUTRAL) - Yön konusunda net bir istatistiki üstünlük yok.",
    ],
  },
  {
    id: "roc_auc",
    category: "Makine Öğrenmesi",
    term: "ROC-AUC Skoru",
    fullTitle: "Receiver Operating Characteristic - Area Under Curve",
    formula: "ROC Eğrisinin Altındaki Alan (0.50 = Yazı-Tura, 1.00 = Kusursuz Ayrım)",
    summary:
      "Sınıflandırma modelinin yükseliş günlerini düşüş günlerinden ayırt etme yeteneğini ölçen evrensel makine öğrenmesi metriğidir.",
    interpretation:
      "Finansal zaman serilerinde yüksek gürültü nedeniyle 0.51 - 0.55 arasındaki AUC skorları bile istatistiki bir alfa (üstünlük) sağlar.",
    rules: [
      "0.50: Rastgele tahmin (yazı-tura).",
      "> 0.50: Modelin tesadüften daha iyi tahmin kabiliyeti olduğunu gösteren pozitif sinyal.",
    ],
  },
  {
    id: "mae",
    category: "Finansal Metrik",
    term: "MAE & RMSE (Hata Payları)",
    fullTitle: "Mean Absolute Error & Root Mean Squared Error",
    formula: "MAE = (1/n) * Σ |Gerçek_Fiyat - Tahmin_Fiyat|",
    summary:
      "Modelin holdout test setindeki tahminlerinin gerçek fiyatlardan ortalama kaç TL saptığını gösteren mutlak hata ölçütüdür.",
    interpretation:
      "Örneğin MAE = 2.82 TL demek, test edilen 6.800'den fazla işlem gününde modelin ortalama fiyat sapmasının 2.82 TL olduğu anlamına gelir.",
    rules: [
      "Düşük MAE: Tahminlerin gerçek fiyatlara daha yakın olduğunu gösterir.",
    ],
  },
];

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  if (!isOpen) return null;

  const categories = ["Tümü", "Teknik Gösterge", "Makine Öğrenmesi", "Finansal Metrik"];

  const filtered = GLOSSARY_ITEMS.filter((item) => {
    const matchesCategory =
      selectedCategory === "Tümü" || item.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.term.toLowerCase().includes(q) ||
      item.fullTitle.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col card-panel rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Finansal İndikatörler & Yapay Zeka Sözlüğü
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Panelde yer alan tüm indikatörlerin, metriklerin ve formüllerin detaylı açıklamaları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-white dark:bg-slate-900/80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Terim ara (RSI, MACD, Bollinger, SMA, MAE, Volatilite)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Aradığınız kriterle eşleşen terim bulunamadı.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.term}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      • {item.fullTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 self-start sm:self-auto">
                    {item.category}
                  </span>
                </div>

                {item.formula && (
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                    <code>{item.formula}</code>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.summary}
                </p>

                <div className="space-y-1.5 pt-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block">
                    Nasıl Yorumlanır?
                  </span>
                  <ul className="space-y-1">
                    {item.rules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5"
                      >
                        <span className="text-blue-500 font-bold shrink-0">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
