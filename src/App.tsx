/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SplashScreen from './components/SplashScreen';
import { 
  Home, 
  BookOpen, 
  History, 
  Wand2, 
  Search, 
  Factory, 
  ChevronDown,
  Activity,
  AlertCircle,
  CheckCircle2,
  Zap,
  Loader2,
  X,
  Trophy, 
  Target, 
  ArrowRight, 
  RotateCcw, 
  Trash2, 
  Download,
  AlertTriangle,
  ChevronRight,
  Info,
  Maximize2,
  Scale
} from 'lucide-react';
import BalancingWorkshop from './components/BalancingWorkshop';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import equipmentData from './Data/equipment.json';

export default function App() {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<string | null>(null);
  const [traceFilter, setTraceFilter] = useState('ALL');
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);
  const [showEquipSuggestions, setShowEquipSuggestions] = useState(false);

  const DefectIllustration = ({ type }: { type: string }) => {
    switch(type) {
      case 'unbalance':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-slate-700 rounded-full flex items-center justify-center relative"
            >
              <div className="w-1 h-6 bg-slate-700 absolute top-0" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-3 h-3 bg-orange-500 rounded-full absolute -top-1.5 shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
              />
            </motion.div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">1X Heavy Spot</div>
          </div>
        );
      case 'misalignment':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="flex items-center gap-1">
              <div className="w-12 h-6 bg-slate-700 rounded-sm relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-600 rounded-full" />
              </div>
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-8 bg-orange-500/30 border-x-2 border-orange-500 rounded-sm flex items-center justify-center"
              >
                <div className="w-0.5 h-6 bg-orange-500" />
              </motion.div>
              <div className="w-12 h-6 bg-slate-700 rounded-sm relative -translate-y-2">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-600 rounded-full" />
              </div>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Angular Offset</div>
          </div>
        );
      case 'looseness':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-20 h-6 border-x-2 border-t-2 border-slate-700 rounded-t-lg relative">
              <motion.div 
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute -bottom-1 -left-2 -right-2 h-2 bg-orange-500/40 border-b-2 border-orange-500"
              />
              <div className="absolute -bottom-3 left-2 w-1 h-3 bg-slate-600" />
              <div className="absolute -bottom-3 right-2 w-1 h-3 bg-slate-600" />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Structural Play</div>
          </div>
        );
      case 'bearing':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-14 h-14 border-4 border-slate-700 rounded-full flex items-center justify-center relative">
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div key={deg} className="absolute w-2 h-2 bg-slate-600 rounded-full" style={{ transform: `rotate(${deg}deg) translateY(-18px)` }} />
              ))}
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="absolute w-2 h-2 bg-orange-500/80 rounded-full shadow-[0_0_5px_rgba(249,115,22,1)]"
                style={{ transform: `rotate(30deg) translateY(-18px)` }}
              />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Race Damage</div>
          </div>
        );
      case 'gearbox':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="flex items-center -space-x-1">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-slate-700 rounded-full flex items-center justify-center relative bg-slate-800">
                {[...Array(8)].map((_, i) => <div key={i} className="absolute w-1 h-2 bg-slate-600" style={{ transform: `rotate(${i*45}deg) translateY(-18px)` }} />)}
              </motion.div>
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-slate-700 rounded-full flex items-center justify-center relative bg-slate-800">
                {[...Array(6)].map((_, i) => <div key={i} className="absolute w-1 h-2 bg-slate-600" style={{ transform: `rotate(${i*60}deg) translateY(-14px)` }} />)}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.5 }} className="w-full h-full border-2 border-orange-500 rounded-full" />
                </div>
              </motion.div>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Mesh Error</div>
          </div>
        );
      case 'cavitation':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-14 h-14 border-2 border-slate-700 rounded-full flex items-center justify-center relative bg-slate-950">
              <div className="w-0.5 h-10 bg-slate-800" />
              <div className="w-10 h-0.5 bg-slate-800" />
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 2, 0], opacity: [0, 1, 0], x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 }}
                  transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: Math.random() }}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_3px_cyan]"
                />
              ))}
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Bubbles</div>
          </div>
        );
      case 'resonance':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <motion.div 
              animate={{ x: [-2, 2, -2], y: [1, -1, 1] }}
              transition={{ duration: 0.05, repeat: Infinity }}
              className="w-20 h-12 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center relative"
            >
              <div className="absolute -top-2 left-4 right-4 h-1 bg-slate-700" />
              <div className="w-12 h-4 bg-brand-accent/20 border border-brand-accent/50 rounded flex items-center justify-center">
                <div className="w-full h-0.5 bg-brand-accent animate-pulse" />
              </div>
              <div className="absolute -inset-4 border border-dashed border-brand-accent/30 rounded-xl" />
            </motion.div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-brand-accent uppercase">Critical Speed</div>
          </div>
        );
      case 'bpf':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center"
              >
                {[0, 72, 144, 216, 288].map(deg => (
                  <div key={deg} className="absolute w-1 h-6 bg-slate-600 rounded-full origin-bottom" style={{ transform: `rotate(${deg}deg) translateY(-28px)` }} />
                ))}
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-20 h-20 border border-blue-500/50 rounded-full" />
              </div>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Vane Passing</div>
          </div>
        );
      case 'turbulence':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-24 h-8 bg-slate-800 border-y-2 border-slate-700 relative overflow-hidden">
               {[...Array(20)].map((_, i) => (
                 <motion.div 
                   key={i}
                   animate={{ x: [0, 100], y: [0, (Math.random() - 0.5) * 20] }}
                   transition={{ duration: 0.5, repeat: Infinity, delay: Math.random() }}
                   className="absolute left-0 w-2 h-0.5 bg-cyan-500/50 blur-[1px]"
                   style={{ top: `${Math.random() * 100}%` }}
                 />
               ))}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Flow Noise</div>
          </div>
        );
      case 'sidebands':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="flex items-center gap-1">
               <motion.div 
                 animate={{ scaleY: [0.5, 1.5, 0.5] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="flex items-center gap-0.5"
               >
                 {[10, 20, 40, 60, 40, 20, 10].map((h, i) => (
                   <div key={i} className="w-1 bg-amber-500/60 rounded-full" style={{ height: `${h}px` }} />
                 ))}
               </motion.div>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-amber-500 uppercase">Amplitude Mod.</div>
          </div>
        );
      case 'lubrication':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-14 h-14 border-4 border-slate-800 rounded-full flex items-center justify-center relative">
               <div className="w-8 h-8 rounded-full bg-slate-700/50" />
               {[...Array(6)].map((_, i) => (
                 <motion.div 
                   key={i}
                   animate={{ rotate: 360 }}
                   transition={{ duration: 0.2, repeat: Infinity, ease: "linear", delay: i * 0.05 }}
                   className="absolute"
                   style={{ transform: `rotate(${i*60}deg) translateY(-18px)` }}
                 >
                   <motion.div 
                     animate={{ opacity: [1, 0, 1] }} 
                     transition={{ duration: 0.1, repeat: Infinity }}
                     className="w-1 h-3 bg-red-500/80 shadow-[0_0_5px_red]" 
                   />
                 </motion.div>
               ))}
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-red-500 uppercase">Thermal Friction</div>
          </div>
        );
      case 'softfoot':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="w-24 h-16 relative">
              <div className="absolute top-4 left-2 right-2 h-8 bg-slate-800 border-2 border-slate-700 rounded-lg" />
              <motion.div 
                animate={{ rotate: [0, -2, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute bottom-0 left-2 w-6 h-4 bg-slate-700 rounded-t border-t-2 border-slate-600 origin-bottom-right"
              />
              <div className="absolute bottom-0 right-2 w-6 h-4 bg-slate-700 rounded-t border-t-2 border-slate-600" />
              <div className="absolute bottom-0 left-2 w-8 h-1 bg-orange-500/30 blur-[2px]" />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Base Gap</div>
          </div>
        );
      case 'electrical':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="relative w-20 h-20 border-4 border-slate-800 rounded-full flex items-center justify-center">
               <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                  <motion.div 
                    animate={{ opacity: [1, 0.3, 1] }} 
                    transition={{ duration: 0.05, repeat: Infinity }}
                    className="w-8 h-8 rounded-full bg-brand-accent/20 blur-sm" 
                  />
               </div>
               {[...Array(8)].map((_, i) => (
                 <motion.div 
                   key={i}
                   animate={{ opacity: [0.2, 1, 0.2] }}
                   transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.05 }}
                   className="absolute w-0.5 h-4 bg-brand-accent/40 rounded-full"
                   style={{ transform: `rotate(${i * 45}deg) translateY(-22px)` }}
                 />
               ))}
               <svg className="absolute inset-0 w-full h-full">
                 <motion.path 
                   animate={{ opacity: [0.1, 0.4, 0.1], strokeDashoffset: [0, 100] }}
                   transition={{ duration: 1, repeat: Infinity }}
                   d="M 10,50 Q 50,10 90,50 Q 50,90 10,50"
                   fill="none"
                   stroke="#22c55e"
                   strokeWidth="0.5"
                   strokeDasharray="4 4"
                   className="opacity-20"
                 />
               </svg>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-brand-accent uppercase">Magnetic Flux</div>
          </div>
        );
      case 'bentshaft':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="relative w-24 h-4 flex items-center">
              <div className="absolute left-0 w-2 h-6 bg-slate-700 rounded-sm" />
              <div className="absolute right-0 w-2 h-6 bg-slate-700 rounded-sm" />
              <svg className="w-32 h-16 overflow-visible">
                <motion.path 
                  animate={{ d: [
                    "M 10,32 Q 64,12 118,32",
                    "M 10,32 Q 64,52 118,32",
                    "M 10,32 Q 64,12 118,32"
                  ]}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  fill="none" 
                  stroke="#64748b" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
                <rect x="0" y="24" width="10" height="16" fill="#334155" rx="2" />
                <rect x="118" y="24" width="10" height="16" fill="#334155" rx="2" />
              </svg>
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 uppercase">Run-Out Deflection</div>
          </div>
        );
      case 'oilwhirl':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="relative w-16 h-16 border-4 border-slate-800 rounded-full flex items-center justify-center">
               <motion.div 
                 animate={{ 
                   x: [0, 4, 0, -4, 0],
                   y: [0, -4, 0, 4, 0],
                   rotate: 360
                 }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600"
               />
               <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-[2px]" />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 border border-dashed border-amber-500/30 rounded-full" 
               />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-amber-500 uppercase">Fluid Wedge / Sub-Sync</div>
          </div>
        );
      case 'rubbing':
        return (
          <div className="relative w-full h-24 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute w-20 h-2 bg-slate-700 rounded-full rotate-45 opacity-20" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-2 border-slate-600 rounded-full flex items-center justify-center"
              >
                <div className="w-1 h-14 bg-slate-500 rounded-full absolute" />
              </motion.div>
              <motion.div 
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute top-2 right-2 w-4 h-4"
              >
                <div className="absolute inset-0 bg-yellow-400 rotate-45 scale-x-50" />
                <div className="absolute inset-0 bg-yellow-400 -rotate-45 scale-x-50" />
              </motion.div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-red-500/50 rounded-tr-lg" />
            </div>
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-red-500 uppercase">Friction Sparks</div>
          </div>
        );
      default:
        return null;
    }
  };

  const FFTSpectrum = ({ type }: { type: string }) => {
    const barsData: Record<string, number[]> = {
      unbalance: [100, 5, 2, 8, 3, 2, 1, 4, 12, 1, 1, 1, 1, 2, 1],
      misalignment: [80, 100, 60, 10, 5, 8, 3, 2, 4, 1, 2, 2, 1, 1, 1],
      looseness: [40, 35, 30, 25, 20, 18, 15, 12, 10, 8, 7, 6, 5, 4, 3],
      bearing: [5, 3, 4, 2, 2, 4, 12, 30, 45, 65, 85, 100, 80, 60, 40],
      gearbox: [10, 8, 12, 100, 40, 35, 10, 5, 30, 80, 30, 15, 5, 4, 2],
      cavitation: [12, 10, 15, 12, 14, 15, 16, 28, 42, 60, 75, 85, 95, 100, 90],
      resonance: [0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bpf: [10, 5, 100, 5, 8, 80, 5, 4, 60, 2, 1, 40, 1, 1, 20],
      turbulence: [20, 25, 30, 35, 40, 45, 50, 48, 45, 40, 35, 30, 25, 20, 15],
      sidebands: [5, 10, 40, 100, 40, 10, 5, 20, 60, 20, 5, 2, 1, 1, 1],
      lubrication: [5, 6, 8, 5, 10, 12, 20, 30, 45, 60, 80, 100, 85, 70, 55],
      softfoot: [100, 80, 10, 5, 2, 3, 1, 2, 4, 1, 1, 1, 1, 1, 1],
      electrical: [5, 2, 8, 2, 10, 5, 100, 3, 4, 5, 2, 1, 1, 0, 0],
      bentshaft: [100, 80, 10, 5, 2, 3, 1, 2, 4, 1, 1, 1, 1, 1, 1],
      oilwhirl: [0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rubbing: [30, 25, 40, 35, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50],
    };
    
    const isNoisy = type === 'looseness' || type === 'cavitation' || type === 'bearing';
    const spectrumBars = barsData[type] || Array(15).fill(5);

    return (
      <div className="w-full h-16 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-end gap-0.5 relative overflow-hidden">
        {isNoisy && <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 0.1, repeat: Infinity }} className="absolute bottom-0 left-0 right-0 h-6 bg-blue-500/10 blur-xl" />}
        {spectrumBars.map((val, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${val}%` }}
            transition={{ delay: i * 0.02 }}
            className={`flex-1 min-w-[3px] ${val > 70 ? 'bg-blue-400 shadow-[0_-2px_10px_rgba(96,165,250,0.5)]' : 'bg-blue-600/40'} rounded-t-sm`}
          />
        ))}
        <div className="absolute top-1 left-2 text-[7px] font-mono text-slate-600 uppercase">FFT SPECTRUM (1X-10X)</div>
      </div>
    );
  };

  const TWFWaveform = ({ type }: { type: string }) => {
    const width = 300;
    const height = 60;
    const midY = height / 2;
    
    let path = "";
    
    switch(type) {
      case 'unbalance': {
        // Pure Sine Wave
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + Math.sin(x * 0.1) * 20;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'misalignment': {
        // Complex Periodic (M/W shape)
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + (Math.sin(x * 0.1) * 15) + (Math.sin(x * 0.2) * 10);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'looseness': {
        // Truncated Sine Wave
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          let yOffset = Math.sin(x * 0.1) * 25;
          // Truncate logic
          if (yOffset > 12) yOffset = 12;
          if (yOffset < -12) yOffset = -12;
          const y = midY + yOffset;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'bearing': {
        // Sharp Spikes (Impacting)
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          let y = midY;
          if (x % 40 === 0) {
            y = midY - 25; // Sharp up spike
          } else if ((x - 2) % 40 === 0) {
            y = midY + 20; // Sharp down spike
          } else {
            y = midY + (Math.random() - 0.5) * 4; // Noise floor
          }
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'gearbox': {
        // Amplitude Modulation (Beating)
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const modulation = Math.sin(x * 0.02) * 0.5 + 0.5; // 0 to 1
          const y = midY + (Math.sin(x * 0.2) * 20 * modulation);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'cavitation': {
        // High frequency random noise
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + (Math.random() - 0.5) * 30;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'resonance': {
        // High amplitude sine
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + Math.sin(x * 0.1) * 35;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'bpf': {
        // Periodic with rhythmic impacts
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + (Math.sin(x * 0.1) * 15) + (x % 50 === 0 ? -15 : 0);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'turbulence': {
        // Erratic random noise
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + (Math.random() - 0.5) * 20;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'sidebands': {
        // Amplitude modulation
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const mod = Math.cos(x * 0.03) * 0.5 + 0.5;
          const y = midY + (Math.sin(x * 0.2) * 25 * mod);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'lubrication': {
        // HF spikes on noise floor
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const noise = (Math.random() - 0.5) * 10;
          const spike = Math.random() > 0.95 ? (Math.random() - 0.5) * 30 : 0;
          const y = midY + noise + spike;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'softfoot': {
        // Truncated on one side
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          let yOff = Math.sin(x * 0.1) * 25;
          if (yOff < -5) yOff = -5; // Truncate bottom
          const y = midY + yOff;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'electrical': {
        // Beating pattern (Amplitude Modulation)
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const beating = Math.sin(x * 0.01) * 0.5 + 0.5;
          const y = midY + (Math.sin(x * 0.2) * 25 * beating);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'bentshaft': {
        // Pure sine sefasa
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + Math.sin(x * 0.1) * 30;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'oilwhirl': {
        // Complex sub-sync
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          const y = midY + (Math.sin(x * 0.04) * 20) + (Math.sin(x * 0.1) * 10);
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      case 'rubbing': {
        // Truncated/flat tops
        const points = [];
        for (let x = 0; x <= width; x += 2) {
          let yOff = Math.sin(x * 0.1) * 35;
          if (yOff > 20) yOff = 20; // Truncate top
          if (yOff < -20) yOff = -20; // Truncate bottom
          const y = midY + yOff;
          points.push(`${x},${y}`);
        }
        path = `M ${points.join(" L ")}`;
        break;
      }
      default:
        path = `M 0,${midY} L ${width},${midY}`;
    }

    return (
      <div className="w-full h-16 bg-slate-950 rounded-xl border border-slate-800 p-1 relative overflow-hidden flex items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
          {/* Grid lines */}
          <line x1="0" y1={midY} x2={width} y2={midY} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={path}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_3px_#22c55e]"
          />
        </svg>
        <div className="absolute top-1 left-2 text-[7px] font-mono text-slate-600 uppercase">Time Waveform (TWF)</div>
      </div>
    );
  };

  const catalogItems = [
    {
      id: 'unbalance',
      type: 'unbalance',
      title: 'Unbalance',
      pattern: '1X RPM Dominan di Radial',
      twf: 'Sinusoidal murni (1 putaran = 1 puncak)',
      remedy: 'Lakukan balancing ulang (In-situ atau Bench balancing).',
      icon: <Activity className="text-brand-accent" />,
      color: 'border-brand-accent/50'
    },
    {
      id: 'misalignment',
      type: 'misalignment',
      title: 'Misalignment',
      pattern: '1X, 2X, 3X Aksial tinggi',
      twf: 'Bergelombang/Jagged (puncak ganda per putaran)',
      remedy: 'Lakukan Laser Alignment dan cek kondisi kopling.',
      icon: <Activity className="text-blue-500" />,
      color: 'border-blue-500/50'
    },
    {
      id: 'looseness',
      type: 'looseness',
      title: 'Mechanical Looseness',
      pattern: 'Banyak Harmonics 1X, 2X, 3X... s/d 10X',
      twf: 'Random impacting / Truncated waveform',
      remedy: 'Kencangkan baut pondasi atau perbaiki fit bearing housing.',
      icon: <AlertCircle className="text-purple-500" />,
      color: 'border-purple-500/50'
    },
    {
      id: 'bearing',
      type: 'bearing',
      title: 'Bearing Defect',
      pattern: 'High Frequency / Noise floor naik',
      twf: 'PeakVue G\'s tinggi dengan Impacting tajam',
      remedy: 'Ganti bearing baru atau lakukan pembersihan & greasing ulang.',
      icon: <AlertCircle className="text-red-500" />,
      color: 'border-red-500/50'
    },
    {
      id: 'gearbox',
      type: 'gearbox',
      title: 'Gearbox Problem',
      pattern: 'Gear Mesh Frequency (GMF) & Sidebands',
      twf: 'Modulation (Amplitudo naik turun secara periodik)',
      remedy: 'Cek keausan gigi, backlash, dan kualitas oli gearbox.',
      icon: <Factory className="text-amber-500" />,
      color: 'border-amber-500/50'
    },
    {
      id: 'cavitation',
      type: 'cavitation',
      title: 'Cavitation',
      pattern: 'Random noise di frekuensi tinggi (Mounds)',
      twf: 'Erratic impacting (Suara kerikil dalam pompa)',
      remedy: 'Cek NPSH, pastikan suction valve terbuka penuh, bersihkan filter.',
      icon: <Activity className="text-cyan-500" />,
      color: 'border-cyan-500/50'
    },
    {
      id: 'resonance',
      type: 'resonance',
      title: 'Resonance',
      pattern: 'Single 1X Peak - Extremely High & Sharp',
      twf: 'Smooth Pure Sine Wave (High Amplitude)',
      remedy: 'Lakukan bump test/coast-down. Ubah kekakuan struktur (stiffening) atau ubah RPM mesin agar menjauh dari frekuensi natural.',
      icon: <Activity className="text-brand-accent" />,
      color: 'border-brand-accent/50'
    },
    {
      id: 'bpf',
      type: 'bpf',
      title: 'Vane Pass (BPF)',
      pattern: 'Dominant BPF (No. Vanes x RPM) + Harmonics',
      twf: 'Periodic Wave with Rhythmic Impacts',
      remedy: 'Cek jarak (clearance) antara impeller dan volute/diffuser, periksa keausan sudu.',
      icon: <Factory className="text-blue-400" />,
      color: 'border-blue-400/50'
    },
    {
      id: 'turbulence',
      type: 'turbulence',
      title: 'Flow Turbulence',
      pattern: 'High Frequency Haystack (Broadband Noise)',
      twf: 'Random/Erratic (Like TV Static)',
      remedy: 'Cek kondisi operasional fluida, pastikan valve terbuka penuh, bersihkan filter hisap.',
      icon: <Activity className="text-cyan-400" />,
      color: 'border-cyan-400/50'
    },
    {
      id: 'modulation',
      type: 'sidebands',
      title: 'Sidebands (Modulation)',
      pattern: 'Sidebands around Center Frequency (Mesh/Bearing)',
      twf: 'Amplitude Modulation (Beating/Grows & Shrinks)',
      remedy: 'Analisa sumber center frequency (Gear/Bearing) dan jarak sideband-nya (RPM poros) untuk melokalisasi komponen yang rusak.',
      icon: <Activity className="text-amber-400" />,
      color: 'border-amber-400/50'
    },
    {
      id: 'lubrication',
      type: 'lubrication',
      title: 'Lack of Lubrication',
      pattern: 'Broadband Noise in High Frequency (>60.000 CPM)',
      twf: 'Low Amplitude Random Noise / Rough Floor',
      remedy: 'Lakukan greasing ulang sesuai standar takaran ultrasonik/vibrasi.',
      icon: <AlertCircle className="text-red-400" />,
      color: 'border-red-400/50'
    },
    {
      id: 'softfoot',
      type: 'softfoot',
      title: 'Soft Foot',
      pattern: 'Dominant 1X and 2X Radial',
      twf: 'Truncated Signal on the base of waveform',
      remedy: 'Cek beda fasa kaki vs baseplate. Lakukan pengencangan baut dan sisipkan shim plate yang sesuai.',
      icon: <AlertCircle className="text-orange-400" />,
      color: 'border-orange-400/50'
    },
    {
      id: 'electrical',
      type: 'electrical',
      title: 'Electrical Problem (Stator Eccentricity / 2x LF)',
      pattern: 'Sharp Peak exactly at 60.000 CPM (2x Line Frequency)',
      twf: 'Beating pattern (Amplitude Modulation) due to 2xLF vs 2xRPM interaction',
      remedy: 'Matikan power motor. Jika vibrasi langsung hilang seketika saat listrik diputus, ini positif masalah elektrikal. Lakukan tes insulasi/MCA.',
      icon: <Zap className="text-brand-accent" />,
      color: 'border-brand-accent/50'
    },
    {
      id: 'bentshaft',
      type: 'bentshaft',
      title: 'Bent Shaft (Poros Bengkok)',
      pattern: 'High 1X and 2X RPM - Dominan in Axial Direction',
      twf: 'Pure axial sine wave in-phase with rotation',
      remedy: 'Lakukan pengukuran run-out menggunakan dial indicator saat mesin mati. Lakukan pelurusan/penggantian poros.',
      icon: <Activity className="text-slate-400" />,
      color: 'border-slate-400/50'
    },
    {
      id: 'oilwhirl',
      type: 'oilwhirl',
      title: 'Oil Whirl / Oil Whip',
      pattern: 'Sub-synchronous peak exactly at 0.38X - 0.48X RPM',
      twf: 'Complex waveforms with rhythmic instability',
      remedy: 'Cek temperatur oli (viskositas mungkin turun) dan periksa clearance bearing journal.',
      icon: <Activity className="text-amber-500" />,
      color: 'border-amber-500/50'
    },
    {
      id: 'rubbing',
      type: 'rubbing',
      title: 'Rotor Rubbing (Gesekan)',
      pattern: 'Sub-synchronous peaks (1/2X, 1/3X) and sequential harmonics',
      twf: 'Truncated/flat-topped sine waves from friction',
      remedy: 'Segera hentikan mesin jika terindikasi rub parah. Lakukan inspeksi internal pada seal labirin dan cek thermal bow.',
      icon: <AlertCircle className="text-red-500" />,
      color: 'border-red-500/50'
    }
  ];

  // Real-time Fetch from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "equipment_history"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs: any[] = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setHistoryLogs(logs);
    }, (error) => {
      console.error("Error fetching history: ", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveToFirestore = async () => {
    const analysis = getDiagnosticResults();
    const suspect = analysis.results[0];

    if (!wizardData.machineId || !wizardData.plant) {
      alert("ID Mesin dan Plant harus diisi.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "equipment_history"), {
        machineId: wizardData.machineId.toUpperCase().replace(/\s/g, ''),
        plant: wizardData.plant,
        overallValue: wizardData.overallValue,
        dominantDirection: wizardData.dominantDirection,
        suspectFault: suspect?.fault || 'Unknown',
        confidence: analysis.confidence,
        recommendation: suspect?.rec || 'Inspeksi Visual',
        timestamp: serverTimestamp()
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setWizardStep(1);
        setShowWizard(false);
        setActiveTab('trace');
      }, 2000);
    } catch (error) {
      console.error("Error saving to Firestore: ", error);
      alert("Gagal menyimpan data ke database. Cek koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

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
    onlyOneDirection: false, // New for Resonance
    
    peakVue: '',
    waveformPattern: '',
    bearingPattern: '', // New for Lubrication/Sidebands
    skipBearing: false,
    
    bpfPeak: false, // New for BPF
    broadbandHaystack: false, // New for Turbulence
    
    harmonicsType: '', // New: Mechanical vs Electrical
    
    gmfDominant: false,
    sidebandsPresent: false,
    skipGearbox: false,
    
    // Step 3: Harmonics
    harmonicsDirection: '', // Aksial, Radial
    harmonicsPhaseDiffAksial: '',
    harmonicsPhaseDiffRadial: '',
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
      const hasPhaseData = (wizardData.harmonicsDirection === 'Aksial' && wizardData.harmonicsPhaseDiffAksial !== '') || 
                           (wizardData.harmonicsDirection === 'Radial' && wizardData.harmonicsPhaseDiffRadial !== '');
      
      if (!wizardData.skipHarmonics && hasPhaseData) {
        confidence = Math.max(confidence, 90);
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

      if (wizardData.onlyOneDirection) {
        results.push({ fault: 'Resonance', prob: 98, rec: 'Suspect Utama: Resonance. Lakukan Bump Test/Coast-down test untuk memastikan frekuensi natural struktur.' });
      }

      if (direction === 'Radial') {
        if (isUnbalancePhase) {
          results.push({ fault: 'Unbalance', prob: 95, rec: 'Lakukan in-place balancing atau bersihkan rotor/impeller dari penumpukan material.' });
          results.push({ fault: 'Misalignment', prob: 30, rec: 'Cek status alignment.' });
        } else if (isMisalignmentPhase) {
          results.push({ fault: 'Misalignment', prob: 92, rec: 'Jadwalkan Laser Alignment, cek kondisi elemen kopling, dan pastikan tidak ada soft foot.' });
          results.push({ fault: 'Unbalance', prob: 35, rec: 'Lakukan pembersihan rotor.' });
        } else if (!wizardData.onlyOneDirection) {
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
      if (wizardData.harmonicsType === 'Electrical') {
        results.push({ fault: 'Electrical Problem (Stator)', prob: 98, rec: 'Suspect Utama: Electrical Problem (Stator). Lakukan tes pemutusan arus listrik secara instan (Coasting Down) untuk verifikasi. Jika vibrasi hilang seketika, ini positif elektrikal.' });
      }

      if (wizardData.harmonicsDirection === 'Aksial') {
        const phaseVal = parseFloat(wizardData.harmonicsPhaseDiffAksial);
        if (phaseVal >= 150 && phaseVal <= 210) {
          results.push({ fault: 'Bent Shaft', prob: 95, rec: 'Indikasi poros bengkok. Jadwalkan dial indicator run-out test saat mesin mati.' });
        } else {
          results.push({ fault: 'Mechanical Anomaly (Axial)', prob: 60, rec: 'Cek kondisi alignment dan kelonggaran baut aksial.' });
        }
      } else if (wizardData.harmonicsDirection === 'Radial') {
        const phaseVal = parseFloat(wizardData.harmonicsPhaseDiffRadial);
        if (phaseVal > 90) {
          results.push({ fault: 'Soft Foot / Base Looseness', prob: 95, rec: 'Kaki Pincang: Beda fasa kaki vs baseplate > 90°. Cek kekencangan baut dan sisipkan shim plate yang sesuai.' });
        } else {
          results.push({ fault: 'Mechanical Looseness / Misalignment', prob: 65, rec: 'Cek status alignment dan kekencangan mounting bolts.' });
        }
      } else if (!wizardData.skipHarmonics) {
        results.push({ fault: 'Misalignment / Looseness', prob: 70, rec: 'Lengkapi data fasa untuk hasil yang lebih spesifik.' });
      }
    }

    if (patterns.includes('HF')) {
      if (wizardData.bearingPattern === 'Lubrication') {
        results.push({ fault: 'Lack of Lubrication', prob: 96, rec: 'Lakukan greasing ulang sesuai standar takaran ultrasonik/vibrasi segera.' });
      } else if (wizardData.bearingPattern === 'Sidebands') {
        results.push({ fault: 'Advanced Bearing Defect / Gear Wear', prob: 94, rec: 'Terdapat Sidebands sekitar frekuensi dominan. Masalah serius pada bearing atau roda gigi.' });
      }

      const pv = parseFloat(wizardData.peakVue);
      if (pv > 5.0) {
        results.push({ fault: 'Severe Bearing Defect', prob: 90, rec: 'Siapkan penggantian bearing pada jadwal shutdown terdekat.' });
        if (wizardData.bearingPattern !== 'Lubrication') results.push({ fault: 'Lack of Lubrication', prob: 40, rec: 'Lakukan greasing ulang segera.' });
      } else {
        results.push({ fault: 'Early Stage Bearing Defect', prob: 65, rec: 'Lakukan monitoring ketat (trend monitoring) dan evaluasi pelumasan.' });
      }
    }

    const isPumpBlowerComp = config.includes('Pompa') || config.includes('Blower') || config.includes('Compressor');
    if (isPumpBlowerComp) {
      if (wizardData.bpfPeak) {
        results.push({ fault: 'Blade Pass / Impeller Wear', prob: 92, rec: 'Puncak di [Sudu x RPM]. Cek clearance impeller dan volute/diffuser.' });
      }
      if (wizardData.broadbandHaystack) {
        results.push({ fault: 'Flow Turbulence / Cavitation', prob: 90, rec: 'Spektrum broadband membentuk haystacks. Cek operasional fluida, valve, dan NPSH.' });
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
    <AnimatePresence mode="wait">
      {showSplashScreen ? (
        <SplashScreen key="splash" onFinish={() => setShowSplashScreen(false)} />
      ) : (
        <div id="app-container" className="min-h-screen pb-24 bg-brand-bg relative overflow-x-hidden safe-area-inset">
      <div className="scanline" />
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showWizard ? (
          <motion.div
            key={activeTab}
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
                  {activeTab === 'home' ? 'Glosarium Referensi Inspeksi & Diagnostik' : activeTab === 'catalog' ? 'Technical Glossary' : activeTab === 'workshop' ? 'Single Plane Balancing Workshop' : 'Repair Logbook'}
                </p>
              </motion.div>
            </header>

            <main className="px-6 pb-4">
              {activeTab === 'home' && (
                <div className="space-y-8">
                  {/* 2. Card 1 (Quick Action) */}
                  <section id="quick-actions">
                    <motion.div 
                      key="quick-actions-home"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-3 gap-3"
                    >
                      <button 
                        id="btn-diagnostic-wizard"
                        onClick={() => setShowWizard(true)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-brand-accent/50 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent mb-2">
                          <Wand2 size={20} />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-slate-200 text-center leading-tight">Diagnostic Wizard</span>
                      </button>

                      <button 
                        id="btn-search-glosarium"
                        onClick={() => setActiveTab('catalog')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-brand-accent/50 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent mb-2">
                          <Search size={20} />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-slate-200 text-center leading-tight">Open Catalog</span>
                      </button>

                      <button 
                        id="btn-balancing-workshop"
                        onClick={() => setActiveTab('workshop')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-brand-accent/50 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent mb-2">
                          <Scale size={20} />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-slate-200 text-center leading-tight">Balancing Workshop</span>
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
                            {Array.from(new Set(equipmentData.map(item => item.plant))).map(plant => (
                              <option key={plant} value={plant}>{plant}</option>
                            ))}
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
                            {historyLogs
                              .filter(log => log.plant === selectedPlant)
                              .slice(0, 5)
                              .map((log, idx) => (
                              <div key={log.id || `log-${idx}`} className="flex gap-4 p-3 rounded-lg bg-brand-bg border border-slate-700/30">
                                <div className="mt-1">
                                  <Activity size={14} className="text-brand-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div className="text-xs font-bold text-slate-200 truncate">{log.machineId}</div>
                                    <div className="text-[8px] font-mono text-brand-accent font-bold">{log.confidence}% Conf.</div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">{log.suspectFault}</div>
                                  <div className="text-[8px] text-slate-500 mt-1 flex justify-between">
                                    <span>{log.overallValue} mm/s • {log.dominantDirection}</span>
                                    <span>{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleDateString() : 'Just now'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {historyLogs.filter(log => log.plant === selectedPlant).length === 0 && (
                              <div className="text-center py-8 text-slate-600 font-mono text-[10px] uppercase">
                                Belum ada riwayat untuk plant ini.
                              </div>
                            )}
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
                </div>
              )}

              {activeTab === 'workshop' && (
                <BalancingWorkshop equipmentData={equipmentData} />
              )}

              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {catalogItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        onClick={() => setSelectedCatalogItem(selectedCatalogItem === item.id ? null : item.id)}
                        className={`p-5 bg-slate-800/40 border border-slate-700/30 border-l-4 ${item.color} rounded-r-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-lg`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg">
                              {item.icon}
                            </div>
                            <h3 className="font-display font-bold text-white tracking-tight">{item.title}</h3>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`text-slate-500 transition-transform duration-300 ${selectedCatalogItem === item.id ? 'rotate-180' : ''}`} 
                          />
                        </div>

                        <AnimatePresence>
                          {selectedCatalogItem === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-6 space-y-6 mt-4 border-t border-slate-700/50">
                                {/* Visual Illustrations Section */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest pl-1">Visual Model</span>
                                    <DefectIllustration type={item.type || 'unbalance'} />
                                  </div>
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest pl-1">Frequency Domain</span>
                                    <FFTSpectrum type={item.type || 'unbalance'} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest pl-1">Time Domain Waveform</span>
                                  <TWFWaveform type={item.type || 'unbalance'} />
                                </div>

                                {/* Deep Intelligence Section */}
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-3 bg-brand-accent rounded-full" />
                                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Spectral Characteristics</span>
                                      </div>
                                      <p className="text-xs text-brand-accent font-bold pl-3">{item.pattern}</p>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Waveform Signature</span>
                                      </div>
                                      <p className="text-xs text-slate-300 pl-3 leading-relaxed">{item.twf}</p>
                                    </div>

                                    <div className="px-3 py-2 bg-green-500/5 border-l-2 border-green-500/50 rounded-r-lg">
                                      <span className="text-[8px] font-mono text-green-500/70 uppercase font-black">Engineering Remedy</span>
                                      <p className="text-[11px] text-green-400 font-medium italic mt-0.5">{item.remedy}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'trace' && (
                <div className="space-y-6">
                  {/* Trace Header & Filter */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History size={18} className="text-brand-accent" />
                        <h2 className="text-lg font-display font-bold text-white">RE-TRACE Database</h2>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{historyLogs.length} Records</span>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-900 border border-slate-700/50 rounded-xl overflow-x-auto no-scrollbar">
                      {['ALL', ...Array.from(new Set(equipmentData.map(item => item.plant)))].map((p) => (
                        <button
                          key={p}
                          onClick={() => setTraceFilter(p)}
                          className={`flex-none px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            traceFilter === p 
                            ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                            : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Log List */}
                  <div className="space-y-3">
                    {historyLogs
                      .filter(log => traceFilter === 'ALL' || log.plant === traceFilter)
                      .map((log, idx) => (
                      <motion.div
                        key={log.id || `trace-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedLogDetail(log)}
                        className="p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl hover:border-brand-accent/30 cursor-pointer group active:scale-[0.98] transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors">
                              <Activity size={16} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">{log.machineId}</h3>
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{log.plant}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                              log.confidence > 85 ? 'border-green-500/50 text-green-500 bg-green-500/5' : 
                              log.confidence > 70 ? 'border-brand-accent/50 text-brand-accent bg-brand-accent/5' : 
                              'border-amber-500/50 text-amber-500 bg-amber-500/5'
                            }`}>
                              {log.confidence}% CONF
                            </div>
                            <span className="text-[8px] text-slate-600 mt-1 block">
                              {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <div className="pl-10">
                          <p className="text-xs font-semibold text-slate-300 line-clamp-1">{log.suspectFault}</p>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 italic">
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              {log.overallValue} mm/s
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 italic">
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              {log.dominantDirection}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {historyLogs.filter(log => traceFilter === 'ALL' || log.plant === traceFilter).length === 0 && (
                      <div className="py-20 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                          <Search size={24} />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No matching records found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                      <div className="relative">
                        <select 
                          value={wizardData.plant} 
                          onChange={(e) => {
                            setWizardData({
                              ...wizardData, 
                              plant: e.target.value,
                              machineId: '' // Reset machineId when plant changes
                            });
                          }}
                          className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:border-brand-accent appearance-none transition-all"
                        >
                          <option value="">Pilih Plant</option>
                          {Array.from(new Set(equipmentData.map(item => item.plant))).map(plant => (
                            <option key={plant} value={plant}>{plant}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
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

                  <div className="space-y-2 relative">
                    <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Machine ID / Tag</label>
                    <input 
                      type="text" 
                      placeholder={wizardData.plant ? "Cari ID atau Deskripsi..." : "Pilih Plant Terlebih Dahulu"}
                      value={wizardData.machineId}
                      disabled={!wizardData.plant}
                      onFocus={() => setShowEquipSuggestions(true)}
                      onBlur={() => {
                        // Delay to allow clicking suggestions
                        setTimeout(() => setShowEquipSuggestions(false), 200)
                      }}
                      onChange={(e) => setWizardData({...wizardData, machineId: e.target.value})}
                      className={`w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-accent transition-all ${!wizardData.plant ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    
                    <AnimatePresence>
                      {showEquipSuggestions && wizardData.plant && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
                        >
                          {equipmentData
                            .filter(item => 
                              item.plant === wizardData.plant && 
                              (item.id.toLowerCase().includes(wizardData.machineId.toLowerCase()) || 
                               item.desc.toLowerCase().includes(wizardData.machineId.toLowerCase()))
                            )
                            .map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setWizardData({ ...wizardData, machineId: item.id });
                                  setShowEquipSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-brand-accent/20 border-b border-slate-800 last:border-0 transition-colors"
                              >
                                <div className="text-sm font-bold text-white">{item.id}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-mono">{item.desc}</div>
                              </button>
                            ))
                          }
                          {equipmentData.filter(item => 
                            item.plant === wizardData.plant && 
                            (item.id.toLowerCase().includes(wizardData.machineId.toLowerCase()) || 
                             item.desc.toLowerCase().includes(wizardData.machineId.toLowerCase()))
                          ).length === 0 && (
                            <div className="px-4 py-3 text-[10px] font-mono text-slate-600 uppercase text-center">
                              No equipment found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                          <div className="space-y-4">
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
                            <label className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={wizardData.onlyOneDirection} 
                                onChange={e => setWizardData({...wizardData, onlyOneDirection: e.target.checked})} 
                                className="mt-0.5 w-4 h-4 accent-brand-accent" 
                              />
                              <span className="text-[10px] leading-tight font-bold text-slate-300">Vibrasi tinggi secara ekstrem HANYA pada satu arah ukur (Vertical/Horizontal/Axial).</span>
                            </label>
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
                              <label className="text-[9px] uppercase font-mono text-slate-500">Pola Spektrum Bearing</label>
                              <select 
                                value={wizardData.bearingPattern} 
                                onChange={e => setWizardData({...wizardData, bearingPattern: e.target.value})} 
                                className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                              >
                                <option value="">Normal / Discrete Peaks</option>
                                <option value="Lubrication">Noise Floor tinggi secara Broadband / Haystack tanpa puncak spesifik</option>
                                <option value="Sidebands">Terdapat Sidebands (puncak kecil pengapit) di sekitar frekuensi dominan</option>
                              </select>
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
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Analisa Harmonics & Electrical</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={wizardData.skipHarmonics} onChange={e => setWizardData({...wizardData, skipHarmonics: e.target.checked})} className="w-3 h-3 accent-purple-500" />
                            <span className="text-[8px] font-mono text-slate-500 uppercase">Skip</span>
                          </label>
                        </div>
                        
                        {!wizardData.skipHarmonics && (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Karakteristik Puncak Sekitar 2X</label>
                              <select 
                                value={wizardData.harmonicsType} 
                                onChange={e => setWizardData({...wizardData, harmonicsType: e.target.value})} 
                                className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                              >
                                <option value="">Pilih Karakteristik...</option>
                                <option value="Mechanical">Tepat di kelipatan putaran poros (misal 5900 CPM untuk motor 2950 RPM)</option>
                                <option value="Electrical">Tepat di 2x Frekuensi Listrik / 2x Line Frequency (tepat 60.000 CPM)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-slate-500">Arah Vibrasi Dominan</label>
                              <select 
                                value={wizardData.harmonicsDirection} 
                                onChange={e => setWizardData({...wizardData, harmonicsDirection: e.target.value})} 
                                className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                              >
                                <option value="">Pilih Arah</option>
                                <option value="Aksial">Aksial</option>
                                <option value="Radial">Radial</option>
                              </select>
                            </div>

                            {wizardData.harmonicsDirection === 'Aksial' && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-1"
                              >
                                <label className="text-[9px] uppercase font-mono text-slate-500">Beda Fasa Aksial antar ujung komponen (°)</label>
                                <input 
                                  type="number" 
                                  placeholder="0° - 360°" 
                                  value={wizardData.harmonicsPhaseDiffAksial} 
                                  onChange={e => setWizardData({...wizardData, harmonicsPhaseDiffAksial: e.target.value})} 
                                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-purple-500 transition-all shadow-inner" 
                                />
                              </motion.div>
                            )}

                            {wizardData.harmonicsDirection === 'Radial' && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-1"
                              >
                                <label className="text-[9px] uppercase font-mono text-slate-500">Beda Fasa kaki vs baseplate (°)</label>
                                <input 
                                  type="number" 
                                  placeholder="0° - 360°" 
                                  value={wizardData.harmonicsPhaseDiffRadial} 
                                  onChange={e => setWizardData({...wizardData, harmonicsPhaseDiffRadial: e.target.value})} 
                                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-purple-500 transition-all shadow-inner" 
                                />
                              </motion.div>
                            )}
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

                    {/* Logic F: Pump/Blower Additional */}
                    {(wizardData.configuration.includes('Pompa') || wizardData.configuration.includes('Blower') || wizardData.configuration.includes('Compressor')) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900/80 border border-blue-400/30 rounded-2xl space-y-4"
                      >
                         <div className="flex items-center gap-2">
                           <Factory size={16} className="text-blue-400" />
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Fluid & Impeller Logic</span>
                         </div>
                         <div className="space-y-2">
                            <label className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={wizardData.bpfPeak} 
                                onChange={e => setWizardData({...wizardData, bpfPeak: e.target.checked})} 
                                className="mt-0.5 w-4 h-4 accent-blue-400" 
                              />
                              <span className="text-[10px] leading-tight font-bold text-slate-300">Apakah muncul puncak persis di [Sudu x putaran RPM]? (Blade Pass Frequency)</span>
                            </label>
                            <label className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={wizardData.broadbandHaystack} 
                                onChange={e => setWizardData({...wizardData, broadbandHaystack: e.target.checked})} 
                                className="mt-0.5 w-4 h-4 accent-blue-400" 
                              />
                              <span className="text-[10px] leading-tight font-bold text-slate-300">Apakah spektrum membentuk gundukan acak (Broadband/Haystack) di frekuensi tinggi?</span>
                            </label>
                         </div>
                      </motion.div>
                    )}

                    {wizardData.spectrumPatterns.length === 0 && !wizardData.configuration.includes('Gearbox') && wizardData.maxVibLocation !== 'Gearbox' && !wizardData.configuration.includes('Pompa') && !wizardData.configuration.includes('Blower') && (
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
                  className="space-y-6 pb-32"
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
                          key="low-conf-physical"
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
                          key="marginal-analysis"
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
                        onClick={handleSaveToFirestore}
                        disabled={isSaving || saveSuccess}
                        className={`w-full py-4 font-black rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] text-xs mt-4 flex items-center justify-center gap-2 ${
                          saveSuccess ? 'bg-green-500 text-white' : 'bg-brand-accent text-white shadow-brand-accent/20 active:scale-[0.98]'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            MENYIMPAN...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 size={16} />
                            DATA BERHASIL DISIMPAN!
                          </>
                        ) : (
                          'SIMPAN KE RE-TRACE LOG'
                        )}
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

          <button 
            id="nav-workshop"
            onClick={() => { setShowWizard(false); setActiveTab('workshop'); }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'workshop' ? 'text-brand-accent' : 'text-slate-500'}`}
          >
            <Scale size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Balance</span>
            {activeTab === 'workshop' && <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-6 h-1 bg-brand-accent blur-sm rounded-full" />}
          </button>
        </div>
      </nav>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedLogDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] p-6 flex flex-col pt-12"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Inspection Detail</span>
                <h2 className="text-2xl font-display font-black text-white">{selectedLogDetail.machineId}</h2>
              </div>
              <button 
                onClick={() => setSelectedLogDetail(null)}
                className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-20">
              {/* Core Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Overall Vibration</span>
                  <div className="text-xl font-black text-white mt-1">{selectedLogDetail.overallValue} <span className="text-xs font-normal text-slate-500">mm/s</span></div>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Confidence Level</span>
                  <div className="text-xl font-black text-brand-accent mt-1">{selectedLogDetail.confidence}%</div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="p-5 bg-brand-accent/5 border border-brand-accent/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-brand-accent" />
                  <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Highest Suspect Fault</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedLogDetail.suspectFault}</h3>
                <div className="pt-3 border-t border-brand-accent/10">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Primary Recommendation</span>
                  <p className="text-sm text-slate-300 mt-1 italic">"{selectedLogDetail.recommendation}"</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Plant Area</span>
                  <span className="text-xs font-bold text-white">{selectedLogDetail.plant}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Dominant Direction</span>
                  <span className="text-xs font-bold text-white">{selectedLogDetail.dominantDirection}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Data Logged At</span>
                  <span className="text-xs font-bold text-white">
                    {selectedLogDetail.timestamp?.toDate ? new Date(selectedLogDetail.timestamp.toDate()).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedLogDetail(null)}
              className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700 uppercase tracking-widest text-[10px]"
            >
              Close Record
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      )}
    </AnimatePresence>
  );
}

