import React, { useState } from 'react';

type OperationType = 'hold' | 'reset' | 'set' | 'load' | 'shift_left' | 'shift_right' | 'roll_left' | 'roll_right' | 'toggle';

interface Operation {
    type: OperationType;
    k: number;
}

const OPERATIONS: { value: OperationType; label: string; needsK?: boolean }[] = [
    { value: 'hold', label: 'Hold' },
    { value: 'reset', label: 'Reset (All 0)' },
    { value: 'set', label: 'Set (All 1)' },
    { value: 'toggle', label: 'Toggle (Invert)' },
    { value: 'load', label: 'Parallel Load (X)' },
    { value: 'shift_left', label: 'Shift Left', needsK: true },
    { value: 'shift_right', label: 'Shift Right', needsK: true },
    { value: 'roll_left', label: 'Roll Left', needsK: true },
    { value: 'roll_right', label: 'Roll Right', needsK: true },
];

const EXPL_MAP: Record<OperationType, string> = {
    hold: "Keeps the current value unchanged. Each flip-flop is fed its own output.",
    reset: "Clears all bits to zero simultaneously.",
    set: "Sets all bits to one simultaneously.",
    toggle: "Inverts all bits. Every 0 becomes a 1, and every 1 becomes a 0.",
    load: "Loads a new parallel input vector (X) into the register.",
    shift_left: "Shifts all bits to the left. Vacated bits on the right are filled with 0s. Mathematically equivalent to multiplying by 2^k.",
    shift_right: "Shifts all bits to the right. Vacated bits on the left are filled with 0s. Mathematically equivalent to integer division by 2^k.",
    roll_left: "Shifts all bits to the left, but bits that 'fall off' the MSB end 'roll' back around to fill the vacated LSB positions.",
    roll_right: "Shifts all bits to the right, but bits that 'fall off' the LSB end 'roll' back around to fill the vacated MSB positions."
};

const getMuxInputLabel = (op: Operation, bitIndex: number, totalBits: number) => {
    switch(op.type) {
        case 'hold':
            return `Q${bitIndex}`;
        case 'reset':
            return '0';
        case 'set':
            return '1';
        case 'toggle':
            return `Q${bitIndex}'`;
        case 'load':
            return `X${bitIndex}`;
        case 'shift_left': {
            const src = bitIndex - op.k;
            return src >= 0 ? `Q${src}` : '0';
        }
        case 'shift_right': {
            const src = bitIndex + op.k;
            return src < totalBits ? `Q${src}` : '0';
        }
        case 'roll_left': {
            // ((bitIndex - k) % totalBits + totalBits) % totalBits handles negative JS modulo
            const src = ((bitIndex - op.k) % totalBits + totalBits) % totalBits;
            return `Q${src}`;
        }
        case 'roll_right': {
            const src = (bitIndex + op.k) % totalBits;
            return `Q${src}`;
        }
        default:
            return '0';
    }
};

export function RegisterTab() {
    const [numBits, setNumBits] = useState(4);
    const [operations, setOperations] = useState<Operation[]>([
        { type: 'hold', k: 1 },
        { type: 'reset', k: 1 },
        { type: 'load', k: 1 },
        { type: 'shift_left', k: 1 }
    ]);
    const [showExplanations, setShowExplanations] = useState(false);

    const handleOpChange = (index: number, field: 'type' | 'k', value: string) => {
        const newOps = [...operations];
        if (field === 'type') {
            newOps[index].type = value as OperationType;
        } else {
            newOps[index].k = Math.max(1, parseInt(value) || 1);
        }
        setOperations(newOps);
    };

    const renderExplanations = () => {
        if (!showExplanations) return null;

        const originalBits = Array.from({length: numBits}).map((_, i) => `Q${numBits - 1 - i}`).join(', ');

        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 max-h-[500px] overflow-y-auto">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Operation Explanations</h3>
                
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg mb-6 sticky top-0 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Original State:</p>
                    <p className="font-mono text-lg text-blue-600 dark:text-blue-400 font-bold">&#123; {originalBits} &#125;</p>
                </div>

                <div className="grid gap-6">
                    {operations.map((op, i) => {
                        const newBits = Array.from({length: numBits}).map((_, bitIdx) => {
                            const bit = numBits - 1 - bitIdx;
                            return getMuxInputLabel(op, bit, numBits);
                        }).join(', ');
                        
                        const s1 = (i >> 1) & 1;
                        const s0 = i & 1;

                        const opDef = OPERATIONS.find(o => o.value === op.type);

                        return (
                            <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <div className="w-24 shrink-0">
                                    <div className="font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-center font-bold">
                                        S={s1}{s0}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                                        {opDef?.label} {opDef?.needsK ? `by ${op.k}` : ''}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        {EXPL_MAP[op.type]}
                                    </p>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 overflow-x-auto">
                                        <span className="text-xs text-slate-500 mr-2 uppercase tracking-wider font-semibold">Result</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">&#123; {newBits} &#125;</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCircuit = () => {
        const SLICE_W = 140;
        const MUX_W = 80;
        const MUX_H = 60;
        const FF_W = 60;
        const FF_H = 80;
        const START_X = 50;
        const TOTAL_W = Math.max(800, numBits * SLICE_W + 100);
        const HEIGHT = 450;

        const muxY = 100;
        const S1_Y = 180;
        const S0_Y = 195;
        const ffY = 250;
        const CLK_Y = 380;

        return (
            <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-6">
                <svg width="100%" height={HEIGHT} viewBox={`0 0 ${TOTAL_W} ${HEIGHT}`} className="font-sans min-w-max">
                    <defs>
                        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="black" className="dark:fill-slate-300" />
                        </marker>
                    </defs>

                    {/* Global Select Lines */}
                    <line x1={20} y1={S1_Y} x2={TOTAL_W - 50} y2={S1_Y} stroke="#3b82f6" strokeWidth="2" className="dark:stroke-blue-400" />
                    <text x={0} y={S1_Y + 4} className="font-mono text-sm font-bold fill-blue-600 dark:fill-blue-400">S1</text>
                    
                    <line x1={20} y1={S0_Y} x2={TOTAL_W - 50} y2={S0_Y} stroke="#3b82f6" strokeWidth="2" className="dark:stroke-blue-400" />
                    <text x={0} y={S0_Y + 4} className="font-mono text-sm font-bold fill-blue-600 dark:fill-blue-400">S0</text>
                    
                    {/* Global Clock Line */}
                    <line x1={20} y1={CLK_Y} x2={TOTAL_W - 50} y2={CLK_Y} stroke="#64748b" strokeWidth="2" className="dark:stroke-slate-400" />
                    <text x={-5} y={CLK_Y + 4} className="font-mono text-sm font-bold fill-slate-600 dark:fill-slate-400">CLK</text>

                    {Array.from({length: numBits}).map((_, idx) => {
                        const bit = numBits - 1 - idx;
                        const x = START_X + idx * SLICE_W;
                        const mx = x + 30; // MUX left edge
                        const fx = mx + 10; // FF left edge

                        return (
                            <g key={bit}>
                                {/* MUX */}
                                <rect x={mx} y={muxY} width={MUX_W} height={MUX_H} fill="white" stroke="#333" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-300" />
                                <text x={mx + MUX_W/2} y={muxY + MUX_H/2 + 5} textAnchor="middle" className="font-bold fill-slate-800 dark:fill-slate-200">MUX</text>
                                <text x={mx + 5} y={muxY + MUX_H/2 - 5} className="text-[10px] fill-slate-500 font-mono rotate-90" style={{transformOrigin: `${mx+5}px ${muxY + MUX_H/2 - 5}px`}}>MSB</text>
                                <text x={mx + MUX_W - 10} y={muxY + MUX_H/2 - 5} className="text-[10px] fill-slate-500 font-mono rotate-90" style={{transformOrigin: `${mx + MUX_W - 10}px ${muxY + MUX_H/2 - 5}px`}}>LSB</text>

                                {/* MUX Inputs */}
                                {[3, 2, 1, 0].map(i => {
                                    const inX = mx + 16 + (3-i) * 16; 
                                    const label = getMuxInputLabel(operations[i], bit, numBits);
                                    
                                    return (
                                        <g key={`in-${bit}-${i}`}>
                                            {/* Wire */}
                                            <line x1={inX} y1={muxY} x2={inX} y2={muxY - 15} stroke="#333" className="dark:stroke-slate-400" strokeWidth="1.5" />
                                            {/* i3, i2... label inside/above MUX */}
                                            <text x={inX} y={muxY + 12} textAnchor="middle" className="text-[10px] font-mono fill-slate-600 dark:fill-slate-400">i{i}</text>
                                            {/* Value/Variable label */}
                                            <text x={inX} y={muxY - 25} textAnchor="middle" className="font-mono text-sm font-bold fill-violet-600 dark:fill-violet-400">
                                                {label}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Select Lines (S1, S0 to MUX) */}
                                <text x={mx + 8} y={muxY + 24} className="text-[10px] fill-slate-600 dark:fill-slate-400 font-mono">s₁</text>
                                <text x={mx + 8} y={muxY + 44} className="text-[10px] fill-slate-600 dark:fill-slate-400 font-mono">s₀</text>
                                
                                <path d={`M ${mx} ${muxY + 20} L ${mx - 15} ${muxY + 20} L ${mx - 15} ${S1_Y}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" className="dark:stroke-blue-400" />
                                <circle cx={mx - 15} cy={S1_Y} r="3" fill="#3b82f6" className="dark:fill-blue-400" />
                                
                                <path d={`M ${mx} ${muxY + 40} L ${mx - 10} ${muxY + 40} L ${mx - 10} ${S0_Y}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" className="dark:stroke-blue-400" />
                                <circle cx={mx - 10} cy={S0_Y} r="3" fill="#3b82f6" className="dark:fill-blue-400" />

                                {/* MUX Output to FF */}
                                <text x={mx + MUX_W/2} y={muxY + MUX_H - 4} textAnchor="middle" className="text-[10px] fill-slate-600 dark:fill-slate-400 font-mono">y</text>
                                <line x1={mx + MUX_W/2} y1={muxY + MUX_H} x2={mx + MUX_W/2} y2={ffY} stroke="#333" strokeWidth="2" className="dark:stroke-slate-300" markerEnd="url(#arrow)" />

                                {/* Flip Flop */}
                                <rect x={fx} y={ffY} width={FF_W} height={FF_H} fill="white" stroke="#333" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-300" />
                                <text x={fx + 12} y={ffY + 20} className="font-bold fill-slate-800 dark:fill-slate-200">D</text>
                                
                                <text x={fx + FF_W - 20} y={ffY + 30} className="font-bold fill-slate-800 dark:fill-slate-200">Q{bit}</text>
                                <text x={fx + FF_W - 20} y={ffY + 60} className="font-bold fill-slate-800 dark:fill-slate-200">Q{bit}</text>
                                {/* Overline for Q_bar */}
                                <line x1={fx + FF_W - 20} y1={ffY + 48} x2={fx + FF_W - 5} y2={ffY + 48} stroke="#333" strokeWidth="1.5" className="dark:stroke-slate-200" />

                                {/* Clock Input */}
                                <path d={`M ${fx + 10} ${ffY + FF_H} L ${fx + 20} ${ffY + FF_H - 10} L ${fx + 30} ${ffY + FF_H}`} fill="none" stroke="#333" strokeWidth="1.5" className="dark:stroke-slate-300" />
                                <line x1={fx + 20} y1={ffY + FF_H} x2={fx + 20} y2={CLK_Y} stroke="#64748b" strokeWidth="1.5" className="dark:stroke-slate-400" />
                                <circle cx={fx + 20} cy={CLK_Y} r="3" fill="#64748b" className="dark:fill-slate-400" />

                                {/* Output wires extending right */}
                                <line x1={fx + FF_W} y1={ffY + 25} x2={fx + FF_W + 15} y2={ffY + 25} stroke="#333" strokeWidth="1.5" className="dark:stroke-slate-300" />
                                <line x1={fx + FF_W} y1={ffY + 55} x2={fx + FF_W + 15} y2={ffY + 55} stroke="#333" strokeWidth="1.5" className="dark:stroke-slate-300" />
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Ring Counter / Multi-Function Register</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Number of Bits (Flip-Flops)</label>
                        <input 
                            type="number" 
                            value={numBits} 
                            onChange={(e) => setNumBits(Math.max(1, Math.min(16, parseInt(e.target.value) || 4)))}
                            className="w-32 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            min={1}
                            max={16}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={showExplanations}
                                onChange={(e) => setShowExplanations(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Show Operation Explanations
                        </label>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="p-3 text-center border-b dark:border-slate-700 border-r w-16">S₁</th>
                                <th className="p-3 text-center border-b dark:border-slate-700 w-16">S₀</th>
                                <th className="p-3 border-b dark:border-slate-700 px-6">Function</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operations.map((op, i) => {
                                const s1 = (i >> 1) & 1;
                                const s0 = i & 1;
                                const opDef = OPERATIONS.find(o => o.value === op.type);

                                return (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 text-center font-mono font-bold border-r dark:border-slate-800 text-blue-600 dark:text-blue-400">{s1}</td>
                                        <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{s0}</td>
                                        <td className="p-3 px-6">
                                            <div className="flex items-center gap-4">
                                                <select 
                                                    value={op.type}
                                                    onChange={(e) => handleOpChange(i, 'type', e.target.value)}
                                                    className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white min-w-[200px]"
                                                >
                                                    {OPERATIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                {opDef?.needsK && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">by amount:</span>
                                                        <input 
                                                            type="number" 
                                                            value={op.k}
                                                            onChange={(e) => handleOpChange(i, 'k', e.target.value)}
                                                            className="w-20 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center"
                                                            min={1}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {renderExplanations()}

            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Implementation Diagram</h3>
            {renderCircuit()}
        </div>
    );
}
