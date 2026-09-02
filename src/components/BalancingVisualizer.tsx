import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  RotateCw, 
  RotateCcw, 
  Eye, 
  Ruler, 
  Layers, 
  HelpCircle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { 
  BalancingData, 
  Vector, 
  SplitWeight, 
  toRad, 
  calcArcDistanceMm 
} from '../types/balancing';

interface VisualizerProps {
  data: BalancingData;
  correction: Vector | null;
  splitWeights: SplitWeight[] | null;
  interactive?: boolean;
}

export default function BalancingVisualizer({
  data,
  correction,
  splitWeights
}: VisualizerProps) {
  const [displayMode, setDisplayMode] = useState<'degrees' | 'arc_mm' | 'arc_cm'>('degrees');
  const [referenceBase, setReferenceBase] = useState<'from_0' | 'from_trial'>('from_0');

  const diameter = data.diameter || 500;
  const circumferenceMm = Math.PI * diameter;
  const circumferenceCm = circumferenceMm / 10;

  const corrAngle = correction ? ((correction.ang % 360) + 360) % 360 : 0;
  const trialAngle = ((data.trialAng % 360) + 360) % 360;

  // Arc length from 0°
  const arcFrom0Mm = calcArcDistanceMm(corrAngle, diameter);
  const arcFrom0Cm = arcFrom0Mm / 10;

  // Arc length from Trial Weight
  const deltaAngleFromTrial = ((corrAngle - trialAngle + 360) % 360);
  const arcFromTrialMm = calcArcDistanceMm(deltaAngleFromTrial, diameter);
  const arcFromTrialCm = arcFromTrialMm / 10;

  // Measurement Direction description
  const isAgainstRotation = data.phaseConvention === 'against_rotation';
  const isCW = data.rotationDir === 'CW';
  
  // Measuring direction:
  // If CW and Against Rotation -> measure CCW
  // If CCW and Against Rotation -> measure CW
  // If CW and With Rotation -> measure CW
  // If CCW and With Rotation -> measure CCW
  const measureDirectionText = isAgainstRotation
    ? (isCW ? 'Berlawanan arah jarum jam (CCW)' : 'Searah jarum jam (CW)')
    : (isCW ? 'Searah jarum jam (CW)' : 'Berlawanan arah jarum jam (CCW)');

  const measureDirectionShort = isAgainstRotation
    ? (isCW ? 'CCW (A/R)' : 'CW (A/R)')
    : (isCW ? 'CW (W/R)' : 'CCW (W/R)');

  // SVG dimensions
  const center = 160;
  const radius = 110;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col space-y-5">
      {/* Visualizer Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Rotor Placement Map & Angle Guide
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Eye size={12} className="text-blue-400" />
                {data.viewingPerspective === 'front' ? 'Muka Depan Impeller' : 'Sisi Driver ke Driven'}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                Putaran: {data.rotationDir}
              </span>
            </div>
          </div>
        </div>

        {/* Units / Measurement Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setDisplayMode('degrees')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              displayMode === 'degrees' 
                ? 'bg-brand-accent text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sudut (°)
          </button>
          <button
            onClick={() => setDisplayMode('arc_mm')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              displayMode === 'arc_mm' 
                ? 'bg-brand-accent text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Keliling (mm)
          </button>
          <button
            onClick={() => setDisplayMode('arc_cm')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              displayMode === 'arc_cm' 
                ? 'bg-brand-accent text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Keliling (cm)
          </button>
        </div>
      </div>

      {/* SVG Canvas & Direct Placement Guide */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Rotor Rendering */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
          <svg viewBox="0 0 320 320" className="w-full max-w-[260px] aspect-square">
            <defs>
              <radialGradient id="rotorGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="85%" stopColor="#020617" />
                <stop offset="100%" stopColor="#1e293b" />
              </radialGradient>
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Rotor Disc Outer */}
            <circle cx={center} cy={center} r={radius} fill="url(#rotorGradient)" stroke="#334155" strokeWidth="3" />
            <circle cx={center} cy={center} r={radius + 15} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={center} cy={center} r="22" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx={center} cy={center} r="6" fill="#64748b" />

            {/* Crosshairs & Angle Ticks */}
            <line x1={center} y1={center - radius - 8} x2={center} y2={center + radius + 8} stroke="#1e293b" strokeWidth="1" />
            <line x1={center - radius - 8} y1={center} x2={center + radius + 8} y2={center} stroke="#1e293b" strokeWidth="1" />

            {/* 0°, 90°, 180°, 270° Reference Labels */}
            <text x={center + radius + 8} y={center + 4} fontSize="9" className="fill-emerald-400 font-mono font-bold">0°</text>
            <text x={center - 8} y={center - radius - 6} fontSize="8" className="fill-slate-500 font-mono">90°</text>
            <text x={center - radius - 24} y={center + 4} fontSize="8" className="fill-slate-500 font-mono">180°</text>
            <text x={center - 10} y={center + radius + 14} fontSize="8" className="fill-slate-500 font-mono">270°</text>

            {/* Impeller Blades if specified */}
            {data.numBlades > 2 && Array.from({ length: data.numBlades }).map((_, i) => {
              const deg = i * (360 / data.numBlades);
              const rad = toRad(deg);
              const bx = center + radius * Math.cos(rad);
              const by = center - radius * Math.sin(rad);
              const lx = center + (radius - 20) * Math.cos(rad);
              const ly = center - (radius - 20) * Math.sin(rad);
              return (
                <g key={i}>
                  <line 
                    x1={center} 
                    y1={center} 
                    x2={bx} 
                    y2={by} 
                    stroke="#334155" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 2"
                  />
                  <text 
                    x={lx} 
                    y={ly} 
                    fontSize="7" 
                    className="fill-slate-500 font-mono font-bold" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                  >
                    B{i + 1}
                  </text>
                </g>
              );
            })}

            {/* 0° Keyway / Photo Tape Mark */}
            <rect 
              x={center + radius - 6} 
              y={center - 4} 
              width="12" 
              height="8" 
              rx="1" 
              fill="#10b981" 
              stroke="#064e3b" 
              strokeWidth="1"
            />
            <text 
              x={center + radius + 5} 
              y={center + 14} 
              fontSize="6.5" 
              className="fill-emerald-400 font-mono font-bold"
            >
              REF/0°
            </text>

            {/* Rotation Direction Arc */}
            <g transform={`translate(${center}, ${center})`}>
              <path 
                d={isCW ? "M 0,-40 A 40 40 0 0 1 40,0" : "M 0,-40 A 40 40 0 0 0 -40,0"} 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="2" 
                strokeDasharray="2 2"
              />
              <polygon 
                points={isCW ? "38,0 44,0 41,7" : "-38,0 -44,0 -41,7"} 
                fill="#38bdf8"
              />
              <text 
                x="0" 
                y="-45" 
                fontSize="7" 
                className="fill-sky-400 font-mono font-bold" 
                textAnchor="middle"
              >
                ROTATION ({data.rotationDir})
              </text>
            </g>

            {/* Trial Weight Ghost (Marked as REMOVED) */}
            {data.trialMass > 0 && (
              <g>
                <line 
                  x1={center} 
                  y1={center} 
                  x2={center + radius * Math.cos(toRad(trialAngle))} 
                  y2={center - radius * Math.sin(toRad(trialAngle))} 
                  stroke="#f59e0b" 
                  strokeWidth="1" 
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <circle 
                  cx={center + radius * Math.cos(toRad(trialAngle))} 
                  cy={center - radius * Math.sin(toRad(trialAngle))} 
                  r="7" 
                  fill="#78350f" 
                  stroke="#f59e0b" 
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
                <text 
                  x={center + (radius + 20) * Math.cos(toRad(trialAngle))} 
                  y={center - (radius + 20) * Math.sin(toRad(trialAngle))} 
                  fontSize="6.5" 
                  className="fill-amber-400 font-mono font-bold" 
                  textAnchor="middle"
                >
                  TRIAL (LEPAS)
                </text>
              </g>
            )}

            {/* Correction Weight Solution */}
            {correction && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {/* Arc line connecting 0° to Correction Position */}
                <path 
                  d={`M ${center + radius} ${center} A ${radius} ${radius} 0 ${corrAngle > 180 ? 1 : 0} 0 ${center + radius * Math.cos(toRad(corrAngle))} ${center - radius * Math.sin(toRad(corrAngle))}`}
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  opacity="0.7"
                />

                {/* Vector Arm */}
                <line 
                  x1={center} 
                  y1={center} 
                  x2={center + radius * Math.cos(toRad(corrAngle))} 
                  y2={center - radius * Math.sin(toRad(corrAngle))} 
                  stroke="#22c55e" 
                  strokeWidth="3.5"
                />

                {/* Weight Indicator */}
                <circle 
                  cx={center + radius * Math.cos(toRad(corrAngle))} 
                  cy={center - radius * Math.sin(toRad(corrAngle))} 
                  r="13" 
                  fill="#22c55e" 
                  filter="url(#glowGreen)"
                />
                <circle 
                  cx={center + radius * Math.cos(toRad(corrAngle))} 
                  cy={center - radius * Math.sin(toRad(corrAngle))} 
                  r="13" 
                  fill="#22c55e" 
                  stroke="#ffffff" 
                  strokeWidth="2"
                />
                <text 
                  x={center + radius * Math.cos(toRad(corrAngle))} 
                  y={center - radius * Math.sin(toRad(corrAngle)) + 3.5} 
                  fontSize="8.5" 
                  className="fill-slate-950 font-mono font-black" 
                  textAnchor="middle"
                >
                  W
                </text>

                {/* Angle / Arc Label on SVG */}
                <text 
                  x={center + (radius + 22) * Math.cos(toRad(corrAngle))} 
                  y={center - (radius + 22) * Math.sin(toRad(corrAngle))} 
                  fontSize="7.5" 
                  className="fill-emerald-400 font-mono font-bold" 
                  textAnchor="middle"
                >
                  {displayMode === 'degrees' 
                    ? `${corrAngle.toFixed(1)}°` 
                    : displayMode === 'arc_mm' 
                      ? `${arcFrom0Mm.toFixed(0)} mm` 
                      : `${arcFrom0Cm.toFixed(1)} cm`}
                </text>
              </motion.g>
            )}
          </svg>

          {/* Perspective Legend Below SVG */}
          <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>POV: {data.viewingPerspective === 'front' ? 'Melihat Muka Impeller (Front)' : 'Melihat dari Sisi Penggerak (Driver)'}</span>
          </div>
        </div>

        {/* Detailed Practical Measurements & Instructions */}
        <div className="md:col-span-6 space-y-4">
          {correction ? (
            <>
              <div className="bg-slate-950 border border-brand-accent/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    Lokasi Penempatan Bobot (W)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {correction.mag.toFixed(1)} Gram
                  </span>
                </div>

                {/* Direct Circumference & Angle values */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">Sudut (Derajat)</span>
                    <span className="text-base font-black text-white font-mono">{corrAngle.toFixed(1)}°</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">Jarak Busur dari 0°</span>
                    <span className="text-base font-black text-brand-accent font-mono">
                      {arcFrom0Mm.toFixed(1)} mm <span className="text-[10px] font-normal text-slate-400">({arcFrom0Cm.toFixed(1)} cm)</span>
                    </span>
                  </div>
                </div>

                {/* Arc from Trial if trial was set */}
                {data.trialMass > 0 && (
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] flex justify-between items-center">
                    <span className="text-slate-400 font-mono">Jarak dari Posisi Trial ({trialAngle}°):</span>
                    <span className="font-bold text-amber-400 font-mono">
                      +{arcFromTrialMm.toFixed(1)} mm ({arcFromTrialCm.toFixed(1)} cm)
                    </span>
                  </div>
                )}
              </div>

              {/* Step-by-step Execution Rule */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-tight">
                  <ArrowUpRight size={14} className="text-brand-accent" />
                  <span>Panduan Pengukuran di Lapangan:</span>
                </div>

                <ol className="text-xs text-slate-300 space-y-2 pl-4 list-decimal leading-relaxed">
                  <li>
                    <strong className="text-white">Lepas Beban Trial ({data.trialMass}g):</strong> Pastikan beban uji coba sementara sudah dilepas total dari rotor.
                  </li>
                  <li>
                    <strong className="text-white">Cari Titik Referensi 0° / Ref Mark:</strong> Temukan tanda tape reflektif, keyway, atau tanda 0° pada lingkar impeller.
                  </li>
                  <li>
                    <strong className="text-white">Tarik Meteran / Busur:</strong> Dari titik 0°, ukur sepanjang keliling lingkar sebesar <span className="text-brand-accent font-bold font-mono">{arcFrom0Mm.toFixed(1)} mm ({arcFrom0Cm.toFixed(1)} cm)</span> ke arah <span className="text-amber-400 font-bold uppercase">{measureDirectionText}</span> ({measureDirectionShort}).
                  </li>
                  <li>
                    <strong className="text-white">Pasang Beban Koreksi:</strong> Las/tempelkan bobot seberat <span className="text-brand-accent font-bold font-mono">{correction.mag.toFixed(1)} g</span> pada titik busur tersebut di radius <span className="font-mono text-slate-200">{(diameter / 2).toFixed(0)} mm</span>.
                  </li>
                </ol>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Keliling Total: {circumferenceMm.toFixed(1)} mm ({circumferenceCm.toFixed(1)} cm)</span>
                  <span>Radius: {(diameter / 2).toFixed(0)} mm</span>
                </div>
              </div>

              {/* Split Weights if blade allocation enabled */}
              {splitWeights && splitWeights.length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                      Pembagian Bobot ke Bilah (Blade Split Option)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {splitWeights.map((sw, idx) => (
                      <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Bilah #{sw.bladeIndex || idx + 1} ({sw.angle.toFixed(0)}°):</span>
                        <span className="font-bold text-white font-mono">{sw.mass.toFixed(1)} g</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    *Gunakan opsi bilah jika lokasi ideal berada di celah kosong antar sudu/blade.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-mono">
              Masukkan data Initial Run dan Trial Run untuk melihat visualisasi dan kalkulasi jarak busur keliling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
