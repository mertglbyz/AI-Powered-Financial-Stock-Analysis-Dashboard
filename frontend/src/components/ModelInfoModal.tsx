"use client";

import React, { useEffect, useState } from "react";
import { X, Brain, CheckCircle2, RotateCw, BarChart3, Database } from "lucide-react";
import { ModelInfoResponse } from "@/types/stock";
import { getModelInfo, triggerRetrain } from "@/lib/api";

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
      setMessage("Yeniden eğitim arka planda başlatıldı. Birkaç dakika içinde güncellenecektir.");
    } catch (err: any) {
      setMessage(`Eğitim başlatılamadı: ${err.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Makine Öğrenmesi Model Mimarisi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Random Forest Regressor & Classifier (v{info?.version || 2})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Model bilgileri yükleniyor...
          </div>
        ) : info ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Eğitim Verisi</span>
                <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">
                  {info.train_size.toLocaleString()} gün
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Test Verisi (Holdout)</span>
                <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">
                  {info.test_size.toLocaleString()} gün
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Eğitilen Hisseler</span>
                <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">
                  {info.tickers.length} BIST30
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Yön Doğruluğu</span>
                <span className="font-bold font-mono text-sm text-emerald-500">
                  %{(info.metrics.directional_accuracy * 100).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Holdout Test Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Holdout Test Seti Metrikleri (Zaman Serisi Ayrımı)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Güvenli Sinyal Doğruluğu:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      %{(info.metrics.confident_accuracy * 100).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Olasılık &ge; %55 veya &le; %45 olduğundaki başarı oranı
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ROC-AUC Skoru:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {info.metrics.roc_auc.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Yükseliş ve düşüş sınıflarını ayırt etme gücü
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ortalama Fiyat Hatası (MAE):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₺{info.metrics.mae_price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Test dönemindeki hisse başına ortalama mutlak sapma
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Test Dönemi Aralığı:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {info.test_period.start} &rarr; {info.test_period.end}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kronolojik son %20 holdout veri dilimi
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Importances */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                En Önemli 6 Model Özelliği (Feature Importances)
              </h4>
              <div className="space-y-2">
                {info.feature_importances.slice(0, 6).map((feat, idx) => {
                  const pct = Math.round(Number(feat.importance) * 100);
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {feat.feature}
                        </span>
                        <span className="text-slate-400 font-mono">
                          %{(Number(feat.importance) * 100).toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, pct * 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions & Status */}
            {message && (
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs border border-blue-500/20">
                {message}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Son Eğitim: {new Date(info.trained_at).toLocaleString("tr-TR")}
              </span>
              <button
                onClick={handleRetrain}
                disabled={isRetraining}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRetraining ? "animate-spin" : ""}`} />
                <span>{isRetraining ? "Eğitiliyor..." : "Modeli Yeniden Eğit"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">
            {message || "Model detayları bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
};
