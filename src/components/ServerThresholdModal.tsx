import React, { useState, useEffect } from 'react';
import { ServerThresholdSettings } from '../types';
import {
  Thermometer,
  Droplets,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ServerThresholdSettings;
  onSaveThresholds: (updated: ServerThresholdSettings) => void;
}

export const ServerThresholdModal: React.FC<Props> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
}) => {
  const [minTemp, setMinTemp] = useState<number>(thresholds.minTemp ?? 17);
  const [maxTemp, setMaxTemp] = useState<number>(thresholds.maxTemp ?? 23);
  const [minHum, setMinHum] = useState<number>(thresholds.minHum ?? 45);
  const [maxHum, setMaxHum] = useState<number>(thresholds.maxHum ?? 55);
  const [stdTempLabel, setStdTempLabel] = useState<string>(
    thresholds.stdTempLabel || `Std ${thresholds.minTemp ?? 17}°C to ${thresholds.maxTemp ?? 23}°C`
  );
  const [stdHumLabel, setStdHumLabel] = useState<string>(
    thresholds.stdHumLabel || `Hum ${thresholds.minHum ?? 45}%-${thresholds.maxHum ?? 55}%`
  );
  const [autoSyncLabel, setAutoSyncLabel] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMinTemp(thresholds.minTemp ?? 17);
      setMaxTemp(thresholds.maxTemp ?? 23);
      setMinHum(thresholds.minHum ?? 45);
      setMaxHum(thresholds.maxHum ?? 55);
      setStdTempLabel(
        thresholds.stdTempLabel || `Std ${thresholds.minTemp ?? 17}°C to ${thresholds.maxTemp ?? 23}°C`
      );
      setStdHumLabel(
        thresholds.stdHumLabel || `Hum ${thresholds.minHum ?? 45}%-${thresholds.maxHum ?? 55}%`
      );
      setFeedbackMsg(null);
      setErrorMessage(null);
    }
  }, [isOpen, thresholds]);

  // Automatically sync labels if autoSyncLabel is on
  const handleTempChange = (newMin: number, newMax: number) => {
    setErrorMessage(null);
    setMinTemp(newMin);
    setMaxTemp(newMax);
    if (autoSyncLabel) {
      setStdTempLabel(`Std ${newMin}°C to ${newMax}°C`);
    }
  };

  const handleHumChange = (newMin: number, newMax: number) => {
    setErrorMessage(null);
    setMinHum(newMin);
    setMaxHum(newMax);
    if (autoSyncLabel) {
      setStdHumLabel(`Hum ${newMin}%-${newMax}%`);
    }
  };

  const applyPreset = (preset: {
    name: string;
    minT: number;
    maxT: number;
    minH: number;
    maxH: number;
  }) => {
    setErrorMessage(null);
    handleTempChange(preset.minT, preset.maxT);
    handleHumChange(preset.minH, preset.maxH);
    setFeedbackMsg(`✓ Preset "${preset.name}" diterapkan.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (minTemp >= maxTemp) {
      setErrorMessage('Suhu Minimum harus lebih kecil dari Suhu Maksimum!');
      return;
    }

    if (minHum >= maxHum) {
      setErrorMessage('Kelembapan Minimum harus lebih kecil dari Kelembapan Maksimum!');
      return;
    }

    setErrorMessage(null);

    const updated: ServerThresholdSettings = {
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
      minHum: Number(minHum),
      maxHum: Number(maxHum),
      stdTempLabel: stdTempLabel.trim() || `Std ${minTemp}°C to ${maxTemp}°C`,
      stdHumLabel: stdHumLabel.trim() || `Hum ${minHum}%-${maxHum}%`,
      updatedAt: Date.now(),
    };

    onSaveThresholds(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header (Clean White Light Theme) */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Thermometer className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight text-slate-900">
                  Standar Suhu &amp; Kelembapan
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
                  Section 4
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ruang Server · Hotel Ciputra Jakarta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Validation Error Message */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Preset Standar Cepat:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Standar Ciputra (17°C - 23°C)',
                    minT: 17,
                    maxT: 23,
                    minH: 45,
                    maxH: 55,
                  })
                }
                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/60 text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Hotel Ciputra</div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-semibold">17°C - 23°C</div>
                <div className="text-[9.5px] text-slate-500">Hum 45% - 55%</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'ASHRAE Server (18°C - 27°C)',
                    minT: 18,
                    maxT: 27,
                    minH: 40,
                    maxH: 60,
                  })
                }
                className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/60 text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">ASHRAE Datacenter</div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-semibold">18°C - 27°C</div>
                <div className="text-[9.5px] text-slate-500">Hum 40% - 60%</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Strict Cold (16°C - 22°C)',
                    minT: 16,
                    maxT: 22,
                    minH: 45,
                    maxH: 55,
                  })
                }
                className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/60 text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Strict Cold Server</div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-semibold">16°C - 22°C</div>
                <div className="text-[9.5px] text-slate-500">Hum 45% - 55%</div>
              </button>
            </div>
          </div>

          {/* Section 1: Temperature Range */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span>Batas Standar Suhu Ruang Server (°C)</span>
              </span>
              <span className="font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                {minTemp}°C s/d {maxTemp}°C
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Suhu Minimum (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={minTemp}
                    onChange={(e) => handleTempChange(parseFloat(e.target.value) || 0, maxTemp)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-500">
                    °C
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Suhu Maksimum (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={maxTemp}
                    onChange={(e) => handleTempChange(minTemp, parseFloat(e.target.value) || 0)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-500">
                    °C
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10.5px] text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
              💡 Jika suhu aktual &lt; {minTemp}°C atau &gt; {maxTemp}°C, sistem akan otomatis memberi tanda peringatan <strong>⚠ Di Luar Batas Standar</strong>.
            </div>
          </div>

          {/* Section 2: Humidity Range */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Batas Standar Kelembapan Server (% RH)</span>
              </span>
              <span className="font-extrabold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                {minHum}% s/d {maxHum}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kelembapan Minimum (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="90"
                    value={minHum}
                    onChange={(e) => handleHumChange(parseInt(e.target.value, 10) || 0, maxHum)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kelembapan Maksimum (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="90"
                    value={maxHum}
                    onChange={(e) => handleHumChange(minHum, parseInt(e.target.value, 10) || 0)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10.5px] text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
              💡 Jika kelembapan aktual &lt; {minHum}% atau &gt; {maxHum}%, sistem akan mendeteksi kondisi kering/lembab berlebih.
            </div>
          </div>

          {/* Section 3: Labels for Print / Documents */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Teks Keterangan Standar (Tercetak di Dokumen &amp; PDF):
              </span>
              <label className="flex items-center gap-1.5 text-[10.5px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncLabel}
                  onChange={(e) => {
                    setAutoSyncLabel(e.target.checked);
                    if (e.target.checked) {
                      setStdTempLabel(`Std ${minTemp}°C to ${maxTemp}°C`);
                      setStdHumLabel(`Hum ${minHum}%-${maxHum}%`);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Otomatis Sinkron</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                  Label Keterangan Suhu:
                </label>
                <input
                  type="text"
                  value={stdTempLabel}
                  onChange={(e) => {
                    setStdTempLabel(e.target.value);
                    setAutoSyncLabel(false);
                  }}
                  placeholder="Std 17°C to 23°C"
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                  Label Keterangan Kelembapan:
                </label>
                <input
                  type="text"
                  value={stdHumLabel}
                  onChange={(e) => {
                    setStdHumLabel(e.target.value);
                    setAutoSyncLabel(false);
                  }}
                  placeholder="Hum 45%-55%"
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <span className="block text-[11px] font-bold text-emerald-950 mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pratinjau Tampilan di Lembar Dokumen &amp; PDF:</span>
            </span>
            <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {stdTempLabel} · {stdHumLabel}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                ✓ Standar Aktif
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Terapkan Standar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
