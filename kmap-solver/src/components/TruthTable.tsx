import React from 'react';

interface TruthTableProps {
    numVars: number;
    grid: number[];
    onToggle: (index: number) => void;
}

export const TruthTable: React.FC<TruthTableProps> = ({ numVars, grid, onToggle }) => {
    const vars = "ABCDE".substring(0, numVars);
    const size = 1 << numVars;

    const rows = [];
    for (let i = 0; i < size; i++) {
        const val = grid[i];
        const displayVal = val === 2 ? 'X' : val;

        const cells = [];
        for (let b = numVars - 1; b >= 0; b--) {
            cells.push(
                <td key={`v-${b}`} className="border border-slate-300 dark:border-slate-600 p-2 text-center text-slate-800 dark:text-gray-200">
                    {(i >> b) & 1}
                </td>
            );
        }

        cells.push(
            <td
                key="output"
                className="border border-slate-300 dark:border-slate-600 p-2 text-center cursor-pointer bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-gray-100 transition-colors"
                onClick={() => onToggle(i)}
            >
                {displayVal}
            </td>
        );

        rows.push(
            <tr key={i} className="even:bg-gray-50 dark:even:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                {cells}
            </tr>
        );
    }

    return (
        <div className="border-l border-slate-200 dark:border-slate-700 pl-6 max-h-[500px] overflow-y-auto w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4 text-center text-slate-800 dark:text-gray-100">Truth Table</h3>
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {vars.split('').map(v => (
                            <th key={v} className="border border-slate-300 dark:border-slate-600 p-2 bg-slate-100 dark:bg-slate-700 text-center text-slate-800 dark:text-gray-200">{v}</th>
                        ))}
                        <th className="border border-slate-300 dark:border-slate-600 p-2 bg-slate-100 dark:bg-slate-700 text-center text-slate-800 dark:text-gray-200">F</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    );
};
