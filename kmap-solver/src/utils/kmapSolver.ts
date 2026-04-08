export class Implicant {
    value: number;
    dashMask: number;
    numVars: number;
    id: string;

    constructor(value: number, numVars: number, dashMask: number = 0) {
        this.value = value;
        this.dashMask = dashMask;
        this.numVars = numVars;
        this.id = `${value}-${dashMask}`;
    }

    merge(other: Implicant): Implicant | null {
        if (this.dashMask !== other.dashMask) return null;
        const diff = this.value ^ other.value;
        if (this.countSetBits(diff) !== 1) return null;
        return new Implicant(
            this.value & other.value,
            this.numVars,
            this.dashMask | diff
        );
    }

    countSetBits(n: number): number {
        let count = 0;
        while (n > 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }

    equals(other: Implicant): boolean {
        return this.value === other.value && this.dashMask === other.dashMask;
    }

    getCoveredMinterms(): number[] {
        let minterms: number[] = [];
        this._generateMinterms(0, 0, minterms);
        return minterms;
    }

    _generateMinterms(currentVal: number, bitIndex: number, results: number[]) {
        if (bitIndex >= this.numVars) {
            results.push(currentVal);
            return;
        }
        const isDash = (this.dashMask >> bitIndex) & 1;
        const baseVal = (this.value >> bitIndex) & 1;

        if (isDash) {
            this._generateMinterms(currentVal, bitIndex + 1, results);
            this._generateMinterms(currentVal | (1 << bitIndex), bitIndex + 1, results);
        } else {
            const bit = baseVal ? (1 << bitIndex) : 0;
            this._generateMinterms(currentVal | bit, bitIndex + 1, results);
        }
    }
}

export class KMapSolver {
    numVars: number;
    size: number;
    grid: number[];
    mode: 'SOP' | 'POS';

    constructor(numVars: number) {
        this.numVars = numVars;
        this.size = 1 << numVars;
        this.grid = new Array(this.size).fill(0);
        this.mode = 'SOP';
    }

    setMode(mode: 'SOP' | 'POS') {
        this.mode = mode;
    }

    setGridValue(index: number, value: number) {
        if (index >= 0 && index < this.size) {
            this.grid[index] = value;
        }
    }

    getGridValue(index: number): number {
        return this.grid[index];
    }

    toggleGridValue(index: number): number {
        const current = this.grid[index];
        this.grid[index] = (current + 1) % 3;
        return this.grid[index];
    }

    reset() {
        this.grid.fill(0);
    }

    getInputTerms() {
        const terms: number[] = [];
        const dontCares: number[] = [];

        for (let i = 0; i < this.size; i++) {
            if (this.grid[i] === 2) {
                dontCares.push(i);
            } else if (this.mode === 'SOP' && this.grid[i] === 1) {
                terms.push(i);
            } else if (this.mode === 'POS' && this.grid[i] === 0) {
                terms.push(i);
            }
        }
        return { terms, dontCares };
    }

    solve() {
        const { terms, dontCares } = this.getInputTerms();
        const allTerms = [...terms, ...dontCares].sort((a, b) => a - b);

        if (allTerms.length === 0) {
            return {
                equation: this.mode === 'SOP' ? '0' : '1',
                groups: []
            };
        }

        if (terms.length === 0) {
             return {
                 equation: this.mode === 'SOP' ? '0' : '1',
                 groups: []
             };
        }

        const primeImplicants = this.getPrimeImplicants(allTerms);
        const solution = this.getMinimalCover(primeImplicants, terms);
        const equation = this.formatEquation(solution);

        return {
            equation: equation,
            groups: solution
        };
    }

    getPrimeImplicants(minterms: number[]): Implicant[] {
        let groups: Implicant[][] = Array.from({ length: this.numVars + 1 }, () => []);

        minterms.forEach(m => {
            const ones = this.countSetBits(m);
            groups[ones].push(new Implicant(m, this.numVars));
        });

        const primeImplicants: Implicant[] = [];

        let merging = true;
        while (merging) {
            merging = false;
            const newGroups: Implicant[][] = Array.from({ length: this.numVars + 1 }, () => []);
            const used = new Set<string>();

            for (let i = 0; i < groups.length - 1; i++) {
                for (let imp1 of groups[i]) {
                    for (let imp2 of groups[i+1]) {
                        const merged = imp1.merge(imp2);
                        if (merged) {
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

            for (let group of groups) {
                for (let imp of group) {
                    if (!used.has(imp.id)) {
                        if (!primeImplicants.some(pi => pi.equals(imp))) {
                            primeImplicants.push(imp);
                        }
                    }
                }
            }

            groups = newGroups;
        }

        for (let group of groups) {
            for (let imp of group) {
                 if (!primeImplicants.some(pi => pi.equals(imp))) {
                    primeImplicants.push(imp);
                }
            }
        }

        return primeImplicants;
    }

    getMinimalCover(primeImplicants: Implicant[], minterms: number[]): Implicant[] {
        const piCovers = primeImplicants.map(pi => {
            return {
                pi: pi,
                covers: pi.getCoveredMinterms().filter(m => minterms.includes(m))
            };
        }).filter(item => item.covers.length > 0);

        let requiredMinterms = new Set(minterms);
        const finalPIs: Implicant[] = [];

        while (requiredMinterms.size > 0) {
            let essentialFound = false;
            const mintermToPIs = new Map<number, number[]>();
            requiredMinterms.forEach(m => mintermToPIs.set(m, []));

            piCovers.forEach((item, index) => {
                item.covers.forEach(m => {
                    if (mintermToPIs.has(m)) {
                        mintermToPIs.get(m)!.push(index);
                    }
                });
            });

            const essentials = new Set<number>();
            for (let [m, piIndices] of mintermToPIs) {
                if (piIndices.length === 1) {
                    essentials.add(piIndices[0]);
                }
            }

            if (essentials.size > 0) {
                essentialFound = true;
                essentials.forEach(index => {
                    const selected = piCovers[index];
                    if (!finalPIs.includes(selected.pi)) {
                        finalPIs.push(selected.pi);
                        selected.covers.forEach(m => requiredMinterms.delete(m));
                    }
                });
            } else {
                let bestPIIndex = -1;
                let maxCover = -1;

                piCovers.forEach((item, index) => {
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
                    break;
                }
            }

            if (!essentialFound && requiredMinterms.size > 0) {
                break;
            }
        }

        return finalPIs;
    }

    formatEquation(implicants: Implicant[]): string {
        if (implicants.length === 0) return this.mode === 'SOP' ? '0' : '1';

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

    getTermString(imp: Implicant): string {
        const vars = "ABCDE".substring(0, this.numVars);
        let localParts = [];

        for (let i = 0; i < this.numVars; i++) {
            const bitPos = this.numVars - 1 - i;
            const isDash = (imp.dashMask >> bitPos) & 1;

            if (!isDash) {
                const bitVal = (imp.value >> bitPos) & 1;
                const char = vars[i];

                if (this.mode === 'SOP') {
                    localParts.push(bitVal ? char : char + "'");
                } else {
                    localParts.push(bitVal ? char + "'" : char);
                }
            }
        }

        if (localParts.length === 0) return "1";

        if (this.mode === 'SOP') {
            return localParts.join('');
        } else {
            return localParts.join(' + ');
        }
    }

    countSetBits(n: number): number {
        let count = 0;
        while (n > 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
}
