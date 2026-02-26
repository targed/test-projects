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
            renderKMap();
            updateSolution();
        });

        solveModeSelect.addEventListener('change', () => {
            solver.setMode(solveModeSelect.value);
            updateSolution(); // Just resolve, grid doesn't change structure
        });

        resetBtn.addEventListener('click', () => {
            solver.reset();
            renderKMap(); // Re-render to clear cells
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

        // Labels
        const colGray = grayCodes[colVarsCount];
        const rowGray = grayCodes[rowVarsCount];

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
                // Determine actual binary index
                // Row bits are MSBs, Col bits are LSBs

                const rowBits = parseInt(rowGray[i], 2);
                const colBits = parseInt(colGray[j], 2);

                // Index = (RowBits << ColVarsCount) | ColBits
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
                    cell.firstChild.textContent = newVal === 2 ? 'X' : newVal; // Update text, keep span
                    updateSolution();
                    if (showTruthTable) renderTruthTable();
                });

                kmapGrid.appendChild(cell);
            }
        }
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

                // Update K-Map cell text
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
            // result.groups corresponds to terms in result.equation parts?
            // formatEquation logic in solver.js:
            // if SOP: join ' + '
            // if POS: join ')(', wrap in ()

            // We need to match groups to equation parts.
            // The solver returns 'groups' array.
            // formatEquation iterates over this array to produce the string.
            // So index i in groups corresponds to index i in the formatted parts.

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
                        separator.innerText = ''; // Implicit multiplication or none for POS as they are parenthesized
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

        groups.forEach((group, gIndex) => {
            const color = colors[gIndex % colors.length];
            // Get cells covered by this group
            // We need to map minterms back to (row, col)
            const minterms = group.getCoveredMinterms();

            // We need to find the bounding box(es) for these minterms.
            // Because of wrapping, a group might be split into multiple visual rectangles.

            // Map minterms to (row, col) coordinates
            const coords = minterms.map(m => {
                 // Inverse of index calculation
                 // index = (rowBits << colVarsCount) | colBits
                 // We need to match rowBits to row index, colBits to col index.

                 const rowBits = m >> colVarsCount;
                 const colBits = m & ((1 << colVarsCount) - 1);

                 // Find index in Gray Code arrays
                 // Gray Code arrays are defined in init scope... wait, need to access them.
                 // Let's move grayCodes out or recreate them.
                 const rowGrayArr = grayCodes[rowVarsCount];
                 const colGrayArr = grayCodes[colVarsCount];

                 const r = rowGrayArr.indexOf(rowBits.toString(2).padStart(rowVarsCount, '0'));
                 const c = colGrayArr.indexOf(colBits.toString(2).padStart(colVarsCount, '0'));

                 return {r, c};
            });

            // Group adjacent coordinates (handling wrapping) to form rectangles
            // A simple way to draw K-map groups is to draw a rect for each connected component.
            // Since K-map groups are always powers of 2 rectangles (possibly wrapped).

            // Identify connected sub-groups on the 2D grid.
            // A group can be:
            // 1. A single rectangle.
            // 2. Wrapped horizontally (left & right edges).
            // 3. Wrapped vertically (top & bottom edges).
            // 4. Wrapped corners (4 corners).

            // Strategy:
            // 1. Detect if it wraps horizontally: check if min min-col and max max-col are at edges (0 and cols-1) AND there is a gap in between?
            // Better: Iterate through the grid and find clusters.

            // Let's classify the shape.
            const minR = Math.min(...coords.map(p => p.r));
            const maxR = Math.max(...coords.map(p => p.r));
            const minC = Math.min(...coords.map(p => p.c));
            const maxC = Math.max(...coords.map(p => p.c));

            // Check for wrapping
            const wrapsRow = (maxR - minR + 1) !== new Set(coords.map(p => p.r)).size; // Simple heuristic? No.
            // If we have indices 0 and 3 in a 4-row grid, and not 1 and 2, it wraps.

            // Let's create a 2D map of the group
            const map = Array(rows).fill(0).map(() => Array(cols).fill(0));
            coords.forEach(p => map[p.r][p.c] = 1);

            // Identify rectangles
            // A group in K-Map is essentially one logical rectangle on the torus.
            // Visually it splits.

            const rectangles = [];

            // Naive approach: Find a '1', expand rectangle as much as possible, mark visited, repeat.
            // Since we know the structure of Prime Implicants, they are always rectangular blocks (on torus).
            // If we split the torus, we get at most 4 rectangles (corners).

            const visited = new Set();

            coords.forEach(p => {
                const key = `${p.r},${p.c}`;
                if (visited.has(key)) return;

                // Start a new rectangle here
                // Expand Right
                let w = 1;
                while (p.c + w < cols && map[p.r][p.c + w]) w++;

                // Expand Down
                let h = 1;
                let valid = true;
                while (p.r + h < rows) {
                    // Check if whole row segment matches
                    for (let k = 0; k < w; k++) {
                        if (!map[p.r + h][p.c + k]) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) break;
                    h++;
                }

                // Add rectangle
                rectangles.push({r: p.r, c: p.c, w, h});

                // Mark covered as visited
                for(let i=0; i<h; i++) {
                    for(let j=0; j<w; j++) {
                        visited.add(`${p.r + i},${p.c + j}`);
                    }
                }
            });

            // Draw rectangles
            rectangles.forEach(rect => {
                const svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                // Cell size is 60px.
                // Add some padding/margin to make it look like a circle/rounded rect
                const padding = 5;
                const x = rect.c * 60 + padding;
                const y = rect.r * 60 + padding;
                const width = rect.w * 60 - 2 * padding;
                const height = rect.h * 60 - 2 * padding;

                svgRect.setAttribute("x", x);
                svgRect.setAttribute("y", y);
                svgRect.setAttribute("width", width);
                svgRect.setAttribute("height", height);
                svgRect.setAttribute("rx", 20); // Rounded corners
                svgRect.setAttribute("ry", 20);
                svgRect.setAttribute("fill", "none");
                svgRect.setAttribute("stroke", color);
                svgRect.setAttribute("stroke-width", "4");
                svgRect.setAttribute("stroke-opacity", "0.8");

                kmapOverlay.appendChild(svgRect);
            });
        });
    }

    init();
});
