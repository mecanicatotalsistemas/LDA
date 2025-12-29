export interface DataPoint {
  time: number;
  status: number; // 1 = failure, 0 = censored
  group?: string;
}

export interface DistributionParameters {
  [key: string]: number;
}

export interface DistributionResult {
  name: string;
  parameters: DistributionParameters;
  logLikelihood: number;
  aic: number;
  bic: number;
  mttf: number;
  b10: number;
  b50: number;
  b90: number;
  reliability: (t: number) => number;
  failure: (t: number) => number;
  hazard: (t: number) => number;
  pdf: (t: number) => number;
}

export interface AnalysisResults {
  distributions: {
    weibull2: DistributionResult;
    weibull3: DistributionResult;
    exponential: DistributionResult;
    lognormal: DistributionResult;
    normal: DistributionResult;
  };
  bestDistribution: string;
  equipmentName: string;
  dataStats: {
    totalSamples: number;
    failures: number;
    censored: number;
    minTime: number;
    maxTime: number;
    meanTime: number;
  };
}

// Degradation Analysis Types
export interface DegradationPoint {
  time: number;
  value: number;
  status?: number; // 0 = active, 1 = failed
}

export interface DegradationModel {
  name: string;
  type: 'linear' | 'exponential' | 'logarithmic' | 'power';
  parameters: { [key: string]: number };
  rSquared: number;
  predict: (t: number) => number;
  timeToFailure: (limit: number) => number;
}

export interface DegradationResults {
  models: {
    linear: DegradationModel;
    exponential: DegradationModel;
    logarithmic: DegradationModel;
    power: DegradationModel;
  };
  bestModel: string;
  failureLimit: number;
  estimatedFailureTime: number;
  projectedData: { time: number; value: number }[];
  lifeDistribution?: DistributionResult;
  equipmentName: string;
  dataStats: {
    totalMeasurements: number;
    timeSpan: number;
    degradationRate: number;
    currentValue: number;
  };
}