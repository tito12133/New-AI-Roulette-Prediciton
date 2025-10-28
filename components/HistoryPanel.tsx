
import React from 'react';
import type { Spin } from '../types';

interface HistoryPanelProps {
    spins: Spin[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ spins }) => {
    const reversedSpins = [...spins].reverse();

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-cyan-400/20 flex flex-col h-96">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center flex-shrink-0">Spin History</h3>
            <div className="overflow-y-auto flex-grow">
                {reversedSpins.length === 0 ? (
                    <p className="text-gray-400 text-center mt-4">No spins recorded yet.</p>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-cyan-300 uppercase bg-gray-700/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-3 py-2">#</th>
                                <th scope="col" className="px-3 py-2">Num</th>
                                <th scope="col" className="px-3 py-2">Dir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reversedSpins.map((spin, index) => (
                                <tr key={spin.id} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}`}>
                                    <td className="px-3 py-2 text-gray-400">{spin.spinNumber}</td>
                                    <td className="px-3 py-2 font-medium text-white">{spin.number}</td>
                                    <td className="px-3 py-2 text-gray-300">{spin.direction}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
