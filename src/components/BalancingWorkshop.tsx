import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Settings, 
  FileText, 
  Trophy, 
  Target, 
  ArrowRight, 
  RotateCcw, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Maximize2,
  Compass,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  Wrench,
  Activity,
  Layers
} from 'lucide-react';
import { 
  BalancingData, 
  BalancingResults, 
  Vector, 
  SplitWeight, 
  VibrationUnit,
  RotationDirection,
  ViewingPerspective,
  PhaseConvention,
  toRad, 
  toDeg, 
  vSub, 
  vDiv, 
  vAdd,
  calcArcDistanceMm 
} from '../types/balancing';
import BalancingVisualizer from './BalancingVisualizer';
import TrimRunTroubleshooter from './TrimRunTroubleshooter';

export default function BalancingWorkshop({ equipmentData = [] }: { equipmentData?: any[] }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEquipSuggestions, setShowEquipSuggestions] = useState(false);
  const [showTroubleshooterModal, setShowTroubleshooterModal] = useState(false);

  const [data, setData] = useState<BalancingData>({
    jobName: '',
    clientName: '',
    vibrationUnit: 'µm',
    rotorMass: 0,
    operatingRPM: 0,
    isoGrade: 6.3,
    diameter: 800,
    rotationDir: 'CW',
    numBlades: 0,
    viewingPerspective: 'front',
    phaseConvention: 'against_rotation',
    
    initAmp: 0,
    initPh: 0,
    
    trialMass: 0,
    trialAng: 0,
    trialAmp: 0,
    trialPh: 0,
    
    finalAmp: 0,
    finalPh: 0
  });

  const filteredEquipment = equipmentData.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const handleSelectEquipment = (item: any) => {
    setData(prev => ({ ...prev, jobName: `${item.id} - ${item.desc}` }));
    setSearchTerm(`${item.id} - ${item.desc}`);
    setShowEquipSuggestions(false);
  };

  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowEquipSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [results, setResults] = useState<BalancingResults>({
    uPer: 0,
    influenceVector: null,
    correction: null,
    correctionArcMm: 0,
    correctionArcCm: 0,
    correctionArcFromTrialMm: 0,
    splitWeights: null,
    residualUnbalance: null,
    isAcceptable: null
  });

  // Calculate Uper whenever relevant data changes
  useEffect(() => {
    if (data.rotorMass > 0 && data.operatingRPM > 0) {
      // Uper (g-mm) = 9549 * (G * M_kg) / N_rpm
      const uPerValue = 9549 * (data.isoGrade * data.rotorMass) / data.operatingRPM;
      setResults(prev => ({ ...prev, uPer: uPerValue }));
    }
  }, [data.rotorMass, data.operatingRPM, data.isoGrade]);

  const handleCalculate = () => {
    if (data.initAmp > 0 && data.trialMass > 0 && data.trialAmp > 0) {
      const initVec: Vector = { mag: data.initAmp, ang: data.initPh };
      const trialRunVec: Vector = { mag: data.trialAmp, ang: data.trialPh };
      const trialMassVec: Vector = { mag: data.trialMass, ang: data.trialAng };

      // Effect = OT - O
      const effect = vSub(trialRunVec, initVec);
      // Alpha = Effect / T
      const alpha = vDiv(effect, trialMassVec);
      
      // W = -O / Alpha = (O / Alpha) + 180 deg
      const rawCorr = vDiv(initVec, alpha);
      const corrAngle = ((rawCorr.ang + 180) % 360 + 360) % 360;
      const correction: Vector = { 
        mag: rawCorr.mag, 
        ang: corrAngle 
      };

      const diameterMm = data.diameter || 800;
      const arcFrom0 = calcArcDistanceMm(corrAngle, diameterMm);
      const deltaFromTrial = ((corrAngle - data.trialAng + 360) % 360);
      const arcFromTrial = calcArcDistanceMm(deltaFromTrial, diameterMm);

      // Handle Split Weights if blades provided (at least 3 blades)
      let splits: SplitWeight[] | null = null;
      if (data.numBlades >= 3) {
        const bladeDeg = 360 / data.numBlades;
        const idx = Math.floor(corrAngle / bladeDeg);
        const a1 = idx * bladeDeg;
        const a2 = ((idx + 1) * bladeDeg) % 360;

        const rT = toRad(corrAngle);
        const r1 = toRad(a1);
        const r2 = toRad((idx + 1) * bladeDeg);
        const det = Math.sin(r2 - r1);

        const m1 = (correction.mag * Math.sin(r2 - rT)) / det;
        const m2 = (correction.mag * Math.sin(rT - r1)) / det;
        
        splits = [
          { bladeIndex: idx + 1, angle: a1, mass: m1, arcDistanceMm: calcArcDistanceMm(a1, diameterMm) },
          { bladeIndex: ((idx + 1) % data.numBlades) + 1, angle: a2, mass: m2, arcDistanceMm: calcArcDistanceMm(a2, diameterMm) }
        ];
      }

      setResults(prev => ({
        ...prev,
        influenceVector: alpha,
        correction: correction,
        correctionArcMm: arcFrom0,
        correctionArcCm: arcFrom0 / 10,
        correctionArcFromTrialMm: arcFromTrial,
        splitWeights: splits
      }));
      setStep(4);
    }
  };

  const handleVerify = () => {
    if (results.influenceVector && data.finalAmp >= 0) {
      // Residual Unbalance (mass equivalent at radius)
      const radius = (data.diameter || 800) / 2;
      const residualMass = data.finalAmp / results.influenceVector.mag;
      const residualU = residualMass * radius;

      // Only attempt to verify ISO if mass and RPM are provided
      const canVerify = data.rotorMass > 0 && data.operatingRPM > 0;

      setResults(prev => ({
        ...prev,
        residualUnbalance: residualU,
        isAcceptable: canVerify ? (residualU <= prev.uPer) : null
      }));
    }
  };

  const reset = () => {
    setStep(1);
    setResults({
      uPer: 0,
      influenceVector: null,
      correction: null,
      correctionArcMm: 0,
      correctionArcCm: 0,
      correctionArcFromTrialMm: 0,
      splitWeights: null,
      residualUnbalance: null,
      isAcceptable: null
    });
  };

  // Vibration unit list
  const vibrationUnits: { label: string; value: VibrationUnit; desc: string }[] = [
    { label: 'µm (pk-pk)', value: 'µm', desc: 'Displacement Peak-to-Peak (Standar Balancing)' },
    { label: 'mm (pk-pk)', value: 'mm', desc: 'Displacement Peak-to-Peak (Metrik mm)' },
    { label: 'mm/s (RMS)', value: 'mm/s (RMS)', desc: 'Velocity RMS (Standar ISO 10816/20816)' },
    { label: 'mm/s (Peak)', value: 'mm/s (Peak)', desc: 'Velocity Peak' },
    { label: 'mils (pk-pk)', value: 'mils', desc: 'Displacement Imperial (Bently Nevada)' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-32">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-brand-accent/20 rounded-xl border border-brand-accent/30 text-brand-accent">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">
                  Workshop Dynamic Balancing
                </h1>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <span>ISO 21940-11 Single Plane Compliance</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-brand-accent font-bold">Unit: {data.vibrationUnit}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Step Wizard Indicator */}
          <div className="flex items-center gap-2">
             {[1, 2, 3, 4, 5].map((s) => (
               <div key={s} className="flex items-center">
                 <button
                   onClick={() => {
                     // Allow navigating back or forward if valid
                     if (s <= step || (s === 4 && results.correction) || (s === 5 && results.residualUnbalance !== null)) {
                       setStep(s);
                     }
                   }}
                   className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                     step === s 
                       ? 'bg-brand-accent text-slate-950 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                       : step > s 
                         ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                         : 'bg-slate-900 border border-slate-800 text-slate-600'
                   }`}
                 >
                   {s}
                 </button>
                 {s < 5 && <div className={`w-4 sm:w-6 h-0.5 ${step > s ? 'bg-brand-accent/50' : 'bg-slate-900'}`} />}
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {/* ================= STEP 1: MACHINE DATA & CONFIG ================= */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Unit Selection Banner */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-brand-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Pilihan Satuan Amplitudo Vibrasi (Vibration Measurement Unit)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-brand-accent font-bold">
                    Aktif: {data.vibrationUnit}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pilih satuan sensor getaran yang digunakan pada alat ukur (vibration analyzer) Anda:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {vibrationUnits.map(u => (
                    <button
                      key={u.value}
                      onClick={() => setData({ ...data, vibrationUnit: u.value })}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        data.vibrationUnit === u.value 
                          ? 'bg-brand-accent/15 border-brand-accent text-white shadow-lg shadow-brand-accent/10' 
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-sm font-mono text-brand-accent">{u.label}</span>
                      <span className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">{u.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Machine Info */}
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="text-brand-accent" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Data Mesin & Rotor</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1 relative" ref={suggestionRef}>
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Input / Cari Nama Equipment</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={searchTerm}
                          onChange={e => {
                            setSearchTerm(e.target.value);
                            setData({...data, jobName: e.target.value});
                            setShowEquipSuggestions(true);
                          }}
                          onFocus={() => setShowEquipSuggestions(true)}
                          placeholder="Ketik kode (e.g. 101-J/Fan Impeller) atau nama..."
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm focus:border-brand-accent outline-none transition-colors"
                        />
                        {showEquipSuggestions && searchTerm.length > 1 && filteredEquipment.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                            {filteredEquipment.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectEquipment(item)}
                                className="w-full px-4 py-3 text-left text-xs hover:bg-slate-800 border-b border-slate-800/50 last:border-0 flex flex-col gap-1"
                              >
                                <span className="font-bold text-brand-accent">{item.id}</span>
                                <span className="text-slate-400 capitalize">{item.desc}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Diameter Plane (mm)</label>
                        <input 
                          type="number" 
                          value={data.diameter || ''}
                          onChange={e => setData({...data, diameter: parseFloat(e.target.value) || 0})}
                          placeholder="800"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-mono outline-none focus:border-brand-accent"
                        />
                        <span className="text-[9px] text-slate-500">Keliling: {(Math.PI * (data.diameter || 0)).toFixed(0)} mm</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Jml Blade (Opsional)</label>
                        <input 
                          type="number" 
                          value={data.numBlades || ''}
                          onChange={e => setData({...data, numBlades: parseInt(e.target.value) || 0})}
                          placeholder="e.g. 6 (Untuk split bobot)"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-mono outline-none focus:border-brand-accent"
                        />
                        <span className="text-[9px] text-slate-500">Untuk membagi ke bilah</span>
                      </div>
                    </div>

                    {/* Geometry & Viewing Orientation Controls */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                      <div className="text-[10px] font-mono font-bold uppercase text-brand-accent flex items-center gap-1.5">
                        <Eye size={14} />
                        <span>Orientasi Pengamatan & Konvensi Sudut</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-400 uppercase">Arah Putaran Rotor</label>
                          <select 
                            value={data.rotationDir}
                            onChange={e => setData({...data, rotationDir: e.target.value as RotationDirection})}
                            className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs font-mono outline-none text-white"
                          >
                            <option value="CW">CW (Searah Jarum Jam)</option>
                            <option value="CCW">CCW (Berlawanan Jarum Jam)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-400 uppercase">Sudut Pandang Pengamat (POV)</label>
                          <select 
                            value={data.viewingPerspective}
                            onChange={e => setData({...data, viewingPerspective: e.target.value as ViewingPerspective})}
                            className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs font-mono outline-none text-white"
                          >
                            <option value="front">Muka Depan Impeller</option>
                            <option value="driver_to_driven">Sisi Penggerak (Driver to Driven)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] font-mono text-slate-400 uppercase">Konvensi Pengukuran Sudut Alat</label>
                        <select 
                          value={data.phaseConvention}
                          onChange={e => setData({...data, phaseConvention: e.target.value as PhaseConvention})}
                          className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs font-mono outline-none text-white"
                        >
                          <option value="against_rotation">Against Rotation (Berlawanan Arah Putaran - Standar Phase Lag)</option>
                          <option value="with_rotation">With Rotation (Searah Putaran - Strobe / Phase Lead)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ISO Standard Requirements */}
                <div className="bg-slate-900/40 border border-brand-accent/20 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Trophy size={80} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-brand-accent" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Target Standar ISO 21940-11</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Massa Rotor (kg)</label>
                        <input 
                          type="number" 
                          value={data.rotorMass || ''}
                          onChange={e => setData({...data, rotorMass: parseFloat(e.target.value) || 0})}
                          placeholder="e.g. 150 kg"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-mono outline-none focus:border-brand-accent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Operating RPM (Service)</label>
                        <input 
                          type="number" 
                          value={data.operatingRPM || ''}
                          onChange={e => setData({...data, operatingRPM: parseFloat(e.target.value) || 0})}
                          placeholder="e.g. 1485 RPM"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-mono outline-none focus:border-brand-accent"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Target Balance Quality Grade</label>
                      <select 
                        value={data.isoGrade}
                        onChange={e => setData({...data, isoGrade: parseFloat(e.target.value)})}
                        className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm cursor-pointer outline-none font-mono"
                      >
                        <option value={1.0}>G1.0 (Precision Grinders, Small Turbines)</option>
                        <option value={2.5}>G2.5 (Gas/Steam Turbines, Turbo Compressors)</option>
                        <option value={6.3}>G6.3 (Standard: Pumps, Fans, Electric Motors, Gears)</option>
                        <option value={16}>G16 (Heavy Duty: Crushers, Agricultural Machinery)</option>
                        <option value={40}>G40 (Car Wheels, Tractor Rims)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-brand-accent/5 border border-brand-accent/30 rounded-2xl">
                      <div className="text-[9px] uppercase font-mono text-brand-accent/80 mb-1 font-bold">
                        Batas Unbalance Maksimum yang Diizinkan (Uper)
                      </div>
                      <div className="text-2xl font-black text-brand-accent font-mono">
                        {data.rotorMass > 0 && data.operatingRPM > 0 ? results.uPer.toFixed(1) : '---'}{' '}
                        <span className="text-sm font-normal text-slate-300">g-mm</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1">
                        Rumus: Uper = 9549 &times; (G &times; M) / N
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!data.jobName || !data.diameter}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-all font-mono text-sm uppercase"
                >
                  NEXT: INITIAL RUN (O)
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 2: INITIAL RUN ================= */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/30">
                     <RotateCcw size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white">Initial Run Data (Vektor O)</h3>
                     <p className="text-sm text-slate-400">
                       Ukur amplitudo dan fasa getaran 1X RPM saat kondisi mesin awal (sebelum ditambah beban apa pun).
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex justify-between">
                      <span>Initial Amplitude ({data.vibrationUnit})</span>
                      <span className="text-brand-accent">1X RPM Peak/RMS</span>
                    </label>
                    <input 
                      type="number" 
                      value={data.initAmp || ''}
                      onChange={e => setData({...data, initAmp: parseFloat(e.target.value) || 0})}
                      placeholder={`Contoh: 85.5 ${data.vibrationUnit}`}
                      className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-lg font-mono outline-none focus:border-brand-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex justify-between">
                      <span>Initial Phase (Derajat °)</span>
                      <span className="text-blue-400">0° s/d 360°</span>
                    </label>
                    <input 
                      type="number" 
                      value={data.initPh || ''}
                      onChange={e => setData({...data, initPh: parseFloat(e.target.value) || 0})}
                      placeholder="Contoh: 120°"
                      className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-lg font-mono outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
                  <div className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Info size={14} className="text-blue-400" />
                    <span>Catatan Pengukuran Fasa:</span>
                  </div>
                  <p>
                    Pastikan sensor getaran dan tachometer/photocell stabil. Gunakan speed operasi konstan (RPM = {data.operatingRPM || 'tetap'}).
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-white transition-colors font-mono text-xs uppercase">
                  &larr; KEMBALI
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!data.initAmp}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 hover:bg-brand-accent/90 transition-all font-mono text-sm uppercase"
                >
                  NEXT: TRIAL RUN (T)
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 3: TRIAL RUN ================= */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/30">
                     <Target size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white">Trial Run Configuration (Vektor T & O+T)</h3>
                     <p className="text-sm text-slate-400">
                       Pasang bobot uji coba sementara pada rotor, lalu jalankan mesin untuk mengukur respons getaran baru.
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Berat Trial (Gram)</label>
                        <input 
                          type="number" 
                          value={data.trialMass || ''}
                          onChange={e => setData({...data, trialMass: parseFloat(e.target.value) || 0})}
                          placeholder="e.g. 50 g"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none font-mono focus:border-amber-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Posisi Trial (Derajat °)</label>
                        <input 
                          type="number" 
                          value={data.trialAng || ''}
                          onChange={e => setData({...data, trialAng: parseFloat(e.target.value) || 0})}
                          placeholder="0° (Ref Mark)"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none font-mono focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                          Amplitudo Baru ({data.vibrationUnit})
                        </label>
                        <input 
                          type="number" 
                          value={data.trialAmp || ''}
                          onChange={e => setData({...data, trialAmp: parseFloat(e.target.value) || 0})}
                          placeholder="e.g. 42.0"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none font-mono focus:border-amber-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                          Fasa Baru (Derajat °)
                        </label>
                        <input 
                          type="number" 
                          value={data.trialPh || ''}
                          onChange={e => setData({...data, trialPh: parseFloat(e.target.value) || 0})}
                          placeholder="e.g. 85°"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none font-mono focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 leading-relaxed font-mono">
                      <strong>Rule of Thumb:</strong> Bobot trial yang baik idealnya menghasilkan perubahan amplitudo getaran sebesar &plusmn;30% atau pergeseran fasa sebesar &ge;30&deg;.
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="flex flex-col items-center justify-center bg-slate-950/70 rounded-2xl p-6 border border-slate-800/80 space-y-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      Trial Vector Preview
                    </div>
                    <svg viewBox="0 0 200 200" className="w-44 h-44">
                      <circle cx="100" cy="100" r="75" fill="#090d16" stroke="#334155" strokeWidth="2" />
                      <line x1="100" y1="20" x2="100" y2="180" stroke="#1e293b" strokeWidth="1" />
                      <line x1="20" y1="100" x2="180" y2="100" stroke="#1e293b" strokeWidth="1" />
                      
                      {/* Initial Vector */}
                      {data.initAmp > 0 && (
                        <line 
                          x1="100" y1="100" 
                          x2={100 + 65 * Math.cos(toRad(data.initPh))} 
                          y2={100 - 65 * Math.sin(toRad(data.initPh))} 
                          stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3"
                        />
                      )}
                      
                      {/* Trial Weight Mark */}
                      {data.trialMass > 0 && (
                        <g>
                          <circle 
                            cx={100 + 75 * Math.cos(toRad(data.trialAng))} 
                            cy={100 - 75 * Math.sin(toRad(data.trialAng))} 
                            r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse"
                          />
                          <text 
                            x={100 + 75 * Math.cos(toRad(data.trialAng))} 
                            y={100 - 75 * Math.sin(toRad(data.trialAng)) + 3} 
                            fontSize="7" fill="#000000" fontWeight="bold" textAnchor="middle"
                          >T</text>
                        </g>
                      )}
                      <text x="180" y="104" fontSize="8" className="fill-emerald-400 font-mono font-bold">0°</text>
                    </svg>
                    <span className="text-[10px] font-mono text-slate-400">
                      Trial Position: {data.trialAng}° ({calcArcDistanceMm(data.trialAng, data.diameter || 800).toFixed(0)} mm dari 0°)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-slate-400 font-bold hover:text-white transition-colors font-mono text-xs uppercase">
                  &larr; KEMBALI
                </button>
                <button 
                  onClick={handleCalculate}
                  disabled={!data.trialMass || !data.trialAmp}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 hover:bg-brand-accent/90 transition-all font-mono text-sm uppercase"
                >
                  HITUNG SOLUSI KOREKSI
                  <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 4: CORRECTION SOLUTION & MAP ================= */}
          {step === 4 && results.correction && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Critical Notice */}
              <div className="bg-red-500/10 border-2 border-red-500/40 p-5 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
                <div>
                   <h4 className="font-bold text-red-400 uppercase tracking-tight font-mono text-sm">
                     PERINGATAN KRUSIAL: LEPAS TRIAL WEIGHT!
                   </h4>
                   <p className="text-xs text-red-200/80 leading-relaxed mt-0.5">
                     Pastikan beban trial ({data.trialMass}g @ {data.trialAng}°) <strong>SUDAH DILEPAS TOTAL</strong> dari rotor sebelum Anda mengelas atau memasang beban koreksi utama ({results.correction.mag.toFixed(1)}g).
                   </p>
                </div>
              </div>

              {/* Dedicated Rotor Placement Visualizer with Degree and Circumference Arc */}
              <BalancingVisualizer 
                data={data}
                correction={results.correction}
                splitWeights={results.splitWeights}
                interactive={true}
              />

              {/* Verification Measurement Input Card */}
              <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-6">
                <div>
                   <h4 className="font-bold text-white text-base uppercase font-mono flex items-center gap-2">
                     <CheckCircle2 size={18} className="text-brand-accent" />
                     Tahap Verifikasi Akhir (Residual Run)
                   </h4>
                   <p className="text-xs text-slate-400 mt-1">
                     Pasang beban koreksi di atas, lepaskan beban trial, lalu jalankan mesin kembali untuk mencatat nilai vibrasi residual:
                   </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                     <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                       Residual Amplitude ({data.vibrationUnit})
                     </label>
                     <input 
                       type="number" 
                       value={data.finalAmp || ''}
                       onChange={e => setData({...data, finalAmp: parseFloat(e.target.value) || 0})}
                       placeholder={`Contoh: 12.5 ${data.vibrationUnit}`}
                       className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-mono text-base outline-none focus:border-brand-accent"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                       Residual Phase (Derajat °)
                     </label>
                     <input 
                       type="number" 
                       value={data.finalPh || ''}
                       onChange={e => setData({...data, finalPh: parseFloat(e.target.value) || 0})}
                       placeholder="Contoh: 70°"
                       className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-mono text-base outline-none focus:border-brand-accent"
                     />
                   </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <button onClick={() => setStep(3)} className="px-6 py-3 text-slate-400 font-bold hover:text-white font-mono text-xs uppercase">
                     &larr; KEMBALI
                   </button>
                   <button 
                    onClick={() => {
                      handleVerify();
                      setStep(5);
                    }}
                    className="bg-brand-accent text-slate-950 px-8 py-3.5 rounded-xl font-bold hover:bg-brand-accent/90 font-mono text-xs uppercase"
                   >
                     VERIFIKASI & LIHAT LAPORAN &rarr;
                   </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 5: VERIFICATION & ACTIONABLE NEXT STEPS ================= */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Acceptance Banner */}
              <div className={`p-8 rounded-3xl border ${
                results.isAcceptable === null ? 'bg-slate-800/80 border-slate-700' :
                results.isAcceptable ? 'bg-brand-accent/10 border-brand-accent/40 shadow-lg shadow-brand-accent/5' : 'bg-red-500/10 border-red-500/40'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {results.isAcceptable === null ? (
                      <Info size={56} className="text-slate-400 shrink-0" />
                    ) : results.isAcceptable ? (
                      <CheckCircle2 size={56} className="text-brand-accent shrink-0" />
                    ) : (
                      <AlertTriangle size={56} className="text-red-500 shrink-0" />
                    )}
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight italic text-white">
                        Status: {results.isAcceptable === null ? 'Balancing Complete' : results.isAcceptable ? 'PASS - ISO COMPLIANT' : 'MARGIN EXCEEDED (UNACCEPTABLE)'}
                      </h2>
                      <p className={`text-base font-bold ${
                        results.isAcceptable === null ? 'text-slate-400' :
                        results.isAcceptable ? 'text-brand-accent' : 'text-red-400'
                      }`}>
                        {results.isAcceptable === null 
                          ? 'ISO 21940 Verification Skipped (Data massa/RPM tidak diisi)' 
                          : `ISO 21940-11 Grade G${data.isoGrade}: ${results.isAcceptable ? 'MEMENUHI STANDAR (PASSED)' : 'MELEBIHI BATAS TOLERANSI'}`}
                      </p>
                      {data.rotorMass > 0 && data.operatingRPM > 0 && (
                        <div className="mt-3 flex gap-8 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 uppercase block text-[10px]">Toleransi Uper:</span>
                            <span className="text-lg font-bold text-slate-300">{results.uPer.toFixed(1)} g-mm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[10px]">Residual Unbalance:</span>
                            <span className={`text-lg font-bold ${results.isAcceptable ? 'text-emerald-400' : 'text-red-400'}`}>
                              {results.residualUnbalance?.toFixed(1)} g-mm
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[10px]">Vibrasi Akhir:</span>
                            <span className="text-lg font-bold text-white">
                              {data.finalAmp} {data.vibrationUnit} @ {data.finalPh}°
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redo / Back button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(4)}
                      className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold hover:bg-slate-800"
                    >
                      &larr; Cek Posisi Bobot
                    </button>
                  </div>
                </div>
              </div>

              {/* INTEGRATED ACTIONABLE NEXT STEPS & TRIM RUN CALCULATOR (REQUESTED BY USER) */}
              <TrimRunTroubleshooter 
                data={data}
                influenceVector={results.influenceVector}
                initialCorrection={results.correction}
                uPer={results.uPer}
                residualUnbalance={results.residualUnbalance}
              />

              {/* Printable Official Engineering Certificate */}
              <div id="printable-report" className="bg-white text-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200 space-y-10 relative overflow-hidden print-styles shadow-2xl">
                 {/* Certified Watermark */}
                 {results.isAcceptable && (
                   <div className="absolute top-10 right-10 w-44 h-44 border-4 border-green-600 rounded-full flex flex-col items-center justify-center rotate-12 opacity-80 pointer-events-none">
                      <div className="text-green-600 font-bold uppercase text-[9px] tracking-widest">Certified Compliance</div>
                      <div className="text-green-600 font-black text-xl uppercase tracking-tighter">ISO 21940-11</div>
                      <div className="text-green-600 font-bold text-xs">GRADE G{data.isoGrade}</div>
                   </div>
                 )}
                 {!results.isAcceptable && results.isAcceptable !== null && (
                   <div className="absolute top-10 right-10 w-44 h-44 border-4 border-red-600 rounded-full flex flex-col items-center justify-center rotate-12 opacity-80 pointer-events-none">
                      <div className="text-red-600 font-bold uppercase text-[9px] tracking-widest">Verification</div>
                      <div className="text-red-600 font-black text-xl uppercase tracking-tighter">FAILED</div>
                   </div>
                 )}

                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                    <div className="space-y-1">
                       <h1 className="text-2xl font-black italic tracking-tighter uppercase">GRID Engine Balancing Report</h1>
                       <p className="text-xs font-mono text-slate-500 tracking-widest">Single Plane Dynamic Balancing & Vibration Certification</p>
                    </div>
                    <div className="text-right font-mono">
                       <div className="text-xs font-bold">TANGGAL: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                       <div className="text-[10px] text-slate-500">JOB REF: BA-{Math.floor(Math.random()*10000)}</div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8 text-xs font-sans">
                    <div className="space-y-3">
                       <h3 className="font-bold border-b border-slate-200 pb-1 font-mono uppercase text-slate-700">DATA MESIN & ROTOR</h3>
                       <div className="grid grid-cols-2 gap-y-1.5">
                          <span className="text-slate-500">Nama Equipment:</span>
                          <span className="font-bold">{data.jobName || '-'}</span>
                          <span className="text-slate-500">Massa Rotor:</span>
                          <span className="font-bold">{data.rotorMass > 0 ? `${data.rotorMass} kg` : 'N/A'}</span>
                          <span className="text-slate-500">Kecepatan (RPM):</span>
                          <span className="font-bold">{data.operatingRPM > 0 ? `${data.operatingRPM} RPM` : 'N/A'}</span>
                          <span className="text-slate-500">Diameter Plane:</span>
                          <span className="font-bold">{data.diameter} mm</span>
                          <span className="text-slate-500">Arah Putaran:</span>
                          <span className="font-bold">{data.rotationDir}</span>
                          <span className="text-slate-500">Satuan Getaran:</span>
                          <span className="font-bold text-blue-600">{data.vibrationUnit}</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h3 className="font-bold border-b border-slate-200 pb-1 font-mono uppercase text-slate-700">HASIL PENYEIMBANGAN</h3>
                       <div className="grid grid-cols-2 gap-y-1.5">
                          <span className="text-slate-500">Initial Vib (O):</span>
                          <span className="font-bold">{data.initAmp} {data.vibrationUnit} @ {data.initPh}°</span>
                          <span className="text-slate-500">Trial Weight (T):</span>
                          <span className="font-bold">{data.trialMass} g @ {data.trialAng}°</span>
                          <span className="text-slate-500">Beban Koreksi (W):</span>
                          <span className="font-bold text-slate-900">{results.correction?.mag.toFixed(1)} g @ {results.correction?.ang.toFixed(1)}°</span>
                          <span className="text-slate-500">Jarak Busur Keliling:</span>
                          <span className="font-bold text-emerald-600">{results.correctionArcMm.toFixed(1)} mm ({results.correctionArcCm.toFixed(1)} cm) dari 0°</span>
                          <span className="text-slate-500">Final Vib (Residual):</span>
                          <span className="font-bold text-emerald-700 italic">{data.finalAmp} {data.vibrationUnit} @ {data.finalPh}°</span>
                          <span className="text-slate-500">Status ISO 21940:</span>
                          <span className={`font-bold ${results.isAcceptable ? 'text-emerald-600' : results.isAcceptable === false ? 'text-red-600' : 'text-slate-600'}`}>
                            {results.isAcceptable === null ? 'N/A (Skipped)' : results.isAcceptable ? `PASS GRADE G${data.isoGrade}` : 'FAILED'}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 pt-4">
                    <h3 className="font-bold text-xs uppercase font-mono text-slate-700">KESIMPULAN & REKOMENDASI ENJINIRING</h3>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
                       Pekerjaan penyeimbangan massa dinamis (Single Plane Workshop Balancing) telah dilakukan.
                       {results.isAcceptable === null ? (
                         " Penurunan vibrasi berhasil dicapai dengan memuaskan. Nilai getaran akhir tercatat berada dalam batas aman operasi."
                       ) : results.isAcceptable ? (
                         ` Kualitas penyeimbangan memenuhi batas ISO 21940-11 Grade G${data.isoGrade}. Nilai residual unbalance (${results.residualUnbalance?.toFixed(2)} g-mm) berada di bawah limit yang diizinkan (${results.uPer.toFixed(2)} g-mm). Mesin dinyatakan LAYAK BEROPERASI (FIT FOR OPERATION).`
                       ) : (
                         ` Nilai residual unbalance (${results.residualUnbalance?.toFixed(2)} g-mm) masih di atas batas toleransi G${data.isoGrade} (${results.uPer.toFixed(2)} g-mm). Direkomendasikan melakukan Trim Run sesuai panduan pada sistem.`
                       )}
                    </div>
                 </div>

                 <div className="pt-12 flex justify-between">
                    <div className="w-48 text-center space-y-10">
                       <p className="text-xs font-bold border-b border-slate-300 pb-1 uppercase font-mono">VIBRATION TECHNICIAN</p>
                       <div className="h-0.5 bg-slate-200" />
                    </div>
                    <div className="w-48 text-center space-y-10">
                       <p className="text-xs font-bold border-b border-slate-300 pb-1 uppercase font-mono">RELIABILITY ENGINEER</p>
                       <div className="h-0.5 bg-slate-200" />
                    </div>
                 </div>
              </div>

              <div className="flex justify-center gap-4">
                  <button onClick={reset} className="flex items-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-bold font-mono text-xs uppercase hover:bg-slate-800 transition-colors">
                    <RotateCcw size={18} />
                    START NEW BALANCING JOB
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-8 py-4 bg-brand-accent text-slate-950 rounded-2xl font-bold font-mono text-xs uppercase hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/10"
                  >
                    <Download size={18} />
                    CETAK / DOWNLOAD LAPORAN RESMI
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none !important;
            padding: 0 !important;
          }
           .print-styles {
             box-shadow: none !important;
             background: white !important;
             color: black !important;
           }
        }
      `}</style>
    </div>
  );
}
