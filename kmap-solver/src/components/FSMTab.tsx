import React, { useState, useMemo } from 'react';
import { KMapSolver } from '../utils/kmapSolver';
import { BooleanParser } from '../utils/algebraParser';
import { LogicCircuit } from './LogicCircuit';
import { KMap } from './KMap';

type MachineType = 'Mealy' | 'Moore';
type FFType = 'D' | 'T' | 'SR' | 'JK';

interface FSMTransition {
    currentState: number;
    input: number;
    nextState: number;
    output: number;
}

export function FSMTab() {
    const [pattern, setPattern] = useState('0011');
    const [machineType, setMachineType] = useState<MachineType>('Mealy');
    const [ffType, setFfType] = useState<FFType>('JK');
    const [allowOverlaps, setAllowOverlaps] = useState(true);
    const [showFFTables, setShowFFTables] = useState(false);
    const [showCircuit, setShowCircuit] = useState(false);

    const validPattern = useMemo(() => {
        return pattern.replace(/[^01]/g, '').slice(0, 8);
    }, [pattern]);

    const { numStates, numBits, numVars, transitions, invalidStates } = useMemo(() => {
        if (!validPattern) return { numStates: 0, numBits: 0, numVars: 0, transitions: [], invalidStates: [] };

        const L = validPattern.length;
        const numStates = machineType === 'Mealy' ? L : L + 1;
        const numBits = Math.max(1, Math.ceil(Math.log2(numStates)));
        const numVars = numBits + 1; // Qs + X

        const transitions: FSMTransition[] = [];

        for (let i = 0; i < numStates; i++) {
            for (let x = 0; x <= 1; x++) {
                const currentMatched = validPattern.slice(0, i);
                const s = currentMatched + x.toString();
                
                let nextState = 0;
                let output = 0;

                if (machineType === 'Mealy') {
                    if (s === validPattern) {
                        output = 1;
                        if (allowOverlaps) {
                            // Find longest prefix of pattern that is suffix of s
                            for (let k = L - 1; k > 0; k--) {
                                if (s.endsWith(validPattern.slice(0, k))) {
                                    nextState = k;
                                    break;
                                }
                            }
                        } else {
                            nextState = 0;
                        }
                    } else {
                        output = 0;
                        for (let k = i + 1; k > 0; k--) {
                            if (k <= L && s.endsWith(validPattern.slice(0, k))) {
                                nextState = k;
                                break;
                            }
                        }
                    }
                } else {
                    // Moore
                    // Output depends only on state, handled separately, but we can store it in transition for convenience
                    // Actually, in Moore, output is 1 if i == L.
                    // Wait, the transition output here can just be the next state's output or we can ignore it.
                    // Let's compute next state
                    if (!allowOverlaps && i === L) {
                        // If in final state and no overlaps, we only match prefix of just the input `x`
                        nextState = validPattern[0] === x.toString() ? 1 : 0;
                    } else {
                        for (let k = Math.min(L, i + 1); k > 0; k--) {
                            if (s.endsWith(validPattern.slice(0, k))) {
                                nextState = k;
                                break;
                            }
                        }
                    }
                    output = i === L ? 1 : 0;
                }

                transitions.push({
                    currentState: i,
                    input: x,
                    nextState,
                    output
                });
            }
        }

        const invalidStates = [];
        for (let i = numStates; i < Math.pow(2, numBits); i++) {
            invalidStates.push(i);
        }

        return { numStates, numBits, numVars, transitions, invalidStates };
    }, [validPattern, machineType, allowOverlaps]);

    const getFFInputs = (q: number, qNext: number, type: FFType): string[] => {
        if (q === -1 || qNext === -1) {
            if (type === 'SR' || type === 'JK') return ['2', '2']; // 2 represents Don't Care (X)
            return ['2'];
        }
        if (type === 'D') return [qNext.toString()];
        if (type === 'T') return [(q ^ qNext).toString()];
        if (type === 'SR') {
            if (q === 0 && qNext === 0) return ['0', '2'];
            if (q === 0 && qNext === 1) return ['1', '0'];
            if (q === 1 && qNext === 0) return ['0', '1'];
            if (q === 1 && qNext === 1) return ['2', '0'];
        }
        if (type === 'JK') {
            if (q === 0 && qNext === 0) return ['0', '2'];
            if (q === 0 && qNext === 1) return ['1', '2'];
            if (q === 1 && qNext === 0) return ['2', '1'];
            if (q === 1 && qNext === 1) return ['2', '0'];
        }
        return [];
    };

    const truthTable = useMemo(() => {
        if (!validPattern) return [];
        const rows = [];
        for (let q = 0; q < Math.pow(2, numBits); q++) {
            for (let x = 0; x <= 1; x++) {
                const isInvalid = invalidStates.includes(q);
                const t = transitions.find(tr => tr.currentState === q && tr.input === x);
                
                const qNext = isInvalid ? -1 : (t ? t.nextState : -1);
                const out = isInvalid ? -1 : (machineType === 'Mealy' ? (t ? t.output : -1) : (q === numStates - 1 ? 1 : 0)); // For Moore, output is 1 if state is L
                
                const ffInputs = [];
                for (let b = numBits - 1; b >= 0; b--) {
                    const qBit = (q >> b) & 1;
                    const qNextBit = qNext === -1 ? -1 : ((qNext >> b) & 1);
                    ffInputs.push(getFFInputs(qBit, qNextBit, ffType));
                }

                rows.push({
                    q, x, qNext, out, ffInputs, isInvalid
                });
            }
        }
        return rows;
    }, [numBits, transitions, invalidStates, machineType, ffType, numStates, validPattern]);

    const equations = useMemo(() => {
        if (!validPattern || numVars > 5) return [];
        
        const solveKMap = (grid: number[]) => {
            const solver = new KMapSolver(numVars);
            solver.grid = grid;
            const solution = solver.solve();
            return { eq: solution.equation, groups: solution.groups, grid };
        };

        const eqs = [];
        
        // Output equation
        const outGrid = new Array(Math.pow(2, numVars)).fill(0);
        truthTable.forEach((row, i) => {
            // KMap grid index: Qs then X
            // row.q is Qs, row.x is X
            const idx = (row.q << 1) | row.x;
            outGrid[idx] = row.out === -1 ? 2 : row.out;
        });
        const outSol = solveKMap(outGrid);
        eqs.push({ name: machineType === 'Mealy' ? 'F' : 'F (Output)', eq: outSol.eq, groups: outSol.groups, grid: outSol.grid });

        // FF equations
        for (let b = numBits - 1; b >= 0; b--) {
            const bitIdx = numBits - 1 - b;
            if (ffType === 'D' || ffType === 'T') {
                const grid = new Array(Math.pow(2, numVars)).fill(0);
                truthTable.forEach(row => {
                    const idx = (row.q << 1) | row.x;
                    const val = parseInt(row.ffInputs[bitIdx][0]);
                    grid[idx] = isNaN(val) ? 2 : val;
                });
                const sol = solveKMap(grid);
                eqs.push({ name: `${ffType}${b}`, eq: sol.eq, groups: sol.groups, grid: sol.grid });
            } else {
                const grid1 = new Array(Math.pow(2, numVars)).fill(0);
                const grid2 = new Array(Math.pow(2, numVars)).fill(0);
                truthTable.forEach(row => {
                    const idx = (row.q << 1) | row.x;
                    const val1 = parseInt(row.ffInputs[bitIdx][0]);
                    const val2 = parseInt(row.ffInputs[bitIdx][1]);
                    grid1[idx] = isNaN(val1) ? 2 : val1;
                    grid2[idx] = isNaN(val2) ? 2 : val2;
                });
                const sol1 = solveKMap(grid1);
                const sol2 = solveKMap(grid2);
                eqs.push({ name: `${ffType === 'SR' ? 'S' : 'J'}${b}`, eq: sol1.eq, groups: sol1.groups, grid: sol1.grid });
                eqs.push({ name: `${ffType === 'SR' ? 'R' : 'K'}${b}`, eq: sol2.eq, groups: sol2.groups, grid: sol2.grid });
            }
        }

        return eqs;
    }, [truthTable, numVars, numBits, ffType, machineType, validPattern]);

    const renderStateDiagram = () => {
        if (!validPattern) return null;

        const radius = 30;
        const spacing = 120;
        const width = Math.max(800, numStates * spacing + 100);
        const height = 400;
        const centerY = height / 2;

        const nodes = Array.from({ length: numStates }).map((_, i) => ({
            id: i,
            x: 50 + i * spacing,
            y: centerY,
            label: `S${i}` + (machineType === 'Moore' ? `\n/${i === numStates - 1 ? 1 : 0}` : '')
        }));

        const edges: any[] = [];
        transitions.forEach(t => {
            const source = nodes[t.currentState];
            const target = nodes[t.nextState];
            const label = machineType === 'Mealy' ? `${t.input}/${t.output}` : `${t.input}`;
            
            // Check if there's already an edge between these nodes
            const existingEdge = edges.find(e => e.source.id === source.id && e.target.id === target.id);
            if (existingEdge) {
                existingEdge.label += `, ${label}`;
            } else {
                edges.push({ source, target, label });
            }
        });

        return (
            <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <svg width={width} height={height} className="font-sans">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" className="dark:fill-slate-400" />
                        </marker>
                    </defs>
                    
                    {edges.map((e, i) => {
                        const dx = e.target.x - e.source.x;
                        const dy = e.target.y - e.source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        let path = '';
                        let labelX = 0;
                        let labelY = 0;

                        if (e.source.id === e.target.id) {
                            // Self loop
                            path = `M ${e.source.x - 10} ${e.source.y - radius} A 20 20 0 1 1 ${e.source.x + 10} ${e.source.y - radius}`;
                            labelX = e.source.x;
                            labelY = e.source.y - radius - 25;
                        } else if (Math.abs(e.source.id - e.target.id) === 1 && e.target.id > e.source.id) {
                            // Forward adjacent
                            path = `M ${e.source.x + radius} ${e.source.y} L ${e.target.x - radius} ${e.target.y}`;
                            labelX = e.source.x + dx / 2;
                            labelY = e.source.y - 10;
                        } else {
                            // Curved path for non-adjacent or backward
                            const sweep = e.target.id > e.source.id ? 1 : 0;
                            const curveHeight = Math.abs(e.source.id - e.target.id) * 30;
                            const cy = sweep ? e.source.y + curveHeight : e.source.y - curveHeight;
                            
                            path = `M ${e.source.x} ${e.source.y + (sweep ? radius : -radius)} Q ${e.source.x + dx/2} ${cy} ${e.target.x} ${e.target.y + (sweep ? radius : -radius)}`;
                            labelX = e.source.x + dx / 2;
                            labelY = cy / 2 + e.source.y / 2 + (sweep ? 10 : -10);
                        }

                        return (
                            <g key={i}>
                                <path d={path} fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" className="dark:stroke-slate-400" />
                                <text x={labelX} y={labelY} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 font-mono text-sm font-bold bg-white">{e.label}</text>
                            </g>
                        );
                    })}

                    {nodes.map(n => (
                        <g key={n.id}>
                            <circle cx={n.x} cy={n.y} r={radius} fill="white" stroke="#3b82f6" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-blue-400" />
                            {machineType === 'Moore' ? (
                                <>
                                    <line x1={n.x - radius} y1={n.y} x2={n.x + radius} y2={n.y} stroke="#3b82f6" strokeWidth="1" className="dark:stroke-blue-400" />
                                    <text x={n.x} y={n.y - 5} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 font-bold text-sm">S{n.id}</text>
                                    <text x={n.x} y={n.y + 15} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 font-mono text-sm">{n.id === numStates - 1 ? 1 : 0}</text>
                                </>
                            ) : (
                                <text x={n.x} y={n.y + 5} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 font-bold">S{n.id}</text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    const renderFFTables = () => {
        if (!showFFTables) return null;

        const tables = {
            D: {
                truth: [['D', 'Q(t+1)'], ['0', '0'], ['1', '1']],
                excitation: [['Q(t)', 'Q(t+1)', 'D'], ['0', '0', '0'], ['0', '1', '1'], ['1', '0', '0'], ['1', '1', '1']],
                char: 'Q(t+1) = D'
            },
            T: {
                truth: [['T', 'Q(t+1)'], ['0', 'Q(t)'], ['1', "Q'(t)"]],
                excitation: [['Q(t)', 'Q(t+1)', 'T'], ['0', '0', '0'], ['0', '1', '1'], ['1', '0', '1'], ['1', '1', '0']],
                char: "Q(t+1) = T ⊕ Q(t)"
            },
            SR: {
                truth: [['S', 'R', 'Q(t+1)'], ['0', '0', 'Q(t)'], ['0', '1', '0'], ['1', '0', '1'], ['1', '1', 'Invalid']],
                excitation: [['Q(t)', 'Q(t+1)', 'S', 'R'], ['0', '0', '0', 'X'], ['0', '1', '1', '0'], ['1', '0', '0', '1'], ['1', '1', 'X', '0']],
                char: "Q(t+1) = S + R'Q(t)"
            },
            JK: {
                truth: [['J', 'K', 'Q(t+1)'], ['0', '0', 'Q(t)'], ['0', '1', '0'], ['1', '0', '1'], ['1', '1', "Q'(t)"]],
                excitation: [['Q(t)', 'Q(t+1)', 'J', 'K'], ['0', '0', '0', 'X'], ['0', '1', '1', 'X'], ['1', '0', 'X', '1'], ['1', '1', 'X', '0']],
                char: "Q(t+1) = J Q'(t) + K' Q(t)"
            }
        };

        const t = tables[ffType];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">{ffType} Flip-Flop Excitation Table</h4>
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                {t.excitation[0].map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {t.excitation.slice(1).map((row, i) => (
                                <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                    {row.map((c, j) => <td key={j} className="px-4 py-2 font-mono">{c}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Characteristic Equation</h4>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-lg text-blue-600 dark:text-blue-400">
                        {t.char}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Finite State Machine Designer</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pattern to Find</label>
                        <input 
                            type="text" 
                            value={pattern} 
                            onChange={(e) => setPattern(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                            placeholder="0011"
                            maxLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Machine Type</label>
                        <select 
                            value={machineType} 
                            onChange={(e) => setMachineType(e.target.value as MachineType)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="Mealy">Mealy Machine</option>
                            <option value="Moore">Moore Machine</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Flip-Flop Type</label>
                        <select 
                            value={ffType} 
                            onChange={(e) => setFfType(e.target.value as FFType)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="D">D Flip-Flop</option>
                            <option value="T">T Flip-Flop</option>
                            <option value="SR">SR Flip-Flop</option>
                            <option value="JK">JK Flip-Flop</option>
                        </select>
                    </div>
                    <div className="flex flex-col justify-center gap-3 mt-4 lg:mt-0">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                            <input 
                                type="checkbox" 
                                checked={allowOverlaps}
                                onChange={(e) => setAllowOverlaps(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Allow Overlapping Patterns
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                            <input 
                                type="checkbox" 
                                checked={showFFTables}
                                onChange={(e) => setShowFFTables(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Show FF Tables
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                            <input 
                                type="checkbox" 
                                checked={showCircuit}
                                onChange={(e) => setShowCircuit(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Draw Circuit
                        </label>
                    </div>
                </div>
                
                {renderFFTables()}
            </div>

            {validPattern && (
                <div className="space-y-8">
                    {/* State Diagram */}
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">State Diagram</h3>
                        {renderStateDiagram()}
                    </div>

                    {/* Truth Table */}
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">State Transition & Excitation Table</h3>
                        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-center text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-900 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 border-r dark:border-slate-700" colSpan={numBits}>Current State (Q)</th>
                                        <th className="px-4 py-3 border-r dark:border-slate-700">Input (X)</th>
                                        <th className="px-4 py-3 border-r dark:border-slate-700" colSpan={numBits}>Next State (Q*)</th>
                                        <th className="px-4 py-3 border-r dark:border-slate-700" colSpan={numBits * (ffType === 'D' || ffType === 'T' ? 1 : 2)}>FF Inputs</th>
                                        <th className="px-4 py-3">Output (F)</th>
                                    </tr>
                                    <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        {Array.from({length: numBits}).map((_, i) => <th key={`q-${i}`} className="px-2 py-2 font-mono">Q{numBits - 1 - i}</th>)}
                                        <th className="px-2 py-2 border-r dark:border-slate-700 font-mono">X</th>
                                        {Array.from({length: numBits}).map((_, i) => <th key={`qn-${i}`} className="px-2 py-2 font-mono">Q*{numBits - 1 - i}</th>)}
                                        {Array.from({length: numBits}).map((_, i) => {
                                            const b = numBits - 1 - i;
                                            if (ffType === 'D' || ffType === 'T') return <th key={`ff-${i}`} className="px-2 py-2 font-mono">{ffType}{b}</th>;
                                            return (
                                                <React.Fragment key={`ff-${i}`}>
                                                    <th className="px-2 py-2 font-mono">{ffType === 'SR' ? 'S' : 'J'}{b}</th>
                                                    <th className="px-2 py-2 font-mono">{ffType === 'SR' ? 'R' : 'K'}{b}</th>
                                                </React.Fragment>
                                            );
                                        })}
                                        <th className="px-2 py-2 font-mono">F</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {truthTable.map((row, i) => (
                                        <tr key={i} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            {Array.from({length: numBits}).map((_, j) => (
                                                <td key={`q-${j}`} className="px-2 py-2 font-mono">{(row.q >> (numBits - 1 - j)) & 1}</td>
                                            ))}
                                            <td className="px-2 py-2 border-r dark:border-slate-700 font-mono font-bold text-blue-600 dark:text-blue-400">{row.x}</td>
                                            {Array.from({length: numBits}).map((_, j) => (
                                                <td key={`qn-${j}`} className="px-2 py-2 font-mono">{row.isInvalid ? 'X' : (row.qNext >> (numBits - 1 - j)) & 1}</td>
                                            ))}
                                            {row.ffInputs.map((ff, j) => (
                                                <React.Fragment key={`ff-${j}`}>
                                                    <td className="px-2 py-2 font-mono text-orange-600 dark:text-orange-400">{ff[0] === '2' ? 'X' : ff[0]}</td>
                                                    {ff.length > 1 && <td className="px-2 py-2 font-mono text-orange-600 dark:text-orange-400">{ff[1] === '2' ? 'X' : ff[1]}</td>}
                                                </React.Fragment>
                                            ))}
                                            <td className="px-2 py-2 font-mono font-bold text-green-600 dark:text-green-400">{row.out === -1 ? 'X' : row.out}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Equations and K-Maps */}
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Minimal Logic Expressions & K-Maps</h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {equations.map((eq, i) => {
                                const varNames = [];
                                for (let j = 0; j < numBits; j++) {
                                    varNames.push(`Q${numBits - 1 - j}`);
                                }
                                varNames.push('X');

                                return (
                                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-6">
                                        <div className="flex items-center gap-4 w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="font-mono font-bold text-xl text-slate-700 dark:text-slate-300 min-w-[3rem]">{eq.name}</div>
                                            <div className="font-mono text-xl text-blue-600 dark:text-blue-400 flex-1">
                                                = {eq.eq === '0' || eq.eq === '1' ? eq.eq : eq.eq.replace(/([A-Z])/g, (match) => {
                                                    const varIdx = match.charCodeAt(0) - 65;
                                                    if (varIdx === numVars - 1) return 'X';
                                                    return `Q${numBits - 1 - varIdx}`;
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-full overflow-x-auto">
                                            <KMap
                                                numVars={numVars}
                                                grid={eq.grid}
                                                onToggle={() => {}} // Read-only
                                                showIndices={false}
                                                rowOffset={0}
                                                colOffset={0}
                                                groups={eq.groups}
                                                onRowOffsetChange={() => {}}
                                                onColOffsetChange={() => {}}
                                                varNames={varNames}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Circuit Diagram */}
                    {showCircuit && (
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Logic Circuit</h3>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                                    Note: This is a simplified combinational logic view of the equations. A full sequential circuit would include the clock and flip-flop blocks.
                                </p>
                                <div className="flex flex-col gap-8">
                                    {equations.map((eq, i) => {
                                        if (eq.eq === '0' || eq.eq === '1') return null;
                                        
                                        // Replace variables for the logic circuit parser
                                        let parsedEq = eq.eq;
                                        try {
                                            const ast = new BooleanParser().parse(parsedEq);
                                            return (
                                                <div key={i} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                                                    <h4 className="font-mono font-bold mb-2">{eq.name}</h4>
                                                    <LogicCircuit ast={ast} showEquation={false} />
                                                </div>
                                            );
                                        } catch (e) {
                                            return null;
                                        }
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
