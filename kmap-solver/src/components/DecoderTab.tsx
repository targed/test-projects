import React, { useState, useMemo } from 'react';

type InputType = 'equation' | 'minterms' | 'maxterms';
type GateType = 'OR' | 'NOR' | 'AND' | 'NAND';

interface OutputConfig {
    id: string;
    name: string;
    inputType: InputType;
    inputValue: string;
    gateType: GateType;
    color: string;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function DecoderTab() {
    const [inputVarsStr, setInputVarsStr] = useState('A, B, C');
    const [decoderType, setDecoderType] = useState<'active-high' | 'active-low'>('active-high');
    const [useMultipleDecoders, setUseMultipleDecoders] = useState(false);
    const [outputs, setOutputs] = useState<OutputConfig[]>([
        {
            id: '1',
            name: 'F1',
            inputType: 'minterms',
            inputValue: '0, 1, 3',
            gateType: 'OR',
            color: COLORS[0]
        }
    ]);

    const validVars = useMemo(() => {
        return inputVarsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }, [inputVarsStr]);

    const numVars = validVars.length;

    const addOutput = () => {
        const newId = Math.random().toString(36).substring(2, 9);
        setOutputs([...outputs, {
            id: newId,
            name: `F${outputs.length + 1}`,
            inputType: 'minterms',
            inputValue: '',
            gateType: decoderType === 'active-high' ? 'OR' : 'NAND',
            color: COLORS[outputs.length % COLORS.length]
        }]);
    };

    const removeOutput = (id: string) => {
        setOutputs(outputs.filter(o => o.id !== id));
    };

    const updateOutput = (id: string, field: keyof OutputConfig, value: any) => {
        setOutputs(outputs.map(o => o.id === id ? { ...o, [field]: value } : o));
    };

    // Evaluate equation to get minterms
    const evaluateEquation = (eq: string, vars: string[]): number[] => {
        if (!eq.trim()) return [];
        const minterms: number[] = [];
        const numCombinations = Math.pow(2, vars.length);
        
        // Very basic evaluator for SOP/POS
        // To be safe and simple, we can just replace vars with 0/1 and use eval, but we need to handle NOT (')
        for (let i = 0; i < numCombinations; i++) {
            let expr = eq;
            // Replace variables with their boolean values
            // Sort variables by length descending to avoid partial matches
            const sortedVars = [...vars].sort((a, b) => b.length - a.length);
            
            let currentExpr = expr;
            for (let vIdx = 0; vIdx < sortedVars.length; vIdx++) {
                const v = sortedVars[vIdx];
                const val = (i & (1 << (vars.length - 1 - vars.indexOf(v)))) ? 1 : 0;
                // Replace variable not followed by '
                const regex = new RegExp(`\\b${v}\\b(?!')`, 'g');
                currentExpr = currentExpr.replace(regex, val.toString());
                
                // Replace variable followed by '
                const regexNot = new RegExp(`\\b${v}'`, 'g');
                currentExpr = currentExpr.replace(regexNot, (1 - val).toString());
            }
            
            // Now we have an expression with 0, 1, +, (, )
            // Replace + with ||, and implicit ANDs with &&
            // This is a bit tricky. Let's just do a simple replacement for standard boolean expressions.
            currentExpr = currentExpr.replace(/\s+/g, '');
            // Insert && between adjacent terms like ) ( or 1 0 or 1 (
            currentExpr = currentExpr.replace(/\)(?=\()/g, ')&&(');
            currentExpr = currentExpr.replace(/([01])(?=\()/g, '$1&&');
            currentExpr = currentExpr.replace(/\)(?=[01])/g, ')&&');
            currentExpr = currentExpr.replace(/([01])(?=[01])/g, '$1&&$2'); // This might need multiple passes, but usually variables are separated
            // Wait, standard SOP is like AB + C. After replacement: 10 + 1.
            // Let's just insert && between any two 0/1s
            let prevExpr = "";
            while (prevExpr !== currentExpr) {
                prevExpr = currentExpr;
                currentExpr = currentExpr.replace(/([01])([01])/g, '$1&&$2');
            }
            currentExpr = currentExpr.replace(/\+/g, '||');
            
            try {
                // eslint-disable-next-line no-eval
                if (eval(currentExpr)) {
                    minterms.push(i);
                }
            } catch (e) {
                // Ignore invalid expressions
            }
        }
        return minterms;
    };

    const getMinterms = (output: OutputConfig): number[] => {
        if (output.inputType === 'minterms') {
            return output.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        } else if (output.inputType === 'maxterms') {
            const maxterms = output.inputValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            const all = Array.from({length: Math.pow(2, numVars)}, (_, i) => i);
            return all.filter(n => !maxterms.includes(n));
        } else {
            return evaluateEquation(output.inputValue, validVars);
        }
    };

    const handleDecoderTypeChange = (type: 'active-high' | 'active-low') => {
        setDecoderType(type);
        // Update gate types to valid ones
        setOutputs(outputs.map(o => ({
            ...o,
            gateType: type === 'active-high' 
                ? (o.gateType === 'OR' || o.gateType === 'NOR' ? o.gateType : 'OR')
                : (o.gateType === 'AND' || o.gateType === 'NAND' ? o.gateType : 'NAND')
        })));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Decoder Implementation</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Decoder Type</label>
                        <select 
                            value={decoderType} 
                            onChange={(e) => handleDecoderTypeChange(e.target.value as any)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="active-high">Active High</option>
                            <option value="active-low">Active Low</option>
                        </select>
                    </div>
                    <div className="flex items-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                            <input 
                                type="checkbox" 
                                checked={useMultipleDecoders}
                                onChange={(e) => setUseMultipleDecoders(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Use Multiple Smaller Decoders
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Outputs</h3>
                        <button 
                            onClick={addOutput}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                            + Add Output
                        </button>
                    </div>
                    
                    {outputs.map((output, idx) => (
                        <div key={output.id} className="flex gap-4 items-start bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: output.color }}>
                                {idx + 1}
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={output.name} 
                                        onChange={(e) => updateOutput(output.id, 'name', e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Input Type</label>
                                    <select 
                                        value={output.inputType} 
                                        onChange={(e) => updateOutput(output.id, 'inputType', e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="minterms">Minterms</option>
                                        <option value="maxterms">Maxterms</option>
                                        <option value="equation">Equation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Value</label>
                                    <input 
                                        type="text" 
                                        value={output.inputValue} 
                                        onChange={(e) => updateOutput(output.id, 'inputValue', e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder={output.inputType === 'equation' ? "A'B + C" : "0, 1, 2"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Gate Type</label>
                                    <select 
                                        value={output.gateType} 
                                        onChange={(e) => updateOutput(output.id, 'gateType', e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        {decoderType === 'active-high' ? (
                                            <>
                                                <option value="OR">OR</option>
                                                <option value="NOR">NOR</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="AND">AND</option>
                                                <option value="NAND">NAND</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => removeOutput(output.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                disabled={outputs.length === 1}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <DecoderDiagram 
                    validVars={validVars} 
                    decoderType={decoderType} 
                    useMultipleDecoders={useMultipleDecoders}
                    outputs={outputs.map(o => ({
                        ...o,
                        minterms: getMinterms(o)
                    }))}
                />
            </div>
        </div>
    );
}

function DecoderDiagram({ 
    validVars, 
    decoderType, 
    useMultipleDecoders, 
    outputs 
}: { 
    validVars: string[], 
    decoderType: 'active-high' | 'active-low',
    useMultipleDecoders: boolean,
    outputs: (OutputConfig & { minterms: number[] })[]
}) {
    const numVars = validVars.length;
    if (numVars === 0) return <div className="text-center text-slate-500">Please enter input variables.</div>;
    if (numVars > 5) return <div className="text-center text-slate-500">Maximum 5 variables supported for visualization.</div>;

    // Calculate dimensions
    const numOutputs = Math.pow(2, numVars);
    
    // If using multiple decoders, we split the MSB
    const useMultiple = useMultipleDecoders && numVars > 1;
    const numDecoders = useMultiple ? 2 : 1;
    const varsPerDecoder = useMultiple ? numVars - 1 : numVars;
    const outputsPerDecoder = Math.pow(2, varsPerDecoder);
    
    const decoderWidth = 120;
    const decoderHeight = Math.max(200, outputsPerDecoder * 30 + 40);
    const decoderSpacing = 40;
    
    const totalDecoderHeight = numDecoders * decoderHeight + (numDecoders - 1) * decoderSpacing;
    
    const startX = 150;
    const startY = 50;
    
    const svgWidth = Math.max(800, startX + decoderWidth + 400);
    const svgHeight = Math.max(600, startY + totalDecoderHeight + 100);

    return (
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="font-sans">
            <defs>
                {/* Gate definitions */}
                <g id="gate-OR">
                    <path d="M 0,0 Q 15,0 30,15 Q 15,30 0,30 Q 10,15 0,0 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                </g>
                <g id="gate-NOR">
                    <path d="M 0,0 Q 15,0 30,15 Q 15,30 0,30 Q 10,15 0,0 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="34" cy="15" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                </g>
                <g id="gate-AND">
                    <path d="M 0,0 L 15,0 A 15 15 0 0 1 15,30 L 0,30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                </g>
                <g id="gate-NAND">
                    <path d="M 0,0 L 15,0 A 15 15 0 0 1 15,30 L 0,30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="34" cy="15" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                </g>
                <g id="gate-NOT">
                    <path d="M 0,0 L 20,10 L 0,20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                </g>
            </defs>

            {/* Draw Decoders */}
            {Array.from({ length: numDecoders }).map((_, dIdx) => {
                const decY = startY + dIdx * (decoderHeight + decoderSpacing);
                
                return (
                    <g key={`decoder-${dIdx}`}>
                        {/* Decoder Box */}
                        <rect 
                            x={startX} 
                            y={decY} 
                            width={decoderWidth} 
                            height={decoderHeight} 
                            fill="white" 
                            stroke="#334155" 
                            strokeWidth="2" 
                            className="dark:fill-slate-800 dark:stroke-slate-400"
                        />
                        <text 
                            x={startX + decoderWidth / 2} 
                            y={decY + decoderHeight / 2} 
                            textAnchor="middle" 
                            transform={`rotate(-90, ${startX + decoderWidth / 2}, ${decY + decoderHeight / 2})`}
                            className="fill-slate-400 dark:fill-slate-500 font-semibold text-lg"
                        >
                            {varsPerDecoder}x{outputsPerDecoder} Decoder
                        </text>

                        {/* Inputs to Decoder */}
                        {Array.from({ length: varsPerDecoder }).map((_, i) => {
                            const varIdx = useMultiple ? i + 1 : i;
                            const inY = decY + 40 + i * 30;
                            return (
                                <g key={`in-${i}`}>
                                    <line x1={startX - 40} y1={inY} x2={startX} y2={inY} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                                    <text x={startX - 45} y={inY + 5} textAnchor="end" className="fill-slate-700 dark:fill-slate-300 font-mono">{validVars[varIdx]}</text>
                                    <text x={startX + 10} y={inY + 5} className="fill-slate-500 dark:fill-slate-400 font-mono text-xs">I{varsPerDecoder - 1 - i}</text>
                                </g>
                            );
                        })}

                        {/* Enable pin if multiple */}
                        {useMultiple && (
                            <g>
                                <line x1={startX - 40} y1={decY + decoderHeight - 20} x2={startX} y2={decY + decoderHeight - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                                <text x={startX + 10} y={decY + decoderHeight - 15} className="fill-slate-500 dark:fill-slate-400 font-mono text-xs">EN</text>
                                {decoderType === 'active-low' && (
                                    <circle cx={startX} cy={decY + decoderHeight - 20} r="4" fill="white" stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400 dark:fill-slate-800" />
                                )}
                            </g>
                        )}

                        {/* Outputs from Decoder */}
                        {Array.from({ length: outputsPerDecoder }).map((_, i) => {
                            const outY = decY + 30 + i * ((decoderHeight - 60) / Math.max(1, outputsPerDecoder - 1));
                            const globalMinterm = useMultiple ? (dIdx * outputsPerDecoder + i) : i;
                            return (
                                <g key={`out-${i}`}>
                                    <line x1={startX + decoderWidth} y1={outY} x2={startX + decoderWidth + 40} y2={outY} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                                    <text x={startX + decoderWidth - 10} y={outY + 4} textAnchor="end" className="fill-slate-500 dark:fill-slate-400 font-mono text-xs">Y{i}</text>
                                    <text x={startX + decoderWidth + 45} y={outY + 4} className="fill-slate-400 dark:fill-slate-500 font-mono text-xs">m{globalMinterm}</text>
                                    {decoderType === 'active-low' && (
                                        <circle cx={startX + decoderWidth} cy={outY} r="4" fill="white" stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400 dark:fill-slate-800" />
                                    )}
                                </g>
                            );
                        })}
                    </g>
                );
            })}

            {/* MSB Input wiring if multiple decoders */}
            {useMultiple && (
                <g>
                    <text x={startX - 100} y={startY + decoderHeight - 15} textAnchor="end" className="fill-slate-700 dark:fill-slate-300 font-mono font-bold">{validVars[0]}</text>
                    
                    {/* Line to first decoder EN */}
                    {decoderType === 'active-high' ? (
                        <>
                            <line x1={startX - 90} y1={startY + decoderHeight - 20} x2={startX - 65} y2={startY + decoderHeight - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                            <use href="#gate-NOT" x={startX - 65} y={startY + decoderHeight - 30} className="stroke-slate-700 dark:stroke-slate-300" />
                            <line x1={startX - 37} y1={startY + decoderHeight - 20} x2={startX - 40} y2={startY + decoderHeight - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                        </>
                    ) : (
                        <line x1={startX - 90} y1={startY + decoderHeight - 20} x2={startX - 40} y2={startY + decoderHeight - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                    )}
                    
                    {/* Line down to second decoder EN */}
                    <line x1={startX - 70} y1={startY + decoderHeight - 20} x2={startX - 70} y2={startY + 2 * decoderHeight + decoderSpacing - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                    <circle cx={startX - 70} cy={startY + decoderHeight - 20} r="3" fill="#334155" className="dark:fill-slate-400" />
                    
                    {/* NOT gate for second decoder (or first, depending on active high/low) */}
                    {decoderType === 'active-high' ? (
                        <line x1={startX - 70} y1={startY + 2 * decoderHeight + decoderSpacing - 20} x2={startX - 40} y2={startY + 2 * decoderHeight + decoderSpacing - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                    ) : (
                        <>
                            <line x1={startX - 70} y1={startY + 2 * decoderHeight + decoderSpacing - 20} x2={startX - 65} y2={startY + 2 * decoderHeight + decoderSpacing - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                            <use href="#gate-NOT" x={startX - 65} y={startY + 2 * decoderHeight + decoderSpacing - 30} className="stroke-slate-700 dark:stroke-slate-300" />
                            <line x1={startX - 37} y1={startY + 2 * decoderHeight + decoderSpacing - 20} x2={startX - 40} y2={startY + 2 * decoderHeight + decoderSpacing - 20} stroke="#334155" strokeWidth="2" className="dark:stroke-slate-400" />
                        </>
                    )}
                </g>
            )}

            {/* Draw Output Gates and Wiring */}
            {outputs.map((output, oIdx) => {
                const gateX = startX + decoderWidth + 200;
                const gateY = startY + 50 + oIdx * 80;
                
                // Determine which terms to connect based on decoder type and gate type
                const allTerms = Array.from({ length: Math.pow(2, numVars) }, (_, i) => i);
                const maxterms = allTerms.filter(t => !output.minterms.includes(t));
                
                let termsToWire: number[] = [];
                if (decoderType === 'active-high') {
                    if (output.gateType === 'OR') {
                        termsToWire = output.minterms;
                    } else if (output.gateType === 'NOR') {
                        termsToWire = maxterms;
                    }
                } else if (decoderType === 'active-low') {
                    if (output.gateType === 'AND') {
                        termsToWire = maxterms;
                    } else if (output.gateType === 'NAND') {
                        termsToWire = output.minterms;
                    }
                }

                return (
                    <g key={`output-gate-${oIdx}`}>
                        {/* Gate */}
                        <use 
                            href={`#gate-${output.gateType}`} 
                            x={gateX} 
                            y={gateY - 15} 
                            stroke={output.color}
                            className="dark:stroke-current"
                            style={{ color: output.color }}
                        />
                        <text x={gateX + 45} y={gateY + 5} className="font-bold text-lg" fill={output.color}>{output.name}</text>
                        <line x1={gateX + (output.gateType.includes('N') ? 38 : 30)} y1={gateY} x2={gateX + 40} y2={gateY} stroke={output.color} strokeWidth="2" />

                        {/* Wiring */}
                        {termsToWire.map((term, tIdx) => {
                            // Find the y coordinate of this term's output from the decoder
                            const dIdx = useMultiple ? Math.floor(term / outputsPerDecoder) : 0;
                            const localTerm = useMultiple ? term % outputsPerDecoder : term;
                            
                            const decY = startY + dIdx * (decoderHeight + decoderSpacing);
                            const outY = decY + 30 + localTerm * ((decoderHeight - 60) / Math.max(1, outputsPerDecoder - 1));
                            
                            const wireStartX = startX + decoderWidth + 40;
                            // Stagger the vertical lines
                            const wireMidX = wireStartX + 20 + (oIdx * 10) + (tIdx * 4) % 100;
                            
                            // Spread inputs on the gate
                            const gateInY = termsToWire.length === 1 
                                ? gateY 
                                : gateY - 10 + (tIdx * 20 / (termsToWire.length - 1));

                            return (
                                <g key={`wire-${oIdx}-${term}`}>
                                    <path 
                                        d={`M ${wireStartX} ${outY} L ${wireMidX} ${outY} L ${wireMidX} ${gateInY} L ${gateX} ${gateInY}`}
                                        fill="none"
                                        stroke={output.color}
                                        strokeWidth="1.5"
                                        opacity="0.7"
                                    />
                                    <circle cx={wireStartX} cy={outY} r="3" fill={output.color} />
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
}
