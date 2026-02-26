class KMapSolver {
    constructor(numVars) {
        this.numVars = numVars;
        // Total number of cells is 2^numVars
        this.size = 1 << numVars;
        // The grid state: 0, 1, or 2 (representing 'x' for don't care)
        // Default to all 0s
        this.grid = new Array(this.size).fill(0);
        this.mode = 'SOP'; // 'SOP' or 'POS'
    }

    setMode(mode) {
        this.mode = mode;
    }

    setGridValue(index, value) {
        if (index >= 0 && index < this.size) {
            this.grid[index] = value;
        }
    }

    getGridValue(index) {
        return this.grid[index];
    }

    toggleGridValue(index) {
        // Toggle sequence: 0 -> 1 -> x (2) -> 0
        const current = this.grid[index];
        this.grid[index] = (current + 1) % 3;
        return this.grid[index];
    }

    reset() {
        this.grid.fill(0);
    }

    /**
     * Get minterms and don't cares based on current mode
     * For SOP: minterms are 1s, don't cares are xs
     * For POS: maxterms are 0s (treated as minterms for logic), don't cares are xs
     */
    getInputTerms() {
        const terms = [];
        const dontCares = [];

        for (let i = 0; i < this.size; i++) {
            if (this.grid[i] === 2) { // Don't Care
                dontCares.push(i);
            } else if (this.mode === 'SOP' && this.grid[i] === 1) {
                terms.push(i);
            } else if (this.mode === 'POS' && this.grid[i] === 0) {
                // For POS, we solve for 0s as if they were 1s, then invert the result
                terms.push(i);
            }
        }
        return { terms, dontCares };
    }

    /**
     * Solves the K-Map using Quine-McCluskey Algorithm
     */
    solve() {
        const { terms, dontCares } = this.getInputTerms();

        // Combine terms and don't cares for finding prime implicants
        const allTerms = [...terms, ...dontCares].sort((a, b) => a - b);

        if (allTerms.length === 0) {
            return {
                equation: this.mode === 'SOP' ? '0' : '1',
                groups: []
            };
        }

        // Check if no terms need covering
        if (terms.length === 0) {
             // If we are looking for 1s (SOP) and find none, result is 0.
             // If we are looking for 0s (POS) and find none, result is 1 (function is always 1).
             return {
                 equation: this.mode === 'SOP' ? '0' : '1',
                 groups: []
             };
        }

        // Check for full map (always true)
        // If SOP and all cells are 1 or x (and at least one 1), result is 1.
        // If POS and all cells are 0 or x (and at least one 0), result is 0.
        // Actually, let the algorithm handle it, except the case where it simplifies to 1 or 0.

        // 1. Find Prime Implicants
        const primeImplicants = this.getPrimeImplicants(allTerms);

        // 2. Filter Prime Implicants to cover all required terms (Essential Prime Implicants + optimization)
        // We only need to cover 'terms', not 'dontCares'.
        const solution = this.getMinimalCover(primeImplicants, terms);

        // 3. Format the output equation
        const equation = this.formatEquation(solution);

        return {
            equation: equation,
            groups: solution
        };
    }

    // --- Quine-McCluskey Implementation ---

    getPrimeImplicants(minterms) {
        // Group minterms by number of 1s in binary representation
        let groups = Array.from({ length: this.numVars + 1 }, () => []);

        minterms.forEach(m => {
            const ones = this.countSetBits(m);
            groups[ones].push(new Implicant(m, this.numVars));
        });

        const primeImplicants = [];

        let merging = true;
        while (merging) {
            merging = false;
            const newGroups = Array.from({ length: this.numVars + 1 }, () => []);
            const used = new Set();

            for (let i = 0; i < groups.length - 1; i++) {
                for (let imp1 of groups[i]) {
                    for (let imp2 of groups[i+1]) {
                        const merged = imp1.merge(imp2);
                        if (merged) {
                            // Avoid duplicates in new groups
                            // Note: merged.value contains 0s for dashed bits.
                            // We group by number of 1s in the value (excluding dashes, effectively)
                            const setBits = this.countSetBits(merged.value);
                            const existing = newGroups[setBits].find(imp => imp.equals(merged));
                            if (!existing) {
                                newGroups[setBits].push(merged);
                            }
                            used.add(imp1.id);
                            used.add(imp2.id);
                            merging = true;
                        }
                    }
                }
            }

            // Collect implicants that weren't merged this round
            for (let group of groups) {
                for (let imp of group) {
                    if (!used.has(imp.id)) {
                        // Check if already in primeImplicants to avoid duplicates from previous passes
                        if (!primeImplicants.some(pi => pi.equals(imp))) {
                            primeImplicants.push(imp);
                        }
                    }
                }
            }

            groups = newGroups;
        }

        // Add any remaining from the last pass
        for (let group of groups) {
            for (let imp of group) {
                 if (!primeImplicants.some(pi => pi.equals(imp))) {
                    primeImplicants.push(imp);
                }
            }
        }

        return primeImplicants;
    }

    getMinimalCover(primeImplicants, minterms) {
        // This is the set covering problem.
        // We need to select a minimum number of Prime Implicants to cover all 'minterms'.

        // Map each PI to the minterms it covers
        const piCovers = primeImplicants.map(pi => {
            return {
                pi: pi,
                covers: pi.getCoveredMinterms().filter(m => minterms.includes(m))
            };
        }).filter(item => item.covers.length > 0); // Remove PIs that only cover don't cares

        let requiredMinterms = new Set(minterms);
        const finalPIs = [];

        // 1. Find Essential Prime Implicants
        // A PI is essential if it covers a minterm that no other PI covers.

        while (requiredMinterms.size > 0) {
            // Check for essentials
            let essentialFound = false;

            // Map minterm -> list of PIs covering it
            const mintermToPIs = new Map();
            requiredMinterms.forEach(m => mintermToPIs.set(m, []));

            piCovers.forEach((item, index) => {
                item.covers.forEach(m => {
                    if (mintermToPIs.has(m)) {
                        mintermToPIs.get(m).push(index);
                    }
                });
            });

            const essentials = new Set();
            for (let [m, piIndices] of mintermToPIs) {
                if (piIndices.length === 1) {
                    essentials.add(piIndices[0]);
                }
            }

            if (essentials.size > 0) {
                essentialFound = true;
                essentials.forEach(index => {
                    const selected = piCovers[index];
                    finalPIs.push(selected.pi);
                    // Remove covered minterms
                    selected.covers.forEach(m => requiredMinterms.delete(m));
                    // Remove this PI from consideration
                    // (We handle this by just checking requiredMinterms in the next loop or filtering piCovers)
                });

                // Remove used PIs from piCovers
                // Actually, simpler to just rebuild piCovers or mark them used?
                // Let's just filter requiredMinterms. The loop continues.
                // We should remove the PIs we just added so we don't pick them again?
                // Yes, but the logic below works on 'requiredMinterms'. If it's empty, we stop.
            } else {
                // No essential PIs found, but minterms remain. This is a cyclic core.
                // Use a heuristic: pick the PI that covers the most remaining minterms.
                // (Petrick's method is exact but complex to implement fully here, greedy is usually sufficient for standard K-maps)

                let bestPIIndex = -1;
                let maxCover = -1;

                piCovers.forEach((item, index) => {
                    // Calculate how many *remaining* minterms this PI covers
                    // We need to be careful not to pick a PI already in finalPIs (though essentials logic should prevent that if implemented right)
                    // But here we are in the non-essential part.
                    if (!finalPIs.includes(item.pi)) {
                        const count = item.covers.filter(m => requiredMinterms.has(m)).length;
                        if (count > maxCover) {
                            maxCover = count;
                            bestPIIndex = index;
                        }
                    }
                });

                if (bestPIIndex !== -1 && maxCover > 0) {
                    const selected = piCovers[bestPIIndex];
                    finalPIs.push(selected.pi);
                    selected.covers.forEach(m => requiredMinterms.delete(m));
                    essentialFound = true;
                } else {
                    // Should not happen if a solution exists
                    break;
                }
            }

            if (!essentialFound && requiredMinterms.size > 0) {
                console.error("Stuck in loop or no solution found");
                break;
            }
        }

        return finalPIs;
    }

    formatEquation(implicants) {
        if (implicants.length === 0) return this.mode === 'SOP' ? '0' : '1';

        // If one implicant covers everything (mask has all bits set)
        // If dashMask has all bits set (e.g. 1111 for 4 vars), it covers everything.
        if (implicants.length === 1 && implicants[0].dashMask === (1 << this.numVars) - 1) {
             return this.mode === 'SOP' ? '1' : '0';
        }

        const parts = implicants.map(imp => {
            return this.getTermString(imp);
        });

        if (this.mode === 'SOP') {
            return parts.join(' + ');
        } else {
            return parts.length > 1 ? `(${parts.join(')(')})` : parts[0];
        }
    }

    getTermString(imp) {
        // Variables: A, B, C, D, E...
        const vars = "ABCDE".substring(0, this.numVars);
        let term = "";

        // imp.dashMask tells us which bits are eliminated (don't care in the implicant)
        // imp.value tells us the value of the remaining bits

        // In SOP: 1 -> A, 0 -> A'
        // In POS: 1 -> A', 0 -> A (inverted logic because we solved for 0s)

        /*
           Wait, for POS:
           We found groups of 0s.
           If we have a group corresponding to A=1, B=0 (10), in SOP this is A B'.
           In POS, this location (10) corresponds to the term (A' + B).

           The standard way to solve POS with QM is to solve for the 0s (treat them as 1s), get the SOP expression for the complement, and then apply DeMorgan's.

           Example: F'(A,B) = A'B + AB'
           F(A,B) = (A + B')(A' + B)

           So if `imp` represents a group of 0s:
           value bit 1 -> Variable is 1 in the group -> In output term, it contributes A' (complemented)
           value bit 0 -> Variable is 0 in the group -> In output term, it contributes A (uncomplemented)

           And terms are OR'd inside, AND'd outside.
        */

        // Bit position 0 is LSB (last variable).
        // e.g. for 4 vars ABCD. A is bit 3, D is bit 0.

        let localParts = [];

        for (let i = 0; i < this.numVars; i++) {
            const bitPos = this.numVars - 1 - i; // A is index 0 in string, but high bit
            const isDash = (imp.dashMask >> bitPos) & 1;

            if (!isDash) {
                const bitVal = (imp.value >> bitPos) & 1;
                const char = vars[i];

                if (this.mode === 'SOP') {
                    // SOP: 1 is A, 0 is A'
                    localParts.push(bitVal ? char : char + "'");
                } else {
                    // POS: 1 is A', 0 is A
                    localParts.push(bitVal ? char + "'" : char);
                }
            }
        }

        if (localParts.length === 0) return "1"; // Should be handled by top level, but just in case

        if (this.mode === 'SOP') {
            return localParts.join('');
        } else {
            return localParts.join(' + ');
        }
    }

    countSetBits(n) {
        let count = 0;
        while (n > 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
}

class Implicant {
    constructor(value, numVars, dashMask = 0) {
        this.value = value; // The binary value (minterm)
        this.dashMask = dashMask; // Bitmask where 1 means "dash" (variable eliminated)
        this.numVars = numVars;
        this.id = `${value}-${dashMask}`; // Unique ID for Set/Map
    }

    /**
     * Tries to merge with another implicant.
     * Returns a new Implicant if successful, null otherwise.
     */
    merge(other) {
        // Must have same dashes
        if (this.dashMask !== other.dashMask) return null;

        // Values must differ by exactly one bit
        const diff = this.value ^ other.value;
        if (this.countSetBits(diff) !== 1) return null;

        return new Implicant(
            this.value & other.value, // Keep common bits (though doesn't matter for dashed ones)
            this.numVars,
            this.dashMask | diff // Add the differing bit to dash mask
        );
    }

    countSetBits(n) {
        let count = 0;
        while (n > 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }

    equals(other) {
        return this.value === other.value && this.dashMask === other.dashMask;
    }

    // Helper to get all minterms covered by this implicant
    getCoveredMinterms() {
        let minterms = [];
        this._generateMinterms(0, 0, minterms);
        return minterms;
    }

    _generateMinterms(currentVal, bitIndex, results) {
        if (bitIndex >= this.numVars) {
            results.push(currentVal);
            return;
        }

        // Check if this bit is a dash
        // bitIndex 0 is LSB
        const isDash = (this.dashMask >> bitIndex) & 1;
        const baseVal = (this.value >> bitIndex) & 1;

        if (isDash) {
            // Recurse for both 0 and 1
            this._generateMinterms(currentVal, bitIndex + 1, results); // bit = 0
            this._generateMinterms(currentVal | (1 << bitIndex), bitIndex + 1, results); // bit = 1
        } else {
            // Keep the fixed value
            const bit = baseVal ? (1 << bitIndex) : 0;
            this._generateMinterms(currentVal | bit, bitIndex + 1, results);
        }
    }
}

// Export for use in node or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KMapSolver, Implicant };
} else {
    window.KMapSolver = KMapSolver;
}
