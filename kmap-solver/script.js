document.addEventListener('DOMContentLoaded', () => {
    // Check if KMapSolver is loaded
    if (typeof KMapSolver === 'undefined') {
        console.error('KMapSolver class not found. Ensure solver.js is loaded first.');
        return;
    }

    const varCountSelect = document.getElementById('var-count');
    const solveModeSelect = document.getElementById('solve-mode');
    const resetBtn = document.getElementById('reset-btn');
    const toggleIndicesBtn = document.getElementById('toggle-indices');
    const toggleTruthTableBtn = document.getElementById('toggle-truth-table');
    const kmapGrid = document.getElementById('kmap-grid');
    const equationDisplay = document.getElementById('equation-display');
    const kmapOverlay = document.getElementById('kmap-overlay');
    const truthTableContainer = document.getElementById('truth-table-container');
    const truthTable = document.getElementById('truth-table');

    let solver = new KMapSolver(parseInt(varCountSelect.value));
    let showIndices = true;
    let showTruthTable = false;
    let rowOffset = 0;
    let colOffset = 0;

    // Gray Code sequences for headers
    // 2 vars: 0, 1
    // 3 vars: 00, 01, 11, 10
    const grayCodes = {
        1: ['0', '1'],
        2: ['00', '01', '11', '10'],
        3: ['000', '001', '011', '010', '110', '111', '101', '100']
    };

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];

    function init() {
        renderKMap();
        updateSolution();

        // Event Listeners
        varCountSelect.addEventListener('change', () => {
            solver = new KMapSolver(parseInt(varCountSelect.value));
            solver.setMode(solveModeSelect.value);
            rowOffset = 0;
            colOffset = 0;
            renderKMap();
            updateSolution();
        });

        solveModeSelect.addEventListener('change', () => {
            solver.setMode(solveModeSelect.value);
            updateSolution();
        });

        resetBtn.addEventListener('click', () => {
            solver.reset();
            renderKMap();
            updateSolution();
        });

        toggleIndicesBtn.addEventListener('click', () => {
            showIndices = !showIndices;
            document.querySelectorAll('.cell-index').forEach(el => {
                el.style.display = showIndices ? 'block' : 'none';
            });
        });

        toggleTruthTableBtn.addEventListener('click', () => {
            showTruthTable = !showTruthTable;
            truthTableContainer.classList.toggle('hidden', !showTruthTable);
            if (showTruthTable) renderTruthTable();
        });
    }

    function rotateArray(arr, offset) {
        // offset > 0: shift right (last to first)
        // offset < 0: shift left (first to last)
        const len = arr.length;
        const normalizedOffset = ((offset % len) + len) % len;
        if (normalizedOffset === 0) return [...arr];
        return [...arr.slice(len - normalizedOffset), ...arr.slice(0, len - normalizedOffset)];
    }

    function renderKMap() {
        const numVars = solver.numVars;
        kmapGrid.innerHTML = '';
        kmapOverlay.innerHTML = ''; // Clear SVG overlay

        // Determine Rows and Columns
        let rowVarsCount, colVarsCount;
        if (numVars === 2) { rowVarsCount = 1; colVarsCount = 1; }
        else if (numVars === 3) { rowVarsCount = 1; colVarsCount = 2; }
        else if (numVars === 4) { rowVarsCount = 2; colVarsCount = 2; }
        else if (numVars === 5) { rowVarsCount = 2; colVarsCount = 3; }

        const rows = 1 << rowVarsCount;
        const cols = 1 << colVarsCount;

        // Set grid template
        kmapGrid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
        kmapGrid.style.gridTemplateRows = `repeat(${rows}, 60px)`;

        // Labels (rotated)
        const colGray = rotateArray(grayCodes[colVarsCount], colOffset);
        const rowGray = rotateArray(grayCodes[rowVarsCount], rowOffset);

        // --- Rotation Controls ---
        // Left Arrow
        const leftBtn = createRotateBtn('◀', () => { colOffset--; renderKMap(); updateSolution(); });
        leftBtn.style.left = '-30px';
        leftBtn.style.top = '50%';
        leftBtn.style.transform = 'translateY(-50%)';
        kmapGrid.appendChild(leftBtn);

        // Right Arrow
        const rightBtn = createRotateBtn('▶', () => { colOffset++; renderKMap(); updateSolution(); });
        rightBtn.style.right = '-30px';
        rightBtn.style.top = '50%';
        rightBtn.style.transform = 'translateY(-50%)';
        kmapGrid.appendChild(rightBtn);

        // Up Arrow
        const upBtn = createRotateBtn('▲', () => { rowOffset--; renderKMap(); updateSolution(); });
        upBtn.style.top = '-30px';
        upBtn.style.left = '50%';
        upBtn.style.transform = 'translateX(-50%)';
        kmapGrid.appendChild(upBtn);

        // Down Arrow
        const downBtn = createRotateBtn('▼', () => { rowOffset++; renderKMap(); updateSolution(); });
        downBtn.style.bottom = '-30px';
        downBtn.style.left = '50%';
        downBtn.style.transform = 'translateX(-50%)';
        kmapGrid.appendChild(downBtn);


        // Column Labels
        for (let j = 0; j < cols; j++) {
            const label = document.createElement('div');
            label.className = 'kmap-label';
            label.innerText = colGray[j];
            label.style.width = '60px';
            label.style.height = '30px';
            label.style.left = `${j * 60}px`;
            label.style.top = '-30px'; // Above grid
            kmapGrid.appendChild(label);
        }

        // Row Labels
        for (let i = 0; i < rows; i++) {
            const label = document.createElement('div');
            label.className = 'kmap-label';
            label.innerText = rowGray[i];
            label.style.width = '40px';
            label.style.height = '60px';
            label.style.left = '-45px'; // Left of grid
            label.style.top = `${i * 60}px`;
            kmapGrid.appendChild(label);
        }

        // Variable Names Label (Top-Left Corner)
        const cornerLabel = document.createElement('div');
        cornerLabel.className = 'kmap-label';
        const vars = "ABCDE".substring(0, numVars);
        const rowVars = vars.substring(0, rowVarsCount);
        const colVars = vars.substring(rowVarsCount);
        cornerLabel.innerText = `${rowVars}\\${colVars}`;
        cornerLabel.style.left = '-60px';
        cornerLabel.style.top = '-30px';
        kmapGrid.appendChild(cornerLabel);


        // Generate Cells
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Determine actual binary index using ROTATED labels
                const rowBits = parseInt(rowGray[i], 2);
                const colBits = parseInt(colGray[j], 2);
                const index = (rowBits << colVarsCount) | colBits;

                const cell = document.createElement('div');
                cell.className = 'kmap-cell';
                cell.dataset.index = index;
                cell.dataset.row = i;
                cell.dataset.col = j;

                // Get current value
                const val = solver.getGridValue(index);
                cell.innerText = val === 2 ? 'X' : val;

                // Add index
                const idxSpan = document.createElement('span');
                idxSpan.className = 'cell-index';
                idxSpan.innerText = index;
                if (!showIndices) idxSpan.style.display = 'none';
                cell.appendChild(idxSpan);

                cell.addEventListener('click', () => {
                    const newVal = solver.toggleGridValue(index);
                    cell.firstChild.textContent = newVal === 2 ? 'X' : newVal;
                    updateSolution();
                    if (showTruthTable) renderTruthTable();
                });

                kmapGrid.appendChild(cell);
            }
        }
    }

    function createRotateBtn(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'rotate-btn';
        btn.innerText = text;
        btn.onclick = onClick;
        return btn;
    }

    function renderTruthTable() {
        const numVars = solver.numVars;
        const vars = "ABCDE".substring(0, numVars);
        const size = 1 << numVars;

        let html = '<table><thead><tr>';
        for (let char of vars) {
            html += `<th>${char}</th>`;
        }
        html += '<th>F</th></tr></thead><tbody>';

        for (let i = 0; i < size; i++) {
            html += `<tr>`;
            // Binary representation of i
            for (let b = numVars - 1; b >= 0; b--) {
                html += `<td>${(i >> b) & 1}</td>`;
            }

            const val = solver.getGridValue(i);
            const displayVal = val === 2 ? 'X' : val;

            // Allow clicking truth table output to toggle
            html += `<td class="tt-output" data-index="${i}" style="cursor:pointer; background-color: #fff;">${displayVal}</td>`;
            html += `</tr>`;
        }
        html += '</tbody></table>';

        truthTable.innerHTML = html;

        // Add listeners to truth table outputs
        document.querySelectorAll('.tt-output').forEach(td => {
            td.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newVal = solver.toggleGridValue(index);
                e.target.innerText = newVal === 2 ? 'X' : newVal;

                // Update K-Map cell text (find cell by data-index)
                // Note: With rotation, the cell at (0,0) is not index 0.
                // But data-index is correct on the cell.
                const kmapCell = document.querySelector(`.kmap-cell[data-index="${index}"]`);
                if (kmapCell) {
                    kmapCell.childNodes[0].textContent = newVal === 2 ? 'X' : newVal;
                }
                updateSolution();
            });
        });
    }

    function updateSolution() {
        const result = solver.solve();

        // Render Color-Mapped Equation
        equationDisplay.innerHTML = ''; // Clear

        const prefix = document.createElement('span');
        prefix.innerText = `${solver.mode} = `;
        prefix.style.color = '#333';
        equationDisplay.appendChild(prefix);

        if (result.groups.length === 0) {
             const span = document.createElement('span');
             span.innerText = result.equation;
             equationDisplay.appendChild(span);
        } else if (result.equation === '1' || result.equation === '0') {
             const span = document.createElement('span');
             span.innerText = result.equation;
             equationDisplay.appendChild(span);
        } else {
            result.groups.forEach((group, index) => {
                const termStr = solver.getTermString(group);
                const color = colors[index % colors.length];

                const span = document.createElement('span');
                span.style.color = color;

                if (solver.mode === 'POS' && result.groups.length > 1) {
                     span.innerText = `(${termStr})`;
                } else {
                     span.innerText = termStr;
                }

                equationDisplay.appendChild(span);

                if (index < result.groups.length - 1) {
                    const separator = document.createElement('span');
                    separator.style.color = '#333';
                    if (solver.mode === 'SOP') {
                        separator.innerText = ' + ';
                    } else {
                        separator.innerText = '';
                    }
                    equationDisplay.appendChild(separator);
                }
            });
        }

        drawGroupings(result.groups);
    }

    function drawGroupings(groups) {
        kmapOverlay.innerHTML = '';
        const numVars = solver.numVars;

        let rowVarsCount, colVarsCount;
        if (numVars === 2) { rowVarsCount = 1; colVarsCount = 1; }
        else if (numVars === 3) { rowVarsCount = 1; colVarsCount = 2; }
        else if (numVars === 4) { rowVarsCount = 2; colVarsCount = 2; }
        else if (numVars === 5) { rowVarsCount = 2; colVarsCount = 3; }

        const rows = 1 << rowVarsCount;
        const cols = 1 << colVarsCount;

        // Rotated Gray Codes
        const colGray = rotateArray(grayCodes[colVarsCount], colOffset);
        const rowGray = rotateArray(grayCodes[rowVarsCount], rowOffset);

        groups.forEach((group, gIndex) => {
            const color = colors[gIndex % colors.length];
            const minterms = group.getCoveredMinterms();

            // Map minterms to (row, col) coordinates using ROTATED labels
            const coords = minterms.map(m => {
                 const rowBits = m >> colVarsCount;
                 const colBits = m & ((1 << colVarsCount) - 1);

                 // Look up in Rotated Arrays
                 const r = rowGray.indexOf(rowBits.toString(2).padStart(rowVarsCount, '0'));
                 const c = colGray.indexOf(colBits.toString(2).padStart(colVarsCount, '0'));

                 return {r, c};
            });

            // Sort coordinates
            coords.sort((a, b) => {
                if (a.r !== b.r) return a.r - b.r;
                return a.c - b.c;
            });

            // 1. Identify Rectangles
            const rectangles = [];
            const map = Array(rows).fill(0).map(() => Array(cols).fill(0));
            coords.forEach(p => map[p.r][p.c] = 1);
            const visited = new Set();

            coords.forEach(p => {
                const key = `${p.r},${p.c}`;
                if (visited.has(key)) return;

                // Expand Right
                let w = 1;
                while (p.c + w < cols && map[p.r][p.c + w]) w++;

                // Expand Down
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

            // 2. Determine if the group wraps
            const hasLeft = coords.some(p => p.c === 0);
            const hasRight = coords.some(p => p.c === cols - 1);
            const hasTop = coords.some(p => p.r === 0);
            const hasBottom = coords.some(p => p.r === rows - 1);

            const isWrapping = rectangles.length > 1;

            rectangles.forEach(rect => {
                const sides = [true, true, true, true]; // Top, Right, Bottom, Left

                if (isWrapping) {
                    if (rect.c === 0 && hasRight) sides[3] = false;
                    if (rect.c + rect.w === cols && hasLeft) sides[1] = false;
                    if (rect.r === 0 && hasBottom) sides[0] = false;
                    if (rect.r + rect.h === rows && hasTop) sides[2] = false;
                }

                drawRect(rect, color, sides);
            });
        });
    }

    function drawRect(rect, color, sides) {
        // ... (Same drawing logic as before) ...
        const padding = 5;
        const cellSize = 60;
        const r = 20;

        let x = rect.c * cellSize + padding;
        let y = rect.r * cellSize + padding;
        let w = rect.w * cellSize - 2 * padding;
        let h = rect.h * cellSize - 2 * padding;

        if (!sides[3]) { x -= padding; w += padding; }
        if (!sides[1]) { w += padding; }
        if (!sides[0]) { y -= padding; h += padding; }
        if (!sides[2]) { h += padding; }

        let d = "";

        // Start Top-Left
        if (sides[3] && sides[0]) {
             d += `M ${x} ${y+r} A ${r} ${r} 0 0 1 ${x+r} ${y}`;
        } else if (!sides[3] && sides[0]) {
             d += `M ${x} ${y}`;
        } else if (sides[3] && !sides[0]) {
             d += `M ${x} ${y}`;
        } else {
             d += `M ${x} ${y}`;
        }

        // Top Edge
        if (sides[0]) {
            if (sides[1]) d += ` L ${x+w-r} ${y}`;
            else d += ` L ${x+w} ${y}`;
        } else {
             d += ` M ${x+w} ${y}`;
        }

        // Top-Right Corner
        if (sides[0] && sides[1]) {
            d += ` A ${r} ${r} 0 0 1 ${x+w} ${y+r}`;
        }

        // Right Edge
        if (sides[1]) {
            if (sides[2]) d += ` L ${x+w} ${y+h-r}`;
            else d += ` L ${x+w} ${y+h}`;
        } else {
            d += ` M ${x+w} ${y+h}`;
        }

        // Bottom-Right Corner
        if (sides[1] && sides[2]) {
            d += ` A ${r} ${r} 0 0 1 ${x+w-r} ${y+h}`;
        }

        // Bottom Edge
        if (sides[2]) {
            if (sides[3]) d += ` L ${x+r} ${y+h}`;
            else d += ` L ${x} ${y+h}`;
        } else {
             d += ` M ${x} ${y+h}`;
        }

        // Bottom-Left Corner
        if (sides[2] && sides[3]) {
            d += ` A ${r} ${r} 0 0 1 ${x} ${y+h-r}`;
        }

        // Left Edge
        if (sides[3]) {
            if (sides[0]) d += ` L ${x} ${y+r}`;
            else d += ` L ${x} ${y}`;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "4");
        path.setAttribute("stroke-opacity", "0.8");

        kmapOverlay.appendChild(path);
    }

    init();
});
