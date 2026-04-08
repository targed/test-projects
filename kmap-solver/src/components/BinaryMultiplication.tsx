import React, { useState } from 'react';

export const BinaryMultiplication: React.FC = () => {
    const [num1, setNum1] = useState('');
    const [num2, setNum2] = useState('');

    const handleNum1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNum1(e.target.value.replace(/[^01]/g, ''));
    };

    const handleNum2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNum2(e.target.value.replace(/[^01]/g, ''));
    };

    const calculateMultiplication = () => {
        if (!num1 || !num2) return null;

        const partialProducts: { value: string; shift: number; isZero: boolean }[] = [];
        
        for (let i = num2.length - 1; i >= 0; i--) {
            const bit = num2[i];
            const shift = num2.length - 1 - i;
            if (bit === '1') {
                partialProducts.push({ value: num1, shift, isZero: false });
            } else {
                partialProducts.push({ value: '0'.repeat(num1.length), shift, isZero: true });
            }
        }

        // Calculate final result using BigInt to avoid precision issues
        const n1 = BigInt('0b' + num1);
        const n2 = BigInt('0b' + num2);
        const result = (n1 * n2).toString(2);

        return { partialProducts, result };
    };

    const res = calculateMultiplication();

    // Calculate max width for formatting
    const maxWidth = res ? Math.max(num1.length, num2.length + 1, res.result.length) : 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Binary Multiplication</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Multiplicand (Binary)</label>
                        <input
                            type="text"
                            value={num1}
                            onChange={handleNum1Change}
                            placeholder="e.g. 11011"
                            maxLength={16}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Multiplier (Binary)</label>
                        <input
                            type="text"
                            value={num2}
                            onChange={handleNum2Change}
                            placeholder="e.g. 101"
                            maxLength={16}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {res && (
                    <div className="flex flex-col gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Multiplication Process</h3>
                            <div className="flex flex-col items-end font-mono text-xl w-max mx-auto">
                                {/* Num 1 */}
                                <div className="flex text-slate-800 dark:text-gray-100">
                                    {num1.padStart(maxWidth, ' ').split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b === ' ' ? '\u00A0' : b}</span>
                                    ))}
                                </div>
                                {/* Num 2 */}
                                <div className="flex text-slate-800 dark:text-gray-100 pb-2 border-b-2 border-slate-800 dark:border-gray-100">
                                    <span className="w-6 text-center mr-2">×</span>
                                    {num2.padStart(maxWidth - 1, ' ').split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b === ' ' ? '\u00A0' : b}</span>
                                    ))}
                                </div>
                                {/* Partial Products */}
                                <div className="pt-2 flex flex-col items-end">
                                    {res.partialProducts.map((pp, index) => (
                                        <div key={index} className={`flex ${pp.isZero ? 'text-slate-400 dark:text-slate-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {pp.value.split('').map((b, i) => (
                                                <span key={i} className="w-6 text-center">{b}</span>
                                            ))}
                                            {Array.from({ length: pp.shift }).map((_, i) => (
                                                <span key={`x-${i}`} className="w-6 text-center text-slate-300 dark:text-slate-600">x</span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                {/* Result */}
                                <div className="flex text-orange-600 dark:text-orange-400 pt-2 pb-1 mt-1 border-t-2 border-slate-800 dark:border-gray-100 font-bold">
                                    {res.result.padStart(maxWidth, ' ').split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b === ' ' ? '\u00A0' : b}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
