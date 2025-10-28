import React, { useState, useEffect, useCallback } from 'react';
import { RouletteWheel } from './components/RouletteWheel';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { AccuracyChart } from './components/AccuracyChart';
import { dbService, GameState } from './services/dbService';
import { predictionService, FullPredictionState, createInitialPredictionState } from './services/predictionService';
import type { Spin, SpinDirection, AccuracyData } from './types';
import { NUMBER_COLORS } from './constants';

const getNumberColorClass = (num: number) => {
    const color = NUMBER_COLORS[num];
    if (color === 'green') return 'bg-green-500 text-white shadow-lg shadow-green-500/50';
    if (color === 'red') return 'bg-red-500 text-white shadow-lg shadow-red-500/50';
    return 'bg-gray-700 text-white shadow-lg shadow-gray-900/50';
};

const PredictionPanel: React.FC<{ prediction: number[] }> = ({ prediction }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-cyan-400/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center">Next Predicted Numbers</h3>
            {prediction.length === 0 ? (
                <p className="text-gray-400 text-center animate-pulse">Enter a spin to see predictions...</p>
            ) : (
                <div className="grid grid-cols-6 gap-2 justify-items-center">
                    {prediction.map(num => (
                        <div key={num} className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg transition-all duration-300 transform hover:scale-110 ${getNumberColorClass(num)}`}>
                            {num}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [predictionState, setPredictionState] = useState<FullPredictionState>(createInitialPredictionState());
    const [isLoading, setIsLoading] = useState(true);
    const [probabilities, setProbabilities] = useState<number[]>(new Array(37).fill(1/37));

    const loadState = useCallback(async () => {
        setIsLoading(true);
        try {
            const savedState = await dbService.loadState();
            if (savedState) {
                setGameState(savedState.gameState);
                setPredictionState(savedState.predictionState);
                if (savedState.gameState.spins.length > 0) {
                   const lastSpin = savedState.gameState.spins[savedState.gameState.spins.length - 1];
                   const nextDirection = lastSpin.direction === 'CW' ? 'CCW' : 'CW';
                   const { probabilities } = predictionService.getHybridPrediction(savedState.predictionState, savedState.gameState.spins, nextDirection);
                   setProbabilities(probabilities);
                }
            } else {
                setGameState({ spins: [], lastPrediction: [], accuracyHistory: [] });
                setPredictionState(createInitialPredictionState());
            }
        } catch (error) {
            console.error("Failed to load state:", error);
            setGameState({ spins: [], lastPrediction: [], accuracyHistory: [] });
            setPredictionState(createInitialPredictionState());
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadState();
    }, [loadState]);

    const handleRecordSpin = async (number: number, direction: SpinDirection) => {
        if (gameState === null) return;

        const newSpin: Spin = {
            id: Date.now(),
            number,
            direction,
            spinNumber: gameState.spins.length + 1,
        };

        const { updatedPredictionState } = predictionService.updateAndPredict(
            predictionState,
            gameState.spins,
            newSpin
        );
        
        const isHit = gameState.lastPrediction.includes(newSpin.number);
        const totalSpins = gameState.spins.length + 1;
        const previousHits = gameState.accuracyHistory.length > 0 ? gameState.accuracyHistory[gameState.accuracyHistory.length - 1].hits : 0;
        const newHits = previousHits + (isHit ? 1 : 0);
        
        const newAccuracyEntry: AccuracyData = {
            spin: totalSpins,
            accuracy: (newHits / totalSpins) * 100,
            hits: newHits,
        };

        const nextSpinDirection = direction === 'CW' ? 'CCW' : 'CW';
        const updatedSpins = [...gameState.spins, newSpin];
        const { probabilities: nextProbabilities, top12: nextPrediction } = predictionService.getHybridPrediction(updatedPredictionState, updatedSpins, nextSpinDirection);

        const newGameState: GameState = {
            spins: updatedSpins,
            lastPrediction: nextPrediction,
            accuracyHistory: [...gameState.accuracyHistory, newAccuracyEntry],
        };

        setPredictionState(updatedPredictionState);
        setGameState(newGameState);
        setProbabilities(nextProbabilities);

        await dbService.saveState({ gameState: newGameState, predictionState: updatedPredictionState });
    };

    const handleReset = async () => {
        setIsLoading(true);
        await dbService.clearState();
        setGameState({ spins: [], lastPrediction: [], accuracyHistory: [] });
        setPredictionState(createInitialPredictionState());
        setProbabilities(new Array(37).fill(1/37));
        setIsLoading(false);
    };
    
    const allModels = predictionState ? [
        predictionState.averageDistance,
        predictionState.markovChain,
        predictionState.hotZone,
        predictionState.momentum,
    ] : [];

    const hybridAccuracy = gameState?.accuracyHistory.length ? gameState.accuracyHistory[gameState.accuracyHistory.length - 1].accuracy : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-2xl text-cyan-400">Loading Predictor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 font-mono flex flex-col items-center">
            <header className="w-full max-w-7xl text-center mb-4">
                <h1 className="text-3xl md:text-5xl font-bold text-cyan-400 tracking-wider" style={{textShadow: '0 0 10px #22d3ee'}}>
                    Ultimate Precision Roulette Predictor
                </h1>
            </header>

            <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
                    <Controls onRecordSpin={handleRecordSpin} onReset={handleReset} />
                    <PredictionPanel prediction={gameState?.lastPrediction ?? []} />
                    <StatsPanel models={allModels} hybridAccuracy={hybridAccuracy} />
                </div>

                <div className="lg:col-span-4 flex justify-center items-center order-1 lg:order-2">
                    <RouletteWheel probabilities={probabilities} />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6 order-3 lg:order-3">
                    <HistoryPanel spins={gameState?.spins ?? []} />
                    <AccuracyChart data={gameState?.accuracyHistory ?? []} />
                </div>
            </main>
        </div>
    );
};

export default App;