"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Brain,
  BarChart3,
  RotateCw,
  HelpCircle,
  Database,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { ModelInfoResponse } from "@/types/stock";
import { getModelInfo, triggerRetrain } from "@/lib/api";

const FEATURE_TRANSLATIONS: Record<
  string,
  { title: string; description: string }
> = {
  mkt_ret_20: {
    title: "BIST 100 Endeksi 20 Günlük Getirisi",
    description: "Piyasanın son 1 aydaki genel yönü ve makro boğa/ayı trendi",
  },
  mkt_ret_5: {
    title: "BIST 100 Endeksi 5 Günlük Getirisi",
    description: "Piyasanın son haftadaki kısa vadeli ivmesi",
  },
  mkt_close_sma50: {
    title: "Endeksin 50 Günlük Ortalamaya Oranı",
    description: "BIST 100'ün orta vadeli ana trend üzerindeki konumu",
  },
  mkt_ret_1: {
    title: "BIST 100 Endeksi Günlük Değişimi",
    description: "Genel endeksin son günkü momentumu",
  },
  volume_ratio: {
    title: "İşlem Hacminin 20 Günlük Ortalamaya Oranı",
    description: "Hacim patlaması ve kurumsal para girişi/çıkışı göstergesi",
  },
  ret_1: {
    title: "Hissenin Son Gün Getirisi",
    description: "Hisse senedinin 1 günlük son kapanış değişimi",
  },
  ret_5: {
    title: "Hissenin 5 Günlük Getirisi",
    description: "Hissenin 1 haftalık geçmiş fiyat ivmesi",
  },
  ret_10: {
    title: "Hissenin 10 Günlük Getirisi",
    description: "Hissenin 2 haftalık geçmiş fiyat ivmesi",
  },
  ret_20: {
    title: "Hissenin 20 Günlük Getirisi",
    description: "Hissenin 1 aylık geçmiş fiyat ivmesi",
  },
  rel_strength_20: {
    title: "Endekse Göre Göreceli Güç (Alpha)",
    description: "Hissenin BIST 100 endeksine göre pozitif/negatif ayrışması",
  },
  rsi: {
    title: "Göreceli Güç Endeksi (RSI 14 / 100)",
    description: "Aşırı alım (≥70) ve aşırı satım (≤30) osilatör değeri",
  },
  macd_n: {
    title: "Normalize MACD Değeri",
    description: "MACD çizgisinin hisse fiyatına bölünmüş ölçekten bağımsız hali",
  },
  macd_signal_n: {
    title: "Normalize MACD Sinyal Çizgisi",
    description: "MACD'nin 9 günlük üssel hareketli ortalaması",
  },
  macd_hist_n: {
    title: "Normalize MACD Histogramı",
    description: "Kesişim ivmesi ve momentum değişimi",
  },
  close_sma20: {
    title: "Fiyatın SMA 20'ye Uzaklığı",
    description: "Fiyatın 20 günlük hareketli ortalamaya göre sapması",
  },
  close_sma50: {
    title: "Fiyatın SMA 50'ye Uzaklığı",
    description: "Fiyatın 50 günlük hareketli ortalamaya göre sapması",
  },
  sma20_sma50: {
    title: "SMA 20 / SMA 50 Oranı (Trend Yönü)",
    description: "Golden Cross (yükseliş) / Death Cross (düşüş) trend ilişkisi",
  },
  bb_pct: {
    title: "Bollinger Bandı Konumu (%B)",
    description: "Fiyatın alt ve üst Bollinger bantları arasındaki göreceli yeri",
  },
  volatility_10: {
    title: "10 Günlük Tarihsel Volatilite",
    description: "Fiyat getirilerinin 10 günlük standart sapması",
  },
  atr_n: {
    title: "Normalize ATR (Volatilite / Fiyat)",
    description: "Hissenin günlük fiyat dalgalanma şiddeti oranı",
  },
  hl_range: {
    title: "Gün İçi Fiyat Marjı ((High-Low)/Close)",
    description: "En yüksek ve en düşük fiyat arasındaki dalga boyu",
  },
};

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [info, setInfo] = useState<ModelInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getModelInfo()
        .then((res) => setInfo(res))
        .catch((err) => setMessage(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRetrain = async () => {
    setIsRetraining(true);
    setMessage(null);
    try {
      await triggerRetrain();
      setMessage(
        "Yeniden eğitim arka planda başlatıldı. Tamamlandığında metrikler otomatik güncellenecektir."
      );
    } catch (err: any) {
      setMessage(`Eğitim başlatılamadı: ${err.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto card-panel rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Makine Öğrenmesi Model Mimarisi & Metrikler
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                  v{info?.version || 2}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                RandomForestRegressor (Fiyat) + RandomForestClassifier (Yön Olasılığı)
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

        {/* Stock Coverage Explanation Box */}
        <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="w-4 h-4 shrink-0" />
            <span>Tüm BIST Hisseleri Kapsamı & Model Eğitim Mantığı</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            <strong>420+ BIST Hissesi Tamamen Aktiftir:</strong> Sistemde 420&apos;den fazla Borsa İstanbul hissesi tanımlıdır ve arama çubuğundan dilediğiniz hisseyi seçebilirsiniz.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            <strong>Neden BIST30 ile Eğitildi?</strong> Model TL cinsinden ham fiyatı değil; <strong>yüzdesel oranları, göreceli gücü ve volatiliteyi</strong> öğrenir. BIST30 hisseleri spekülatif tavan-taban manipülasyonlarından en uzak, en derinlikli veri kaynağıdır. Model bu likit havuzda öğrendiği genel piyasa dinamiğini Borsa İstanbul&apos;daki <strong>tüm 420+ hisseye</strong> uygulayarak her biri için ayrı tahmin üretir.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Model metrikleri yükleniyor...
          </div>
        ) : info ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Eğitim Kümesi</span>
                <span className="font-bold font-mono text-base text-slate-900 dark:text-white">
                  {info.train_size.toLocaleString()} gün
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">30 BIST30 hissesi</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Test (Holdout)</span>
                <span className="font-bold font-mono text-base text-slate-900 dark:text-white">
                  {info.test_size.toLocaleString()} gün
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Son %20 kronolojik</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Yön Doğruluğu</span>
                <span className="font-bold font-mono text-base text-emerald-500">
                  %{(info.metrics.directional_accuracy * 100).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tüm test günleri</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Güvenli Sinyal</span>
                <span className="font-bold font-mono text-base text-indigo-500">
                  %{(info.metrics.confident_accuracy * 100).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Olasılık ≥%55 veya ≤%45</span>
              </div>
            </div>

            {/* Holdout Test Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Holdout Test Seti Metrikleri (Zaman Serisi Ayrımı)
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {info.test_period.start} &rarr; {info.test_period.end}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">ROC-AUC Skoru:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {info.metrics.roc_auc.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Modelin yükseliş ve düşüş sınıflarını ayırt etme gücü (0.50 = Yazı-tura).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Ortalama Fiyat Sapması (MAE):</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      ₺{info.metrics.mae_price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    6.800+ test gününde gerçek fiyat ile model tahmini arasındaki ortalama TL farkı.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Yükseliş Sinyali Ort. Getirisi:</span>
                    <span className="font-bold font-mono text-emerald-500">
                      +%{ (info.metrics.long_signal_avg_return * 100).toFixed(2) }
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Model &quot;Yükseliş&quot; sinyali verdiğinde hisselerin ertesi gün ortalama getirisi.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Tüm Günler Ort. Getirisi:</span>
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-300">
                      +%{ (info.metrics.all_days_avg_return * 100).toFixed(2) }
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Test dönemindeki tüm hisselerin genel ortalama günlük piyasa getirisi (kıyaslama).
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Importances with Human Friendly Titles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Model Kararlarında En Etkili Faktörler (Özellik Önemleri)
              </h4>
              <div className="space-y-2.5">
                {info.feature_importances.slice(0, 7).map((feat, idx) => {
                  const meta = FEATURE_TRANSLATIONS[feat.feature] || {
                    title: feat.feature,
                    description: "Teknik piyasa göstergesi",
                  };
                  const pct = Math.round(Number(feat.importance) * 100);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {meta.title}
                        </span>
                        <span className="font-mono font-bold text-indigo-500">
                          %{(Number(feat.importance) * 100).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{meta.description}</p>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, pct * 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retrain Trigger */}
            {message && (
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs border border-blue-500/20">
                {message}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Son Model Eğitimi: {new Date(info.trained_at).toLocaleString("tr-TR")}
              </span>
              <button
                onClick={handleRetrain}
                disabled={isRetraining}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRetraining ? "animate-spin" : ""}`}
                />
                <span>{isRetraining ? "Eğitiliyor..." : "Modeli Yeniden Eğit"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {message || "Model detayları bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
};
