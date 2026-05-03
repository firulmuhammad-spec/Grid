/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  BookOpen, 
  History, 
  Wand2, 
  Search, 
  Factory, 
  ChevronDown,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard Form State
  const [wizardData, setWizardData] = useState({
    // Step 1: Identity & Machine
    plant: '',
    machineId: '',
    rpmCpm: '',
    orientation: '', // Horizontal, Vertikal
    configuration: '', // Motor-Pompa, etc.
    
    // Step 2: Basic Vibration
    maxVibLocation: '', // Driver NDE, Driver DE...
    overallValue: '',
    dominantDirection: '',
    spectrumPatterns: [] as string[], // 1X RPM, Harmonics, Sub, HF
    
    // Step 3: Dynamic Investigations
    crossPhaseDeg: '',
    coherence: '',
    skipPhase: false,
    
    peakVue: '',
    waveformPattern: '',
    skipBearing: false,
    
    gmfDominant: false,
    sidebandsPresent: false,
    skipGearbox: false,
    
    loosenessBaseplate: false,
    bentShaftIndication: false,
    skipHarmonics: false,
    
    // Step 3: Sub-synch
    bearingType: '', // Rolling, Journal
    isWhirlWhipRange: false,
    isRubbingSound: false,
    isFlowFluctuation: false,
    skipSubSynch: false,
    
    // Step 4: Verification
    sensorPerpendicular: false,
    surfaceFlat: false
  });

  const toggleSpectrumPattern = (pattern: string) => {
    setWizardData(prev => ({
      ...prev,
      spectrumPatterns: prev.spectrumPatterns.includes(pattern)
        ? prev.spectrumPatterns.filter(p => p !== pattern)
        : [...prev.spectrumPatterns, pattern]
    }));
  };

  const getDiagnosticResults = () => {
    const results = [];
    const patterns = wizardData.spectrumPatterns;
    const direction = wizardData.dominantDirection;
    const config = wizardData.configuration;
    
    let confidence = 50; // Base confidence
    if (wizardData.sensorPerpendicular && wizardData.surfaceFlat) confidence += 10;
    
    // Expert Logic for Confidence Level
    if (patterns.includes('1X')) {
      if (!wizardData.skipPhase && wizardData.crossPhaseDeg !== '' && parseFloat(wizardData.coherence) >= 0.8) {
        confidence = 95;
      } else if (wizardData.skipPhase) {
        confidence = Math.min(confidence, 70);
      }
    }

    if (patterns.includes('HF')) {
      if (!wizardData.skipBearing && wizardData.peakVue !== '') {
        confidence = Math.max(confidence, 90);
      } else if (wizardData.skipBearing) {
        confidence = Math.min(confidence, 65);
      }
    }

    if (patterns.includes('Harmonics')) {
      if (!wizardData.skipHarmonics && (wizardData.loosenessBaseplate || wizardData.bentShaftIndication)) {
        confidence = Math.max(confidence, 85);
      } else if (wizardData.skipHarmonics) {
        confidence = Math.min(confidence, 68);
      }
    }

    if (patterns.includes('Sub')) {
      if (!wizardData.skipSubSynch && (wizardData.bearingType !== '' || wizardData.isWhirlWhipRange || wizardData.isRubbingSound || wizardData.isFlowFluctuation)) {
        confidence = Math.max(confidence, 90);
      } else if (wizardData.skipSubSynch) {
        confidence = Math.min(confidence, 60);
      }
    }
    
    confidence = Math.min(confidence, 100);

    // Expert Logic Engine
    if (patterns.includes('1X')) {
      const phaseVal = parseFloat(wizardData.crossPhaseDeg);
      const isUnbalancePhase = (phaseVal >= 0 && phaseVal <= 30) || (phaseVal >= 330 && phaseVal <= 360);
      const isMisalignmentPhase = (phaseVal >= 150 && phaseVal <= 210);

      if (direction === 'Radial') {
        if (isUnbalancePhase) {
          results.push({ fault: 'Unbalance', prob: 95, rec: 'Lakukan in-place balancing atau bersihkan rotor/impeller dari penumpukan material.' });
          results.push({ fault: 'Misalignment', prob: 30, rec: 'Cek status alignment.' });
        } else if (isMisalignmentPhase) {
          results.push({ fault: 'Misalignment', prob: 92, rec: 'Jadwalkan Laser Alignment, cek kondisi elemen kopling, dan pastikan tidak ada soft foot.' });
          results.push({ fault: 'Unbalance', prob: 35, rec: 'Lakukan pembersihan rotor.' });
        } else {
          results.push({ fault: 'Unbalance / Resonance', prob: 60, rec: 'Data phase tidak konklusif. Lakukan pengecekan fisik menyeluruh.' });
        }
      } else if (direction === 'Axial') {
        results.push({ fault: 'Angular Misalignment', prob: 80, rec: 'Jadwalkan pengecekan alignment dan cek keausan elemen kopling.' });
        results.push({ fault: 'Bearing Cocked', prob: 30, rec: 'Cek verticality bearing housing.' });
      } else {
        results.push({ fault: 'Unbalance / Resonance', prob: 60, rec: 'Lakukan bump test untuk cek resonansi struktur.' });
      }
    }

    if (patterns.includes('Harmonics')) {
      if (wizardData.loosenessBaseplate) {
        results.push({ fault: 'Mechanical Looseness', prob: 90, rec: 'Kencangkan baut pondasi, cek indikasi soft foot.' });
      } else if (wizardData.bentShaftIndication) {
        results.push({ fault: 'Bent Shaft / Shaft Deflection', prob: 85, rec: 'Lakukan dial indicator test pada poros atau ganti poros jika bengkok permanen.' });
      } else {
        results.push({ fault: 'Misalignment / Looseness', prob: 70, rec: 'Cek kekencangan mounting bolt dan status alignment.' });
      }
    }

    if (patterns.includes('HF')) {
      const pv = parseFloat(wizardData.peakVue);
      if (pv > 5.0) {
        results.push({ fault: 'Severe Bearing Defect', prob: 90, rec: 'Siapkan penggantian bearing pada jadwal shutdown terdekat.' });
        results.push({ fault: 'Lack of Lubrication', prob: 40, rec: 'Lakukan greasing ulang segera.' });
      } else {
        results.push({ fault: 'Early Stage Bearing Defect', prob: 65, rec: 'Lakukan monitoring ketat (trend monitoring) dan evaluasi pelumasan.' });
      }
    }

    if (config.includes('Gearbox') && wizardData.gmfDominant) {
      if (wizardData.sidebandsPresent) {
        results.push({ fault: 'Gear Tooth Wear / Damage', prob: 85, rec: 'Inspeksi internal gear, cek kondisi oli dan partikel metal.' });
      } else {
        results.push({ fault: 'Backlash / Eccentric Gear', prob: 70, rec: 'Cek setting backlash dan eksentrisitas roda gigi.' });
      }
    }

    if (patterns.includes('Sub')) {
      if (wizardData.bearingType === 'Journal' && wizardData.isWhirlWhipRange) {
        results.push({ fault: 'Oil Whirl / Oil Whip', prob: 95, rec: 'Cek temperatur pelumas, periksa clearance pada journal bearing.' });
      }
      if (wizardData.isRubbingSound) {
        results.push({ fault: 'Rotor Rubbing', prob: 92, rec: 'Segera inspeksi internal untuk melihat titik gesekan pada rotor atau seal.' });
      }
      if (wizardData.isFlowFluctuation && (config.includes('Pompa') || config.includes('Blower'))) {
        results.push({ fault: 'Cavitation / Aeration / Surge', prob: 88, rec: 'Cek NPSH (Net Positive Suction Head), pastikan valve terbuka penuh, periksa filter hisap (suction).' });
      }
      if (results.length === 0) {
        results.push({ fault: 'General Sub-synchronous Anomaly', prob: 65, rec: 'Cek indikasi gesekan atau ketidakstabilan aliran.' });
      }
    }

    if (results.length === 0) {
      results.push({ fault: 'Anomaly Detected', prob: 50, rec: 'Data dasar minim. Cek detail spektrum atau lakukan inspeksi visual di lokasi.' });
    }
    
    const sortedResults = results.sort((a, b) => b.prob - a.prob).slice(0, 3);
    return { results: sortedResults, confidence };
  };

  const nextStep = () => setWizardStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setWizardStep(prev => Math.max(prev - 1, 1));

  const allVerified = wizardData.sensorPerpendicular && wizardData.surfaceCoatingFree && wizardData.boltsTight;

  return (
    <div id="app-container" className="min-h-screen pb-24 bg-brand-bg relative overflow-x-hidden">
      <div className="scanline" />
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showWizard ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            {/* 1. Header Utama */}
            <header id="main-header" className="px-6 pt-10 pb-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl font-display font-extrabold tracking-tighter text-brand-accent italic">
                  GRID
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] font-mono text-slate-400 mt-1">
                  Glosarium Referensi Inspeksi & Diagnostik
                </p>
              </motion.div>
            </header>

            <main className="px-6 space-y-8">
              {/* 2. Card 1 (Quick Action) */}
              <section id="quick-actions">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <button 
                    id="btn-diagnostic-wizard"
                    onClick={() => setShowWizard(true)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-brand-accent/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent mb-3">
                      <Wand2 size={24} />
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-slate-200 text-center">Diagnostic Wizard</span>
                  </button>

                  <button 
                    id="btn-search-glosarium"
                    className="flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-brand-accent/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent mb-3">
                      <Search size={24} />
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-slate-200 text-center">Search Glosarium</span>
                  </button>
                </motion.div>
              </section>

              {/* 3. Card 2 (RE-TRACE History) */}
              <section id="re-trace-history">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-3xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                    <h2 className="text-lg font-display font-bold text-white tracking-tight">Logbook Perbaikan Mesin</h2>
                  </div>
                  
                  <div className="relative">
                    <label htmlFor="plant-select" className="sr-only">Pilih Plant</label>
                    <div className="relative group">
                      <select
                        id="plant-select"
                        value={selectedPlant}
                        onChange={(e) => setSelectedPlant(e.target.value)}
                        className="w-full h-14 pl-12 pr-10 appearance-none bg-slate-900 border border-slate-600 rounded-xl text-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all cursor-pointer"
                      >
                        <option value="">Pilih Plant</option>
                        <option value="NH3A">NH3A</option>
                        <option value="NH3B">NH3B</option>
                        <option value="UTIL">UTIL</option>
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-accent transition-colors">
                        <Factory size={20} />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs italic text-slate-500 flex items-center gap-1.5">
                    <History size={12} />
                    Pilih plant untuk melihat riwayat perawatan mesin.
                  </p>

                  <AnimatePresence mode="wait">
                    {selectedPlant && (
                      <motion.div
                        key={selectedPlant}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-slate-700/50 space-y-3"
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                          <span>Recent Activity: {selectedPlant}</span>
                          <span className="text-brand-accent">LIVE VIEW</span>
                        </div>
                        {[1, 2].map((i) => (
                          <div key={i} className="flex gap-4 p-3 rounded-lg bg-brand-bg border border-slate-700/30">
                            <div className="mt-1">
                              <Activity size={14} className="text-brand-accent" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-200">Pump P-2001 {i === 1 ? 'A' : 'B'} Leakage</div>
                              <div className="text-[10px] text-slate-500">2h ago • Inspector ID: 4421</div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </section>

              {/* Extra Decorative Branding */}
              <section id="safety-warning" className="pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-accent/10 border-l-4 border-brand-accent rounded-r-lg">
                  <AlertCircle size={16} className="text-brand-accent shrink-0" />
                  <span className="text-[10px] font-mono text-brand-accent/80 leading-tight tracking-wider uppercase">
                    SAFETY FIRST: Ensure proper LOTO procedures are followed.
                  </span>
                </div>
              </section>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full px-6 pt-10"
          >
            {/* Wizard Header */}
            <header className="flex items-center justify-between mb-8">
              <button 
                onClick={() => { setShowWizard(false); setWizardStep(1); }}
                className="flex items-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800">
                  <ChevronDown size={18} className="rotate-90" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest font-mono">Exit</span>
              </button>
              <div className="text-right">
                <div className="text-[10px] font-mono text-brand-accent uppercase mb-1">Step {wizardStep} of 4</div>
                <div className="flex gap-1 justify-end">
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step} 
                      className={`h-1 rounded-full transition-all duration-300 ${step <= wizardStep ? 'bg-brand-accent w-6' : 'bg-slate-800 w-3'}`}
                    />
                  ))}
                </div>
              </div>
            </header>
            <AnimatePresence mode="wait">
              {/* Step 1: Identitas & Konfigurasi Mesin */}
              {wizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-l-4 border-brand-accent pl-4">
                    <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Machine Context</h2>
                    <p className="text-xs font-mono text-slate-500 uppercase">Phase 1: Mechanical Configuration</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Plant Location</label>
                      <select 
                        value={wizardData.plant} 
                        onChange={(e) => setWizardData({...wizardData, plant: e.target.value})}
                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                      >
                        <option value="">Pilih Plant</option>
                        <option value="NH3A">NH3A</option>
                        <option value="NH3B">NH3B</option>
                        <option value="UTIL">UTIL</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Speed (RPM/CPM)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1500"
                        value={wizardData.rpmCpm}
                        onChange={(e) => setWizardData({...wizardData, rpmCpm: e.target.value})}
                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Machine ID / Tag</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: P-2001A"
                      value={wizardData.machineId}
                      onChange={(e) => setWizardData({...wizardData, machineId: e.target.value})}
                      className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-accent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Orientation</label>
                      <select 
                        value={wizardData.orientation} 
                        onChange={(e) => setWizardData({...wizardData, orientation: e.target.value})}
                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                      >
                        <option value="">Select</option>
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertikal">Vertikal</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Configuration</label>
                      <select 
                        value={wizardData.configuration} 
                        onChange={(e) => setWizardData({...wizardData, configuration: e.target.value})}
                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                      >
                        <option value="">Select Configuration</option>
                        <option value="Motor-Pompa">Motor-Pompa</option>
                        <option value="Motor-Blower">Motor-Blower</option>
                        <option value="Motor-Gearbox-Driven">Motor-Gearbox-Driven</option>
                        <option value="Turbin-Driven">Turbin-Driven</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Input Data Vibrasi Dasar */}
              {wizardStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Vibration Data</h2>
                    <p className="text-xs font-mono text-slate-500 uppercase">Phase 2: Baseline Spectrum Analysis</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Highest Vibration Location</label>
                      <select 
                        value={wizardData.maxVibLocation} 
                        onChange={(e) => setWizardData({...wizardData, maxVibLocation: e.target.value})}
                        className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                      >
                        <option value="">Select Component</option>
                        <option value="Driver NDE">Driver Non-Drive End (NDE)</option>
                        <option value="Driver DE">Driver Drive End (DE)</option>
                        <option value="Driven DE">Driven Drive End (DE)</option>
                        <option value="Driven NDE">Driven Non-Drive End (NDE)</option>
                        <option value="Gearbox">Gearbox Housing</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Overall (mm/s RMS)</label>
                        <input 
                          type="number" 
                          placeholder="0.0"
                          value={wizardData.overallValue}
                          onChange={(e) => setWizardData({...wizardData, overallValue: e.target.value})}
                          className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-accent transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Dominant Direction</label>
                        <select 
                          value={wizardData.dominantDirection} 
                          onChange={(e) => setWizardData({...wizardData, dominantDirection: e.target.value})}
                          className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                        >
                          <option value="">Select</option>
                          <option value="Horizontal">Horizontal</option>
                          <option value="Vertikal">Vertikal</option>
                          <option value="Axial">Aksial</option>
                          <option value="Radial">Radial</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Dominant Spectrum Pattern (Orders)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: '1X', label: '1X RPM' },
                          { id: 'Harmonics', label: 'Harmonics (2X/3X+)' },
                          { id: 'Sub', label: 'Sub-synch (<1X)' },
                          { id: 'HF', label: 'High Freq / Noise' }
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => toggleSpectrumPattern(p.id)}
                            className={`p-3 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                              wizardData.spectrumPatterns.includes(p.id)
                                ? 'bg-brand-accent border-brand-accent text-white shadow-lg shadow-brand-accent/20'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Investigasi Dinamis */}
              {wizardStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Expert Logic</h2>
                    <p className="text-xs font-mono text-slate-500 uppercase">Phase 3: Deep Targeted Validation</p>
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Logic A: 1X Cross Phase */}
                    {wizardData.spectrumPatterns.includes('1X') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-brand-accent/30 rounded-2xl space-y-4 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Activity size={16} className="text-brand-accent" />
                            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Cross Phase Analysis</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipPhase} onChange={e => setWizardData({...wizardData, skipPhase: e.target.checked})} className="w-3 h-3 accent-brand-accent" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipPhase && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Phase Diff (Deg)</label>
                              <input type="number" placeholder="0°" value={wizardData.crossPhaseDeg} onChange={e => setWizardData({...wizardData, crossPhaseDeg: e.target.value})} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Coherence</label>
                              <input type="number" step="0.1" placeholder="0.9" value={wizardData.coherence} onChange={e => setWizardData({...wizardData, coherence: e.target.value})} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Logic B: Bearing / HF */}
                    {wizardData.spectrumPatterns.includes('HF') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-blue-500/30 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Bearing / Lubrication</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipBearing} onChange={e => setWizardData({...wizardData, skipBearing: e.target.checked})} className="w-3 h-3 accent-blue-500" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipBearing && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">PeakVue / Enveloping (G's)</label>
                              <input type="number" placeholder="0.5 Gs" value={wizardData.peakVue} onChange={e => setWizardData({...wizardData, peakVue: e.target.value})} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Time-Waveform Pattern</label>
                              <select value={wizardData.waveformPattern} onChange={e => setWizardData({...wizardData, waveformPattern: e.target.value})} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white">
                                <option value="">Select Pattern</option>
                                <option value="Normal">Normal</option>
                                <option value="Impacting">Impacting / Pukulan</option>
                                <option value="Modulation">Modulation / Mengalun</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Logic C: Gearbox */}
                    {(wizardData.maxVibLocation === 'Gearbox' || wizardData.configuration.includes('Gearbox')) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-amber-500/30 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Factory size={16} className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Gearbox Analysis</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipGearbox} onChange={e => setWizardData({...wizardData, skipGearbox: e.target.checked})} className="w-3 h-3 accent-amber-500" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipGearbox && (
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                              <input type="checkbox" checked={wizardData.gmfDominant} onChange={e => setWizardData({...wizardData, gmfDominant: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                              <span className="text-[10px] font-bold text-slate-300">GMF Dominant Present</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                              <input type="checkbox" checked={wizardData.sidebandsPresent} onChange={e => setWizardData({...wizardData, sidebandsPresent: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                              <span className="text-[10px] font-bold text-slate-300">Sidebands around GMF detected</span>
                            </label>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Logic D: Harmonics */}
                    {wizardData.spectrumPatterns.includes('Harmonics') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-purple-500/30 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Activity size={16} className="text-purple-500" />
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Analisa Kelonggaran & Poros</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipHarmonics} onChange={e => setWizardData({...wizardData, skipHarmonics: e.target.checked})} className="w-3 h-3 accent-purple-500" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipHarmonics && (
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                              <input type="checkbox" checked={wizardData.loosenessBaseplate} onChange={e => setWizardData({...wizardData, loosenessBaseplate: e.target.checked})} className="w-4 h-4 accent-purple-500" />
                              <span className="text-[10px] font-bold text-slate-300">Terdapat indikasi baut baseplate kendor</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                              <input type="checkbox" checked={wizardData.bentShaftIndication} onChange={e => setWizardData({...wizardData, bentShaftIndication: e.target.checked})} className="w-4 h-4 accent-purple-500" />
                              <span className="text-[10px] font-bold text-slate-300">Indikasi poros bengkok (Bent Shaft)</span>
                            </label>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Logic E: Sub-synch */}
                    {wizardData.spectrumPatterns.includes('Sub') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Activity size={16} className="text-cyan-500" />
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Analisa Gesekan & Fluida</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipSubSynch} onChange={e => setWizardData({...wizardData, skipSubSynch: e.target.checked})} className="w-3 h-3 accent-cyan-500" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipSubSynch && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Jenis Bearing</label>
                              <select 
                                value={wizardData.bearingType} 
                                onChange={e => setWizardData({...wizardData, bearingType: e.target.value})} 
                                className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                              >
                                <option value="">Pilih Jenis</option>
                                <option value="Rolling">Rolling Element</option>
                                <option value="Journal">Journal / Sleeve Bearing</option>
                              </select>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                                <input type="checkbox" checked={wizardData.isWhirlWhipRange} onChange={e => setWizardData({...wizardData, isWhirlWhipRange: e.target.checked})} className="w-4 h-4 accent-cyan-500" />
                                <span className="text-[10px] font-bold text-slate-300">Frekuensi persis di rentang 0.38X - 0.48X RPM</span>
                              </label>
                              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                                <input type="checkbox" checked={wizardData.isRubbingSound} onChange={e => setWizardData({...wizardData, isRubbingSound: e.target.checked})} className="w-4 h-4 accent-cyan-500" />
                                <span className="text-[10px] font-bold text-slate-300">Terdengar suara gesekan kasar (Rubbing)</span>
                              </label>
                              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                                <input type="checkbox" checked={wizardData.isFlowFluctuation} onChange={e => setWizardData({...wizardData, isFlowFluctuation: e.target.checked})} className="w-4 h-4 accent-cyan-500" />
                                <span className="text-[10px] font-bold text-slate-300">Terdapat indikasi fluktuasi aliran/tekanan fluida (Cavitation/Surge)</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {wizardData.spectrumPatterns.length === 0 && !wizardData.configuration.includes('Gearbox') && wizardData.maxVibLocation !== 'Gearbox' && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] mb-2 px-6">Data Dasar Cukup - Silakan klik Lanjutkan untuk melihat hasil.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Verifikasi & Hasil */}
              {wizardStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4 mb-2">
                      <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Final Verdict</h2>
                      <p className="text-xs font-mono text-slate-500 uppercase">Phase 4: Confidence-Weighted Diagnosis</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${wizardData.sensorPerpendicular ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                        <div className="flex justify-between items-center">
                          <Activity size={14} className={wizardData.sensorPerpendicular ? 'text-green-500' : 'text-slate-500'} />
                          <input type="checkbox" checked={wizardData.sensorPerpendicular} onChange={e => setWizardData({...wizardData, sensorPerpendicular: e.target.checked})} className="w-4 h-4 accent-green-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-200">Sensor Tegak Lurus</span>
                      </label>
                      <label className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${wizardData.surfaceFlat ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                        <div className="flex justify-between items-center">
                          <Activity size={14} className={wizardData.surfaceFlat ? 'text-green-500' : 'text-slate-500'} />
                          <input type="checkbox" checked={wizardData.surfaceFlat} onChange={e => setWizardData({...wizardData, surfaceFlat: e.target.checked})} className="w-4 h-4 accent-green-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-200">Permukaan Rata</span>
                      </label>
                    </div>

                    <AnimatePresence>
                      {(!wizardData.sensorPerpendicular || !wizardData.surfaceFlat) && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-4 py-2 border border-orange-500/30 bg-orange-500/10 rounded-lg flex items-center gap-3"
                        >
                          <AlertCircle size={14} className="text-orange-500 shrink-0" />
                          <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">Low Confidence - Cek Kondisi Fisik Pengukuran</span>
                        </motion.div>
                      )}
                      {getDiagnosticResults().confidence <= 75 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 border border-amber-500/50 bg-amber-500/10 rounded-xl flex items-start gap-3"
                        >
                          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-tight">ANALISA MARGINAL</p>
                            <p className="text-[9px] leading-tight text-slate-300">
                              {wizardData.spectrumPatterns.includes('1X') 
                                ? "ANALISA MARGINAL: Harap lengkapi data Cross Phase antar bantalan agar sistem dapat membedakan Unbalance dan Misalignment dengan akurat."
                                : wizardData.spectrumPatterns.includes('HF')
                                ? "ANALISA MARGINAL: Harap lengkapi data PeakVue/Enveloping untuk memastikan keparahan cacat bearing."
                                : "Confidence Level rendah. Harap lengkapi data spesifik (Cross Phase/PeakVue/Waveform) atau cek kondisi fisik secara menyeluruh agar hasil lebih akurat."
                              }
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 blur-2xl rounded-full -mr-12 -mt-12 pointer-events-none" />
                      
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Diagnostic Candidates</span>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-accent/20 text-brand-accent text-[8px] font-bold rounded-full">
                            <Activity size={10} />
                            LIVE ENGINE
                          </div>
                          <span className={`${getDiagnosticResults().confidence > 75 ? 'text-green-400' : 'text-amber-400'} text-[8px] font-mono mt-1`}>Confidence: {getDiagnosticResults().confidence}%</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {getDiagnosticResults().results.map((res, idx) => (
                          <div key={`${res.fault}-${idx}`} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className={`font-display font-black tracking-tight ${idx === 0 ? 'text-white text-xl uppercase italic' : 'text-slate-400 text-sm'}`}>
                                {res.fault}
                              </span>
                              <div className="text-right">
                                <span className={`font-mono font-black ${idx === 0 ? 'text-brand-accent text-lg' : 'text-slate-500 text-xs'}`}>
                                  {res.prob}%
                                </span>
                                <div className="text-[7px] text-slate-600 uppercase font-mono">Prob. Value</div>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${res.prob}%` }}
                                transition={{ duration: 1, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-brand-accent to-orange-400' : 'bg-slate-700'}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actionable Recommendation Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 p-4 bg-slate-800/20 border border-slate-700 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Wand2 size={14} className="text-brand-accent" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">REKOMENDASI TINDAKAN</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          {getDiagnosticResults().results[0]?.rec || 'Lakukan observasi visual pada titik getaran tertinggi.'}
                        </p>
                      </motion.div>

                      <div className="grid grid-cols-3 gap-2 pt-6 mt-6 border-t border-slate-800 text-center">
                        <div>
                          <div className="text-[8px] text-slate-600 uppercase font-mono mb-1">RPM</div>
                          <div className="text-xs font-bold text-white tracking-tighter">{wizardData.rpmCpm || '0'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-600 uppercase font-mono mb-1">Overall</div>
                          <div className="text-xs font-bold text-white tracking-tighter">{wizardData.overallValue || '0'} mm/s</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-600 uppercase font-mono mb-1">Tag</div>
                          <div className="text-xs font-bold text-white tracking-tighter truncate px-1">{wizardData.machineId || 'N/A'}</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => { setShowWizard(false); setWizardStep(1); setActiveTab('trace'); }}
                        className="w-full py-4 bg-brand-accent text-white font-black rounded-2xl shadow-xl shadow-brand-accent/20 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs mt-4"
                      >
                        SIMPAN KE RE-TRACE LOG
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wizard Navigation Footer */}
            {wizardStep < 4 && (
              <footer className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto">
                <div className="flex gap-4">
                  {wizardStep > 1 && (
                    <button 
                      onClick={prevStep}
                      className="flex-1 py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl active:scale-95 transition-transform text-sm uppercase tracking-widest"
                    >
                      KEMBALI
                    </button>
                  )}
                  <button 
                    onClick={nextStep}
                    disabled={wizardStep === 1 && (!wizardData.plant || !wizardData.machineId || !wizardData.rpmCpm)}
                    className={`flex-[2] py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand-accent/10 text-sm uppercase tracking-widest ${
                      wizardStep === 1 && (!wizardData.plant || !wizardData.machineId || !wizardData.rpmCpm) 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-brand-accent text-white'
                    }`}
                  >
                    LANJUTKAN
                  </button>
                </div>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Bottom Navigation */}
      <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto h-20 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-6">
          <button 
            id="nav-home"
            onClick={() => { setShowWizard(false); setActiveTab('home'); }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'home' && !showWizard ? 'text-brand-accent' : 'text-slate-500'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
            {activeTab === 'home' && !showWizard && <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-6 h-1 bg-brand-accent blur-sm rounded-full" />}
          </button>
          
          <button 
            id="nav-catalog"
            onClick={() => { setShowWizard(false); setActiveTab('catalog'); }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'catalog' ? 'text-brand-accent' : 'text-slate-500'}`}
          >
            <BookOpen size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Catalog</span>
            {activeTab === 'catalog' && <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-6 h-1 bg-brand-accent blur-sm rounded-full" />}
          </button>

          <button 
            id="nav-trace"
            onClick={() => { setShowWizard(false); setActiveTab('trace'); }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'trace' ? 'text-brand-accent' : 'text-slate-500'}`}
          >
            <History size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Trace</span>
            {activeTab === 'trace' && <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-6 h-1 bg-brand-accent blur-sm rounded-full" />}
          </button>
        </div>
      </nav>
    </div>
  );
}

