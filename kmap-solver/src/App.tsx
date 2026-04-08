/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { KMapSolver } from './utils/kmapSolver';
import { BooleanParser, evaluateAST, simplifyStepByStep, renderAST, nodesEqual, getCanonicalAST } from './utils/algebraParser';
import { KMap } from './components/KMap';
import { TruthTable } from './components/TruthTable';
import { LogicCircuit } from './components/LogicCircuit';
import { BinaryEducation } from './components/BinaryEducation';

export default function App() {
    const [activeTab, setActiveTab] = useState<'kmap' | 'binary'>('kmap');
    const [numVars, setNumVars] = useState(4);
    const [mode, setMode] = useState<'SOP' | 'POS'>('SOP');
    const [grid, setGrid] = useState<number[]>(new Array(16).fill(0));
    const [showIndices, setShowIndices] = useState(true);
    const [showTruthTable, setShowTruthTable] = useState(false);
    const [showAlgebra, setShowAlgebra] = useState(false);
    const [showCircuit, setShowCircuit] = useState(false);
    const [circuitType, setCircuitType] = useState<'simplified' | 'canonical'>('simplified');
    const [showCircuitEquations, setShowCircuitEquations] = useState(false);
    const [rowOffset, setRowOffset] = useState(0);
    const [colOffset, setColOffset] = useState(0);
    const [algebraInput, setAlgebraInput] = useState('');
    const [algebraSteps, setAlgebraSteps] = useState<any[]>([]);
    const [algebraError, setAlgebraError] = useState('');
    const [showStandardForms, setShowStandardForms] = useState(true);
    const [mintermsInput, setMintermsInput] = useState('');
    const [maxtermsInput, setMaxtermsInput] = useState('');
    const [dontCaresInput, setDontCaresInput] = useState('');
    const [showUniversalGates, setShowUniversalGates] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const m: number[] = [];
        const M: number[] = [];
        const d: number[] = [];
        grid.forEach((val, i) => {
            if (val === 1) m.push(i);
            else if (val === 0) M.push(i);
            else if (val === 2) d.push(i);
        });
        setMintermsInput(m.join(', '));
        setMaxtermsInput(M.join(', '));
        setDontCaresInput(d.join(', '));
    }, [grid]);

    const parseIndices = (str: string) => {
        return Array.from(new Set(str.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n >= 0 && n < (1 << numVars))));
    };

    const applyMinterms = () => {
        const m = parseIndices(mintermsInput);
        const d = parseIndices(dontCaresInput);
        const newGrid = new Array(1 << numVars).fill(0);
        d.forEach(i => newGrid[i] = 2);
        m.forEach(i => newGrid[i] = 1);
        setGrid(newGrid);
    };

    const applyMaxterms = () => {
        const M = parseIndices(maxtermsInput);
        const d = parseIndices(dontCaresInput);
        const newGrid = new Array(1 << numVars).fill(1);
        d.forEach(i => newGrid[i] = 2);
        M.forEach(i => newGrid[i] = 0);
        setGrid(newGrid);
    };

    const applyDontCares = () => {
        const d = parseIndices(dontCaresInput);
        const newGrid = [...grid];
        for (let i = 0; i < newGrid.length; i++) {
            if (newGrid[i] === 2) newGrid[i] = 0;
        }
        d.forEach(i => newGrid[i] = 2);
        setGrid(newGrid);
    };

    const solver = useMemo(() => {
        const s = new KMapSolver(numVars);
        s.setMode(mode);
        s.grid = [...grid];
        return s;
    }, [numVars, mode, grid]);

    const solution = useMemo(() => solver.solve(), [solver]);

    const handleToggle = (index: number) => {
        const newGrid = [...grid];
        newGrid[index] = (newGrid[index] + 1) % 3;
        setGrid(newGrid);
    };

    const handleReset = () => {
        setGrid(new Array(1 << numVars).fill(0));
        setRowOffset(0);
        setColOffset(0);
        setAlgebraSteps([]);
        setAlgebraInput('');
        setAlgebraError('');
    };

    const handleNumVarsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const n = parseInt(e.target.value);
        setNumVars(n);
        setGrid(new Array(1 << n).fill(0));
        setRowOffset(0);
        setColOffset(0);
    };

    const handleSolveAlgebra = () => {
        if (!algebraInput.trim()) return;
        try {
            setAlgebraError('');
            const parser = new BooleanParser();
            const ast = parser.parse(algebraInput);

            const vars = new Set<string>();
            const traverse = (node: any) => {
                if (!node) return;
                if (node.type === 'VAR') vars.add(node.value);
                traverse(node.left);
                traverse(node.right);
            };
            traverse(ast);

            const sortedVars = Array.from(vars).sort();
            let nVars = sortedVars.length;

            if (nVars === 0) nVars = numVars;
            else if (nVars < 2) nVars = 2;
            else if (nVars > 5) {
                setAlgebraError("Only up to 5 variables supported.");
                return;
            }

            if (nVars !== numVars) {
                setNumVars(nVars);
                setRowOffset(0);
                setColOffset(0);
            }

            const size = 1 << nVars;
            const newGrid = new Array(size).fill(0);
            for (let i = 0; i < size; i++) {
                const context: Record<string, number> = {};
                for (let v = 0; v < nVars; v++) {
                    const val = (i >> (nVars - 1 - v)) & 1;
                    if (v < sortedVars.length) {
                        context[sortedVars[v]] = val;
                    }
                }
                newGrid[i] = evaluateAST(ast, context);
            }
            setGrid(newGrid);

            const steps = simplifyStepByStep(ast);
            
            const tempSolver = new KMapSolver(nVars);
            tempSolver.setMode(mode);
            tempSolver.grid = newGrid;
            const tempSolution = tempSolver.solve();
            
            let finalSteps = [{ ast, description: 'Input', rule: 'Input' }, ...steps];
            
            try {
                const finalAST = parser.parse(tempSolution.equation);
                const lastAST = finalSteps[finalSteps.length - 1].ast;
                if (!nodesEqual(lastAST, finalAST)) {
                    finalSteps.push({ ast: finalAST, description: 'K-Map Minimization', rule: 'K-Map' });
                }
            } catch (e) {
                // Ignore if final equation cannot be parsed
            }
            
            setAlgebraSteps(finalSteps);
        } catch (e: any) {
            setAlgebraError("Error parsing expression: " + e.message);
        }
    };

    const renderUniversalGatesSteps = () => {
        if (solution.groups.length === 0) return null;
        if (solution.equation === '1' || solution.equation === '0') return <div className="text-slate-500 dark:text-slate-400">Constant values do not require universal gate conversion.</div>;

        const terms = solution.groups.map(g => solver.getTermString(g));
        
        if (mode === 'SOP') {
            // NAND-NAND
            const step1 = terms.join(' + ');
            const step2 = `(${step1})''`;
            const step3 = `(${terms.map(t => `(${t})'`).join(' · ')})'`;
            
            return (
                <div className="flex flex-col gap-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">NAND-NAND Implementation</h4>
                    <div className="flex flex-col gap-2 font-mono text-slate-800 dark:text-gray-200 bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
                        <div><span className="text-slate-500">1. Original SOP:</span> F = {step1}</div>
                        <div><span className="text-slate-500">2. Double Negate:</span> F = {step2}</div>
                        <div><span className="text-slate-500">3. De Morgan's:</span> F = {step3}</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        This form uses only NAND gates. Each term <code>(X)'</code> is a NAND gate, and the outer <code>(...)'</code> is another NAND gate combining them.
                    </p>
                </div>
            );
        } else {
            // NOR-NOR
            const step1 = terms.map(t => solution.groups.length > 1 ? `(${t})` : t).join('');
            const step2 = `(${step1})''`;
            const step3 = `(${terms.map(t => `(${t})'`).join(' + ')})'`;
            
            return (
                <div className="flex flex-col gap-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">NOR-NOR Implementation</h4>
                    <div className="flex flex-col gap-2 font-mono text-slate-800 dark:text-gray-200 bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
                        <div><span className="text-slate-500">1. Original POS:</span> F = {step1}</div>
                        <div><span className="text-slate-500">2. Double Negate:</span> F = {step2}</div>
                        <div><span className="text-slate-500">3. De Morgan's:</span> F = {step3}</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        This form uses only NOR gates. Each term <code>(X)'</code> is a NOR gate, and the outer <code>(...)'</code> is another NOR gate combining them.
                    </p>
                </div>
            );
        }
    };

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 font-sans text-gray-800 dark:text-gray-100 flex justify-center transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md max-w-6xl w-full flex flex-col items-center relative transition-colors duration-300">
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('kmap')}
                        className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'kmap' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        K-Map Solver
                    </button>
                    <button 
                        onClick={() => setActiveTab('binary')}
                        className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'binary' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        Binary Education
                    </button>
                </div>

                {activeTab === 'kmap' ? (
                    <>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">K-Map Solver</h1>

                        <div className="flex gap-4 mb-8 flex-wrap justify-center">
                            <div className="flex items-center gap-2">
                                <label className="font-medium text-slate-700 dark:text-slate-300">Variables:</label>
                                <select value={numVars} onChange={handleNumVarsChange} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-gray-100">
                                    <option value={2}>2 Variables (A, B)</option>
                                    <option value={3}>3 Variables (A, B, C)</option>
                                    <option value={4}>4 Variables (A, B, C, D)</option>
                                    <option value={5}>5 Variables (A, B, C, D, E)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="font-medium text-slate-700 dark:text-slate-300">Mode:</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value as 'SOP' | 'POS')} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-gray-100">
                                    <option value="SOP">Sum of Products (SOP)</option>
                                    <option value="POS">Product of Sums (POS)</option>
                                </select>
                            </div>

                    <button onClick={handleReset} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Reset</button>
                    <button onClick={() => setShowIndices(!showIndices)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Toggle Indices</button>
                    <button onClick={() => setShowTruthTable(!showTruthTable)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Toggle Truth Table</button>
                    <button onClick={() => setShowCircuit(!showCircuit)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Toggle Circuit</button>
                    <button onClick={() => setShowStandardForms(!showStandardForms)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Toggle Standard Forms</button>
                    <button onClick={() => setShowUniversalGates(!showUniversalGates)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors">Toggle Universal Gates</button>
                    <button onClick={() => setShowAlgebra(!showAlgebra)} className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors">Boolean Algebra Solver</button>
                </div>

                {showStandardForms && (
                    <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-8 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-gray-100">Standard Forms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Minterms (Σm / 1s / True / SOP)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={mintermsInput} 
                                        onChange={e => setMintermsInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && applyMinterms()}
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100"
                                        placeholder="e.g. 0, 1, 2"
                                    />
                                    <button onClick={applyMinterms} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Apply</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Maxterms (ΠM / 0s / False / POS)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={maxtermsInput} 
                                        onChange={e => setMaxtermsInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && applyMaxterms()}
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100"
                                        placeholder="e.g. 3, 4, 5"
                                    />
                                    <button onClick={applyMaxterms} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Apply</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Don't Cares (d / Xs)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={dontCaresInput} 
                                        onChange={e => setDontCaresInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && applyDontCares()}
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100"
                                        placeholder="e.g. 6, 7"
                                    />
                                    <button onClick={applyDontCares} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Apply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showAlgebra && (
                    <div className="w-full max-w-3xl bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-8 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-gray-100">Boolean Algebra Solver</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={algebraInput}
                                onChange={(e) => setAlgebraInput(e.target.value)}
                                placeholder="Enter expression (e.g., A + B'C)"
                                className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-slate-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleSolveAlgebra()}
                            />
                            <button onClick={handleSolveAlgebra} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors">Solve & Map</button>
                        </div>
                        {algebraError && <div className="text-red-500 dark:text-red-400 mb-4">{algebraError}</div>}
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                            {algebraSteps.map((step, i) => (
                                <div key={i} className="p-2 border-b border-slate-200 dark:border-slate-700 last:border-0 font-mono text-slate-800 dark:text-gray-200">
                                    {i === 0 ? (
                                        <strong>Input: {renderAST(step.ast)}</strong>
                                    ) : (
                                        <>
                                            <div className="text-gray-500 dark:text-slate-400 text-sm">↓ {step.description}</div>
                                            <div className="text-lg mt-1">{renderAST(step.ast)}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {algebraSteps.length > 0 && (
                                <div className="mt-4 font-bold font-mono text-slate-800 dark:text-gray-100">
                                    Final Simplified Form: {renderAST(algebraSteps[algebraSteps.length - 1].ast)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="w-full bg-gray-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center mb-8 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-gray-100">Solution:</h3>
                    <div className="font-mono text-xl font-bold text-orange-600 dark:text-orange-400 flex flex-wrap justify-center gap-1">
                        <span className="text-gray-800 dark:text-gray-300">{mode} = </span>
                        {solution.groups.length === 0 ? (
                            <span>{solution.equation}</span>
                        ) : solution.equation === '1' || solution.equation === '0' ? (
                            <span>{solution.equation}</span>
                        ) : (
                            solution.groups.map((group, index) => {
                                const termStr = solver.getTermString(group);
                                const color = colors[index % colors.length];
                                const isLast = index === solution.groups.length - 1;
                                return (
                                    <React.Fragment key={index}>
                                        <span style={{ color }}>
                                            {mode === 'POS' && solution.groups.length > 1 ? `(${termStr})` : termStr}
                                        </span>
                                        {!isLast && <span className="text-gray-800 dark:text-gray-300">{mode === 'SOP' ? ' + ' : ''}</span>}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>
                </div>

                {showUniversalGates && (
                    <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-8 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-gray-100">Universal Gates Conversion</h3>
                        {renderUniversalGatesSteps()}
                    </div>
                )}

                <div className="flex gap-8 flex-wrap justify-center w-full mb-8">
                    <KMap
                        numVars={numVars}
                        grid={grid}
                        onToggle={handleToggle}
                        showIndices={showIndices}
                        rowOffset={rowOffset}
                        colOffset={colOffset}
                        groups={solution.groups}
                        onRowOffsetChange={setRowOffset}
                        onColOffsetChange={setColOffset}
                    />
                    {showTruthTable && (
                        <TruthTable
                            numVars={numVars}
                            grid={grid}
                            onToggle={handleToggle}
                        />
                    )}
                </div>

                {showCircuit && (
                    <div className="w-full bg-gray-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-col items-center transition-colors">
                        <div className="flex justify-between items-center w-full mb-4">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-gray-100">Logic Circuit</h3>
                            <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                                    <input type="checkbox" checked={showCircuitEquations} onChange={(e) => setShowCircuitEquations(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                    <span className="text-sm">Show Equations</span>
                                </label>
                                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-md p-1 transition-colors">
                                    <button 
                                        onClick={() => setCircuitType('simplified')}
                                        className={`px-3 py-1 text-sm rounded-sm transition-colors ${circuitType === 'simplified' ? 'bg-white dark:bg-slate-800 shadow-sm font-medium text-slate-800 dark:text-gray-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                    >
                                        Simplified
                                    </button>
                                    <button 
                                        onClick={() => setCircuitType('canonical')}
                                        className={`px-3 py-1 text-sm rounded-sm transition-colors ${circuitType === 'canonical' ? 'bg-white dark:bg-slate-800 shadow-sm font-medium text-slate-800 dark:text-gray-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                    >
                                        Canonical
                                    </button>
                                </div>
                            </div>
                        </div>
                        <LogicCircuit 
                            ast={circuitType === 'simplified' ? new BooleanParser().parse(solution.equation) : getCanonicalAST(grid, numVars, mode)} 
                            showEquation={showCircuitEquations} 
                        />
                    </div>
                )}
                    </>
                ) : (
                    <BinaryEducation />
                )}
            </div>
        </div>
    );
}
