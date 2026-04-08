export class Token {
    constructor(public type: string, public value: string | null) {}
}

export class ASTNode {
    constructor(
        public type: string,
        public left: ASTNode | null = null,
        public right: ASTNode | null = null,
        public value: string | null = null
    ) {}
}

export class BooleanParser {
    tokens: Token[] = [];
    pos: number = 0;

    tokenize(input: string): Token[] {
        const tokens: Token[] = [];
        let i = 0;
        while (i < input.length) {
            const char = input[i];
            if (/\s/.test(char)) { i++; continue; }
            if (/[A-Za-z]/.test(char)) {
                tokens.push(new Token('VAR', char.toUpperCase()));
                i++; continue;
            }
            if (char === '0' || char === '1') {
                tokens.push(new Token('CONST', char));
                i++; continue;
            }
            switch (char) {
                case '+': case '|': tokens.push(new Token('OR', '+')); break;
                case '*': case '&': case '.': tokens.push(new Token('AND', '.')); break;
                case '!': case '~': tokens.push(new Token('NOT', '!')); break;
                case '\'': tokens.push(new Token('POST_NOT', '\'')); break;
                case '(': tokens.push(new Token('LPAREN', '(')); break;
                case ')': tokens.push(new Token('RPAREN', ')')); break;
                default: console.warn(`Unknown character: ${char}`);
            }
            i++;
        }
        tokens.push(new Token('EOF', null));
        return tokens;
    }

    parse(input: string): ASTNode {
        this.tokens = this.tokenize(input);
        this.pos = 0;
        return this.parseExpression();
    }

    peek(): Token { return this.tokens[this.pos]; }
    consume(): Token { return this.tokens[this.pos++]; }

    parseExpression(): ASTNode {
        let left = this.parseTerm();
        while (this.peek().type === 'OR') {
            this.consume();
            const right = this.parseTerm();
            left = new ASTNode('OR', left, right);
        }
        return left;
    }

    parseTerm(): ASTNode {
        let left = this.parseFactor();
        while (
            this.peek().type === 'AND' ||
            this.peek().type === 'VAR' ||
            this.peek().type === 'CONST' ||
            this.peek().type === 'LPAREN' ||
            this.peek().type === 'NOT'
        ) {
            if (this.peek().type === 'AND') this.consume();
            const right = this.parseFactor();
            left = new ASTNode('AND', left, right);
        }
        return left;
    }

    parseFactor(): ASTNode {
        let node: ASTNode;
        if (this.peek().type === 'NOT') {
            this.consume();
            node = new ASTNode('NOT', this.parseFactor());
        } else {
            node = this.parsePrimary();
        }
        while (this.peek() && this.peek().type === 'POST_NOT') {
            this.consume();
            node = new ASTNode('NOT', node);
        }
        return node;
    }

    parsePrimary(): ASTNode {
        const token = this.peek();
        if (token.type === 'VAR') {
            this.consume();
            return new ASTNode('VAR', null, null, token.value);
        }
        if (token.type === 'CONST') {
            this.consume();
            return new ASTNode('CONST', null, null, token.value);
        }
        if (token.type === 'LPAREN') {
            this.consume();
            const expr = this.parseExpression();
            if (this.peek().type === 'RPAREN') {
                this.consume();
            } else {
                throw new Error("Missing closing parenthesis");
            }
            return expr;
        }
        throw new Error(`Unexpected token: ${token.type} at pos ${this.pos}`);
    }
}

export function getCanonicalAST(grid: number[], numVars: number, mode: 'SOP' | 'POS'): ASTNode | null {
    const terms: ASTNode[] = [];
    for (let i = 0; i < grid.length; i++) {
        if (mode === 'SOP' && grid[i] === 1) {
            const vars: ASTNode[] = [];
            for (let v = 0; v < numVars; v++) {
                const isTrue = (i >> (numVars - 1 - v)) & 1;
                const varNode = new ASTNode('VAR', null, null, String.fromCharCode(65 + v));
                if (isTrue) {
                    vars.push(varNode);
                } else {
                    vars.push(new ASTNode('NOT', varNode));
                }
            }
            terms.push(vars.reduce((acc, curr) => new ASTNode('AND', acc, curr)));
        } else if (mode === 'POS' && grid[i] === 0) {
            const vars: ASTNode[] = [];
            for (let v = 0; v < numVars; v++) {
                const isTrue = (i >> (numVars - 1 - v)) & 1;
                const varNode = new ASTNode('VAR', null, null, String.fromCharCode(65 + v));
                if (isTrue) {
                    vars.push(new ASTNode('NOT', varNode));
                } else {
                    vars.push(varNode);
                }
            }
            terms.push(vars.reduce((acc, curr) => new ASTNode('OR', acc, curr)));
        }
    }
    
    if (terms.length === 0) return null;
    if (terms.length === 1) return terms[0];
    
    const rootType = mode === 'SOP' ? 'OR' : 'AND';
    return terms.reduce((acc, curr) => new ASTNode(rootType, acc, curr));
}

export function evaluateAST(node: ASTNode | null, context: Record<string, number>): number {
    if (!node) return 0;
    switch (node.type) {
        case 'CONST': return parseInt(node.value!);
        case 'VAR': return context[node.value!] ? 1 : 0;
        case 'NOT': return evaluateAST(node.left, context) ? 0 : 1;
        case 'AND': return (evaluateAST(node.left, context) && evaluateAST(node.right, context)) ? 1 : 0;
        case 'OR': return (evaluateAST(node.left, context) || evaluateAST(node.right, context)) ? 1 : 0;
    }
    return 0;
}

export function renderAST(node: ASTNode | null): string {
    if (!node) return "";
    switch (node.type) {
        case 'CONST':
        case 'VAR': return node.value!;
        case 'NOT': return `${renderAST(node.left)}'`;
        case 'AND': {
            let leftA = renderAST(node.left);
            let rightA = renderAST(node.right);
            if (node.left?.type === 'OR') leftA = `(${leftA})`;
            if (node.right?.type === 'OR') rightA = `(${rightA})`;
            return `${leftA}${rightA}`;
        }
        case 'OR': return `${renderAST(node.left)} + ${renderAST(node.right)}`;
    }
    return "";
}

export function cloneAST(node: ASTNode | null): ASTNode | null {
    if (!node) return null;
    return new ASTNode(node.type, cloneAST(node.left), cloneAST(node.right), node.value);
}

export function nodesEqual(n1: ASTNode | null, n2: ASTNode | null): boolean {
    if (!n1 && !n2) return true;
    if (!n1 || !n2) return false;
    if (n1.type !== n2.type) return false;
    if (n1.value !== n2.value) return false;
    return nodesEqual(n1.left, n2.left) && nodesEqual(n1.right, n2.right);
}

function isZero(node: ASTNode) { return node.type === 'CONST' && node.value === '0'; }
function isOne(node: ASTNode) { return node.type === 'CONST' && node.value === '1'; }

function isComplement(n1: ASTNode | null, n2: ASTNode | null) {
    if (!n1 || !n2) return false;
    if (n1.type === 'NOT' && nodesEqual(n1.left, n2)) return true;
    if (n2.type === 'NOT' && nodesEqual(n2.left, n1)) return true;
    return false;
}

export function simplifyStepByStep(ast: ASTNode) {
    const steps: any[] = [];
    let currentAST = cloneAST(ast);
    let iterations = 0;

    while (iterations < 100) {
        const result = applyFirstApplicableRule(currentAST);
        if (result.applied) {
            currentAST = result.newAST;
            steps.push({
                ast: cloneAST(currentAST),
                description: result.description,
                rule: result.rule
            });
        } else {
            break;
        }
        iterations++;
    }

    return steps;
}

function applyFirstApplicableRule(node: ASTNode | null): any {
    if (!node) return { applied: false };

    let res = applyFirstApplicableRule(node.left);
    if (res.applied) {
        node.left = res.newAST;
        return { applied: true, newAST: node, description: res.description, rule: res.rule };
    }

    res = applyFirstApplicableRule(node.right);
    if (res.applied) {
        node.right = res.newAST;
        return { applied: true, newAST: node, description: res.description, rule: res.rule };
    }

    const rules = [
        ruleDoubleNegation,
        ruleDeMorgan,
        ruleAnnulment,
        ruleIdentity,
        ruleIdempotent,
        ruleComplement,
        ruleCombine,
        ruleAbsorption,
        ruleRedundancy,
        ruleExpand
    ];

    for (let rule of rules) {
        const ruleRes = rule(node);
        if (ruleRes) {
            return { applied: true, newAST: ruleRes.node, description: ruleRes.desc, rule: ruleRes.name };
        }
    }

    return { applied: false };
}

function ruleDoubleNegation(node: ASTNode) {
    if (node.type === 'NOT' && node.left?.type === 'NOT') {
        return { node: node.left.left, desc: "Double Negation Law (A'' = A)", name: "Double Negation" };
    }
    return null;
}

function ruleDeMorgan(node: ASTNode) {
    if (node.type === 'NOT' && node.left?.type === 'OR') {
        const A = node.left.left;
        const B = node.left.right;
        return {
            node: new ASTNode('AND', new ASTNode('NOT', A), new ASTNode('NOT', B)),
            desc: "DeMorgan's Theorem ((A+B)' = A'B')", name: "DeMorgan"
        };
    }
    if (node.type === 'NOT' && node.left?.type === 'AND') {
        const A = node.left.left;
        const B = node.left.right;
        return {
            node: new ASTNode('OR', new ASTNode('NOT', A), new ASTNode('NOT', B)),
            desc: "DeMorgan's Theorem ((AB)' = A'+B')", name: "DeMorgan"
        };
    }
    return null;
}

export function gatherTerms(node: ASTNode | null, type: 'OR' | 'AND'): ASTNode[] {
    if (!node) return [];
    if (node.type === type) {
        return [...gatherTerms(node.left, type), ...gatherTerms(node.right, type)];
    }
    return [node];
}

function buildTree(terms: ASTNode[], type: 'OR' | 'AND'): ASTNode | null {
    if (terms.length === 0) return null;
    if (terms.length === 1) return terms[0];
    let node = terms[0];
    for (let i = 1; i < terms.length; i++) {
        node = new ASTNode(type, node, terms[i]);
    }
    return node;
}

function ruleCombine(node: ASTNode) {
    if (node.type === 'OR') {
        const terms = gatherTerms(node, 'OR');
        for (let i = 0; i < terms.length; i++) {
            for (let j = i + 1; j < terms.length; j++) {
                const factors1 = gatherTerms(terms[i], 'AND');
                const factors2 = gatherTerms(terms[j], 'AND');
                
                if (factors1.length === factors2.length) {
                    let diffCount = 0;
                    let diffIndex1 = -1;
                    let diffIndex2 = -1;
                    
                    // Match factors
                    const matched2 = new Array(factors2.length).fill(false);
                    for (let k = 0; k < factors1.length; k++) {
                        let foundMatch = false;
                        for (let l = 0; l < factors2.length; l++) {
                            if (!matched2[l] && nodesEqual(factors1[k], factors2[l])) {
                                matched2[l] = true;
                                foundMatch = true;
                                break;
                            }
                        }
                        if (!foundMatch) {
                            diffCount++;
                            diffIndex1 = k;
                        }
                    }
                    
                    if (diffCount === 1) {
                        for (let l = 0; l < factors2.length; l++) {
                            if (!matched2[l]) {
                                diffIndex2 = l;
                                break;
                            }
                        }
                        
                        if (isComplement(factors1[diffIndex1], factors2[diffIndex2])) {
                            // Combine them!
                            const newFactors = factors1.filter((_, idx) => idx !== diffIndex1).map(cloneAST);
                            const combinedTerm = buildTree(newFactors as ASTNode[], 'AND');
                            
                            const newTerms = terms.filter((_, idx) => idx !== i && idx !== j).map(cloneAST);
                            if (combinedTerm) newTerms.push(combinedTerm);
                            
                            const newNode = buildTree(newTerms as ASTNode[], 'OR');
                            if (newNode) {
                                return { node: newNode, desc: "Combine Law (AB + AB' = A)", name: "Combine" };
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

function ruleExpand(node: ASTNode) {
    if (node.type === 'AND') {
        if (node.right?.type === 'OR') {
            const A = node.left;
            const B = node.right.left;
            const C = node.right.right;
            return {
                node: new ASTNode('OR', new ASTNode('AND', cloneAST(A), cloneAST(B)), new ASTNode('AND', cloneAST(A), cloneAST(C))),
                desc: "Distributive Law (Expand)", name: "Expand"
            };
        }
        if (node.left?.type === 'OR') {
            const A = node.right;
            const B = node.left.left;
            const C = node.left.right;
            return {
                node: new ASTNode('OR', new ASTNode('AND', cloneAST(B), cloneAST(A)), new ASTNode('AND', cloneAST(C), cloneAST(A))),
                desc: "Distributive Law (Expand)", name: "Expand"
            };
        }
    }
    return null;
}

function ruleAnnulment(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        for (let i = 0; i < terms.length; i++) {
            if (node.type === 'OR' && isOne(terms[i])) {
                return { node: new ASTNode('CONST', null, null, '1'), desc: "Annulment Law (A + 1 = 1)", name: "Annulment" };
            }
            if (node.type === 'AND' && isZero(terms[i])) {
                return { node: new ASTNode('CONST', null, null, '0'), desc: "Annulment Law (A . 0 = 0)", name: "Annulment" };
            }
        }
    }
    return null;
}

function ruleIdentity(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        for (let i = 0; i < terms.length; i++) {
            if ((node.type === 'OR' && isZero(terms[i])) || (node.type === 'AND' && isOne(terms[i]))) {
                const newTerms = terms.filter((_, idx) => idx !== i).map(cloneAST);
                const newNode = buildTree(newTerms as ASTNode[], node.type);
                if (newNode) {
                    return { node: newNode, desc: `Identity Law (A ${node.type === 'OR' ? '+ 0' : '. 1'} = A)`, name: "Identity" };
                }
            }
        }
    }
    return null;
}

function ruleIdempotent(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        for (let i = 0; i < terms.length; i++) {
            for (let j = i + 1; j < terms.length; j++) {
                if (nodesEqual(terms[i], terms[j])) {
                    const newTerms = terms.filter((_, idx) => idx !== j).map(cloneAST);
                    const newNode = buildTree(newTerms as ASTNode[], node.type);
                    if (newNode) {
                        return { node: newNode, desc: `Idempotent Law (A ${node.type === 'OR' ? '+' : '.'} A = A)`, name: "Idempotent" };
                    }
                }
            }
        }
    }
    return null;
}

function ruleComplement(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        for (let i = 0; i < terms.length; i++) {
            for (let j = i + 1; j < terms.length; j++) {
                if (isComplement(terms[i], terms[j])) {
                    const val = node.type === 'OR' ? '1' : '0';
                    const newTerms = terms.filter((_, idx) => idx !== i && idx !== j).map(cloneAST);
                    newTerms.push(new ASTNode('CONST', null, null, val));
                    const newNode = buildTree(newTerms as ASTNode[], node.type);
                    if (newNode) {
                        return { node: newNode, desc: `Complement Law (A ${node.type === 'OR' ? '+' : '.'} A' = ${val})`, name: "Complement" };
                    }
                }
            }
        }
    }
    return null;
}

function ruleAbsorption(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        const innerType = node.type === 'OR' ? 'AND' : 'OR';
        
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) continue;
                
                const factorsI = gatherTerms(terms[i], innerType);
                const factorsJ = gatherTerms(terms[j], innerType);
                
                // terms[j] is absorbed by terms[i] if ALL factors of terms[i] are in terms[j]
                const isAbsorbed = factorsI.every(fi => factorsJ.some(fj => nodesEqual(fi, fj)));
                
                if (isAbsorbed) {
                    const newTerms = terms.filter((_, idx) => idx !== j).map(cloneAST);
                    const newNode = buildTree(newTerms as ASTNode[], node.type);
                    if (newNode) {
                        return { node: newNode, desc: `Absorption Law (A ${node.type === 'OR' ? '+' : '.'} AB = A)`, name: "Absorption" };
                    }
                }
            }
        }
    }
    return null;
}

function ruleRedundancy(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const terms = gatherTerms(node, node.type);
        const innerType = node.type === 'OR' ? 'AND' : 'OR';
        
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) continue;
                
                const factors = gatherTerms(terms[j], innerType);
                const compIndex = factors.findIndex(f => isComplement(terms[i], f));
                
                if (compIndex !== -1) {
                    // terms[j] has a factor that is the complement of terms[i]
                    // We can remove that factor from terms[j]
                    const newFactors = factors.filter((_, idx) => idx !== compIndex).map(cloneAST);
                    const newTerm = buildTree(newFactors as ASTNode[], innerType);
                    
                    const newTerms = terms.filter((_, idx) => idx !== j).map(cloneAST);
                    if (newTerm) newTerms.push(newTerm);
                    
                    const newNode = buildTree(newTerms as ASTNode[], node.type);
                    if (newNode) {
                        return { node: newNode, desc: `Redundancy Law (A ${node.type === 'OR' ? '+' : '.'} A'B = A ${node.type === 'OR' ? '+' : '.'} B)`, name: "Redundancy" };
                    }
                }
            }
        }
    }
    return null;
}

function ruleAssociative(node: ASTNode) {
    if (node.type === 'OR' && node.right?.type === 'OR') {
        return {
            node: new ASTNode('OR', new ASTNode('OR', node.left, node.right.left), node.right.right),
            desc: "Associative Law", name: "Associative"
        };
    }
    if (node.type === 'AND' && node.right?.type === 'AND') {
        return {
            node: new ASTNode('AND', new ASTNode('AND', node.left, node.right.left), node.right.right),
            desc: "Associative Law", name: "Associative"
        };
    }
    return null;
}

function getASTString(node: ASTNode | null): string {
    if (!node) return "";
    if (node.type === 'VAR' || node.type === 'CONST') return node.value!;
    if (node.type === 'NOT') return "!" + getASTString(node.left);
    if (node.type === 'AND') return "(" + getASTString(node.left) + "." + getASTString(node.right) + ")";
    if (node.type === 'OR') return "(" + getASTString(node.left) + "+" + getASTString(node.right) + ")";
    return "";
}

function ruleCommutative(node: ASTNode) {
    if (node.type === 'OR' || node.type === 'AND') {
        const s1 = getASTString(node.left);
        const s2 = getASTString(node.right);
        if (s1 > s2) {
            return {
                node: new ASTNode(node.type, node.right, node.left),
                desc: "Commutative Law",
                name: "Commutative"
            };
        }
    }
    return null;
}
