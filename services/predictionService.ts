import type { Spin, SpinDirection } from '../types';
import { ROULETTE_NUMBERS, NUMBER_TO_INDEX_MAP, MODEL_NAMES } from '../constants';

const WHEEL_SIZE = 37;
const AVG_DIST_WINDOW = 20;
const HOT_ZONE_WINDOW = 50;
const LEARNING_RATE = 0.1; // Alpha for weight adjustment

// --- Interfaces for Model States ---

interface BaseModelState {
    name: string;
    weight: number;
    accuracy: number;
    hits: number;
    spins: number;
}

interface AverageDistanceState extends BaseModelState {
    distances: { CW: number[]; CCW: number[] };
}

interface MarkovChainState extends BaseModelState {
    transitionMatrix: number[][];
}

interface HotZoneState extends BaseModelState {
    // No extra state needed, calculated from spin history
}

interface MomentumState extends BaseModelState {
    // No extra state needed, calculated from other models' performance
}

export interface FullPredictionState {
    averageDistance: AverageDistanceState;
    markovChain: MarkovChainState;
    hotZone: HotZoneState;
    momentum: MomentumState;
}

// --- Utility Functions ---

const getNumberIndex = (num: number): number => NUMBER_TO_INDEX_MAP.get(num) ?? -1;

const getDistance = (from: number, to: number, direction: SpinDirection): number => {
    const fromIndex = getNumberIndex(from);
    const toIndex = getNumberIndex(to);
    if (direction === 'CW') {
        return (toIndex - fromIndex + WHEEL_SIZE) % WHEEL_SIZE;
    } else {
        return (fromIndex - toIndex + WHEEL_SIZE) % WHEEL_SIZE;
    }
};

const normalizeScores = (scores: number[]): number[] => {
    const sum = scores.reduce((a, b) => a + b, 0);
    if (sum === 0) return new Array(WHEEL_SIZE).fill(1 / WHEEL_SIZE);
    return scores.map(s => s / sum);
};

// --- Prediction Models ---

const getAvgDistPrediction = (state: AverageDistanceState, lastSpin: Spin | undefined, nextDirection: SpinDirection): number[] => {
    const scores = new Array(WHEEL_SIZE).fill(0);
    if (!lastSpin) return scores;

    const distances = state.distances[nextDirection];
    if (distances.length === 0) return scores;

    const avgDistance = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);
    const lastIndex = getNumberIndex(lastSpin.number);
    const predictedIndex = (lastIndex + avgDistance) % WHEEL_SIZE;

    // Distribute scores around the predicted number
    for (let i = 0; i < WHEEL_SIZE; i++) {
        const distFromPrediction = Math.min(
            Math.abs(i - predictedIndex),
            WHEEL_SIZE - Math.abs(i - predictedIndex)
        );
        scores[i] = Math.max(0, 5 - distFromPrediction);
    }
    
    return scores.map((_, i) => scores[getNumberIndex(ROULETTE_NUMBERS[i])]);
};

const getMarkovPrediction = (state: MarkovChainState, lastSpin: Spin | undefined): number[] => {
    if (!lastSpin) return new Array(WHEEL_SIZE).fill(0);
    return state.transitionMatrix[lastSpin.number];
};

const getHotZonePrediction = (spins: Spin[]): number[] => {
    const scores = new Array(WHEEL_SIZE).fill(0);
    const recentSpins = spins.slice(-HOT_ZONE_WINDOW);
    recentSpins.forEach(spin => {
        scores[spin.number]++;
    });
    return scores;
};

const getMomentumPrediction = (predictionState: FullPredictionState, lastSpin: Spin | undefined, nextDirection: SpinDirection): number[] => {
    // This model gives more weight to the direction-based model (AvgDist) if it's performing well.
    const avgDistScores = getAvgDistPrediction(predictionState.averageDistance, lastSpin, nextDirection);
    // Amplify the score based on the model's own accuracy
    return avgDistScores.map(s => s * (1 + predictionState.averageDistance.accuracy));
};


// --- Main Service ---

class PredictionService {
    createInitialPredictionState(): FullPredictionState {
        return {
            averageDistance: { name: MODEL_NAMES.AVG_DIST, weight: 0.25, accuracy: 0, hits: 0, spins: 0, distances: { CW: [], CCW: [] } },
            markovChain: { name: MODEL_NAMES.MARKOV, weight: 0.25, accuracy: 0, hits: 0, spins: 0, transitionMatrix: Array(WHEEL_SIZE).fill(0).map(() => Array(WHEEL_SIZE).fill(0)) },
            hotZone: { name: MODEL_NAMES.HOT_ZONE, weight: 0.25, accuracy: 0, hits: 0, spins: 0 },
            momentum: { name: MODEL_NAMES.MOMENTUM, weight: 0.25, accuracy: 0, hits: 0, spins: 0 },
        };
    }

    getHybridPrediction(state: FullPredictionState, allSpins: Spin[], nextDirection: SpinDirection) {
        const lastSpin = allSpins.length > 0 ? allSpins[allSpins.length - 1] : undefined;
        const models = [state.averageDistance, state.markovChain, state.hotZone, state.momentum];
        const rawScores = [
            getAvgDistPrediction(state.averageDistance, lastSpin, nextDirection),
            getMarkovPrediction(state.markovChain, lastSpin),
            getHotZonePrediction(allSpins),
            getMomentumPrediction(state, lastSpin, nextDirection),
        ];

        const normalizedScores = rawScores.map(normalizeScores);
        
        const finalScores = new Array(WHEEL_SIZE).fill(0);
        for (let i = 0; i < WHEEL_SIZE; i++) {
            for (let j = 0; j < models.length; j++) {
                finalScores[i] += normalizedScores[j][i] * models[j].weight;
            }
        }

        const probabilities = normalizeScores(finalScores);
        const top12 = [...probabilities]
            .map((p, i) => ({ number: i, prob: p }))
            .sort((a, b) => b.prob - a.prob)
            .slice(0, 12)
            .map(item => item.number);
            
        return { probabilities, top12 };
    }

    updateAndPredict(
        currentState: FullPredictionState,
        allSpins: Spin[],
        newSpin: Spin,
    ) {
        const lastSpin = allSpins[allSpins.length - 1];
        let updatedState = JSON.parse(JSON.stringify(currentState)) as FullPredictionState;

        // 1. Update individual model states
        // Average Distance
        if (lastSpin) {
            const dist = getDistance(lastSpin.number, newSpin.number, newSpin.direction);
            updatedState.averageDistance.distances[newSpin.direction].push(dist);
            if (updatedState.averageDistance.distances[newSpin.direction].length > AVG_DIST_WINDOW) {
                updatedState.averageDistance.distances[newSpin.direction].shift();
            }
        }
        // Markov Chain
        if (lastSpin) {
            updatedState.markovChain.transitionMatrix[lastSpin.number][newSpin.number]++;
        }

        // 2. Evaluate model performance on this spin
        const modelPredictions = {
            averageDistance: getAvgDistPrediction(currentState.averageDistance, lastSpin, newSpin.direction),
            markovChain: getMarkovPrediction(currentState.markovChain, lastSpin),
            hotZone: getHotZonePrediction(allSpins),
            momentum: getMomentumPrediction(currentState, lastSpin, newSpin.direction),
        };

        const modelKeys = Object.keys(modelPredictions) as (keyof FullPredictionState)[];
        const modelHits: { [key in keyof FullPredictionState]?: boolean } = {};
        
        modelKeys.forEach(key => {
            const scores = modelPredictions[key];
            const topPrediction = scores.indexOf(Math.max(...scores));
            if (topPrediction === newSpin.number) {
                 modelHits[key] = true;
            }
        });
        
        // 3. Update accuracies and weights
        let totalAccuracy = 0;
        modelKeys.forEach(key => {
            const model = updatedState[key];
            model.spins++;
            if (modelHits[key]) {
                model.hits++;
            }
            model.accuracy = model.spins > 0 ? model.hits / model.spins : 0;
            totalAccuracy += model.accuracy;
        });

        if (totalAccuracy > 0) {
            modelKeys.forEach(key => {
                const model = updatedState[key];
                const targetWeight = model.accuracy / totalAccuracy;
                model.weight = model.weight * (1 - LEARNING_RATE) + targetWeight * LEARNING_RATE;
            });
        }
        
        // Normalize weights to ensure they sum to 1
        const weightSum = modelKeys.reduce((sum, key) => sum + updatedState[key].weight, 0);
        if (weightSum > 0) {
             modelKeys.forEach(key => {
                updatedState[key].weight /= weightSum;
             });
        }

        return {
            updatedPredictionState: updatedState,
        };
    }
}

export const predictionService = new PredictionService();
export const createInitialPredictionState = predictionService.createInitialPredictionState;