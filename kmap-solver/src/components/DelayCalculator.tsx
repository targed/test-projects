import React, { useState } from 'react';

export const DelayCalculator: React.FC = () => {
    const [numRowsInput, setNumRowsInput] = useState<string>('2');
    const [numColsInput, setNumColsInput] = useState<string>('4');
    const [sumDelayInput, setSumDelayInput] = useState<string>('2');
    const [carryDelayInput, setCarryDelayInput] = useState<string>('1.5');

    const numRows = parseInt(numRowsInput) || 0;
    const numCols = parseInt(numColsInput) || 0;
    const sumDelay = parseFloat(sumDelayInput) || 0;
    const carryDelay = parseFloat(carryDelayInput) || 0;

    // Calculate delays
    const calculateDelays = () => {
        const delays: any[][] = [];
        for (let r = 0; r < numRows; r++) {
            delays[r] = [];
            for (let c = numCols - 1; c >= 0; c--) {
                // Inputs to FA
                let aDelay = 0;
                let bDelay = 0;
                let cinDelay = 0;

                if (r > 0) {
                    aDelay = delays[r - 1][c].sumDelay;
                }
                
                if (c < numCols - 1) {
                    cinDelay = delays[r][c + 1].coutDelay;
                }

                // FA calculates Sum and Cout based on when ALL inputs are ready
                const inputsReadyTime = Math.max(aDelay, bDelay, cinDelay);
                
                const currentSumDelay = inputsReadyTime + sumDelay;
                const currentCoutDelay = inputsReadyTime + carryDelay;

                delays[r][c] = {
                    aDelay,
                    bDelay,
                    cinDelay,
                    sumDelay: currentSumDelay,
                    coutDelay: currentCoutDelay,
                    inputsReadyTime
                };
            }
        }
        return delays;
    };

    const isGridValid = numRows > 0 && numCols > 0;
    const delays = isGridValid ? calculateDelays() : null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 items-center">
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Number of Rows</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={5} 
                        value={numRowsInput} 
                        onChange={(e) => setNumRowsInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-24"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Bits per Row</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={16} 
                        value={numColsInput} 
                        onChange={(e) => setNumColsInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-24"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Sum Delay (ns)</label>
                    <input 
                        type="number" 
                        step="0.1"
                        min={0} 
                        value={sumDelayInput} 
                        onChange={(e) => setSumDelayInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-32"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Carry Delay (ns)</label>
                    <input 
                        type="number" 
                        step="0.1"
                        min={0} 
                        value={carryDelayInput} 
                        onChange={(e) => setCarryDelayInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-32"
                    />
                </div>
            </div>

            {delays && (
                <div className="overflow-x-auto p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col items-center" style={{ minWidth: 'max-content' }}>
                        {Array.from({ length: numRows }).map((_, r) => (
                        <div key={r} className="flex relative mb-16">
                            {/* Carry Out from MSB */}
                            <div className="flex flex-col items-center justify-center mr-4 relative">
                                <div className="text-xs font-mono text-orange-500 font-bold mb-1">Cout</div>
                                <div className="text-sm font-bold text-slate-800 dark:text-gray-100">
                                    {delays[r][0].coutDelay}ns
                                </div>
                                <div className="h-0.5 w-4 bg-slate-400 absolute left-8 top-1/2"></div>
                            </div>

                            {/* Full Adders */}
                            {Array.from({ length: numCols }).map((_, c) => (
                                <div key={c} className="flex flex-col items-center relative mx-4">
                                    {/* Inputs A and B */}
                                    <div className="flex gap-4 mb-4">
                                        {/* Input A */}
                                        <div className="flex flex-col items-center">
                                            {r === 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-mono text-slate-500">a{c}</span>
                                                    <div className="w-0.5 h-8 bg-slate-800 dark:bg-slate-200"></div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center h-full justify-end">
                                                    <div className="w-0.5 h-8 bg-blue-500"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input B */}
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs font-mono text-slate-500">b{c}</span>
                                            <div className="w-0.5 h-8 bg-slate-800 dark:bg-slate-200"></div>
                                        </div>
                                    </div>

                                    {/* FA Box */}
                                    <div className="w-24 h-20 border-2 border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-800 flex flex-col items-center justify-center font-bold text-lg relative z-10">
                                        FA
                                        <div className="text-xs font-normal text-slate-500 mt-1">
                                            Max In: {delays[r][c].inputsReadyTime}ns
                                        </div>
                                    </div>

                                    {/* Carry In wire from right */}
                                    {c < numCols - 1 && (
                                        <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-400 flex items-center justify-center">
                                            <span className="absolute -top-4 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-1">
                                                {delays[r][c].cinDelay}ns
                                            </span>
                                        </div>
                                    )}

                                    {/* Sum Output */}
                                    <div className="flex gap-4 w-24">
                                        <div className="flex flex-col items-center w-10">
                                            <div className="w-0.5 h-8 bg-blue-500"></div>
                                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                {delays[r][c].sumDelay}ns
                                            </div>
                                            {r === numRows - 1 && (
                                                <div className="text-xs font-mono text-slate-500 mt-1">s{c}</div>
                                            )}
                                        </div>
                                        <div className="w-10"></div>
                                    </div>
                                </div>
                            ))}

                            {/* Carry In for LSB */}
                            <div className="flex flex-col items-center justify-center ml-4 relative">
                                <div className="text-xs font-mono text-slate-500 font-bold mb-1">Cin</div>
                                <div className="text-sm font-bold text-slate-800 dark:text-gray-100">
                                    0ns
                                </div>
                                <div className="h-0.5 w-4 bg-slate-400 absolute right-8 top-1/2"></div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                <h4 className="font-bold mb-2">Delay Equations (Single Row)</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Longest time for Sum = <code>Sum Time + (Number of FAs - 1) * Carry Time</code></li>
                    <li>Longest time for Carry Out = <code>Carry Time * Number of FAs</code></li>
                </ul>
                <p className="mt-2 text-sm opacity-80">
                    Note: For multiple rows, the delay propagates downwards. A Full Adder waits for all inputs (A, B, Cin) to be ready before calculating its outputs.
                </p>
            </div>
        </div>
    );
};
