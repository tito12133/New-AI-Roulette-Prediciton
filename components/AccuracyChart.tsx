
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AccuracyData } from '../types';

interface AccuracyChartProps {
    data: AccuracyData[];
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ data }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-cyan-400/20 h-64">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center">Hybrid Model Accuracy</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="spin" stroke="#a0aec0" label={{ value: 'Spin', position: 'insideBottom', offset: -15, fill: '#a0aec0' }}/>
                    <YAxis stroke="#a0aec0" unit="%" domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                            borderColor: '#22d3ee',
                            color: '#e2e8f0'
                        }} 
                        itemStyle={{ color: '#67e8f9' }}
                    />
                    <Legend wrapperStyle={{ color: '#a0aec0' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#67e8f9' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
