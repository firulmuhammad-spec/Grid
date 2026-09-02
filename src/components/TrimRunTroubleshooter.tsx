import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  HelpCircle, 
  Calculator, 
  Wrench, 
  CheckCircle2, 
  PlusCircle, 
  RotateCw, 
  Activity, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  Sparkles
} from 'lucide-react';
import { 
  BalancingData, 
  Vector, 
  vSub, 
  vDiv, 
  vAdd, 
  toDeg, 
  toRad, 
  calcArcDistanceMm 
} from '../types/balancing';

interface TroubleshooterProps {
  data: BalancingData;
  influenceVector: Vector | null;
  initialCorrection: Vector | null;
  uPer: number;
  residualUnbalance: number | null;
  onApplyTrimRun?: (trimAdd: Vector, trimTotal: Vector) => void;
}

export default function TrimRunTroubleshooter({
  data,
  influenceVector,
  initialCorrection,
  uPer,
  residualUnbalance,
  onApplyTrimRun
}: TroubleshooterProps) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'sop' | 'causes'>('calculator');
  const [trimAmp, setTrimAmp] = useState<number>(data.finalAmp || 0);
  const [trimPh, setTrimPh] = useState<number>(data.finalPh || 0);
  const [showTrimResults, setShowTrimResults] = useState<boolean>(false);

  const diameter = data.diameter || 500;

  // Trim Run Calculation
  // Residual Vector: O_final
  // Influence Vector: Alpha
  // Additional Trim Weight to add: deltaW = -O_final / Alpha = (O_final / Alpha) + 180 deg
  let deltaW: Vector | null = null;
  let totalW: Vector | null = null;
  let deltaArcMm = 0;
  let deltaArcCm = 0;
  let totalArcMm = 0;
  let totalArcCm = 0;

  if (influenceVector && trimAmp > 0 && initialCorrection) {
    const finalVec: Vector = { mag: trimAmp, ang: trimPh };
    const rawDelta = vDiv(finalVec, influenceVector);
    deltaW = {
      mag: rawDelta.mag,
      ang: ((rawDelta.ang + 180) % 360 + 360) % 360
    };

    deltaArcMm = calcArcDistanceMm(deltaW.ang, diameter);
    deltaArcCm = deltaArcMm / 10;

    // Total vector if replacing W1: W_total = W_initial + deltaW
    totalW = vAdd(initialCorrection, deltaW);
    totalArcMm = calcArcDistanceMm(totalW.ang, diameter);
    totalArcCm = totalArcMm / 10;
  }

  const isAgainstRotation = data.phaseConvention === 'against_rotation';
  const isCW = data.rotationDir === 'CW';
  const measureDirectionText = isAgainstRotation
    ? (isCW ? 'Berlawanan arah jarum jam (CCW)' : 'Searah jarum jam (CW)')
    : (isCW ? 'Searah jarum jam (CW)' : 'Berlawanan arah jarum jam (CCW)');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      {/* Troubleshooter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              Langkah Lanjutan: Jika Nilai Unbalance Masih Besar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Panduan standar ISO 21940 & Kalkulator Trim Run (Koreksi Tambahan tanpa perlu mengulang Trial Run).
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'calculator' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator size={14} />
            <span>Trim Run Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sop' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={14} />
            <span>SOP & Opsi Lapangan</span>
          </button>
          <button
            onClick={() => setActiveTab('causes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'causes' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>Investigasi Non-Unbalance</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Trim Run Calculator */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <Calculator size={16} className="text-amber-400" />
                Input Getaran Sisa Saat Ini (Residual Run)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Satuan: {data.vibrationUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">
                  Amplitudo Getaran Sisa ({data.vibrationUnit})
                </label>
                <input 
                  type="number" 
                  value={trimAmp || ''}
                  onChange={e => setTrimAmp(parseFloat(e.target.value) || 0)}
                  placeholder={`Contoh: 35 ${data.vibrationUnit}`}
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-mono text-sm outline-none focus:border-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">
                  Fasa Getaran Sisa (Derajat °)
                </label>
                <input 
                  type="number" 
                  value={trimPh || ''}
                  onChange={e => setTrimPh(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 145°"
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-mono text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              onClick={() => setShowTrimResults(true)}
              disabled={!trimAmp || !influenceVector}
              className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-bold font-mono text-xs uppercase tracking-wider hover:bg-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Hitung Bobot Koreksi Trim Tambahan
            </button>
          </div>

          {/* Computed Solutions Comparison */}
          {deltaW && totalW && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Option A: Keep W1 and Add Trim Weight */}
              <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono px-3 py-1 rounded-bl-xl font-bold">
                  OPSI 1: TERMUDAH
                </div>
                <div>
                  <h5 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <PlusCircle size={16} className="text-emerald-400" />
                    Biarkan W1 Terpasang + Tambah Trim Weight
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Biarkan bobot pertama ({initialCorrection?.mag.toFixed(1)}g @ {initialCorrection?.ang.toFixed(1)}°) tetap terpasang, lalu tambahkan bobot kecil tambahan:
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tambah Bobot (ΔW):</span>
                    <span className="text-lg font-black text-emerald-400">{deltaW.mag.toFixed(1)} Gram</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Di Posisi Sudut:</span>
                    <span className="font-bold text-white">{deltaW.ang.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Jarak Busur dari 0°:</span>
                    <span className="font-bold text-brand-accent">
                      {deltaArcMm.toFixed(1)} mm ({deltaArcCm.toFixed(1)} cm)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <strong className="text-slate-200">Cara Ukur:</strong> Ukur sepanjang keliling lingkar sebesar <span className="text-emerald-400 font-bold">{deltaArcMm.toFixed(1)} mm</span> dari tanda 0° ke arah <span className="text-amber-400 font-bold">{measureDirectionText}</span>.
                </div>
              </div>

              {/* Option B: Remove W1 and Replace with Combined Weight */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[9px] font-mono px-3 py-1 rounded-bl-xl font-bold">
                  OPSI 2: 1 BOBOT TUNGGAL
                </div>
                <div>
                  <h5 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <RotateCw size={16} className="text-blue-400" />
                    Lepas W1 & Ganti Total Bobot Baru
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Lepas bobot pertama ({initialCorrection?.mag.toFixed(1)}g), lalu pasang 1 bobot gabungan baru hasil penjumlahan vektor:
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Bobot Baru (W total):</span>
                    <span className="text-lg font-black text-blue-400">{totalW.mag.toFixed(1)} Gram</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Di Posisi Sudut Baru:</span>
                    <span className="font-bold text-white">{totalW.ang.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Jarak Busur dari 0°:</span>
                    <span className="font-bold text-brand-accent">
                      {totalArcMm.toFixed(1)} mm ({totalArcCm.toFixed(1)} cm)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <strong className="text-slate-200">Cara Ukur:</strong> Ukur <span className="text-blue-400 font-bold">{totalArcMm.toFixed(1)} mm</span> dari tanda 0° ke arah <span className="text-amber-400 font-bold">{measureDirectionText}</span>.
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 2: SOP & Field Action Rules */}
      {activeTab === 'sop' && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider font-mono">
                <CheckCircle2 size={16} />
                <span>1. Menambah Bobot vs Melepas Bobot</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">Trial Weight:</strong> WAJIB dilepas sebelum memasang bobot koreksi pertama (W1).</li>
                <li><strong className="text-slate-200">Koreksi Pertama (W1):</strong> Jika getaran masih belum mencapai target ISO, Anda BISA memilih membiarkan W1 dan hanya menambah bobot trim (&Delta;W), atau melepas W1 dan menggantinya dengan W total.</li>
                <li><strong className="text-slate-200">Maksimal Run:</strong> Umumnya balancing single plane diselesaikan dalam 1 Initial + 1 Trial + 1 Correction + 1 Trim Run (Maks 2-3 run).</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider font-mono">
                <Layers size={16} />
                <span>2. Pengurangan Massa (Drilling / Grinding)</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Jika rotor berputar pada fluida korosif/makanan di mana pengelasan dilarang, lakukan <strong>Material Removal</strong> (pemberat dikurangi dengan cara digerinda atau dibor).</li>
                <li><strong className="text-slate-200">Sudut Pengurangan:</strong> Posisi buang massa adalah persis <strong className="text-amber-400 font-mono">180° BERLAWANAN</strong> dari sudut penambahan bobot (&theta; + 180°).</li>
                <li><strong className="text-slate-200">Massa:</strong> Massa yang dibuang sama besarnya dengan nilai massa koreksi hasil hitungan (W).</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wider font-mono">
                <Sliders size={16} />
                <span>3. Koreksi Beda Radius (r1 &ne; r2)</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Jika bobot terpaksa dipasang pada radius yang lebih kecil atau lebih besar dari diameter yang diinput, gunakan prinsip momen unbalance tetap:</li>
                <li className="font-mono text-purple-300 bg-slate-900 p-2 rounded-lg text-center">
                  M2 = M1 &times; (r1 / r2)
                </li>
                <li>Radius lebih kecil (r2 &lt; r1) membutuhkan bobot lebih berat. Radius lebih besar (r2 &gt; r1) membutuhkan bobot lebih ringan.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider font-mono">
                <ShieldAlert size={16} />
                <span>4. Verifikasi Resonansi & Cross-Effect</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Jika mesin memiliki rotor panjang ($L / D &gt; 0.5$) atau tumpuan overhung besar, single plane mungkin tidak cukup karena adanya <strong>Couple / Dynamic Unbalance</strong> (memerlukan 2-Plane Balancing).</li>
                <li>Pastikan RPM saat Initial Run, Trial Run, dan Final Run selalu sama (fluktuasi &lt; 2%).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Non-Unbalance Causes Diagnostic */}
      {activeTab === 'causes' && (
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-red-300 uppercase tracking-tight font-mono text-sm">
                Vibrasi 1X Tidak Turun Setelah Diberi Beban Koreksi?
              </h5>
              <p className="text-red-200/80 mt-1">
                Jika pemberian beban berulang kali tidak menurunkan getaran atau respon rotor tidak konsisten (non-linier), jangan terus menambah bobot. Lakukan investigasi penyebab akar berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                1. Resonansi / Critical Speed
              </span>
              <p className="text-slate-400">
                Kecepatan kerja mesin berada dekat (&plusmn;10-15%) dari frekuensi pribadi (natural frequency). Fasa akan sangat sensitif dan getaran diamplifikasi secara dinamis.
              </p>
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
                Uji: Lakukan Bump Test saat mesin mati atau plot Bode saat coast down.
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                2. Shaft Bent / Runout Mekanikal
              </span>
              <p className="text-slate-400">
                Poros yang bengkok atau eksentrisitas mekanis akan memancarkan getaran 1X RPM yang tidak dapat diseimbangkan dengan bobot dinamis.
              </p>
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
                Uji: Pasang dial indicator pada shaft (Total Indicator Reading / TIR).
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                3. Misalignment & Looseness
              </span>
              <p className="text-slate-400">
                Kekakuan kopling atau kaki mesin yang kendor/grouting pecah (Structural Looseness) menyebabkan reaksi getaran 1X dan 2X yang kuat.
              </p>
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
                Uji: Cek fasa aksial kopling (&Delta;&phi; &approx; 180&deg;) dan fasa sambungan pondasi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
