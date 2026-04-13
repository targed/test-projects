import React, { useState } from 'react';

type Term = {
    variable: string;
    shift: number;
    isNegative: boolean;
};

export const EquationRCABuilder: React.FC = () => {
    const [equation, setEquation] = useState('9X - 2Y');
    const [numBitsInput, setNumBitsInput] = useState<string>('8');
    const [wordLengthInput, setWordLengthInput] = useState<string>('5'); // e.g., X is 5 bits

    const numBits = parseInt(numBitsInput) || 0;
    const wordLength = parseInt(wordLengthInput) || 0;

    const parseEquation = (eq: string): Term[] => {
        const regex = /([+-]?)\s*(\d*)([a-zA-Z]+)/g;
        let match;
        const terms: Term[] = [];
        while ((match = regex.exec(eq)) !== null) {
            const sign = match[1] === '-' ? '-' : '+';
            const coeff = match[2] ? parseInt(match[2]) : 1;
            const variable = match[3];

            let temp = coeff;
            let shift = 0;
            while (temp > 0) {
                if (temp & 1) {
                    terms.push({
                        variable,
                        shift,
                        isNegative: sign === '-'
                    });
                }
                temp >>= 1;
                shift++;
            }
        }
        
        // Sort: positive terms first to avoid double-negative in first row if possible
        return terms.sort((a, b) => (a.isNegative === b.isNegative ? 0 : a.isNegative ? 1 : -1));
    };

    const terms = parseEquation(equation);
    const numRows = Math.max(1, terms.length - 1);

    const isGridValid = numBits > 0 && wordLength > 0;

    const getWireLabel = (term: Term, bitIndex: number) => {
        const actualBit = bitIndex - term.shift;
        if (actualBit < 0 || actualBit >= wordLength) return '0';
        return `${term.variable.toLowerCase()}${actualBit}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 items-center">
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Equation</label>
                    <input 
                        type="text" 
                        value={equation} 
                        onChange={(e) => setEquation(e.target.value)}
                        placeholder="e.g. 9X - 2Y"
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-48"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">RCA Bits</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={16} 
                        value={numBitsInput} 
                        onChange={(e) => setNumBitsInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-24"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Word Length (Vars)</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={16} 
                        value={wordLengthInput} 
                        onChange={(e) => setWordLengthInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-32"
                    />
                </div>
            </div>

            {isGridValid && terms.length > 0 ? (
                <div className="overflow-x-auto p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col items-center" style={{ minWidth: 'max-content' }}>
                        {Array.from({ length: numRows }).map((_, r) => {
                            const termB = terms[r + 1];
                            const termA = r === 0 ? terms[0] : null;
                            
                            // Determine Cin for this row
                            let cin = '0';
                            if (r === 0 && termA?.isNegative && termB?.isNegative) {
                                cin = 'Error: Need 2 Cins'; // Edge case
                            } else if (r === 0 && termA?.isNegative) {
                                cin = '1';
                            } else if (termB?.isNegative) {
                                cin = '1';
                            }

                            return (
                                <div key={r} className="flex relative mb-16">
                                    {/* Carry Out from MSB */}
                                    <div className="flex flex-col items-center justify-center mr-4 relative">
                                        <div className="text-xs font-mono text-orange-500 font-bold mb-1">Cout</div>
                                        <div className="h-0.5 w-4 bg-slate-400 absolute left-8 top-1/2"></div>
                                    </div>

                                    {/* Full Adders */}
                                    {Array.from({ length: numBits }).map((_, c) => {
                                        const bitIndex = numBits - 1 - c; // MSB is left (c=0), LSB is right (c=numBits-1)
                                        
                                        let aLabel = '';
                                        let aInvert = false;
                                        if (r === 0 && termA) {
                                            aLabel = getWireLabel(termA, bitIndex);
                                            aInvert = termA.isNegative;
                                        }

                                        let bLabel = '';
                                        let bInvert = false;
                                        if (termB) {
                                            bLabel = getWireLabel(termB, bitIndex);
                                            bInvert = termB.isNegative;
                                        }

                                        return (
                                            <div key={c} className="flex flex-col items-center relative mx-4">
                                                {/* Inputs A and B */}
                                                <div className="flex gap-4 mb-4">
                                                    {/* Input A */}
                                                    <div className="flex flex-col items-center">
                                                        {r === 0 ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{aLabel}</span>
                                                                {aInvert && (
                                                                    <div className="w-4 h-4 rounded-full border-2 border-slate-800 dark:border-slate-200 mt-1 flex items-center justify-center bg-white dark:bg-slate-800 z-10"></div>
                                                                )}
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
                                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{bLabel}</span>
                                                        {bInvert && (
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-800 dark:border-slate-200 mt-1 flex items-center justify-center bg-white dark:bg-slate-800 z-10"></div>
                                                        )}
                                                        <div className="w-0.5 h-8 bg-slate-800 dark:bg-slate-200"></div>
                                                    </div>
                                                </div>

                                                {/* FA Box */}
                                                <div className="w-24 h-20 border-2 border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-lg relative z-10">
                                                    FA
                                                </div>

                                                {/* Carry In wire from right */}
                                                {c < numBits - 1 && (
                                                    <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-400 flex items-center justify-center"></div>
                                                )}

                                                {/* Sum Output */}
                                                <div className="flex gap-4 w-24">
                                                    <div className="flex flex-col items-center w-10">
                                                        <div className="w-0.5 h-8 bg-blue-500"></div>
                                                        {r === numRows - 1 && (
                                                            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                                Z{bitIndex}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-10"></div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Carry In for LSB */}
                                    <div className="flex flex-col items-center justify-center ml-4 relative">
                                        <div className="text-xs font-mono text-slate-500 font-bold mb-1">Cin</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-gray-100">
                                            {cin}
                                        </div>
                                        <div className="h-0.5 w-4 bg-slate-400 absolute right-8 top-1/2"></div>
                                    </div>
                                    
                                    {/* Row Label */}
                                    <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-500 w-24">
                                        {r === 0 && termA ? `+ ${termA.shift > 0 ? 2**termA.shift : ''}${termA.variable}` : ''}
                                        <br/>
                                        {termB ? `${termB.isNegative ? '-' : '+'} ${termB.shift > 0 ? 2**termB.shift : ''}${termB.variable}` : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : !isGridValid ? null : (
                <div className="p-4 text-red-500">Could not parse equation. Please use format like "9X - 2Y".</div>
            )}
        </div>
    );
};
