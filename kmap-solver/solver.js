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

        if (terms.length === 0) {
             // If we are looking for 1s (SOP) and find none, result is 0.
             // If we are looking for 0s (POS) and find none, result is 1 (function is always 1).
             return {
                 equation: this.mode === 'SOP' ? '0' : '1',
                 groups: []
             };
        }

        // 1. Find Prime Implicants
        const primeImplicants = this.getPrimeImplicants(allTerms);
        
        // Edge case: If only one prime implicant covers everything
        if (primeImplicants.length === 1 && primeImplicants[0].getCoveredMinterms().length === this.size) {
            return {
                equation: this.mode === 'SOP' ? '1' : '0',
                groups: primeImplicants
            };
        }

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
        const primeImplicantIds = new Set(); // Track IDs for faster duplicate checking

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

            // Collect implicants that weren't merged this round (these are prime)
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

        // Add any remaining from the last pass (these couldn't be merged further)
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

        if (minterms.length === 0) return [];

        // Map each PI to the minterms it covers
        let availablePIs = primeImplicants.map((pi, idx) => {
            return {
                pi: pi,
                covers: pi.getCoveredMinterms().filter(m => minterms.includes(m)),
                originalIndex: idx
            };
        }).filter(item => item.covers.length > 0); // Remove PIs that only cover don't cares

        let requiredMinterms = new Set(minterms);
        const finalPIs = [];
        const usedIndices = new Set(); // Track which PIs we've already selected

        // 1. Find Essential Prime Implicants and greedy selections
        while (requiredMinterms.size > 0 && availablePIs.length > 0) {
            // Filter out PIs that don't cover any remaining minterms
            availablePIs = availablePIs.filter(item => 
                item.covers.some(m => requiredMinterms.has(m))
            );

            if (availablePIs.length === 0) break;

            // Rebuild the coverage map for remaining PIs and minterms
            const mintermToPIs = new Map();
            requiredMinterms.forEach(m => mintermToPIs.set(m, []));

            availablePIs.forEach((item, index) => {
                item.covers.forEach(m => {
                    if (mintermToPIs.has(m)) {
                        mintermToPIs.get(m).push(index);
                    }
                });
            });

            // Find essential PIs (PIs that are the only option for at least one minterm)
            const essentials = new Set();
            for (let [m, piIndices] of mintermToPIs) {
                if (piIndices.length === 1) {
                    essentials.add(piIndices[0]);
                }
            }

            let selectedIndex = -1;

            if (essentials.size > 0) {
                // Select an essential PI
                selectedIndex = essentials.values().next().value;
            } else {
                // No essential PIs, use greedy heuristic
                // Pick the PI that covers the most remaining minterms AND has the largest total coverage (fewest literals)
                let maxCover = -1;
                let maxTotalCover = -1;
                
                availablePIs.forEach((item, index) => {
                    const count = item.covers.filter(m => requiredMinterms.has(m)).length;
                    const totalCount = item.pi.getCoveredMinterms().length; // Larger groups are better
                    
                    if (count > maxCover || (count === maxCover && totalCount > maxTotalCover)) {
                        maxCover = count;
                        maxTotalCover = totalCount;
                        selectedIndex = index;
                    }
                });
            }

            if (selectedIndex !== -1) {
                const selected = availablePIs[selectedIndex];
                finalPIs.push(selected.pi);
                usedIndices.add(selected.originalIndex);
                
                // Remove covered minterms
                selected.covers.forEach(m => requiredMinterms.delete(m));
                
                // Remove the selected PI from available PIs
                availablePIs.splice(selectedIndex, 1);
            } else {
                // No valid selection found but minterms remain - shouldn't happen
                console.error("No solution found for remaining minterms:", Array.from(requiredMinterms));
                break;
            }
        }

        // Final pass: remove any redundant PIs that might have been added
        // A PI is redundant if all its minterms are covered by other selected PIs
        const optimizedPIs = [];
        for (let i = 0; i < finalPIs.length; i++) {
            const currentPI = finalPIs[i];
            const currentCovers = currentPI.getCoveredMinterms().filter(m => minterms.includes(m));
            
            // Check if all minterms covered by currentPI are covered by other PIs
            let isRedundant = true;
            for (const m of currentCovers) {
                let coveredByOther = false;
                for (let j = 0; j < finalPIs.length; j++) {
                    if (i !== j) {
                        const otherCovers = finalPIs[j].getCoveredMinterms();
                        if (otherCovers.includes(m)) {
                            coveredByOther = true;
                            break;
                        }
                    }
                }
                if (!coveredByOther) {
                    isRedundant = false;
                    break;
                }
            }
            
            if (!isRedundant) {
                optimizedPIs.push(currentPI);
            }
        }

        return optimizedPIs;
    }

    formatEquation(implicants) {
        if (implicants.length === 0) return this.mode === 'SOP' ? '0' : '1';

        // If one implicant covers everything and has no literals (mask 0, value 0), it's a "1"
        if (implicants.length === 1 && implicants[0].mask === 0) {
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
