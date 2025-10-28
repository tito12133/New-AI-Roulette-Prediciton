
import React, { useState } from 'react';
import type { SpinDirection } from '../types';

interface ControlsProps {
    onRecordSpin: (number: number, direction: SpinDirection) => void;
    onReset: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onRecordSpin, onReset }) => {
    const [number, setNumber] = useState('');
    const [direction, setDirection] = useState<SpinDirection>('CW');

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || (/^\d+$/.test(value) && +value >= 0 && +value <= 36)) {
            setNumber(value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (number === '') return;
        onRecordSpin(parseInt(number, 10), direction);
        setNumber('');
        setDirection(prev => prev === 'CW' ? 'CCW' : 'CW');
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-cyan-400/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center">Spin Input</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="number-input" className="block text-sm font-medium text-gray-300 mb-1">Winning Number (0-36)</label>
                    <input
                        id="number-input"
                        type="number"
                        value={number}
                        onChange={handleNumberChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
                        min="0"
                        max="36"
                        required
                        placeholder="e.g. 17"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Spin Direction</label>
                    <div className="flex items-center justify-center space-x-2 bg-gray-900 p-1 rounded-lg">
                        <button type="button" onClick={() => setDirection('CW')} className={`w-full py-2 text-sm font-bold rounded-md transition-colors duration-200 ${direction === 'CW' ? 'bg-cyan-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>CW</button>
                        <button type="button" onClick={() => setDirection('CCW')} className={`w-full py-2 text-sm font-bold rounded-md transition-colors duration-200 ${direction === 'CCW' ? 'bg-cyan-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>CCW</button>
                    </div>
                </div>
                <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                    Record Spin
                </button>
            </form>
             <button onClick={onReset} className="mt-4 w-full bg-red-800/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-all duration-200">
                Reset Learning
            </button>
        </div>
    );
};
