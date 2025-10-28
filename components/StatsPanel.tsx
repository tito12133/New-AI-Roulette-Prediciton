
import React from 'react';

interface ModelStat {
    name: string;
    accuracy: number;
    weight: number;
}

interface StatsPanelProps {
    models: ModelStat[];
    hybridAccuracy: number;
}

const StatBar: React.FC<{ value: number; color: string; }> = ({ value, color }) => (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ models, hybridAccuracy }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-cyan-400/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center">Model Performance</h3>
            <div className="space-y-4">
                {models.map(model => (
                    <div key={model.name}>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-medium text-gray-300">{model.name}</span>
                            <span className="text-xs font-semibold text-cyan-300">{(model.accuracy * 100).toFixed(1)}% Acc</span>
                        </div>
                        <StatBar value={model.weight * 100} color="bg-cyan-500" />
                        <div className="text-right text-xs text-gray-400 mt-1">Weight: {(model.weight * 100).toFixed(1)}%</div>
                    </div>
                ))}
                <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-md font-bold text-green-400">Hybrid Model</span>
                        <span className="text-sm font-semibold text-green-300">{hybridAccuracy.toFixed(1)}% Acc</span>
                    </div>
                    <StatBar value={hybridAccuracy} color="bg-green-500" />
                </div>
            </div>
        </div>
    );
};
