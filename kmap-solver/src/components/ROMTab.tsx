import React, { useState, useEffect } from 'react';

export function ROMTab() {
    const [blockRows, setBlockRows] = useState<number>(128);
    const [blockCols, setBlockCols] = useState<number>(16);
    const [numBlocks, setNumBlocks] = useState<number>(3);
    const [effRows, setEffRows] = useState<number>(384);
    
    const [controlType, setControlType] = useState<'gates' | 'decoder'>('gates');
    const [showAddresses, setShowAddresses] = useState<boolean>(false);

    const handleBlockRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 1;
        setBlockRows(val);
        setEffRows(val * numBlocks);
    };

    const handleBlockColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 1;
        setBlockCols(val);
    };

    const handleNumBlocksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 1;
        setNumBlocks(val);
        setEffRows(blockRows * val);
    };

    const handleEffRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 1;
        setEffRows(val);
        setNumBlocks(Math.ceil(val / blockRows));
    };

    const A = Math.max(1, Math.ceil(Math.log2(blockRows)));
    const K = A - 1;
    const C = Math.max(1, Math.ceil(Math.log2(numBlocks)));

    const renderCircuit = () => {
        const chipW = 120;
        const chipH = 90;
        const spacing = 50;
        const startX = 550;
        const startY = 80;
        
        const svgHeight = Math.max(400, startY + numBlocks * (chipH + spacing) + 50);
        const svgWidth = 850;
        
        const controlX = Array.from({length: C}).map((_, i) => 100 + (C - 1 - i) * 40);
        const addrBusX = startX - 40;
        const dataBusX = startX + chipW + 40;
        const clkX = 50;

        return (
            <div className="overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-6">
                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="font-sans">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" className="dark:fill-slate-400" />
                        </marker>
                    </defs>

                    {/* Clock Line */}
                    <line x1={clkX} y1={svgHeight - 30} x2={startX - 20} y2={svgHeight - 30} stroke="#64748b" strokeWidth="2" className="dark:stroke-slate-400" />
                    <text x={clkX} y={svgHeight - 35} className="fill-slate-600 dark:fill-slate-400 font-mono text-sm">CLK</text>

                    {/* Address Bus */}
                    <line x1={addrBusX} y1={40} x2={addrBusX} y2={startY + (numBlocks - 1) * (chipH + spacing) + 20} stroke="#3b82f6" strokeWidth="3" className="dark:stroke-blue-400" />
                    <line x1={50} y1={40} x2={addrBusX} y2={40} stroke="#3b82f6" strokeWidth="3" className="dark:stroke-blue-400" />
                    <text x={150} y={30} className="fill-blue-600 dark:fill-blue-400 font-mono font-bold">Addr(K,...,0)</text>
                    <line x1={220} y1={30} x2={240} y2={50} stroke="#3b82f6" strokeWidth="2" className="dark:stroke-blue-400" />
                    <text x={245} y={45} className="fill-blue-600 dark:fill-blue-400 font-mono text-sm">K+1</text>

                    {/* Data Bus */}
                    <line x1={dataBusX} y1={startY + 45} x2={dataBusX} y2={startY + (numBlocks - 1) * (chipH + spacing) + 45} stroke="#10b981" strokeWidth="3" className="dark:stroke-emerald-400" />
                    <line x1={dataBusX} y1={startY + 45} x2={dataBusX + 50} y2={startY + 45} stroke="#10b981" strokeWidth="3" className="dark:stroke-emerald-400" />
                    <line x1={dataBusX + 20} y1={35} x2={dataBusX + 40} y2={55} stroke="#10b981" strokeWidth="2" className="dark:stroke-emerald-400" />
                    <text x={dataBusX + 45} y={40} className="fill-emerald-600 dark:fill-emerald-400 font-mono font-bold">{blockCols}</text>

                    {/* Control Lines */}
                    {controlX.map((cx, i) => {
                        const bitIndex = C - 1 - i;
                        return (
                            <g key={`ctrl-${i}`}>
                                <line x1={cx} y1={40} x2={cx} y2={svgHeight - 50} stroke="#8b5cf6" strokeWidth="2" className="dark:stroke-violet-400" />
                                <circle cx={cx} cy={40} r={4} fill="#8b5cf6" className="dark:fill-violet-400" />
                                <text x={cx} y={25} textAnchor="middle" className="fill-violet-600 dark:fill-violet-400 font-mono text-xs font-bold">A(K+{bitIndex + 1})</text>
                            </g>
                        );
                    })}

                    {/* Decoder (if selected) */}
                    {controlType === 'decoder' && (
                        <g>
                            <rect x={250} y={startY} width={80} height={Math.max(100, numBlocks * 40)} fill="white" stroke="#64748b" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-400" />
                            <text x={290} y={startY + 20} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 font-bold text-sm">{C}x{Math.pow(2, C)}</text>
                            <text x={290} y={startY + 35} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 font-bold text-sm">Decoder</text>
                            
                            {/* Decoder Inputs */}
                            {controlX.map((cx, i) => {
                                const y = startY + 20 + i * 20;
                                return (
                                    <g key={`dec-in-${i}`}>
                                        <line x1={cx} y1={y} x2={250} y2={y} stroke="#8b5cf6" strokeWidth="2" className="dark:stroke-violet-400" />
                                        <circle cx={cx} cy={y} r={3} fill="#8b5cf6" className="dark:fill-violet-400" />
                                    </g>
                                );
                            })}
                        </g>
                    )}

                    {/* Chips */}
                    {Array.from({length: numBlocks}).map((_, i) => {
                        const cy = startY + i * (chipH + spacing);
                        
                        return (
                            <g key={`chip-${i}`}>
                                {/* Chip Body */}
                                <rect x={startX} y={cy} width={chipW} height={chipH} fill="white" stroke="#333" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-300" />
                                <text x={startX + chipW/2} y={cy + 20} textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 font-bold text-sm">{blockRows}x{blockCols}b</text>
                                <text x={startX + chipW + 10} y={cy + 20} className="fill-slate-500 dark:fill-slate-400 font-mono text-xs">({i + 1})</text>
                                
                                {/* Addr Input */}
                                <text x={startX + 5} y={cy + 40} className="fill-slate-600 dark:fill-slate-400 font-mono text-xs">Addr</text>
                                <line x1={addrBusX} y1={cy + 35} x2={startX} y2={cy + 35} stroke="#3b82f6" strokeWidth="2" className="dark:stroke-blue-400" markerEnd="url(#arrowhead)" />
                                <circle cx={addrBusX} cy={cy + 35} r={3} fill="#3b82f6" className="dark:fill-blue-400" />

                                {/* Data Output */}
                                <text x={startX + chipW - 15} y={cy + 50} className="fill-slate-600 dark:fill-slate-400 font-mono text-xs font-bold">D</text>
                                <line x1={startX + chipW} y1={cy + 45} x2={dataBusX} y2={cy + 45} stroke="#10b981" strokeWidth="2" className="dark:stroke-emerald-400" />
                                <circle cx={dataBusX} cy={cy + 45} r={3} fill="#10b981" className="dark:fill-emerald-400" />

                                {/* Enable Input */}
                                <text x={startX + 5} y={cy + 75} className="fill-slate-600 dark:fill-slate-400 font-mono text-xs">en</text>

                                {/* Clock Input */}
                                <path d={`M ${startX} ${cy + 60} L ${startX + 10} ${cy + 65} L ${startX} ${cy + 70}`} fill="none" stroke="#64748b" strokeWidth="1.5" className="dark:stroke-slate-400" />
                                <line x1={startX - 20} y1={svgHeight - 30} x2={startX - 20} y2={cy + 65} stroke="#64748b" strokeWidth="1.5" className="dark:stroke-slate-400" />
                                <line x1={startX - 20} y1={cy + 65} x2={startX} y2={cy + 65} stroke="#64748b" strokeWidth="1.5" className="dark:stroke-slate-400" />
                                <circle cx={startX - 20} cy={svgHeight - 30} r={3} fill="#64748b" className="dark:fill-slate-400" />

                                {/* Control Logic */}
                                {controlType === 'gates' ? (
                                    <g>
                                        {/* AND Gate */}
                                        <path d={`M ${startX - 60} ${cy + 60} L ${startX - 40} ${cy + 60} A 15 15 0 0 1 ${startX - 40} ${cy + 90} L ${startX - 60} ${cy + 90} Z`} fill="white" stroke="#8b5cf6" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-violet-400" />
                                        <line x1={startX - 25} y1={cy + 75} x2={startX} y2={cy + 75} stroke="#8b5cf6" strokeWidth="2" className="dark:stroke-violet-400" markerEnd="url(#arrowhead)" />
                                        
                                        {/* Inputs to AND gate */}
                                        {controlX.map((cx, j) => {
                                            const bitIndex = C - 1 - j;
                                            const isOne = (i >> bitIndex) & 1;
                                            const inY = cy + 65 + j * (20 / Math.max(1, C - 1));
                                            
                                            return (
                                                <g key={`ctrl-in-${i}-${j}`}>
                                                    <line x1={cx} y1={inY} x2={startX - 60} y2={inY} stroke="#8b5cf6" strokeWidth="1.5" className="dark:stroke-violet-400" />
                                                    <circle cx={cx} cy={inY} r={3} fill="#8b5cf6" className="dark:fill-violet-400" />
                                                    {!isOne && (
                                                        <g transform={`translate(${cx + 20}, ${inY})`}>
                                                            <polygon points="-5,-5 5,0 -5,5" fill="white" stroke="#8b5cf6" strokeWidth="1.5" className="dark:fill-slate-800 dark:stroke-violet-400" />
                                                            <circle cx="7" cy="0" r="2" fill="white" stroke="#8b5cf6" strokeWidth="1.5" className="dark:fill-slate-800 dark:stroke-violet-400" />
                                                        </g>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                ) : (
                                    <g>
                                        {/* Connection from Decoder */}
                                        <line x1={330} y1={startY + 20 + i * 30} x2={startX} y2={cy + 75} stroke="#8b5cf6" strokeWidth="2" className="dark:stroke-violet-400" markerEnd="url(#arrowhead)" />
                                        <text x={340} y={startY + 15 + i * 30} className="fill-violet-600 dark:fill-violet-400 font-mono text-xs">{i}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">ROM Circuit Designer</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                    {/* Individual Block Size */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Individual Block Size</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Rows (Words)</label>
                                <input 
                                    type="number" 
                                    value={blockRows} 
                                    onChange={handleBlockRowsChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                                    min={2}
                                />
                            </div>
                            <span className="text-slate-500 mt-5">x</span>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Columns (Bits)</label>
                                <input 
                                    type="number" 
                                    value={blockCols} 
                                    onChange={handleBlockColsChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                                    min={1}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Number of Blocks */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Number of Blocks</h3>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Chips</label>
                            <input 
                                type="number" 
                                value={numBlocks} 
                                onChange={handleNumBlocksChange}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Effective Overall Size */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">Effective Overall Size</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Total Rows</label>
                                <input 
                                    type="number" 
                                    value={effRows} 
                                    onChange={handleEffRowsChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                                    min={2}
                                />
                            </div>
                            <span className="text-slate-500 mt-5">x</span>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bits</label>
                                <input 
                                    type="number" 
                                    value={blockCols} 
                                    disabled
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <label className="font-medium text-slate-700 dark:text-slate-300">Control Logic:</label>
                        <select 
                            value={controlType} 
                            onChange={(e) => setControlType(e.target.value as 'gates' | 'decoder')}
                            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="gates">Basic Gates (AND/NOT)</option>
                            <option value="decoder">Decoder</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                        <input 
                            type="checkbox" 
                            checked={showAddresses}
                            onChange={(e) => setShowAddresses(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        Show Address Ranges
                    </label>
                </div>
            </div>

            {/* Calculations & Explanations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Address Calculations</h3>
                    <div className="space-y-4 text-slate-700 dark:text-slate-300">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="mb-2"><strong>A</strong> represents the number of address bits required for a single ROM block.</p>
                            <p className="font-mono text-sm bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                A = log₂({blockRows}) = {A}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <p className="mb-2"><strong>K</strong> is the highest index of the address bus for a single block (since indices start at 0).</p>
                            <p className="font-mono text-sm bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                K = A - 1 = {A} - 1 = {K}
                            </p>
                        </div>
                        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                            <p className="mb-2">To control <strong>{numBlocks}</strong> blocks, we need additional address bits to select which block is active.</p>
                            <p className="font-mono text-sm bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                Control Bits = ceil(log₂({numBlocks})) = {C}
                            </p>
                            <p className="mt-2 text-sm">These are connected to A(K+1) through A(K+{C}).</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">How it works</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                        Since these chips are turned on and off with different control gates, they can act as a larger unified memory even when reading from the same input as only one is active at a time. 
                        <br/><br/>
                        The lower <strong>{A}</strong> bits of the address bus are sent to every chip simultaneously. However, the upper <strong>{C}</strong> bits are decoded to ensure that the <code>Enable (en)</code> pin is high for exactly one chip at any given address.
                        <br/><br/>
                        If there were no control gates, each block would be the same as the others, and they would all attempt to output data onto the shared bus simultaneously, causing conflicts.
                    </p>
                </div>
            </div>

            {/* Address Ranges Table */}
            {showAddresses && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Address Ranges</h3>
                    <table className="w-full text-left text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Chip</th>
                                <th className="p-3">Starting Address (Binary)</th>
                                <th className="p-3 rounded-tr-lg">Ending Address (Binary)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({length: numBlocks}).map((_, i) => {
                                const controlBits = i.toString(2).padStart(C, '0');
                                const startAddr = '0'.repeat(A);
                                const endAddr = '1'.repeat(A);
                                return (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <td className="p-3 font-medium">{i + 1}</td>
                                        <td className="p-3 font-mono">
                                            <span className="text-violet-600 dark:text-violet-400 font-bold">{controlBits}</span>{' '}
                                            <span className="text-blue-600 dark:text-blue-400">{startAddr}</span>
                                        </td>
                                        <td className="p-3 font-mono">
                                            <span className="text-violet-600 dark:text-violet-400 font-bold">{controlBits}</span>{' '}
                                            <span className="text-blue-600 dark:text-blue-400">{endAddr}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Circuit Diagram */}
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Circuit Diagram</h3>
            {renderCircuit()}
        </div>
    );
}
