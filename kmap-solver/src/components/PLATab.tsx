import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Types
type Literal = { varName: string, isComplement: boolean };
type Term = Literal[];

interface PLAOutput {
    name: string;
    inputType: 'Equation' | 'Minterms' | 'Maxterms';
    inputValue: string;
}

const COLORS = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

// Parsers
function parseSOP(equation: string, validVars: string[]): Term[] {
    const sortedVars = [...validVars].sort((a, b) => b.length - a.length);
    const eq = equation.replace(/\s+/g, '');
    if (!eq) return [];
    const termStrs = eq.split('+');
    return termStrs.map(tStr => {
        const literals: Term = [];
        let i = 0;
        while (i < tStr.length) {
            let matchedVar = sortedVars.find(v => tStr.startsWith(v, i));
            if (matchedVar) {
                let isComplement = false;
                i += matchedVar.length;
                if (i < tStr.length && tStr[i] === "'") {
                    isComplement = true;
                    i++;
                }
                literals.push({ varName: matchedVar, isComplement });
            } else {
                i++;
            }
        }
        return literals;
    });
}

function parsePOS(equation: string, validVars: string[]): Term[] {
    const sortedVars = [...validVars].sort((a, b) => b.length - a.length);
    const eq = equation.replace(/\s+/g, '');
    if (!eq) return [];
    const termStrs = eq.split(')(').map(s => s.replace(/\(/g, '').replace(/\)/g, ''));
    return termStrs.map(tStr => {
        const literals: Term = [];
        const litStrs = tStr.split('+');
        for (const lStr of litStrs) {
            let matchedVar = sortedVars.find(v => lStr.startsWith(v));
            if (matchedVar) {
                let isComplement = lStr.includes("'");
                literals.push({ varName: matchedVar, isComplement });
            }
        }
        return literals;
    });
}

function mintermsToSOP(minterms: number[], numVars: number, validVars: string[]): Term[] {
    return minterms.map(m => {
        const literals: Term = [];
        for (let i = 0; i < numVars; i++) {
            const isComplement = (m & (1 << (numVars - 1 - i))) === 0;
            literals.push({ varName: validVars[i], isComplement });
        }
        return literals;
    });
}

function maxtermsToPOS(maxterms: number[], numVars: number, validVars: string[]): Term[] {
    return maxterms.map(m => {
        const literals: Term = [];
        for (let i = 0; i < numVars; i++) {
            const isComplement = (m & (1 << (numVars - 1 - i))) !== 0;
            literals.push({ varName: validVars[i], isComplement });
        }
        return literals;
    });
}

export function PLATab() {
    const [plaType, setPlaType] = useState<'AND-OR' | 'OR-AND'>('AND-OR');
    const [inputVarsStr, setInputVarsStr] = useState('A, B, C');
    const [outputs, setOutputs] = useState<PLAOutput[]>([
        { name: 'F1', inputType: 'Minterms', inputValue: '0, 1, 2' },
        { name: 'F2', inputType: 'Equation', inputValue: "A'B + AC" }
    ]);

    const inputVars = useMemo(() => inputVarsStr.split(',').map(s => s.trim()).filter(s => s), [inputVarsStr]);
    const numVars = inputVars.length;

    const { allTerms } = useMemo(() => {
        const allTerms: { term: Term, termKey: string, usedBy: Set<number> }[] = [];
        const termMap = new Map<string, number>();

        outputs.forEach((out, outIdx) => {
            let terms: Term[] = [];
            try {
                if (plaType === 'AND-OR') {
                    if (out.inputType === 'Equation') {
                        terms = parseSOP(out.inputValue, inputVars);
                    } else if (out.inputType === 'Minterms') {
                        const minterms = out.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        terms = mintermsToSOP(minterms, numVars, inputVars);
                    } else if (out.inputType === 'Maxterms') {
                        const maxterms = out.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        const minterms = [];
                        for (let i=0; i<Math.pow(2, numVars); i++) {
                            if (!maxterms.includes(i)) minterms.push(i);
                        }
                        terms = mintermsToSOP(minterms, numVars, inputVars);
                    }
                } else {
                    if (out.inputType === 'Equation') {
                        terms = parsePOS(out.inputValue, inputVars);
                    } else if (out.inputType === 'Maxterms') {
                        const maxterms = out.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        terms = maxtermsToPOS(maxterms, numVars, inputVars);
                    } else if (out.inputType === 'Minterms') {
                        const minterms = out.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        const maxterms = [];
                        for (let i=0; i<Math.pow(2, numVars); i++) {
                            if (!minterms.includes(i)) maxterms.push(i);
                        }
                        terms = maxtermsToPOS(maxterms, numVars, inputVars);
                    }
                }
            } catch (e) {
                console.error("Error parsing PLA input", e);
            }

            terms.forEach(term => {
                term.sort((a, b) => inputVars.indexOf(a.varName) - inputVars.indexOf(b.varName));
                const termKey = term.map(l => `${l.isComplement ? '!' : ''}${l.varName}`).join(',');
                
                if (termMap.has(termKey)) {
                    allTerms[termMap.get(termKey)!].usedBy.add(outIdx);
                } else {
                    termMap.set(termKey, allTerms.length);
                    allTerms.push({ term, termKey, usedBy: new Set([outIdx]) });
                }
            });
        });

        return { allTerms };
    }, [plaType, inputVars, outputs, numVars]);

    // Layout constants
    const startX = 60;
    const startY = 80;
    const inputSpacing = 60;
    const lineSpacing = 20;
    const termSpacing = 40;
    const gateWidth = 30;
    const outputSpacing = 60;

    const totalWidth = startX + numVars * inputSpacing + 40 + gateWidth + 40 + outputs.length * outputSpacing + 60;
    const totalHeight = startY + allTerms.length * termSpacing + 100;

    const addOutput = () => {
        setOutputs([...outputs, { name: `F${outputs.length + 1}`, inputType: 'Equation', inputValue: '' }]);
    };

    const updateOutput = (index: number, field: keyof PLAOutput, value: string) => {
        const newOutputs = [...outputs];
        newOutputs[index] = { ...newOutputs[index], [field]: value };
        setOutputs(newOutputs);
    };

    const removeOutput = (index: number) => {
        setOutputs(outputs.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Programmable Logic Array (PLA)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PLA Type</label>
                        <select 
                            value={plaType} 
                            onChange={(e) => setPlaType(e.target.value as any)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="AND-OR">AND-OR</option>
                            <option value="OR-AND">OR-AND</option>
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {plaType === 'AND-OR' ? "For Equations, use Sum of Products (SOP) format, e.g., A'B + C" : "For Equations, use Product of Sums (POS) format, e.g., (A'+B)(C)"}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Input Variables (comma separated)</label>
                        <input 
                            type="text" 
                            value={inputVarsStr} 
                            onChange={(e) => setInputVarsStr(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            placeholder="A, B, C"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Outputs</h3>
                        <button 
                            onClick={addOutput}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                            <Plus size={16} /> Add Output
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {outputs.map((out, idx) => (
                            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                                <input 
                                    type="text" 
                                    value={out.name} 
                                    onChange={(e) => updateOutput(idx, 'name', e.target.value)}
                                    className="w-20 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-center"
                                    placeholder="Name"
                                />
                                <select 
                                    value={out.inputType} 
                                    onChange={(e) => updateOutput(idx, 'inputType', e.target.value as any)}
                                    className="w-32 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="Equation">Equation</option>
                                    <option value="Minterms">Minterms</option>
                                    <option value="Maxterms">Maxterms</option>
                                </select>
                                <input 
                                    type="text" 
                                    value={out.inputValue} 
                                    onChange={(e) => updateOutput(idx, 'inputValue', e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                                    placeholder={out.inputType === 'Equation' ? (plaType === 'AND-OR' ? "A'B + C" : "(A'+B)(C)") : "0, 1, 2"}
                                />
                                <button 
                                    onClick={() => removeOutput(idx)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    disabled={outputs.length <= 1}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 text-center">PLA Diagram</h3>
                
                <div className="flex justify-center min-w-max pb-8">
                    <svg width={totalWidth} height={totalHeight} className="text-slate-800 dark:text-slate-200">
                        {/* Input Lines */}
                        {inputVars.map((v, i) => {
                            const trueX = startX + i * inputSpacing;
                            const compX = trueX + lineSpacing;
                            const color = COLORS[i % COLORS.length];
                            
                            return (
                                <g key={`input-${i}`}>
                                    <text x={trueX + lineSpacing/2} y={startY - 45} textAnchor="middle" fill={color} className="font-mono font-bold text-lg">{v}</text>
                                    
                                    {/* Connection from label to lines */}
                                    <line x1={trueX} y1={startY - 40} x2={trueX} y2={startY - 20} stroke={color} strokeWidth="2" opacity="0.6" />
                                    <line x1={trueX} y1={startY - 30} x2={compX} y2={startY - 30} stroke={color} strokeWidth="2" opacity="0.6" />
                                    <line x1={compX} y1={startY - 30} x2={compX} y2={startY - 20} stroke={color} strokeWidth="2" opacity="0.6" />
                                    <circle cx={trueX} cy={startY - 30} r="3" fill={color} />

                                    {/* True Line */}
                                    <line x1={trueX} y1={startY - 5} x2={trueX} y2={totalHeight - 60} stroke={color} strokeWidth="2" opacity="0.6" />
                                    <path d={`M ${trueX-8} ${startY-20} L ${trueX+8} ${startY-20} L ${trueX} ${startY-5} Z`} fill="white" stroke={color} strokeWidth="2" />
                                    
                                    {/* Comp Line */}
                                    <line x1={compX} y1={startY + 1} x2={compX} y2={totalHeight - 60} stroke={color} strokeWidth="2" opacity="0.6" />
                                    <path d={`M ${compX-8} ${startY-20} L ${compX+8} ${startY-20} L ${compX} ${startY-5} Z`} fill="white" stroke={color} strokeWidth="2" />
                                    <circle cx={compX} cy={startY-2} r="3" fill="white" stroke={color} strokeWidth="2" />
                                </g>
                            );
                        })}

                        {/* Intermediate Terms */}
                        {allTerms.map((termObj, j) => {
                            const termY = startY + j * termSpacing + 20;
                            const gateX = startX + numVars * inputSpacing + 40;
                            const lineEndX = plaType === 'AND-OR' ? gateX : gateX + 10;
                            
                            return (
                                <g key={`term-${j}`}>
                                    {/* Horizontal Line */}
                                    <line x1={startX - 10} y1={termY} x2={lineEndX} y2={termY} stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                    
                                    {/* Connections */}
                                    {termObj.term.map((lit, idx) => {
                                        const vIdx = inputVars.indexOf(lit.varName);
                                        if (vIdx === -1) return null;
                                        const cx = startX + vIdx * inputSpacing + (lit.isComplement ? lineSpacing : 0);
                                        const color = COLORS[vIdx % COLORS.length];
                                        return (
                                            <circle key={`conn-${j}-${idx}`} cx={cx} cy={termY} r="4" fill={color} />
                                        );
                                    })}

                                    {/* Intermediate Gate */}
                                    <g transform={`translate(${gateX}, ${termY})`}>
                                        {plaType === 'AND-OR' ? (
                                            <path d="M 0,-15 L 15,-15 A 15,15 0 0,1 15,15 L 0,15 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                        ) : (
                                            <path d="M 0,-15 Q 20,-15 30,0 Q 20,15 0,15 Q 10,0 0,-15 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                        )}
                                    </g>

                                    {/* Line from gate to output lines */}
                                    <line x1={gateX + gateWidth} y1={termY} x2={gateX + gateWidth + 40 + outputs.length * outputSpacing} y2={termY} stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                </g>
                            );
                        })}

                        {/* Output Lines */}
                        {outputs.map((out, k) => {
                            const outX = startX + numVars * inputSpacing + 40 + gateWidth + 40 + k * outputSpacing;
                            const gateY = startY + allTerms.length * termSpacing + 40;
                            const color = COLORS[(numVars + k) % COLORS.length];
                            const lineEndY = plaType === 'AND-OR' ? gateY + 10 : gateY;

                            return (
                                <g key={`out-${k}`}>
                                    {/* Vertical Line */}
                                    <line x1={outX} y1={startY + 20} x2={outX} y2={lineEndY} stroke={color} strokeWidth="2" opacity="0.6" />
                                    
                                    {/* Connections */}
                                    {allTerms.map((termObj, j) => {
                                        if (termObj.usedBy.has(k)) {
                                            const termY = startY + j * termSpacing + 20;
                                            return <circle key={`out-conn-${k}-${j}`} cx={outX} cy={termY} r="4" fill={color} />;
                                        }
                                        return null;
                                    })}

                                    {/* Output Gate */}
                                    <g transform={`translate(${outX}, ${gateY})`}>
                                        {plaType === 'AND-OR' ? (
                                            <path d="M -15,0 Q -15,20 0,30 Q 15,20 15,0 Q 0,10 -15,0 Z" fill="none" stroke={color} strokeWidth="2" />
                                        ) : (
                                            <path d="M -15,0 L -15,15 A 15,15 0 0,0 15,15 L 15,0 Z" fill="none" stroke={color} strokeWidth="2" />
                                        )}
                                    </g>
                                    
                                    {/* Output Label */}
                                    <text x={outX} y={gateY + 50} textAnchor="middle" fill={color} className="font-mono font-bold text-lg">{out.name}</text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
