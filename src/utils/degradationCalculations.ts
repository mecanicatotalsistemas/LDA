import { DegradationPoint, DegradationResults, DegradationModel, DistributionResult } from '../types';

// Mathematical models for degradation
const linearModel = (t: number, a: number, b: number): number => a + b * t;
const exponentialModel = (t: number, a: number, b: number): number => a * Math.exp(b * t);
const logarithmicModel = (t: number, a: number, b: number): number => a + b * Math.log(t);
const powerModel = (t: number, a: number, b: number): number => a * Math.pow(t, b);

// Least squares fitting for linear model
function fitLinearModel(times: number[], values: number[]): DegradationModel {
  const n = times.length;
  const sumT = times.reduce((sum, t) => sum + t, 0);
  const sumV = values.reduce((sum, v) => sum + v, 0);
  const sumTV = times.reduce((sum, t, i) => sum + t * values[i], 0);
  const sumT2 = times.reduce((sum, t) => sum + t * t, 0);
  
  const b = (n * sumTV - sumT * sumV) / (n * sumT2 - sumT * sumT);
  const a = (sumV - b * sumT) / n;
  
  // Calculate R²
  const meanV = sumV / n;
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - linearModel(times[i], a, b), 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanV, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);
  
  return {
    name: 'Linear',
    type: 'linear',
    parameters: { a, b },
    rSquared: Math.max(0, rSquared),
    predict: (t: number) => linearModel(t, a, b),
    timeToFailure: (limit: number) => b !== 0 ? (limit - a) / b : Infinity
  };
}

// Exponential model fitting using linearization
function fitExponentialModel(times: number[], values: number[]): DegradationModel {
  // Transform to linear: ln(y) = ln(a) + b*t
  const validIndices = values.map((v, i) => ({ v, i })).filter(({ v }) => v > 0);
  
  if (validIndices.length < 2) {
    return {
      name: 'Exponential',
      type: 'exponential',
      parameters: { a: 1, b: 0 },
      rSquared: 0,
      predict: (t: number) => values[0] || 1,
      timeToFailure: () => Infinity
    };
  }
  
  const validTimes = validIndices.map(({ i }) => times[i]);
  const logValues = validIndices.map(({ v }) => Math.log(v));
  
  const linearFit = fitLinearModel(validTimes, logValues);
  const lnA = linearFit.parameters.a;
  const b = linearFit.parameters.b;
  const a = Math.exp(lnA);
  
  // Calculate R² for original data
  const meanV = values.reduce((sum, v) => sum + v, 0) / values.length;
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - exponentialModel(times[i], a, b), 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanV, 2), 0);
  const rSquared = Math.max(0, 1 - (ssRes / ssTot));
  
  return {
    name: 'Exponential',
    type: 'exponential',
    parameters: { a, b },
    rSquared,
    predict: (t: number) => exponentialModel(t, a, b),
    timeToFailure: (limit: number) => b > 0 ? Math.log(limit / a) / b : Infinity
  };
}

// Logarithmic model fitting
function fitLogarithmicModel(times: number[], values: number[]): DegradationModel {
  // Transform: y = a + b*ln(t)
  const validIndices = times.map((t, i) => ({ t, i })).filter(({ t }) => t > 0);
  
  if (validIndices.length < 2) {
    return {
      name: 'Logarithmic',
      type: 'logarithmic',
      parameters: { a: 0, b: 0 },
      rSquared: 0,
      predict: (t: number) => values[0] || 0,
      timeToFailure: () => Infinity
    };
  }
  
  const logTimes = validIndices.map(({ t }) => Math.log(t));
  const validValues = validIndices.map(({ i }) => values[i]);
  
  const linearFit = fitLinearModel(logTimes, validValues);
  const a = linearFit.parameters.a;
  const b = linearFit.parameters.b;
  
  // Calculate R² for original data
  const meanV = values.reduce((sum, v) => sum + v, 0) / values.length;
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - logarithmicModel(times[i], a, b), 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanV, 2), 0);
  const rSquared = Math.max(0, 1 - (ssRes / ssTot));
  
  return {
    name: 'Logarithmic',
    type: 'logarithmic',
    parameters: { a, b },
    rSquared,
    predict: (t: number) => logarithmicModel(t, a, b),
    timeToFailure: (limit: number) => b !== 0 ? Math.exp((limit - a) / b) : Infinity
  };
}

// Power model fitting using linearization
function fitPowerModel(times: number[], values: number[]): DegradationModel {
  // Transform: ln(y) = ln(a) + b*ln(t)
  const validIndices = times.map((t, i) => ({ t, i }))
    .filter(({ t, i }) => t > 0 && values[i] > 0);
  
  if (validIndices.length < 2) {
    return {
      name: 'Power',
      type: 'power',
      parameters: { a: 1, b: 0 },
      rSquared: 0,
      predict: (t: number) => values[0] || 1,
      timeToFailure: () => Infinity
    };
  }
  
  const logTimes = validIndices.map(({ t }) => Math.log(t));
  const logValues = validIndices.map(({ i }) => Math.log(values[i]));
  
  const linearFit = fitLinearModel(logTimes, logValues);
  const lnA = linearFit.parameters.a;
  const b = linearFit.parameters.b;
  const a = Math.exp(lnA);
  
  // Calculate R² for original data
  const meanV = values.reduce((sum, v) => sum + v, 0) / values.length;
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - powerModel(times[i], a, b), 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanV, 2), 0);
  const rSquared = Math.max(0, 1 - (ssRes / ssTot));
  
  return {
    name: 'Power',
    type: 'power',
    parameters: { a, b },
    rSquared,
    predict: (t: number) => powerModel(t, a, b),
    timeToFailure: (limit: number) => b !== 0 ? Math.pow(limit / a, 1 / b) : Infinity
  };
}

// Simple Weibull fitting for failure time distribution
function fitWeibullForDegradation(failureTimes: number[]): DistributionResult {
  if (failureTimes.length === 0) {
    throw new Error('No failure times available for distribution fitting');
  }
  
  // Simple method of moments for Weibull parameters
  const meanTime = failureTimes.reduce((sum, t) => sum + t, 0) / failureTimes.length;
  const variance = failureTimes.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / failureTimes.length;
  
  // Approximate Weibull parameters
  const cv = Math.sqrt(variance) / meanTime; // Coefficient of variation
  let beta = 1.0; // Shape parameter
  
  // Iterative approximation for beta
  for (let i = 0; i < 10; i++) {
    const gamma1 = gamma(1 + 1/beta);
    const gamma2 = gamma(1 + 2/beta);
    const theoreticalCV = Math.sqrt(gamma2 - gamma1*gamma1) / gamma1;
    
    if (Math.abs(theoreticalCV - cv) < 0.01) break;
    
    beta = beta * (cv < theoreticalCV ? 1.1 : 0.9);
    beta = Math.max(0.5, Math.min(5.0, beta));
  }
  
  const eta = meanTime / gamma(1 + 1/beta);
  
  const mttf = eta * gamma(1 + 1/beta);
  const b10 = eta * Math.pow(-Math.log(0.9), 1/beta);
  const b50 = eta * Math.pow(-Math.log(0.5), 1/beta);
  const b90 = eta * Math.pow(-Math.log(0.1), 1/beta);
  
  return {
    name: 'Weibull (Degradation)',
    parameters: { beta, eta },
    logLikelihood: 0, // Simplified
    aic: 0,
    bic: 0,
    mttf,
    b10,
    b50,
    b90,
    reliability: (t: number) => Math.exp(-Math.pow(t/eta, beta)),
    failure: (t: number) => 1 - Math.exp(-Math.pow(t/eta, beta)),
    hazard: (t: number) => (beta/eta) * Math.pow(t/eta, beta-1),
    pdf: (t: number) => (beta/eta) * Math.pow(t/eta, beta-1) * Math.exp(-Math.pow(t/eta, beta))
  };
}

// Gamma function approximation
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

export async function performDegradationAnalysis(
  data: DegradationPoint[], 
  failureLimit: number,
  equipmentName: string = ''
): Promise<DegradationResults> {
  if (data.length < 3) {
    throw new Error('São necessários pelo menos 3 pontos de medição para análise de degradação');
  }
  
  if (failureLimit <= 0) {
    throw new Error('Limite de falha deve ser um valor positivo');
  }
  
  const times = data.map(d => d.time);
  const values = data.map(d => d.value);
  
  try {
    // Fit all degradation models
    const linear = fitLinearModel(times, values);
    const exponential = fitExponentialModel(times, values);
    const logarithmic = fitLogarithmicModel(times, values);
    const power = fitPowerModel(times, values);
    
    const models = { linear, exponential, logarithmic, power };
    
    // Find best model based on R²
    let bestModel = 'linear';
    let bestR2 = linear.rSquared;
    
    Object.entries(models).forEach(([key, model]) => {
      if (model.rSquared > bestR2 && isFinite(model.rSquared)) {
        bestR2 = model.rSquared;
        bestModel = key;
      }
    });
    
    const selectedModel = models[bestModel as keyof typeof models];
    const estimatedFailureTime = selectedModel.timeToFailure(failureLimit);
    
    // Generate projected data
    const maxTime = Math.max(...times);
    const projectionTime = Math.min(estimatedFailureTime * 1.2, maxTime * 3);
    const projectedData = Array.from({ length: 50 }, (_, i) => {
      const t = (i + 1) * projectionTime / 50;
      return {
        time: t,
        value: selectedModel.predict(t)
      };
    });
    
    // Calculate data statistics
    const timeSpan = Math.max(...times) - Math.min(...times);
    const degradationRate = (Math.max(...values) - Math.min(...values)) / timeSpan;
    const currentValue = values[values.length - 1];
    
    const dataStats = {
      totalMeasurements: data.length,
      timeSpan,
      degradationRate,
      currentValue
    };
    
    // Try to fit life distribution if we have reasonable failure time
    let lifeDistribution: DistributionResult | undefined;
    if (isFinite(estimatedFailureTime) && estimatedFailureTime > 0) {
      try {
        // Generate some failure times around the estimate for distribution fitting
        const failureTimes = [
          estimatedFailureTime * 0.8,
          estimatedFailureTime * 0.9,
          estimatedFailureTime,
          estimatedFailureTime * 1.1,
          estimatedFailureTime * 1.2
        ];
        lifeDistribution = fitWeibullForDegradation(failureTimes);
      } catch (error) {
        console.warn('Could not fit life distribution:', error);
      }
    }
    
    return {
      models,
      bestModel,
      failureLimit,
      estimatedFailureTime,
      projectedData,
      lifeDistribution,
      equipmentName,
      dataStats
    };
    
  } catch (error) {
    console.error('Erro no cálculo de degradação:', error);
    throw new Error(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}