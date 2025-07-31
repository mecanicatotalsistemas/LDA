import { DataPoint, AnalysisResults, DistributionResult } from '../types';

// Gamma function approximation using Lanczos approximation
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }

  const t = z + g + 0.5;
  const sqrt2pi = Math.sqrt(2 * Math.PI);

  return sqrt2pi * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Normal CDF using error function
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Error function approximation (Abramowitz and Stegun)
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Inverse normal CDF approximation (Beasley-Springer-Moro algorithm)
function normalInverse(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let x: number;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    x = (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
  }

  return x;
}

// Maximum Likelihood Estimation for Weibull 2-parameter
function fitWeibull2(data: DataPoint[]): DistributionResult {
  const times = data.map(d => d.time);
  const status = data.map(d => d.status);
  const n = times.length;
  const failures = status.filter(s => s === 1).length;
  
  if (failures === 0) {
    throw new Error('Não há falhas nos dados para ajustar a distribuição Weibull');
  }

  // Initial estimates using method of moments
  const logTimes = times.map(t => Math.log(t));
  const meanLogT = logTimes.reduce((sum, lt) => sum + lt, 0) / n;
  const varLogT = logTimes.reduce((sum, lt) => sum + Math.pow(lt - meanLogT, 2), 0) / (n - 1);
  
  let beta = Math.sqrt(6 * varLogT) / Math.PI; // Initial estimate
  beta = Math.max(0.1, Math.min(10, beta)); // Bound beta
  
  // Newton-Raphson iteration for MLE
  for (let iter = 0; iter < 100; iter++) {
    const oldBeta = beta;
    
    let sum1 = 0, sum2 = 0, sum3 = 0, sum4 = 0;
    
    for (let i = 0; i < n; i++) {
      const t = times[i];
      const s = status[i];
      const logT = Math.log(t);
      const tBeta = Math.pow(t, beta);
      
      sum1 += s * logT;
      sum2 += tBeta * logT;
      sum3 += s;
      sum4 += tBeta * logT * logT;
    }
    
    const totalTBeta = times.reduce((sum, t) => sum + Math.pow(t, beta), 0);
    
    if (totalTBeta === 0) break;
    
    const f = sum1 - sum2 / totalTBeta * failures + sum3 / beta;
    const df = -sum4 / totalTBeta + Math.pow(sum2 / totalTBeta, 2) - sum3 / (beta * beta);
    
    if (Math.abs(df) < 1e-10) break;
    
    beta = beta - f / df;
    beta = Math.max(0.1, Math.min(10, beta)); // Keep beta in reasonable bounds
    
    if (Math.abs(beta - oldBeta) < 1e-6) break;
  }
  
  // Calculate eta using MLE formula
  const sumTBeta = times.reduce((sum, t) => sum + Math.pow(t, beta), 0);
  const eta = Math.pow(sumTBeta / failures, 1 / beta);
  
  // Calculate reliability metrics
  const mttf = eta * gamma(1 + 1 / beta);
  const b10 = eta * Math.pow(-Math.log(0.9), 1 / beta);
  const b50 = eta * Math.pow(-Math.log(0.5), 1 / beta);
  const b90 = eta * Math.pow(-Math.log(0.1), 1 / beta);
  
  // Log-likelihood calculation
  let logLikelihood = 0;
  for (let i = 0; i < n; i++) {
    const t = times[i];
    const s = status[i];
    const tOverEta = t / eta;
    const tOverEtaBeta = Math.pow(tOverEta, beta);
    
    if (s === 1) {
      // Failure
      logLikelihood += Math.log(beta) - beta * Math.log(eta) + (beta - 1) * Math.log(t) - tOverEtaBeta;
    } else {
      // Censored
      logLikelihood += -tOverEtaBeta;
    }
  }
  
  const numParams = 2;
  const aic = 2 * numParams - 2 * logLikelihood;
  const bic = Math.log(n) * numParams - 2 * logLikelihood;
  
  return {
    name: 'Weibull 2-Parameter',
    parameters: { beta, eta },
    logLikelihood,
    aic,
    bic,
    mttf,
    b10,
    b50,
    b90,
    reliability: (t: number) => Math.exp(-Math.pow(t / eta, beta)),
    failure: (t: number) => 1 - Math.exp(-Math.pow(t / eta, beta)),
    hazard: (t: number) => (beta / eta) * Math.pow(t / eta, beta - 1),
    pdf: (t: number) => (beta / eta) * Math.pow(t / eta, beta - 1) * Math.exp(-Math.pow(t / eta, beta))
  };
}

// Weibull 3-parameter (simplified with location parameter = 0)
function fitWeibull3(data: DataPoint[]): DistributionResult {
  const result = fitWeibull2(data);
  return {
    ...result,
    name: 'Weibull 3-Parameter',
    parameters: { ...result.parameters, gamma: 0 }
  };
}

// Maximum Likelihood Estimation for Exponential distribution
function fitExponential(data: DataPoint[]): DistributionResult {
  const times = data.map(d => d.time);
  const status = data.map(d => d.status);
  const n = times.length;
  
  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const failures = status.reduce((sum, s) => sum + s, 0);
  
  if (failures === 0) {
    throw new Error('Não há falhas nos dados para ajustar a distribuição Exponencial');
  }
  
  // MLE estimate for exponential
  const lambda = failures / totalTime;
  const mttf = 1 / lambda;
  
  const b10 = -Math.log(0.9) / lambda;
  const b50 = -Math.log(0.5) / lambda;
  const b90 = -Math.log(0.1) / lambda;
  
  // Log-likelihood
  let logLikelihood = 0;
  for (let i = 0; i < n; i++) {
    const t = times[i];
    const s = status[i];
    
    if (s === 1) {
      logLikelihood += Math.log(lambda) - lambda * t;
    } else {
      logLikelihood += -lambda * t;
    }
  }
  
  const numParams = 1;
  const aic = 2 * numParams - 2 * logLikelihood;
  const bic = Math.log(n) * numParams - 2 * logLikelihood;
  
  return {
    name: 'Exponential',
    parameters: { lambda },
    logLikelihood,
    aic,
    bic,
    mttf,
    b10,
    b50,
    b90,
    reliability: (t: number) => Math.exp(-lambda * t),
    failure: (t: number) => 1 - Math.exp(-lambda * t),
    hazard: (t: number) => lambda,
    pdf: (t: number) => lambda * Math.exp(-lambda * t)
  };
}

// Maximum Likelihood Estimation for Lognormal distribution
function fitLognormal(data: DataPoint[]): DistributionResult {
  const times = data.map(d => d.time);
  const status = data.map(d => d.status);
  const n = times.length;
  const failures = status.filter(s => s === 1).length;
  
  if (failures === 0) {
    throw new Error('Não há falhas nos dados para ajustar a distribuição Lognormal');
  }
  
  // For complete data, MLE estimates are:
  const logTimes = times.map(t => Math.log(t));
  const failureLogTimes = times.filter((t, i) => status[i] === 1).map(t => Math.log(t));
  
  // MLE estimates
  const mu = failureLogTimes.reduce((sum, lt) => sum + lt, 0) / failures;
  const sigma = Math.sqrt(failureLogTimes.reduce((sum, lt) => sum + Math.pow(lt - mu, 2), 0) / failures);
  
  const mttf = Math.exp(mu + sigma * sigma / 2);
  
  // Calculate percentiles using inverse normal
  const b10 = Math.exp(mu + sigma * normalInverse(0.1));
  const b50 = Math.exp(mu);
  const b90 = Math.exp(mu + sigma * normalInverse(0.9));
  
  // Log-likelihood for censored data
  let logLikelihood = 0;
  for (let i = 0; i < n; i++) {
    const t = times[i];
    const s = status[i];
    const z = (Math.log(t) - mu) / sigma;
    
    if (s === 1) {
      // Failure
      logLikelihood += -0.5 * Math.log(2 * Math.PI) - Math.log(sigma) - Math.log(t) - 0.5 * z * z;
    } else {
      // Censored
      logLikelihood += Math.log(1 - normalCDF(z));
    }
  }
  
  const numParams = 2;
  const aic = 2 * numParams - 2 * logLikelihood;
  const bic = Math.log(n) * numParams - 2 * logLikelihood;
  
  return {
    name: 'Lognormal',
    parameters: { mu, sigma },
    logLikelihood,
    aic,
    bic,
    mttf,
    b10,
    b50,
    b90,
    reliability: (t: number) => 1 - normalCDF((Math.log(t) - mu) / sigma),
    failure: (t: number) => normalCDF((Math.log(t) - mu) / sigma),
    hazard: (t: number) => {
      const z = (Math.log(t) - mu) / sigma;
      const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
      const Phi = normalCDF(z);
      return phi / (sigma * t * (1 - Phi));
    },
    pdf: (t: number) => {
      const z = (Math.log(t) - mu) / sigma;
      return Math.exp(-0.5 * z * z) / (sigma * t * Math.sqrt(2 * Math.PI));
    }
  };
}

// Maximum Likelihood Estimation for Normal distribution
function fitNormal(data: DataPoint[]): DistributionResult {
  const times = data.map(d => d.time);
  const status = data.map(d => d.status);
  const n = times.length;
  const failures = status.filter(s => s === 1).length;
  
  if (failures === 0) {
    throw new Error('Não há falhas nos dados para ajustar a distribuição Normal');
  }
  
  // For complete data, MLE estimates are:
  const failureTimes = times.filter((t, i) => status[i] === 1);
  
  const mu = failureTimes.reduce((sum, t) => sum + t, 0) / failures;
  const sigma = Math.sqrt(failureTimes.reduce((sum, t) => sum + Math.pow(t - mu, 2), 0) / failures);
  
  const mttf = mu;
  
  // Calculate percentiles
  const b10 = Math.max(0, mu + sigma * normalInverse(0.1));
  const b50 = mu;
  const b90 = mu + sigma * normalInverse(0.9);
  
  // Log-likelihood for censored data
  let logLikelihood = 0;
  for (let i = 0; i < n; i++) {
    const t = times[i];
    const s = status[i];
    const z = (t - mu) / sigma;
    
    if (s === 1) {
      // Failure
      logLikelihood += -0.5 * Math.log(2 * Math.PI) - Math.log(sigma) - 0.5 * z * z;
    } else {
      // Censored
      logLikelihood += Math.log(1 - normalCDF(z));
    }
  }
  
  const numParams = 2;
  const aic = 2 * numParams - 2 * logLikelihood;
  const bic = Math.log(n) * numParams - 2 * logLikelihood;
  
  return {
    name: 'Normal',
    parameters: { mu, sigma },
    logLikelihood,
    aic,
    bic,
    mttf,
    b10: Math.max(0, b10), // Ensure non-negative
    b50,
    b90,
    reliability: (t: number) => 1 - normalCDF((t - mu) / sigma),
    failure: (t: number) => normalCDF((t - mu) / sigma),
    hazard: (t: number) => {
      const z = (t - mu) / sigma;
      const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
      const Phi = normalCDF(z);
      const reliability = 1 - Phi;
      return reliability > 1e-10 ? phi / (sigma * reliability) : 0;
    },
    pdf: (t: number) => Math.exp(-0.5 * Math.pow((t - mu) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI))
  };
}

export async function performLDA(data: DataPoint[]): Promise<AnalysisResults> {
  if (data.length < 3) {
    throw new Error('São necessários pelo menos 3 pontos de dados para análise');
  }
  
  const failures = data.filter(d => d.status === 1).length;
  if (failures === 0) {
    throw new Error('É necessário pelo menos uma falha nos dados para análise');
  }
  
  try {
    // Fit all distributions
    const weibull2 = fitWeibull2(data);
    const weibull3 = fitWeibull3(data);
    const exponential = fitExponential(data);
    const lognormal = fitLognormal(data);
    const normal = fitNormal(data);
    
    const distributions = {
      weibull2,
      weibull3,
      exponential,
      lognormal,
      normal
    };
    
    // Find best distribution based on AIC (lower is better)
    let bestDistribution = 'weibull2';
    let bestAIC = weibull2.aic;
    
    Object.entries(distributions).forEach(([key, dist]) => {
      if (dist.aic < bestAIC && isFinite(dist.aic)) {
        bestAIC = dist.aic;
        bestDistribution = key;
      }
    });
    
    // Calculate data statistics
    const times = data.map(d => d.time);
    const censored = data.length - failures;
    
    const dataStats = {
      totalSamples: data.length,
      failures,
      censored,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      meanTime: times.reduce((sum, t) => sum + t, 0) / times.length
    };
    
    return {
      distributions,
      bestDistribution,
      equipmentName: '', // Will be set by the calling component
      dataStats
    };
    
  } catch (error) {
    console.error('Erro no cálculo LDA:', error);
    throw new Error(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}