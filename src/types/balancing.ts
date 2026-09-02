export type VibrationUnit = 'µm' | 'mm' | 'mm/s (RMS)' | 'mm/s (Peak)' | 'mils';

export type RotationDirection = 'CW' | 'CCW';
export type ViewingPerspective = 'front' | 'driver_to_driven';
export type PhaseConvention = 'against_rotation' | 'with_rotation';

export interface Vector {
  mag: number;
  ang: number;
}

export interface SplitWeight {
  bladeIndex?: number;
  angle: number;
  mass: number;
  arcDistanceMm?: number;
}

export interface BalancingData {
  jobName: string;
  clientName: string;
  vibrationUnit: VibrationUnit;
  rotorMass: number; // in kg (optional)
  operatingRPM: number;
  isoGrade: number;
  diameter: number; // in mm
  rotationDir: RotationDirection;
  numBlades: number;
  viewingPerspective: ViewingPerspective;
  phaseConvention: PhaseConvention;
  
  // Step 2: Initial Run
  initAmp: number;
  initPh: number;
  
  // Step 3: Trial Run
  trialMass: number;
  trialAng: number;
  trialAmp: number;
  trialPh: number;
  
  // Step 5: Verification Run
  finalAmp: number;
  finalPh: number;
}

export interface BalancingResults {
  uPer: number; // g-mm limit
  influenceVector: Vector | null; // α in unit/g
  correction: Vector | null; // mass (g) and angle (deg)
  correctionArcMm: number; // arc distance from 0° in mm
  correctionArcCm: number; // arc distance in cm
  correctionArcFromTrialMm: number; // arc distance from trial weight in mm
  splitWeights: SplitWeight[] | null;
  residualUnbalance: number | null; // in g-mm
  isAcceptable: boolean | null;
  
  // Trim run calculations (if residual is still high)
  trimCorrectionAdd?: Vector; // Additional weight to add while keeping W1
  trimCorrectionNew?: Vector; // Total new weight if removing W1
}

export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => {
  let d = (r * 180) / Math.PI;
  return ((d % 360) + 360) % 360;
};

export const p2c = (m: number, a: number) => ({
  x: m * Math.cos(toRad(a)),
  y: m * Math.sin(toRad(a))
});

export const c2p = (x: number, y: number): Vector => ({
  mag: Math.sqrt(x * x + y * y),
  ang: toDeg(Math.atan2(y, x))
});

export const vAdd = (v1: Vector, v2: Vector): Vector => {
  const c1 = p2c(v1.mag, v1.ang);
  const c2 = p2c(v2.mag, v2.ang);
  return c2p(c1.x + c2.x, c1.y + c2.y);
};

export const vSub = (v1: Vector, v2: Vector): Vector => {
  const c1 = p2c(v1.mag, v1.ang);
  const c2 = p2c(v2.mag, v2.ang);
  return c2p(c1.x - c2.x, c1.y - c2.y);
};

export const vDiv = (v1: Vector, v2: Vector): Vector => ({
  mag: v1.mag / v2.mag,
  ang: ((v1.ang - v2.ang) % 360 + 360) % 360
});

export const vMul = (v1: Vector, v2: Vector): Vector => ({
  mag: v1.mag * v2.mag,
  ang: ((v1.ang + v2.ang) % 360 + 360) % 360
});

/**
 * Calculates arc distance in mm for a given angle on a circle with diameter D (mm)
 */
export const calcArcDistanceMm = (angleDeg: number, diameterMm: number) => {
  const normDeg = ((angleDeg % 360) + 360) % 360;
  const circumference = Math.PI * diameterMm;
  return (normDeg / 360) * circumference;
};
