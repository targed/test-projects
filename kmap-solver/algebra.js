
// ... (Previous content of algebra.js) ...
// This file will be overwritten with the full content, including previous parts.
// I need to read the previous content first to append, or just rewrite the whole thing.
// I'll rewrite the whole file to ensure it's clean, copying the parser parts.

class Token {
    constructor(type, value) {
        this.type = type; // 'VAR', 'OR', 'AND', 'NOT', 'LPAREN', 'RPAREN', 'EOF'
        this.value = value;
    }
}

class ASTNode {
    constructor(type, left = null, right = null, value = null) {
        this.type = type; // 'OR', 'AND', 'NOT', 'VAR', 'CONST'
        this.left = left;
        this.right = right;
        this.value = value; // For VAR (name) or CONST (0/1)
    }
}

class BooleanParser {
    constructor() {
        this.tokens = [];
        this.pos = 0;
    }

    tokenize(input) {
        const tokens = [];
        let i = 0;
        while (i < input.length) {
            const char = input[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (/[A-Za-z]/.test(char)) {
                tokens.push(new Token('VAR', char.toUpperCase()));
                i++;
                continue;
            }

            if (char === '0' || char === '1') {
                tokens.push(new Token('CONST', char));
                i++;
                continue;
            }

            switch (char) {
                case '+':
                case '|':
                    tokens.push(new Token('OR', '+'));
                    break;
                case '*':
                case '&':
                case '.':
                    tokens.push(new Token('AND', '.'));
                    break;
                case '!':
                case '~':
                    tokens.push(new Token('NOT', '!'));
                    break;
                case '\'':
                    tokens.push(new Token('POST_NOT', '\'')); // Post-fix NOT
                    break;
                case '(':
                    tokens.push(new Token('LPAREN', '('));
                    break;
                case ')':
                    tokens.push(new Token('RPAREN', ')'));
                    break;
                default:
                    console.warn(`Unknown character: ${char}`);
            }
            i++;
        }
        tokens.push(new Token('EOF', null));
        return tokens;
    }

    parse(input) {
        this.tokens = this.tokenize(input);
        this.pos = 0;
        return this.parseExpression();
    }

    peek() {
        return this.tokens[this.pos];
    }

    consume() {
        return this.tokens[this.pos++];
    }

    // Expression: Term { OR Term }
    parseExpression() {
        let left = this.parseTerm();

        while (this.peek().type === 'OR') {
            this.consume();
            const right = this.parseTerm();
            left = new ASTNode('OR', left, right);
        }

        return left;
    }

    // Term: Factor { [AND] Factor }
    parseTerm() {
        let left = this.parseFactor();

        while (
            this.peek().type === 'AND' ||
            this.peek().type === 'VAR' ||
            this.peek().type === 'CONST' ||
            this.peek().type === 'LPAREN' ||
            this.peek().type === 'NOT'
        ) {
            if (this.peek().type === 'AND') {
                this.consume();
            }
            // Implicit AND handling
            const right = this.parseFactor();
            left = new ASTNode('AND', left, right);
        }

        return left;
    }

    // Factor: [NOT] Primary [POST_NOT]
    parseFactor() {
        let node;

        if (this.peek().type === 'NOT') {
            this.consume();
            node = new ASTNode('NOT', this.parseFactor());
        } else {
            node = this.parsePrimary();
        }

        // Handle post-fix NOT (e.g., A')
        while (this.peek() && this.peek().type === 'POST_NOT') {
            this.consume();
            node = new ASTNode('NOT', node);
        }

        return node;
    }

    // Primary: VAR | CONST | LPAREN Expr RPAREN
    parsePrimary() {
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

// Evaluator
function evaluateAST(node, context) {
    if (!node) return 0;

    switch (node.type) {
        case 'CONST':
            return parseInt(node.value);
        case 'VAR':
            return context[node.value] ? 1 : 0;
        case 'NOT':
            return evaluateAST(node.left, context) ? 0 : 1;
        case 'AND':
            return (evaluateAST(node.left, context) && evaluateAST(node.right, context)) ? 1 : 0;
        case 'OR':
            return (evaluateAST(node.left, context) || evaluateAST(node.right, context)) ? 1 : 0;
    }
    return 0;
}

// HTML Renderer (Overline style)
function renderAST(node) {
    if (!node) return "";

    switch (node.type) {
        case 'CONST':
        case 'VAR':
            return node.value;
        case 'NOT':
            return `<span style="text-decoration: overline">${renderAST(node.left)}</span>`;
        case 'AND':
            let leftA = renderAST(node.left);
            let rightA = renderAST(node.right);
            // Precedence: NOT > AND > OR.
            // If child is OR, need parens.
            if (node.left.type === 'OR') leftA = `(${leftA})`;
            if (node.right.type === 'OR') rightA = `(${rightA})`;
            return `${leftA} · ${rightA}`;
        case 'OR':
            return `${renderAST(node.left)} + ${renderAST(node.right)}`;
    }
}

// --- Simplification Logic ---

function cloneAST(node) {
    if (!node) return null;
    return new ASTNode(node.type, cloneAST(node.left), cloneAST(node.right), node.value);
}

function nodesEqual(n1, n2) {
    if (!n1 && !n2) return true;
    if (!n1 || !n2) return false;
    if (n1.type !== n2.type) return false;
    if (n1.value !== n2.value) return false;
    return nodesEqual(n1.left, n2.left) && nodesEqual(n1.right, n2.right);
}

// Helper: Check if node is essentially "0"
function isZero(node) {
    return node.type === 'CONST' && node.value === '0';
}
// Helper: Check if node is essentially "1"
function isOne(node) {
    return node.type === 'CONST' && node.value === '1';
}

function simplifyStepByStep(ast) {
    const steps = [];
    let currentAST = cloneAST(ast);
    let iterations = 0;

    // Safety break
    while (iterations < 50) {
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

function applyFirstApplicableRule(node) {
    // We try to apply rules recursively.
    // Post-order traversal: simplify children first, then current node.

    if (!node) return { applied: false };

    // 1. Simplify Left
    let res = applyFirstApplicableRule(node.left);
    if (res.applied) {
        node.left = res.newAST;
        return { applied: true, newAST: node, description: res.description, rule: res.rule };
    }

    // 2. Simplify Right
    res = applyFirstApplicableRule(node.right);
    if (res.applied) {
        node.right = res.newAST;
        return { applied: true, newAST: node, description: res.description, rule: res.rule };
    }

    // 3. Apply Rules to Current Node
    // List of rules to try
    const rules = [
        ruleDoubleNegation,
        ruleAnnulment,
        ruleIdentity,
        ruleIdempotent,
        ruleComplement,
        ruleDeMorgan,
        ruleAbsorption,
        ruleDistributive,
        ruleAssociative,
        ruleCommutative
    ];

    for (let rule of rules) {
        const ruleRes = rule(node);
        if (ruleRes) {
            return { applied: true, newAST: ruleRes.node, description: ruleRes.desc, rule: ruleRes.name };
        }
    }

    return { applied: false };
}

// Helper for Commutative sort
function getASTString(node) {
    if (!node) return "";
    if (node.type === 'VAR' || node.type === 'CONST') return node.value;
    if (node.type === 'NOT') return "!" + getASTString(node.left);
    if (node.type === 'AND') return "(" + getASTString(node.left) + "." + getASTString(node.right) + ")";
    if (node.type === 'OR') return "(" + getASTString(node.left) + "+" + getASTString(node.right) + ")";
    return "";
}

function ruleCommutative(node) {
    // A + B = B + A
    // Move simpler/smaller terms to the left
    if (node.type === 'OR' || node.type === 'AND') {
        const s1 = getASTString(node.left);
        const s2 = getASTString(node.right);

        // Sort by length first, then alphabetical
        if (s1.length > s2.length || (s1.length === s2.length && s1 > s2)) {
            return {
                node: new ASTNode(node.type, node.right, node.left),
                desc: "Commutative Law (Reordering)",
                name: "Commutative"
            };
        }
    }
    return null;
}

function ruleAssociative(node) {
    // A + (B + C) = (A + B) + C
    // Move parenthesis to the left to facilitate left-side simplification
    if (node.type === 'OR' && node.right.type === 'OR') {
        const A = node.left;
        const B = node.right.left;
        const C = node.right.right;
        const newNode = new ASTNode('OR',
            new ASTNode('OR', A, B),
            C
        );
        return { node: newNode, desc: "Associative Law", name: "Associative" };
    }
    // A . (B . C) = (A . B) . C
    if (node.type === 'AND' && node.right.type === 'AND') {
        const A = node.left;
        const B = node.right.left;
        const C = node.right.right;
        const newNode = new ASTNode('AND',
            new ASTNode('AND', A, B),
            C
        );
        return { node: newNode, desc: "Associative Law", name: "Associative" };
    }
    return null;
}

// --- Rules ---

function ruleDoubleNegation(node) {
    // !!A = A
    if (node.type === 'NOT' && node.left.type === 'NOT') {
        return { node: node.left.left, desc: "Double Negation Law (!!A = A)", name: "Double Negation" };
    }
    return null;
}

function ruleAnnulment(node) {
    // A + 1 = 1
    if (node.type === 'OR') {
        if (isOne(node.left) || isOne(node.right)) {
            return { node: new ASTNode('CONST', null, null, '1'), desc: "Annulment Law (A + 1 = 1)", name: "Annulment" };
        }
    }
    // A . 0 = 0
    if (node.type === 'AND') {
        if (isZero(node.left) || isZero(node.right)) {
            return { node: new ASTNode('CONST', null, null, '0'), desc: "Annulment Law (A . 0 = 0)", name: "Annulment" };
        }
    }
    return null;
}

function ruleIdentity(node) {
    // A + 0 = A
    if (node.type === 'OR') {
        if (isZero(node.right)) return { node: node.left, desc: "Identity Law (A + 0 = A)", name: "Identity" };
        if (isZero(node.left)) return { node: node.right, desc: "Identity Law (0 + A = A)", name: "Identity" };
    }
    // A . 1 = A
    if (node.type === 'AND') {
        if (isOne(node.right)) return { node: node.left, desc: "Identity Law (A . 1 = A)", name: "Identity" };
        if (isOne(node.left)) return { node: node.right, desc: "Identity Law (1 . A = A)", name: "Identity" };
    }
    return null;
}

function ruleIdempotent(node) {
    // A + A = A
    if (node.type === 'OR' && nodesEqual(node.left, node.right)) {
        return { node: node.left, desc: "Idempotent Law (A + A = A)", name: "Idempotent" };
    }
    // A . A = A
    if (node.type === 'AND' && nodesEqual(node.left, node.right)) {
        return { node: node.left, desc: "Idempotent Law (A . A = A)", name: "Idempotent" };
    }
    return null;
}

function ruleComplement(node) {
    // A + !A = 1
    if (node.type === 'OR') {
        if (isComplement(node.left, node.right)) {
            return { node: new ASTNode('CONST', null, null, '1'), desc: "Complement Law (A + A' = 1)", name: "Complement" };
        }
    }
    // A . !A = 0
    if (node.type === 'AND') {
        if (isComplement(node.left, node.right)) {
            return { node: new ASTNode('CONST', null, null, '0'), desc: "Complement Law (A . A' = 0)", name: "Complement" };
        }
    }
    return null;
}

function isComplement(n1, n2) {
    // Check if n1 = !n2 or n2 = !n1
    if (n1.type === 'NOT' && nodesEqual(n1.left, n2)) return true;
    if (n2.type === 'NOT' && nodesEqual(n2.left, n1)) return true;
    return false;
}

function ruleDeMorgan(node) {
    // !(A + B) = !A . !B
    if (node.type === 'NOT' && node.left.type === 'OR') {
        const A = node.left.left;
        const B = node.left.right;
        const newNode = new ASTNode('AND',
            new ASTNode('NOT', A),
            new ASTNode('NOT', B)
        );
        return { node: newNode, desc: "DeMorgan's Theorem (!(A+B) = !A.!B)", name: "DeMorgan" };
    }
    // !(A . B) = !A + !B
    if (node.type === 'NOT' && node.left.type === 'AND') {
        const A = node.left.left;
        const B = node.left.right;
        const newNode = new ASTNode('OR',
            new ASTNode('NOT', A),
            new ASTNode('NOT', B)
        );
        return { node: newNode, desc: "DeMorgan's Theorem (!(A.B) = !A+!B)", name: "DeMorgan" };
    }
    return null;
}

function ruleAbsorption(node) {
    // A + (A . B) = A
    if (node.type === 'OR') {
        // Left is term, Right is AND
        if (node.right.type === 'AND') {
            if (nodesEqual(node.left, node.right.left) || nodesEqual(node.left, node.right.right)) {
                return { node: node.left, desc: "Absorption Law (A + AB = A)", name: "Absorption" };
            }
        }
        // Right is term, Left is AND
        if (node.left.type === 'AND') {
            if (nodesEqual(node.right, node.left.left) || nodesEqual(node.right, node.left.right)) {
                return { node: node.right, desc: "Absorption Law (AB + A = A)", name: "Absorption" };
            }
        }
    }
    return null;
}

function ruleDistributive(node) {
    // Factoring out: AB + AC = A(B+C)
    // Only apply if it reduces complexity? Or standard form?
    // User wants reduction.
    if (node.type === 'OR') {
        if (node.left.type === 'AND' && node.right.type === 'AND') {
            const A1 = node.left.left;
            const B1 = node.left.right;
            const A2 = node.right.left;
            const B2 = node.right.right;

            // Check for common term
            let common = null;
            let others = [];

            if (nodesEqual(A1, A2)) { common = A1; others = [B1, B2]; }
            else if (nodesEqual(A1, B2)) { common = A1; others = [B1, A2]; }
            else if (nodesEqual(B1, A2)) { common = B1; others = [A1, B2]; }
            else if (nodesEqual(B1, B2)) { common = B1; others = [A1, A2]; }

            if (common) {
                const newNode = new ASTNode('AND',
                    common,
                    new ASTNode('OR', others[0], others[1])
                );
                return { node: newNode, desc: "Distributive Law (AB + AC = A(B+C))", name: "Distributive" };
            }
        }
    }
    return null;
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BooleanParser, evaluateAST, renderAST, ASTNode, simplifyStepByStep };
} else {
    window.BooleanParser = BooleanParser;
    window.evaluateAST = evaluateAST;
    window.renderAST = renderAST;
    window.simplifyStepByStep = simplifyStepByStep;
}
