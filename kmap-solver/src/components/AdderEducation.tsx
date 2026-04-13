import React, { useState } from 'react';
import { CustomRCASimulator } from './CustomRCASimulator';
import { DelayCalculator } from './DelayCalculator';
import { EquationRCABuilder } from './EquationRCABuilder';

export const AdderEducation: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'equation' | 'simulator' | 'delay'>('simulator');

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'equation' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('equation')}
                >
                    Equation Builder
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'simulator' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('simulator')}
                >
                    Custom RCA Simulator
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'delay' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('delay')}
                >
                    Delay Calculator
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
                {activeTab === 'equation' && (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Equation to RCA Builder</h2>
                        <EquationRCABuilder />
                    </div>
                )}
                {activeTab === 'simulator' && (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Custom RCA Simulator</h2>
                        <CustomRCASimulator />
                    </div>
                )}
                {activeTab === 'delay' && (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Propagation Delay Calculator</h2>
                        <DelayCalculator />
                    </div>
                )}
            </div>
        </div>
    );
};
