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