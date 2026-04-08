import React, { useState } from 'react';

export const BinaryAddition: React.FC = () => {
    const [num1, setNum1] = useState('');
    const [num2, setNum2] = useState('');
    const [isSigned, setIsSigned] = useState(false);
    const [bitWidth, setBitWidth] = useState<number>(8);

    const handleNum1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNum1(e.target.value.replace(/[^01]/g, ''));
    };

    const handleNum2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNum2(e.target.value.replace(/[^01]/g, ''));
    };

    const calculateAddition = () => {
        if (!num1 && !num2) return null;

        const pad1 = num1 || '0';
        const pad2 = num2 || '0';

        // Pad to bitWidth
        const n1 = pad1.padStart(bitWidth, isSigned && pad1[0] === '1' ? '1' : '0').slice(-bitWidth);
        const n2 = pad2.padStart(bitWidth, isSigned && pad2[0] === '1' ? '1' : '0').slice(-bitWidth);

        let carry = 0;
        let result = '';
        let carries = '';

        for (let i = bitWidth - 1; i >= 0; i--) {
            const bit1 = parseInt(n1[i]);
            const bit2 = parseInt(n2[i]);
            const sum = bit1 + bit2 + carry;
            
            result = (sum % 2).toString() + result;
            carries = carry.toString() + carries;
            carry = Math.floor(sum / 2);
        }
        
        const carryOut = carry;
        const carryInToMSB = parseInt(carries[0]);
        
        const CF = carryOut === 1;
        const OF = carryOut !== carryInToMSB;
        const ZF = result.split('').every(b => b === '0');
        const SF = result[0] === '1';
        
        const lowestByte = result.slice(-8);
        const onesCount = lowestByte.split('').filter(b => b === '1').length;
        const PF = onesCount % 2 === 0;

        return { n1, n2, result, carries, carryOut, CF, OF, ZF, SF, PF };
    };

    const res = calculateAddition();

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Binary Addition & Flags</h2>
            
            <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Type:</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input 
                            type="radio" 
                            checked={!isSigned} 
                            onChange={() => setIsSigned(false)} 
                            className="accent-blue-500"
                        />
                        Unsigned
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input 
                            type="radio" 
                            checked={isSigned} 
                            onChange={() => setIsSigned(true)} 
                            className="accent-blue-500"
                        />
                        Signed (2's Comp)
                    </label>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bit Width:</span>
                    <select 
                        value={bitWidth} 
                        onChange={(e) => setBitWidth(Number(e.target.value))}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-100 outline-none"
                    >
                        <option value={4}>4-bit</option>
                        <option value={8}>8-bit</option>
                        <option value={16}>16-bit</option>
                        <option value={32}>32-bit</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Number 1 (Binary)</label>
                        <input
                            type="text"
                            value={num1}
                            onChange={handleNum1Change}
                            placeholder="e.g. 1010"
                            maxLength={bitWidth}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Number 2 (Binary)</label>
                        <input
                            type="text"
                            value={num2}
                            onChange={handleNum2Change}
                            placeholder="e.g. 0110"
                            maxLength={bitWidth}
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {res && (
                    <div className="flex flex-col gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Addition Process</h3>
                            <div className="flex flex-col items-center font-mono text-xl">
                                {/* Carries */}
                                <div className="flex text-sm text-orange-500 dark:text-orange-400 h-6 mb-1">
                                    <span className="w-8"></span> {/* Padding for operator */}
                                    <span className="w-6 text-center">{res.carryOut > 0 ? res.carryOut : ''}</span>
                                    {res.carries.split('').map((c, i) => (
                                        <span key={i} className="w-6 text-center">
                                            {c === '1' ? (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-orange-500 dark:border-orange-400">1</span>
                                            ) : '\u00A0'}
                                        </span>
                                    ))}
                                </div>
                                {/* Num 1 */}
                                <div className="flex text-slate-800 dark:text-gray-100">
                                    <span className="w-8"></span>
                                    <span className="w-6"></span>
                                    {res.n1.split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b}</span>
                                    ))}
                                </div>
                                {/* Num 2 */}
                                <div className="flex text-slate-800 dark:text-gray-100 pb-2 border-b-2 border-slate-800 dark:border-gray-100">
                                    <span className="w-8 text-center">+</span>
                                    <span className="w-6"></span>
                                    {res.n2.split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b}</span>
                                    ))}
                                </div>
                                {/* Result */}
                                <div className="flex text-blue-600 dark:text-blue-400 pt-2 font-bold">
                                    <span className="w-8"></span>
                                    <span className="w-6 text-center text-orange-500 dark:text-orange-400">{res.carryOut > 0 && !isSigned ? res.carryOut : '\u00A0'}</span>
                                    {res.result.split('').map((b, i) => (
                                        <span key={i} className="w-6 text-center">{b}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Status Flags</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${res.CF ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-gray-100">CF (Carry)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Unsigned overflow</div>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${res.CF ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>{res.CF ? '1' : '0'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${res.OF ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-gray-100">OF (Overflow)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Signed overflow</div>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${res.OF ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>{res.OF ? '1' : '0'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${res.ZF ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-gray-100">ZF (Zero)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Result is zero</div>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${res.ZF ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{res.ZF ? '1' : '0'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${res.SF ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-gray-100">SF (Sign)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Result is negative</div>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${res.SF ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{res.SF ? '1' : '0'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border flex items-center justify-between ${res.PF ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-gray-100">PF (Parity)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Even 1s in lowest byte</div>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${res.PF ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{res.PF ? '1' : '0'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
