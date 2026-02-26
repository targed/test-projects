// Test the K-Map Solver
const { KMapSolver } = require('./solver.js');

console.log('=== Testing K-Map Solver ===\n');

// Test 1: 4-variable K-map with 4 ones in upper right corner
console.log('Test 1: 4-var K-map, upper right corner (4 ones)');
console.log('Expected: One group of 4, equation should be AB');
const solver1 = new KMapSolver(4);
solver1.setMode('SOP');

// Upper right in a 4x4 K-map (Gray code: rows 00,01,11,10 cols 00,01,11,10)
// AB\CD  00  01  11  10
//   00    -   -   -   -
//   01    -   -   1   1  (AB=01, CD=11 is index 0111=7, CD=10 is 0110=6)
//   11    -   -   1   1  (AB=11, CD=11 is index 1111=15, CD=10 is 1110=14)
//   10    -   -   -   -

// These form a group where A varies (0->1 in positions 1,3), B=1, C=1, D varies
// Wait, let me recalculate the indices properly

// For 4 vars ABCD:
// Row represents AB (high bits), Col represents CD (low bits)
// Gray code for 2 bits: 00, 01, 11, 10 (indices 0,1,2,3 in gray code order)

// Upper right corner visually would be:
// Row index 0,1 (AB gray: 00, 01) and Col index 2,3 (CD gray: 11, 10)
// But we need the actual binary values:
// Gray[0] = 00 (binary 0), Gray[1] = 01 (binary 1), Gray[2] = 11 (binary 3), Gray[3] = 10 (binary 2)

// So:
// Row Gray[0]=00 (A=0,B=0), Col Gray[2]=11 (C=1,D=1): index = 0011 = 3
// Row Gray[0]=00 (A=0,B=0), Col Gray[3]=10 (C=1,D=0): index = 0010 = 2  
// Row Gray[1]=01 (A=0,B=1), Col Gray[2]=11 (C=1,D=1): index = 0111 = 7
// Row Gray[1]=01 (A=0,B=1), Col Gray[3]=10 (C=1,D=0): index = 0110 = 6

solver1.setGridValue(2, 1);
solver1.setGridValue(3, 1);
solver1.setGridValue(6, 1);
solver1.setGridValue(7, 1);

const result1 = solver1.solve();
console.log('Equation:', result1.equation);
console.log('Number of groups:', result1.groups.length);
result1.groups.forEach((g, i) => {
    console.log(`  Group ${i}:`, solver1.getTermString(g), '- covers minterms:', g.getCoveredMinterms());
});
console.log();

// Test 2: 3-variable K-map with the reported pattern
console.log('Test 2: 3-var K-map - 4 ones on right, 2 ones on left, 2 zeros in middle left');
console.log('BC\\A   0   1');
console.log('00     1   1  (indices 0, 4)');
console.log('01     0   1  (indices 1, 5)');
console.log('11     0   1  (indices 3, 7)');
console.log('10     1   1  (indices 2, 6)');

const solver2 = new KMapSolver(3);
solver2.setMode('SOP');

// Setting up the grid
solver2.setGridValue(0, 1); // BC=00, A=0
solver2.setGridValue(4, 1); // BC=00, A=1
solver2.setGridValue(1, 0); // BC=01, A=0
solver2.setGridValue(5, 1); // BC=01, A=1
solver2.setGridValue(3, 0); // BC=11, A=0
solver2.setGridValue(7, 1); // BC=11, A=1
solver2.setGridValue(2, 1); // BC=10, A=0
solver2.setGridValue(6, 1); // BC=10, A=1

const result2 = solver2.solve();
console.log('Equation:', result2.equation);
console.log('Number of groups:', result2.groups.length);
result2.groups.forEach((g, i) => {
    console.log(`  Group ${i}:`, solver2.getTermString(g), '- covers minterms:', g.getCoveredMinterms());
});
console.log();

// Test 3: Simple 2-variable case
console.log('Test 3: 2-var K-map with all ones (should give equation = 1)');
const solver3 = new KMapSolver(2);
solver3.setMode('SOP');
solver3.setGridValue(0, 1);
solver3.setGridValue(1, 1);
solver3.setGridValue(2, 1);
solver3.setGridValue(3, 1);

const result3 = solver3.solve();
console.log('Equation:', result3.equation);
console.log('Number of groups:', result3.groups.length);
console.log();

console.log('=== Tests Complete ===');
