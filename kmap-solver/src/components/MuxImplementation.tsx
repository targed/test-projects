import React, { useMemo } from 'react';
import { KMapSolver } from '../utils/kmapSolver';
import { BooleanParser, ASTNode, renderAST } from '../utils/algebraParser';
import { KMap } from './KMap';
import { LogicCircuit } from './LogicCircuit';

interface MuxImplementationProps {
    grid: number[];
    numVars: number;
    muxSize: number;
    mode: 'SOP' | 'POS';
}

export default function MuxImplementation({ grid, numVars, muxSize, mode }: MuxImplementationProps) {
    const k = Math.log2(muxSize); // number of select lines
    const remainingVars = numVars - k;
    
    const allVars = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numVars);
    const selectVars = allVars.slice(0, k);
    const inputVars = allVars.slice(k);

    const partitions = useMemo(() => {
        const parts = [];
        for (let i = 0; i < muxSize; i++) {
            const subGrid: number[] = [];
            for (let j = 0; j < Math.pow(2, remainingVars); j++) {
                const index = (i << remainingVars) | j;
                subGrid.push(grid[index]);
            }
            
            let equation = '';
            let ast: ASTNode | null = null;
            let groups: any[] = [];
            
            if (remainingVars === 0) {
                equation = subGrid[0] === 1 ? '1' : subGrid[0] === 0 ? '0' : 'X';
                ast = new ASTNode('CONST', null, null, equation);
            } else {
                const solver = new KMapSolver(remainingVars);
                solver.setMode(mode);
                solver.grid = [...subGrid];
                const solution = solver.solve();
                equation = solution.equation;
                groups = solution.groups;
                
                if (equation === '0' || equation === '1') {
                    ast = new ASTNode('CONST', null, null, equation);
                } else {
                    const tempVars = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, remainingVars);
                    try {
                        ast = new BooleanParser().parse(equation);
                        
                        const mapAST = (node: ASTNode | null): ASTNode | null => {
                            if (!node) return null;
                            if (node.type === 'VAR') {
                                const idx = tempVars.indexOf(node.value!);
                                if (idx !== -1) {
                                    return new ASTNode('VAR', null, null, inputVars[idx]);
                                }
                            }
                            return new ASTNode(node.type, mapAST(node.left), mapAST(node.right), node.value);
                        };
                        
                        ast = mapAST(ast);
                        if (ast) {
                            equation = renderAST(ast);
                        }
                    } catch (e) {
                        console.error("Error parsing/mapping equation:", e);
                    }
                }
            }
            
            parts.push({ index: i, subGrid, equation, ast, groups });
        }
        return parts;
    }, [grid, numVars, muxSize, mode, remainingVars, inputVars]);

    return (
        <div className="w-full flex flex-col gap-8 mt-4">
            <div className="flex flex-col gap-8 items-center justify-center w-full">
                
                {/* MUX Visualizer */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center w-full overflow-x-auto">
                    <h4 className="text-lg font-medium text-slate-800 dark:text-gray-100 mb-6">{muxSize}:1 Multiplexer</h4>
                    
                    <div className="relative flex items-center min-w-max pb-16">
                        {/* Inputs */}
                        <div className="flex flex-col mr-2">
                            {partitions.map((part) => (
                                <div key={part.index} className="relative flex items-center justify-end" style={{ height: '64px', minWidth: '120px' }}>
                                    {part.ast && (part.ast.type !== 'CONST' && part.ast.type !== 'VAR') ? (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.4] origin-right">
                                            <LogicCircuit ast={part.ast} showEquation={false} transparent={true} />
                                        </div>
                                    ) : (
                                        <span className="font-mono text-sm text-blue-600 dark:text-blue-400 mr-2 font-semibold">
                                            {part.equation}
                                        </span>
                                    )}
                                    <div className="w-8 h-0.5 bg-slate-800 dark:bg-slate-300"></div>
                                </div>
                            ))}
                        </div>
                        
                        {/* MUX Body */}
                        <div className="relative border-2 border-slate-800 dark:border-slate-300 bg-slate-50 dark:bg-slate-700 flex flex-col" 
                             style={{ width: '80px', height: `${partitions.length * 64}px`, minHeight: '120px' }}>
                            
                            {/* Input Labels */}
                            <div className="absolute left-1 top-0 bottom-0 flex flex-col w-full">
                                {partitions.map((part) => (
                                    <div key={part.index} className="flex items-center" style={{ height: '64px' }}>
                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                            I{part.index}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* MUX Label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="font-bold text-slate-800 dark:text-gray-200 transform -rotate-90 whitespace-nowrap">
                                    MUX
                                </span>
                            </div>
                            
                            {/* Select Lines */}
                            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 translate-y-full">
                                {selectVars.map((v, i) => (
                                    <div key={v} className="flex flex-col items-center">
                                        <div className="w-0.5 h-6 bg-slate-800 dark:bg-slate-300"></div>
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">S{k - 1 - i}</span>
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">({v})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Output */}
                        <div className="flex items-center ml-2">
                            <div className="w-12 h-0.5 bg-slate-800 dark:bg-slate-300"></div>
                            <span className="font-mono font-bold text-lg text-slate-800 dark:text-gray-100 ml-2">F</span>
                        </div>
                    </div>
                </div>

                {/* Partitions Table */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 w-full overflow-x-auto">
                    <h4 className="text-lg font-medium text-slate-800 dark:text-gray-100 mb-4">Input Equations</h4>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                                <th className="p-2 font-mono text-slate-600 dark:text-slate-300">Input</th>
                                <th className="p-2 font-mono text-slate-600 dark:text-slate-300">Select ({selectVars.join('')})</th>
                                {remainingVars > 0 && <th className="p-2 font-mono text-slate-600 dark:text-slate-300">Truth Table ({inputVars.join('')})</th>}
                                <th className="p-2 font-mono text-slate-600 dark:text-slate-300">Equation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partitions.map((part) => (
                                <tr key={part.index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-2 font-mono font-bold text-slate-800 dark:text-gray-200">I{part.index}</td>
                                    <td className="p-2 font-mono text-slate-600 dark:text-slate-400">
                                        {part.index.toString(2).padStart(k, '0')}
                                    </td>
                                    {remainingVars > 0 && (
                                        <td className="p-2 font-mono text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                                            <div className="flex flex-wrap gap-2">
                                                {part.subGrid.map((val, idx) => (
                                                    <span key={idx} className="mr-2">
                                                        {idx.toString(2).padStart(remainingVars, '0')}:<strong className={val === 1 ? 'text-green-600 dark:text-green-400' : val === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}>{val === 2 ? 'X' : val}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                            {remainingVars >= 2 && (
                                                <div className="mt-2 scale-75 origin-top-left">
                                                    <KMap 
                                                        numVars={remainingVars} 
                                                        grid={part.subGrid} 
                                                        onToggle={() => {}} 
                                                        showIndices={false} 
                                                        rowOffset={0} 
                                                        colOffset={0} 
                                                        groups={part.groups} 
                                                        onRowOffsetChange={() => {}} 
                                                        onColOffsetChange={() => {}}
                                                        varNames={inputVars}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400 align-top">{part.equation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
