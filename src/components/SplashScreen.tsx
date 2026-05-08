import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap, Database } from 'lucide-react';

export default function SplashScreen({ onFinish }: { onFinish: () => void; key?: string }) {
  const [status, setStatus] = useState('INITIALIZING SYSTEMS...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      { text: 'BOOTING KERNEL...', delay: 500, p: 20 },
      { text: 'CONNECTING TO SENSORS...', delay: 1000, p: 45 },
      { text: 'LOADING ISO 21940 STANDARDS...', delay: 1500, p: 70 },
      { text: 'STABILIZING SPECTRAL BUFFER...', delay: 2000, p: 90 },
      { text: 'SYSTEM READY.', delay: 2500, p: 100 },
    ];

    sequence.forEach((s) => {
      setTimeout(() => {
        setStatus(s.text);
        setProgress(s.p);
      }, s.delay);
    });

    const timer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: 'circOut' }}
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Pulsing Glow */}
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-[500px] h-[500px] bg-brand-accent/20 blur-[120px] rounded-full"
      />

      <div className="relative flex flex-col items-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="relative mb-12"
        >
          <div className="w-24 h-24 bg-brand-accent/10 border border-brand-accent/30 rounded-3xl flex items-center justify-center p-6 relative">
            <Activity className="text-brand-accent w-full h-full" />
            
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand-accent" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand-accent" />
          </div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 border border-dashed border-brand-accent/30 rounded-full"
          />
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase mb-2">
            GRID<span className="text-brand-accent">.</span>
          </h1>
          <p className="text-xs font-mono tracking-[0.4em] text-slate-500">INDUSTRIAL INTELLIGENCE</p>
        </motion.div>

        {/* Loading Bar */}
        <div className="w-64 space-y-4">
          <div className="flex justify-between items-end text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-2">
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              </motion.div> 
              {status}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-brand-accent shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Features */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex gap-8"
      >
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck size={12} />
          <span className="text-[10px] uppercase font-bold tracking-tight">Encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Database size={12} />
          <span className="text-[10px] uppercase font-bold tracking-tight">ISO-Ready</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Zap size={12} />
          <span className="text-[10px] uppercase font-bold tracking-tight">Real-time</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
