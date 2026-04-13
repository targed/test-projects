import React, { useState, useEffect } from 'react';

type FAInput = {
    value: '0' | '1';
    invert: boolean;
};

type RowConfig = {
    cin: '0' | '1';
    bInputs: FAInput[];
    aInputs?: FAInput[]; // Only for row 0
};

type FAState = {
    a: number;
    b: number;
    cin: number;
    sum: number;
    cout: number;
};

export const CustomRCASimulator: React.FC = () => {
    const [numRowsInput, setNumRowsInput] = useState<string>('2');
    const [numColsInput, setNumColsInput] = useState<string>('4');
    const [rows, setRows] = useState<RowConfig[]>([]);

    const numRows = parseInt(numRowsInput) || 0;
    const numCols = parseInt(numColsInput) || 0;

    // Initialize rows
    useEffect(() => {
        setRows(prev => {
            const newRows: RowConfig[] = [];
            for (let r = 0; r < numRows; r++) {
                const prevRow = prev[r];
                const bInputs: FAInput[] = Array(numCols).fill(null).map((_, i) => 
                    prevRow?.bInputs[i] || { value: '0', invert: false }
                );
                const row: RowConfig = { cin: prevRow?.cin || '0', bInputs };
                if (r === 0) {
                    row.aInputs = Array(numCols).fill(null).map((_, i) => 
                        prevRow?.aInputs?.[i] || { value: '0', invert: false }
                    );
                }
                newRows.push(row);
            }
            return newRows;
        });
    }, [numRows, numCols]);

    const updateInput = (r: number, c: number, type: 'a' | 'b', field: 'value' | 'invert', val: any) => {
        const newRows = [...rows];
        if (type === 'a' && newRows[r].aInputs) {
            newRows[r].aInputs![c] = { ...newRows[r].aInputs![c], [field]: val };
        } else {
            newRows[r].bInputs[c] = { ...newRows[r].bInputs[c], [field]: val };
        }
        setRows(newRows);
    };

    const updateCin = (r: number, val: '0' | '1') => {
        const newRows = [...rows];
        newRows[r].cin = val;
        setRows(newRows);
    };

    // Evaluate the grid
    const evaluateGrid = (): FAState[][] => {
        const gridState: FAState[][] = [];
        for (let r = 0; r < numRows; r++) {
            gridState[r] = [];
            let currentCin = parseInt(rows[r].cin);
            
            // Iterate from LSB (numCols - 1) to MSB (0)
            for (let c = numCols - 1; c >= 0; c--) {
                let aVal = 0;
                if (r === 0) {
                    const aIn = rows[r].aInputs![c];
                    aVal = parseInt(aIn.value) ^ (aIn.invert ? 1 : 0);
                } else {
                    aVal = gridState[r-1][c].sum;
                }

                const bIn = rows[r].bInputs[c];
                const bVal = parseInt(bIn.value) ^ (bIn.invert ? 1 : 0);

                const sum = aVal ^ bVal ^ currentCin;
                const cout = (aVal & bVal) | (aVal & currentCin) | (bVal & currentCin);

                gridState[r][c] = { a: aVal, b: bVal, cin: currentCin, sum, cout };
                currentCin = cout;
            }
        }
        return gridState;
    };

    const isGridValid = numRows > 0 && numCols > 0 && rows.length === numRows && rows[0]?.bInputs.length === numCols;
    const gridState = isGridValid ? evaluateGrid() : null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-6 items-center">
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Number of Rows</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={5} 
                        value={numRowsInput} 
                        onChange={(e) => setNumRowsInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-24"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Bits per Row (Cols)</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={16} 
                        value={numColsInput} 
                        onChange={(e) => setNumColsInput(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 w-24"
                    />
                </div>
            </div>

            {gridState && (
                <div className="overflow-x-auto p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col items-center" style={{ minWidth: 'max-content' }}>
                        {rows.map((row, r) => (
                        <div key={r} className="flex relative mb-16">
                            {/* Carry Out from MSB */}
                            <div className="flex flex-col items-center justify-center mr-4">
                                <div className="text-xs font-mono text-orange-500 font-bold mb-1">Cout</div>
                                <div className="w-8 h-8 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold rounded-full border border-orange-300 dark:border-orange-700">
                                    {gridState[r][0].cout}
                                </div>
                                <div className="h-0.5 w-4 bg-slate-400 absolute left-8 top-1/2"></div>
                            </div>

                            {/* Full Adders */}
                            {Array.from({ length: numCols }).map((_, c) => (
                                <div key={c} className="flex flex-col items-center relative mx-4">
                                    {/* Inputs A and B */}
                                    <div className="flex gap-4 mb-4">
                                        {/* Input A */}
                                        <div className="flex flex-col items-center">
                                            {r === 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <select 
                                                        value={row.aInputs![c].value} 
                                                        onChange={(e) => updateInput(r, c, 'a', 'value', e.target.value)}
                                                        className="w-10 p-1 text-center border border-slate-300 rounded bg-white dark:bg-slate-800 dark:border-slate-600 font-mono"
                                                    >
                                                        <option value="0">0</option>
                                                        <option value="1">1</option>
                                                    </select>
                                                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={row.aInputs![c].invert}
                                                            onChange={(e) => updateInput(r, c, 'a', 'invert', e.target.checked)}
                                                        />
                                                        NOT
                                                    </label>
                                                    {row.aInputs![c].invert && (
                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-800 dark:border-slate-200 mt-1 flex items-center justify-center bg-white dark:bg-slate-800 z-10"></div>
                                                    )}
                                                    <div className="w-0.5 h-4 bg-slate-800 dark:bg-slate-200"></div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center h-full justify-end">
                                                    <div className="w-0.5 h-8 bg-blue-500"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input B */}
                                        <div className="flex flex-col items-center gap-1">
                                            <select 
                                                value={row.bInputs[c].value} 
                                                onChange={(e) => updateInput(r, c, 'b', 'value', e.target.value)}
                                                className="w-10 p-1 text-center border border-slate-300 rounded bg-white dark:bg-slate-800 dark:border-slate-600 font-mono"
                                            >
                                                <option value="0">0</option>
                                                <option value="1">1</option>
                                            </select>
                                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={row.bInputs[c].invert}
                                                    onChange={(e) => updateInput(r, c, 'b', 'invert', e.target.checked)}
                                                />
                                                NOT
                                            </label>
                                            {row.bInputs[c].invert && (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-800 dark:border-slate-200 mt-1 flex items-center justify-center bg-white dark:bg-slate-800 z-10"></div>
                                            )}
                                            <div className="w-0.5 h-4 bg-slate-800 dark:bg-slate-200"></div>
                                        </div>
                                    </div>

                                    {/* FA Box */}
                                    <div className="w-24 h-20 border-2 border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-lg relative z-10">
                                        FA
                                        {/* Internal values display */}
                                        <div className="absolute top-1 left-2 text-xs font-mono text-slate-500">A:{gridState[r][c].a}</div>
                                        <div className="absolute top-1 right-2 text-xs font-mono text-slate-500">B:{gridState[r][c].b}</div>
                                        <div className="absolute bottom-1 left-2 text-xs font-mono text-slate-500">Co:{gridState[r][c].cout}</div>
                                        <div className="absolute bottom-1 right-2 text-xs font-mono text-slate-500">S:{gridState[r][c].sum}</div>
                                    </div>

                                    {/* Carry In wire from right */}
                                    {c < numCols - 1 && (
                                        <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-400 flex items-center justify-center">
                                            <span className="absolute -top-4 text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-900 px-1">{gridState[r][c].cin}</span>
                                        </div>
                                    )}

                                    {/* Sum Output */}
                                    <div className="flex gap-4 w-24">
                                        <div className="flex flex-col items-center w-10">
                                            <div className="w-0.5 h-8 bg-blue-500"></div>
                                            {r === numRows - 1 && (
                                                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-full border border-blue-300 dark:border-blue-700">
                                                    {gridState[r][c].sum}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-10"></div>
                                    </div>
                                </div>
                            ))}

                            {/* Carry In for LSB */}
                            <div className="flex flex-col items-center justify-center ml-4 relative">
                                <div className="text-xs font-mono text-slate-500 font-bold mb-1">Cin</div>
                                <select 
                                    value={row.cin} 
                                    onChange={(e) => updateCin(r, e.target.value as '0' | '1')}
                                    className="w-12 p-1 text-center border border-slate-300 rounded bg-white dark:bg-slate-800 dark:border-slate-600 font-mono z-10"
                                >
                                    <option value="0">0</option>
                                    <option value="1">1</option>
                                </select>
                                <div className="h-0.5 w-4 bg-slate-400 absolute right-12 top-1/2"></div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </div>
    );
};
