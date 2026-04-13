import React from 'react';

interface KMapProps {
    numVars: number;
    grid: number[];
    onToggle: (index: number) => void;
    showIndices: boolean;
    rowOffset: number;
    colOffset: number;
    groups: any[];
    onRowOffsetChange: (offset: number) => void;
    onColOffsetChange: (offset: number) => void;
    varNames?: string[];
}

const grayCodes: Record<number, string[]> = {
    1: ['0', '1'],
    2: ['00', '01', '11', '10'],
    3: ['000', '001', '011', '010', '110', '111', '101', '100']
};

function rotateArray<T>(arr: T[], offset: number): T[] {
    const len = arr.length;
    const normalizedOffset = ((offset % len) + len) % len;
    if (normalizedOffset === 0) return [...arr];
    return [...arr.slice(len - normalizedOffset), ...arr.slice(0, len - normalizedOffset)];
}

export const KMap: React.FC<KMapProps> = ({ numVars, grid, onToggle, showIndices, rowOffset, colOffset, groups, onRowOffsetChange, onColOffsetChange, varNames }) => {
    let rowVarsCount = 1, colVarsCount = 1;
    if (numVars === 3) { colVarsCount = 2; }
    else if (numVars === 4) { rowVarsCount = 2; colVarsCount = 2; }
    else if (numVars === 5) { rowVarsCount = 2; colVarsCount = 3; }

    const rows = 1 << rowVarsCount;
    const cols = 1 << colVarsCount;

    const colGray = rotateArray(grayCodes[colVarsCount], colOffset);
    const rowGray = rotateArray(grayCodes[rowVarsCount], rowOffset);

    const vars = varNames ? varNames.join('') : "ABCDE".substring(0, numVars);
    const rowVars = vars.substring(0, rowVarsCount);
    const colVars = vars.substring(rowVarsCount);

    const cellSize = 60;
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];

    const renderOverlay = () => {
        const paths: React.JSX.Element[] = [];

        groups.forEach((group, gIndex) => {
            const color = colors[gIndex % colors.length];
            const minterms = group.getCoveredMinterms();

            const coords = minterms.map((m: number) => {
                 const rowBits = m >> colVarsCount;
                 const colBits = m & ((1 << colVarsCount) - 1);
                 const r = rowGray.indexOf(rowBits.toString(2).padStart(rowVarsCount, '0'));
                 const c = colGray.indexOf(colBits.toString(2).padStart(colVarsCount, '0'));
                 return {r, c};
            });

            coords.sort((a: any, b: any) => {
                if (a.r !== b.r) return a.r - b.r;
                return a.c - b.c;
            });

            const rectangles: any[] = [];
            const map = Array(rows).fill(0).map(() => Array(cols).fill(0));
            coords.forEach((p: any) => map[p.r][p.c] = 1);
            const visited = new Set<string>();

            coords.forEach((p: any) => {
                const key = `${p.r},${p.c}`;
                if (visited.has(key)) return;

                let w = 1;
                while (p.c + w < cols && map[p.r][p.c + w]) w++;

                let h = 1;
                let valid = true;
                while (p.r + h < rows) {
                    for (let k = 0; k < w; k++) {
                        if (!map[p.r + h][p.c + k]) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) break;
                    h++;
                }

                rectangles.push({r: p.r, c: p.c, w, h});

                for(let i=0; i<h; i++) {
                    for(let j=0; j<w; j++) {
                        visited.add(`${p.r + i},${p.c + j}`);
                    }
                }
            });

            const hasLeft = coords.some((p: any) => p.c === 0);
            const hasRight = coords.some((p: any) => p.c === cols - 1);
            const hasTop = coords.some((p: any) => p.r === 0);
            const hasBottom = coords.some((p: any) => p.r === rows - 1);
            const isWrapping = rectangles.length > 1;

            rectangles.forEach((rect, rIndex) => {
                const sides = [true, true, true, true]; // Top, Right, Bottom, Left

                if (isWrapping) {
                    if (rect.c === 0 && hasRight) sides[3] = false;
                    if (rect.c + rect.w === cols && hasLeft) sides[1] = false;
                    if (rect.r === 0 && hasBottom) sides[0] = false;
                    if (rect.r + rect.h === rows && hasTop) sides[2] = false;
                }

                const padding = Math.min(25, 4 + (gIndex * 4));

                let x = rect.c * cellSize + padding;
                let y = rect.r * cellSize + padding;
                let w = rect.w * cellSize - 2 * padding;
                let h = rect.h * cellSize - 2 * padding;

                if (!sides[3]) { x -= padding; w += padding; }
                if (!sides[1]) { w += padding; }
                if (!sides[0]) { y -= padding; h += padding; }
                if (!sides[2]) { h += padding; }

                const r = Math.min(15, w / 2, h / 2);

                let d = "";

                if (sides[3] && sides[0]) {
                     d += `M ${x} ${y+r} A ${r} ${r} 0 0 1 ${x+r} ${y}`;
                } else {
                     d += `M ${x} ${y}`;
                }

                if (sides[0]) {
                    if (sides[1]) d += ` L ${x+w-r} ${y}`;
                    else d += ` L ${x+w} ${y}`;
                } else {
                     d += ` M ${x+w} ${y}`;
                }

                if (sides[0] && sides[1]) d += ` A ${r} ${r} 0 0 1 ${x+w} ${y+r}`;

                if (sides[1]) {
                    if (sides[2]) d += ` L ${x+w} ${y+h-r}`;
                    else d += ` L ${x+w} ${y+h}`;
                } else {
                    d += ` M ${x+w} ${y+h}`;
                }

                if (sides[1] && sides[2]) d += ` A ${r} ${r} 0 0 1 ${x+w-r} ${y+h}`;

                if (sides[2]) {
                    if (sides[3]) d += ` L ${x+r} ${y+h}`;
                    else d += ` L ${x} ${y+h}`;
                } else {
                     d += ` M ${x} ${y+h}`;
                }

                if (sides[2] && sides[3]) d += ` A ${r} ${r} 0 0 1 ${x} ${y+h-r}`;

                if (sides[3]) {
                    if (sides[0]) d += ` L ${x} ${y+r}`;
                    else d += ` L ${x} ${y}`;
                }

                paths.push(
                    <path
                        key={`${gIndex}-${rIndex}`}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeOpacity="0.8"
                    />
                );
            });
        });

        return <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">{paths}</svg>;
    };

    const cells = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const rowBits = parseInt(rowGray[i], 2);
            const colBits = parseInt(colGray[j], 2);
            const index = (rowBits << colVarsCount) | colBits;
            const val = grid[index];

            cells.push(
                <div
                    key={index}
                    className="w-[60px] h-[60px] border border-slate-300 dark:border-slate-600 flex justify-center items-center text-2xl cursor-pointer relative select-none bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-100 transition-colors"
                    onClick={() => onToggle(index)}
                >
                    {val === 2 ? 'X' : val}
                    {showIndices && (
                        <span className="absolute bottom-0.5 right-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                            {index}
                        </span>
                    )}
                </div>
            );
        }
    }

    return (
        <div className="relative inline-block m-8">
            {/* Corner Label */}
            <div className="absolute -top-8 -left-12 text-sm font-bold w-12 text-right text-slate-800 dark:text-gray-200">
                {rowVars}\{colVars}
            </div>

            {/* Column Labels */}
            {colGray.map((label, j) => (
                <div key={`col-${j}`} className="absolute -top-8 text-sm font-bold flex justify-center items-center h-8 text-slate-800 dark:text-gray-200" style={{ left: j * 60, width: 60 }}>
                    {label}
                </div>
            ))}

            {/* Row Labels */}
            {rowGray.map((label, i) => (
                <div key={`row-${i}`} className="absolute -left-10 text-sm font-bold flex justify-center items-center w-8 text-slate-800 dark:text-gray-200" style={{ top: i * 60, height: 60 }}>
                    {label}
                </div>
            ))}

            {/* Rotation Controls */}
            <button className="absolute top-1/2 -left-16 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-110 transition-transform" onClick={() => onColOffsetChange(colOffset - 1)}>◀</button>
            <button className="absolute top-1/2 -right-8 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-110 transition-transform" onClick={() => onColOffsetChange(colOffset + 1)}>▶</button>
            <button className="absolute -top-14 left-1/2 -translate-x-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-110 transition-transform" onClick={() => onRowOffsetChange(rowOffset - 1)}>▲</button>
            <button className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-110 transition-transform" onClick={() => onRowOffsetChange(rowOffset + 1)}>▼</button>

            <div
                className="grid border-2 border-gray-800 dark:border-gray-400 relative"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 60px)`,
                    gridTemplateRows: `repeat(${rows}, 60px)`
                }}
            >
                {cells}
                {renderOverlay()}
            </div>
        </div>
    );
};
