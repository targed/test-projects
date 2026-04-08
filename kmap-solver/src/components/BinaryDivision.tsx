import React, { useState } from 'react';

export const BinaryDivision: React.FC = () => {
    const [dividend, setDividend] = useState('');
    const [divisor, setDivisor] = useState('');

    const handleDividendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDividend(e.target.value.replace(/[^01]/g, ''));
    };

    const handleDivisorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDivisor(e.target.value.replace(/[^01]/g, ''));
    };

    const calculateDivision = () => {
        if (!dividend || !divisor || divisor === '0' || !divisor.includes('1')) return null;

        let current = '';
        let quotientFull = '';
        const steps: any[] = [];
        
        const cleanDivisor = divisor.replace(/^0+/, '') || '0';
        const cleanDividend = dividend.replace(/^0+/, '') || '0';

        if (cleanDivisor === '0') return null;

        for (let i = 0; i < cleanDividend.length; i++) {
            current += cleanDividend[i];
            const currentVal = BigInt('0b' + current);
            const divisorVal = BigInt('0b' + cleanDivisor);

            if (currentVal >= divisorVal) {
                quotientFull += '1';
                const remainder = (currentVal - divisorVal).toString(2);
                
                steps.push({
                    top: current,
                    bottom: cleanDivisor,
                    result: remainder,
                    endIndex: i
                });
                current = remainder === '0' ? '' : remainder;
            } else {
                quotientFull += '0';
            }
        }

        const quotient = quotientFull.replace(/^0+/, '') || '0';
        const remainder = current || '0';

        return { quotient, quotientFull, remainder, steps, cleanDividend, cleanDivisor };
    };

    const res = calculateDivision();

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Binary Division</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Dividend (Binary)</label>
                        <input
                            type="text"
                            value={dividend}
                            onChange={handleDividendChange}
                            placeholder="e.g. 101010"
                            maxLength={16}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Divisor (Binary)</label>
                        <input
                            type="text"
                            value={divisor}
                            onChange={handleDivisorChange}
                            placeholder="e.g. 110"
                            maxLength={16}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {res && (
                    <div className="flex flex-col gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Division Process</h3>
                            <div className="flex flex-col items-start font-mono text-xl w-max mx-auto">
                                {/* Quotient */}
                                <div className="flex text-orange-600 dark:text-orange-400 font-bold mb-1">
                                    {/* Spacer for divisor and | */}
                                    <div className="flex" style={{ width: `${(res.cleanDivisor.length + 2) * 1.5}rem` }}></div>
                                    {res.quotientFull.split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b === '0' && i < res.quotientFull.length - res.quotient.length ? '\u00A0' : b}</span>
                                    ))}
                                </div>
                                
                                {/* Divisor and Dividend */}
                                <div className="flex text-slate-800 dark:text-gray-100 items-center">
                                    <div className="flex text-blue-600 dark:text-blue-400 mr-2">
                                        {res.cleanDivisor.split('').map((b, i) => (
                                            <span key={i} className="w-6 text-center">{b}</span>
                                        ))}
                                    </div>
                                    <span className="w-6 text-center border-l-2 border-slate-800 dark:border-gray-100 h-8 flex items-center justify-center"></span>
                                    <div className="flex border-t-2 border-slate-800 dark:border-gray-100 pt-1">
                                        {res.cleanDividend.split('').map((b, i) => (
                                            <span key={i} className="w-6 text-center">{b}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="flex flex-col mt-2">
                                    {res.steps.map((step, index) => {
                                        const padBottom = step.endIndex - step.bottom.length + 1;
                                        const padTop = step.endIndex - step.top.length + 1;
                                        
                                        return (
                                            <div key={index} className="flex flex-col">
                                                {/* Top (brought down) - only show if it's not the first step, as first step top is just the dividend prefix */}
                                                {index > 0 && (
                                                    <div className="flex text-slate-800 dark:text-gray-100">
                                                        <div className="flex" style={{ width: `${(res.cleanDivisor.length + 2) * 1.5}rem` }}></div>
                                                        {Array.from({ length: padTop }).map((_, i) => <span key={`pad-${i}`} className="w-6"></span>)}
                                                        {step.top.split('').map((b: string, i: number) => (
                                                            <span key={i} className="w-6 text-center">{b}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Bottom (subtracted divisor) */}
                                                <div className="flex text-slate-500 dark:text-slate-400 border-b-2 border-slate-400 dark:border-slate-500 pb-1">
                                                    <div className="flex" style={{ width: `${(res.cleanDivisor.length + 2) * 1.5}rem` }}></div>
                                                    {Array.from({ length: padBottom - 1 }).map((_, i) => <span key={`pad-${i}`} className="w-6"></span>)}
                                                    <span className="w-6 text-center">-</span>
                                                    {step.bottom.split('').map((b: string, i: number) => (
                                                        <span key={i} className="w-6 text-center">{b}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Final Remainder */}
                                    <div className="flex text-orange-600 dark:text-orange-400 font-bold pt-1">
                                        <div className="flex" style={{ width: `${(res.cleanDivisor.length + 2) * 1.5}rem` }}></div>
                                        {/* Pad remainder to align with the last step's end index */}
                                        {Array.from({ length: res.cleanDividend.length - res.remainder.length }).map((_, i) => <span key={`pad-${i}`} className="w-6"></span>)}
                                        {res.remainder.split('').map((b, i) => (
                                            <span key={i} className="w-6 text-center">{b}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex flex-col gap-2 text-center">
                                <div className="text-lg">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Quotient: </span>
                                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{res.quotient}</span>
                                </div>
                                <div className="text-lg">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Remainder: </span>
                                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{res.remainder}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
