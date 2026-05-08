import { useState, useEffect, useRef } from 'react';
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
  Maximize2
} from 'lucide-react';

interface Vector {
  mag: number;
  ang: number;
}

const toRad = (d: number) => d * Math.PI / 180;
const toDeg = (r: number) => {
  let d = r * 180 / Math.PI;
  return (d < 0 ? d + 360 : d) % 360;
};

const p2c = (m: number, a: number) => ({
  x: m * Math.cos(toRad(a)),
  y: m * Math.sin(toRad(a))
});

const c2p = (x: number, y: number) => ({
  mag: Math.sqrt(x * x + y * y),
  ang: toDeg(Math.atan2(y, x))
});

const vSub = (v1: Vector, v2: Vector): Vector => {
  const c1 = p2c(v1.mag, v1.ang);
  const c2 = p2c(v2.mag, v2.ang);
  return c2p(c1.x - c2.x, c1.y - c2.y);
};

const vDiv = (v1: Vector, v2: Vector): Vector => ({
  mag: v1.mag / v2.mag,
  ang: v1.ang - v2.ang
});

export default function BalancingWorkshop({ equipmentData = [] }: { equipmentData?: any[] }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEquipSuggestions, setShowEquipSuggestions] = useState(false);
  const [data, setData] = useState({
    jobName: '',
    clientName: '',
    rotorMass: 0,
    operatingRPM: 0,
    isoGrade: 6.3,
    diameter: 0,
    rotationDir: 'CW' as 'CW' | 'CCW',
    numBlades: 0,
    
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
    setData({ ...data, jobName: `${item.id} - ${item.desc}` });
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

  const [results, setResults] = useState<{
    uPer: number;
    influenceVector: Vector | null;
    correction: Vector | null;
    splitWeights: { angle: number; mass: number }[] | null;
    residualUnbalance: number | null;
    isAcceptable: boolean | null;
  }>({
    uPer: 0,
    influenceVector: null,
    correction: null,
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
      const correction: Vector = { 
        mag: rawCorr.mag, 
        ang: (rawCorr.ang + 180) % 360 
      };
      if (correction.ang < 0) correction.ang += 360;

      // Handle Split Weights if blades provided
      let splits = null;
      if (data.numBlades >= 3) {
        const bladeDeg = 360 / data.numBlades;
        const idx = Math.floor(correction.ang / bladeDeg);
        const a1 = idx * bladeDeg;
        const a2 = (idx + 1) * bladeDeg;

        const rT = toRad(correction.ang);
        const r1 = toRad(a1);
        const r2 = toRad(a2);
        const det = Math.sin(r2 - r1);

        const m1 = (correction.mag * Math.sin(r2 - rT)) / det;
        const m2 = (correction.mag * Math.sin(rT - r1)) / det;
        
        splits = [
          { angle: a1, mass: m1 },
          { angle: a2, mass: m2 }
        ];
      }

      setResults(prev => ({
        ...prev,
        influenceVector: alpha,
        correction: correction,
        splitWeights: splits
      }));
      setStep(4);
    }
  };

  const handleVerify = () => {
    if (results.influenceVector && data.finalAmp >= 0) {
      // Residual Unbalance (mass equivalent at radius)
      const radius = data.diameter / 2;
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
      splitWeights: null,
      residualUnbalance: null,
      isAcceptable: null
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-32">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-accent/20 rounded-lg">
                <Scale className="text-brand-accent" size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Workshop Balancing</h1>
            </div>
            <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">ISO 21940-11 Single Plane Compliance</p>
          </div>
          
          <div className="flex items-center gap-2">
             {[1, 2, 3, 4, 5].map((s) => (
               <div key={s} className="flex items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                   step === s ? 'bg-brand-accent text-slate-950 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                   step > s ? 'bg-slate-700 text-slate-300' : 'bg-slate-900 border border-slate-800 text-slate-600'
                 }`}>
                   {s}
                 </div>
                 {s < 5 && <div className={`w-6 h-0.5 ${step > s ? 'bg-slate-700' : 'bg-slate-900'}`} />}
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="text-brand-accent" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Data Mesin</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1 relative" ref={suggestionRef}>
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Input / Cari Equipment</label>
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
                          placeholder="Ketik kode (101-J) atau nama..."
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
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Arah Putaran</label>
                        <select 
                          value={data.rotationDir}
                          onChange={e => setData({...data, rotationDir: e.target.value as any})}
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm outline-none"
                        >
                          <option value="CW">CW (Kanan)</option>
                          <option value="CCW">CCW (Kiri)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Jml Blade (Opsional)</label>
                        <input 
                          type="number" 
                          value={data.numBlades || ''}
                          onChange={e => setData({...data, numBlades: parseInt(e.target.value) || 0})}
                          placeholder="e.g. 5"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Diameter Plane (mm)</label>
                      <input 
                        type="number" 
                        value={data.diameter || ''}
                        onChange={e => setData({...data, diameter: parseFloat(e.target.value) || 0})}
                        placeholder="800"
                        className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-brand-accent/20 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Trophy size={80} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-brand-accent" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">ISO 21940-11 Standard</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Massa Rotor (kg) - Opsional</label>
                        <input 
                          type="number" 
                          value={data.rotorMass || ''}
                          onChange={e => setData({...data, rotorMass: parseFloat(e.target.value) || 0})}
                          placeholder="Kosongkan jika tak tahu"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Operating RPM (Service)</label>
                        <input 
                          type="number" 
                          value={data.operatingRPM || ''}
                          onChange={e => setData({...data, operatingRPM: parseFloat(e.target.value) || 0})}
                          placeholder="RPM saat mesin kerja"
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Target ISO Grade</label>
                      <select 
                        value={data.isoGrade}
                        onChange={e => setData({...data, isoGrade: parseFloat(e.target.value)})}
                        className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm cursor-pointer outline-none"
                      >
                        <option value={2.5}>G2.5 (High Precision / Turbines)</option>
                        <option value={6.3}>G6.3 (Standar: Pumps, Fans, Gears)</option>
                        <option value={16}>G16 (Heavy Duty / Agricultural)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-brand-accent/5 border border-brand-accent/30 rounded-2xl">
                      <div className="text-[9px] uppercase font-mono text-brand-accent/60 mb-1">Max Permissible Unbalance (Uper)</div>
                      <div className="text-2xl font-black text-brand-accent">
                        {data.rotorMass > 0 && data.operatingRPM > 0 ? results.uPer.toFixed(1) : '---'} <span className="text-sm font-normal">g-mm</span>
                      </div>
                      <div className="text-[8px] text-slate-500 mt-1 uppercase">*(Dihitung berdasarkan Operating Speed)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!data.jobName || !data.diameter}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-all"
                >
                  NEXT: INITIAL RUN
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

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
                   <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                     <RotateCcw size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold">Initial Run Data</h3>
                     <p className="text-sm text-slate-400">Ukur vibrasi 1X RPM saat kondisi mesin awal.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Initial Amplitude (Microns)</label>
                    <input 
                      type="number" 
                      value={data.initAmp || ''}
                      onChange={e => setData({...data, initAmp: parseFloat(e.target.value) || 0})}
                      placeholder="e.g. 85.5"
                      className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Initial Phase (Deg)</label>
                    <input 
                      type="number" 
                      value={data.initPh || ''}
                      onChange={e => setData({...data, initPh: parseFloat(e.target.value) || 0})}
                      placeholder="e.g. 120"
                      className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-white transition-colors">BACK</button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!data.initAmp}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 hover:bg-brand-accent/90 transition-all"
                >
                  NEXT: TRIAL RUN
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

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
                   <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                     <Target size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold">Trial Run Configuration</h3>
                     <p className="text-sm text-slate-400">Pasang beban trial sementara pada rotor.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Berat Trial (Gram)</label>
                        <input 
                          type="number" 
                          value={data.trialMass || ''}
                          onChange={e => setData({...data, trialMass: parseFloat(e.target.value) || 0})}
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Posisi Trial (Deg)</label>
                        <input 
                          type="number" 
                          value={data.trialAng || ''}
                          onChange={e => setData({...data, trialAng: parseFloat(e.target.value) || 0})}
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Amplitude Baru</label>
                        <input 
                          type="number" 
                          value={data.trialAmp || ''}
                          onChange={e => setData({...data, trialAmp: parseFloat(e.target.value) || 0})}
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Phase Baru</label>
                        <input 
                          type="number" 
                          value={data.trialPh || ''}
                          onChange={e => setData({...data, trialPh: parseFloat(e.target.value) || 0})}
                          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl p-6 border border-slate-800/50">
                    <div className="mb-4 text-[10px] font-mono text-slate-500 uppercase">Visual Reference</div>
                    <svg viewBox="0 0 200 200" className="w-40 h-40">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                      <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="1" className="text-slate-900" />
                      <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1" className="text-slate-900" />
                      
                      {/* Initial Vector */}
                      {data.initAmp > 0 && (
                        <line 
                          x1="100" y1="100" 
                          x2={100 + 70 * Math.cos(toRad(data.initPh))} 
                          y2={100 - 70 * Math.sin(toRad(data.initPh))} 
                          stroke="blue" strokeWidth="1" strokeDasharray="2 2"
                        />
                      )}
                      
                      {/* Trial Weight */}
                      {data.trialMass > 0 && (
                        <circle 
                          cx={100 + 80 * Math.cos(toRad(data.trialAng))} 
                          cy={100 - 80 * Math.sin(toRad(data.trialAng))} 
                          r="6" fill="#f59e0b" className="animate-pulse"
                        />
                      )}
                      <text x="185" y="105" fontSize="10" className="fill-slate-600 font-bold">0°</text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-slate-400 font-bold hover:text-white transition-colors">BACK</button>
                <button 
                  onClick={handleCalculate}
                  disabled={!data.trialMass || !data.trialAmp}
                  className="group flex items-center gap-2 bg-brand-accent text-slate-950 px-8 py-4 rounded-2xl font-bold disabled:opacity-30 hover:bg-brand-accent/90 transition-all"
                >
                  COMPUTE SOLUTION
                  <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && results.correction && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <div>
                   <h4 className="font-bold text-red-400 uppercase tracking-tight">Peringatan Krusial</h4>
                   <p className="text-sm text-red-200/70">LEPAS beban trial weight sebelum memasang beban koreksi utama. Jangan pernah membiarkan beban trial tertinggal di poros.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-8">
                   <div>
                     <h3 className="text-2xl font-black italic tracking-tighter text-brand-accent uppercase">Correction Solution</h3>
                     <p className="text-sm text-slate-400">Pasang beban berikut pada rotor.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                     <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Massa Koreksi</label>
                        <div className="text-4xl font-black text-white">{results.correction.mag.toFixed(1)} <span className="text-lg font-normal text-slate-400">Gram</span></div>
                     </div>
                     <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Posisi Sudut</label>
                        <div className="text-4xl font-black text-white">{results.correction.ang.toFixed(1)}°</div>
                        <div className="mt-2 text-xs font-mono text-brand-accent/70">
                           {data.rotationDir === 'CW' ? 'Ukur CCW dari 0°' : 'Ukur CW dari 0°'}
                        </div>
                     </div>
                   </div>

                   {results.splitWeights && (
                     <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <Info size={14} className="text-blue-400" />
                           <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Blade Split Logic</h4>
                        </div>
                        <div className="space-y-3">
                           {results.splitWeights.map((sw, i) => (
                             <div key={i} className="flex justify-between items-center text-sm">
                               <span className="text-slate-400">Blade {sw.angle.toFixed(0)}°</span>
                               <span className="font-bold text-white">{sw.mass.toFixed(1)} Gram</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-6">
                   <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">SVG Visualization</div>
                   <svg viewBox="0 0 320 320" className="w-full max-w-[280px]">
                      {/* Rotor Base */}
                      <circle cx="160" cy="160" r="120" fill="none" stroke="#1e293b" strokeWidth="4" />
                      <circle cx="160" cy="160" r="140" fill="none" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
                      
                      {/* Crosshair */}
                      <line x1="160" y1="40" x2="160" y2="280" stroke="#0f172a" strokeWidth="1" />
                      <line x1="40" y1="160" x2="280" y2="160" stroke="#0f172a" strokeWidth="1" />
                      
                      {/* Labels */}
                      <text x="290" y="165" fontSize="12" className="fill-slate-600 font-bold">0°</text>
                      
                      {/* Blades if any */}
                      {data.numBlades > 0 && Array.from({length: data.numBlades}).map((_, i) => {
                        const deg = i * (360 / data.numBlades);
                        return (
                          <line 
                            key={i}
                            x1="160" y1="160" 
                            x2={160 + 120 * Math.cos(toRad(deg))} 
                            y2={160 - 120 * Math.sin(toRad(deg))} 
                            stroke="#1e293b" strokeWidth="1"
                          />
                        );
                      })}

                      {/* Ghost Trial */}
                      <circle 
                        cx={160 + 120 * Math.cos(toRad(data.trialAng))} 
                        cy={160 - 120 * Math.sin(toRad(data.trialAng))} 
                        r="6" fill="#64748b" opacity="0.3"
                      />
                      <text 
                        x={160 + 140 * Math.cos(toRad(data.trialAng))} 
                        y={160 - 140 * Math.sin(toRad(data.trialAng))} 
                        fontSize="8" className="fill-slate-700" textAnchor="middle"
                      >TRIAL (REM)</text>

                      {/* Main Correction */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <line 
                          x1="160" y1="160" 
                          x2={160 + 120 * Math.cos(toRad(results.correction.ang))} 
                          y2={160 - 120 * Math.sin(toRad(results.correction.ang))} 
                          stroke="#22c55e" strokeWidth="4" 
                        />
                        <circle 
                          cx={160 + 120 * Math.cos(toRad(results.correction.ang))} 
                          cy={160 - 120 * Math.sin(toRad(results.correction.ang))} 
                          r="12" fill="#22c55e" className="shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                        />
                        <text 
                          x={160 + 120 * Math.cos(toRad(results.correction.ang))} 
                          y={160 - 120 * Math.sin(toRad(results.correction.ang)) + 4} 
                          fontSize="10" className="fill-slate-950 font-black text-center" textAnchor="middle"
                        >W</text>
                      </motion.g>
                   </svg>
                </div>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 space-y-6">
                <div>
                   <h4 className="font-bold text-slate-200">Tahap Akhir: Verifikasi</h4>
                   <p className="text-sm text-slate-400">Masukkan nilai vibrasi setelah beban koreksi dipasang untuk verifikasi standar ISO.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                     <label className="text-[10px] font-mono text-slate-500 uppercase">Residual Amplitude</label>
                     <input 
                       type="number" 
                       value={data.finalAmp || ''}
                       onChange={e => setData({...data, finalAmp: parseFloat(e.target.value) || 0})}
                       className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-mono text-slate-500 uppercase">Residual Phase</label>
                     <input 
                       type="number" 
                       value={data.finalPh || ''}
                       onChange={e => setData({...data, finalPh: parseFloat(e.target.value) || 0})}
                       className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 outline-none"
                     />
                   </div>
                </div>
                <div className="flex justify-end gap-3">
                   <button onClick={() => setStep(3)} className="px-6 py-3 text-slate-400 font-bold hover:text-white">BACK</button>
                   <button 
                    onClick={() => {
                      handleVerify();
                      setStep(5);
                    }}
                    className="bg-brand-accent text-slate-950 px-8 py-3 rounded-xl font-bold hover:bg-brand-accent/90"
                   >
                     VERIFY & COMPLETE
                   </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className={`p-8 rounded-3xl border ${
                results.isAcceptable === null ? 'bg-slate-800 border-slate-700' :
                results.isAcceptable ? 'bg-brand-accent/10 border-brand-accent/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-6">
                  {results.isAcceptable === null ? (
                    <Info size={60} className="text-slate-400 shrink-0" />
                  ) : results.isAcceptable ? (
                    <CheckCircle2 size={60} className="text-brand-accent shrink-0" />
                  ) : (
                    <AlertTriangle size={60} className="text-red-500 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                      Status: {results.isAcceptable === null ? 'Balancing Complete' : results.isAcceptable ? 'Acceptable' : 'Margin Exceeded'}
                    </h2>
                    <p className={`text-lg font-bold ${
                      results.isAcceptable === null ? 'text-slate-400' :
                      results.isAcceptable ? 'text-brand-accent' : 'text-red-400'
                    }`}>
                      {results.isAcceptable === null ? 'ISO Verification Skipped (No Mass Data)' : `ISO 21940-11 Compliant: ${results.isAcceptable ? 'YES (PASSED)' : 'NO (FAILED)'}`}
                    </p>
                    {data.rotorMass > 0 && data.operatingRPM > 0 && (
                      <div className="mt-4 flex gap-8">
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Limit (g-mm)</div>
                          <div className="text-xl font-bold">{results.uPer.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Residual (g-mm)</div>
                          <div className="text-xl font-bold">{results.residualUnbalance?.toFixed(1)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Printable Report Section */}
              <div id="printable-report" className="bg-white text-slate-900 p-12 rounded-lg border border-slate-200 space-y-12 relative overflow-hidden print-styles">
                 {/* Watermark/Stamp */}
                 {results.isAcceptable && (
                   <div className="absolute top-10 right-10 w-40 h-40 border-4 border-green-600 rounded-full flex flex-col items-center justify-center rotate-12 opacity-80 pointer-events-none">
                      <div className="text-green-600 font-bold uppercase text-[10px]">Certified Compliance</div>
                      <div className="text-green-600 font-black text-xl uppercase tracking-tighter">ISO 21940-11</div>
                      <div className="text-green-600 font-bold text-sm">GRADE G{data.isoGrade}</div>
                   </div>
                 )}
                 {!results.isAcceptable && results.isAcceptable !== null && (
                   <div className="absolute top-10 right-10 w-40 h-40 border-4 border-red-600 rounded-full flex flex-col items-center justify-center rotate-12 opacity-80 pointer-events-none">
                      <div className="text-red-600 font-bold uppercase text-[10px]">Verification</div>
                      <div className="text-red-600 font-black text-xl uppercase tracking-tighter">FAILED</div>
                   </div>
                 )}

                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-black italic tracking-tighter uppercase">GRID Engine Report</h1>
                       <p className="text-xs font-mono text-slate-500 tracking-widest">Rotating Inspection & Diagnostics</p>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-bold">DATE: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                       <div className="text-xs text-slate-500">REF: BA-{Math.floor(Math.random()*10000)}</div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-12 text-sm">
                    <div className="space-y-4">
                       <h3 className="font-bold border-b border-slate-200 pb-2">MACHINE DATA</h3>
                       <div className="grid grid-cols-2 gap-y-2">
                          <span className="text-slate-500">Job Name:</span>
                          <span className="font-bold">{data.jobName || '-'}</span>
                          <span className="text-slate-500">Mass:</span>
                          <span className="font-bold">{data.rotorMass > 0 ? `${data.rotorMass} kg` : 'N/A'}</span>
                          <span className="text-slate-500">Op RPM:</span>
                          <span className="font-bold">{data.operatingRPM > 0 ? `${data.operatingRPM} RPM` : 'N/A'}</span>
                          <span className="text-slate-500">Diameter:</span>
                          <span className="font-bold">{data.diameter} mm</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h3 className="font-bold border-b border-slate-200 pb-2">BALANCING RESULTS</h3>
                       <div className="grid grid-cols-2 gap-y-2">
                          <span className="text-slate-500">Init Vib:</span>
                          <span className="font-bold">{data.initAmp} µm @ {data.initPh}°</span>
                          <span className="text-slate-500">ISO Status:</span>
                          <span className={`font-bold ${results.isAcceptable ? 'text-emerald-600' : results.isAcceptable === false ? 'text-red-600' : 'text-slate-600'}`}>
                            {results.isAcceptable === null ? 'NOT VERIFIED' : `PASS G${data.isoGrade}`}
                          </span>
                          <span className="text-slate-500">Corr Mass:</span>
                          <span className="font-bold">{results.correction?.mag.toFixed(1)} g</span>
                          <span className="text-slate-500">Final Vib:</span>
                          <span className="font-bold text-emerald-600 italic">{data.finalAmp} µm @ {data.finalPh}°</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-8">
                    <h3 className="font-bold">ENGINEER CONCLUSION</h3>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed">
                       Pekerjaan penyeimbangan massa (single plane balancing) telah diselesaikan. 
                       {results.isAcceptable === null ? (
                         " Proses balancing berhasil menurunkan vibrasi mesin secara signifikan. Dikarenakan data berat rotor dan RPM kerja tidak tersedia secara pasti, verifikasi standar ISO 21940-11 dilewati."
                       ) : results.isAcceptable ? (
                         ` Rotor mencapai tingkat kestabilan yang dipersyaratkan oleh standar ISO 21940-11 Grade G${data.isoGrade} dengan nilai residual unbalance sebesar ${results.residualUnbalance?.toFixed(2)} g-mm.`
                       ) : (
                         ` Proses balancing telah dilakukan. Namun nilai residual unbalance (${results.residualUnbalance?.toFixed(2)} g-mm) masih berada di atas limit standar G${data.isoGrade} (${results.uPer.toFixed(2)} g-mm). Disarankan pengecekan lebih lanjut.`
                       )}
                       Equipment dinyatakan layak beroperasi berdasarkan penurunan amplitudo getaran.
                    </div>
                 </div>

                 <div className="pt-16 flex justify-between">
                    <div className="w-48 text-center space-y-12">
                       <p className="text-xs font-bold border-b border-slate-200 pb-2">TECHNICIAN</p>
                       <div className="h-1 bg-slate-200" />
                    </div>
                    <div className="w-48 text-center space-y-12">
                       <p className="text-xs font-bold border-b border-slate-200 pb-2">HEAD OF INSPECTION</p>
                       <div className="h-1 bg-slate-200" />
                    </div>
                 </div>
              </div>

              <div className="flex justify-center gap-4">
                  <button onClick={reset} className="flex items-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                    <RotateCcw size={18} />
                    START NEW JOB
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-8 py-4 bg-brand-accent text-slate-950 rounded-2xl font-bold hover:bg-brand-accent/90 transition-all"
                  >
                    <Download size={18} />
                    DOWNLOAD REPORT
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
