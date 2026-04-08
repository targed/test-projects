import React, { useMemo } from 'react';
import { ASTNode, gatherTerms, renderAST } from '../utils/algebraParser';

export type CNode = {
    id: string;
    type: 'AND' | 'OR' | 'NOT' | 'VAR';
    label?: string;
    children: CNode[];
    level: number;
    leafCount: number;
    y: number;
    x: number;
    astStr: string;
};

function buildCTree(ast: ASTNode, getId: () => string): CNode {
    const id = getId();
    const astStr = renderAST(ast);
    if (ast.type === 'VAR' || ast.type === 'CONST') {
        return { id, type: 'VAR', label: ast.value || ast.type, children: [], level: 0, leafCount: 1, x: 0, y: 0, astStr };
    }
    if (ast.type === 'NOT') {
        const child = buildCTree(ast.left!, getId);
        return { id, type: 'NOT', children: [child], level: child.level + 1, leafCount: child.leafCount, x: 0, y: 0, astStr };
    }
    
    const terms = gatherTerms(ast, ast.type as 'AND' | 'OR');
    const children = terms.map(t => buildCTree(t, getId));
    const level = children.length > 0 ? Math.max(...children.map(c => c.level)) + 1 : 0;
    const leafCount = children.reduce((sum, c) => sum + c.leafCount, 0);
    
    return { id, type: ast.type as 'AND' | 'OR' | 'NOT' | 'VAR', children, level, leafCount, x: 0, y: 0, astStr };
}

const X_SPACING = 150;
const Y_SPACING = 50;

function layoutCTree(root: CNode) {
    const maxLevel = root.level;
    let currentLeafY = 40;
    
    function traverse(node: CNode) {
        node.children.forEach(traverse);
        
        node.x = node.level * X_SPACING + 60; // +60 for left margin
        
        if (node.children.length === 0) {
            node.y = currentLeafY;
            currentLeafY += Y_SPACING;
        } else {
            node.y = node.children.reduce((sum, c) => sum + c.y, 0) / node.children.length;
        }
    }
    
    traverse(root);
    return { maxLevel, totalHeight: currentLeafY + 40, totalWidth: maxLevel * X_SPACING + 250 };
}

function getOutputPort(node: CNode) {
    if (node.type === 'VAR') return { x: node.x + 10, y: node.y };
    if (node.type === 'AND') return { x: node.x + 45, y: node.y };
    if (node.type === 'OR') return { x: node.x + 50, y: node.y };
    if (node.type === 'NOT') return { x: node.x + 45, y: node.y };
    return { x: node.x, y: node.y };
}

function getInputPort(node: CNode, childIndex: number, totalChildren: number) {
    if (node.type === 'NOT') return { x: node.x, y: node.y };
    
    let yOffset = 0;
    if (totalChildren > 1) {
        yOffset = -15 + (30 / (totalChildren - 1)) * childIndex;
    }
    
    let xOffset = 0;
    if (node.type === 'OR') {
        xOffset = 15 * (1 - Math.pow(yOffset / 20, 2));
    }
    
    return { x: node.x + xOffset, y: node.y + yOffset };
}

const Gate: React.FC<{ node: CNode, showEquation: boolean }> = ({ node, showEquation }) => {
    const { x, y, type, label, astStr } = node;
    
    if (type === 'VAR') {
        return (
            <g transform={`translate(${x}, ${y})`}>
                <text x="0" y="5" fontSize="18" fontFamily="monospace" textAnchor="end" className="fill-slate-800 dark:fill-gray-100" fontWeight="bold">{label}</text>
            </g>
        );
    }
    
    let path = '';
    if (type === 'AND') {
        path = "M 0 -20 L 25 -20 A 20 20 0 0 1 25 20 L 0 20 Z";
    } else if (type === 'OR') {
        path = "M 0 -20 Q 15 0 0 20 Q 25 20 50 0 Q 25 -20 0 -20 Z";
    } else if (type === 'NOT') {
        path = "M 0 -15 L 35 0 L 0 15 Z";
    }
    
    return (
        <g transform={`translate(${x}, ${y})`}>
            <path d={path} className="fill-slate-50 dark:fill-slate-800 stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" />
            {type === 'NOT' && <circle cx="40" cy="0" r="5" className="fill-slate-50 dark:fill-slate-800 stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" />}
            {showEquation && (
                <text x={type === 'NOT' ? 50 : 55} y="-15" fontSize="12" className="fill-blue-600 dark:fill-blue-400" fontFamily="monospace">
                    {astStr}
                </text>
            )}
        </g>
    );
}

export const LogicCircuit = ({ ast, showEquation }: { ast: ASTNode | null, showEquation: boolean }) => {
    const { root, width, height } = useMemo(() => {
        if (!ast) return { root: null, width: 0, height: 0 };
        let counter = 0;
        const getId = () => `node_${counter++}`;
        const r = buildCTree(ast, getId);
        const { totalWidth, totalHeight } = layoutCTree(r);
        return { root: r, width: totalWidth, height: totalHeight };
    }, [ast]);
    
    if (!root) return null;
    
    const edges: React.ReactNode[] = [];
    const nodes: React.ReactNode[] = [];
    
    function renderNode(node: CNode) {
        nodes.push(<Gate key={node.id} node={node} showEquation={showEquation} />);
        
        node.children.forEach((child, idx) => {
            const outPort = getOutputPort(child);
            const inPort = getInputPort(node, idx, node.children.length);
            
            const midX = outPort.x + (inPort.x - outPort.x) / 2;
            const path = `M ${outPort.x} ${outPort.y} C ${midX} ${outPort.y}, ${midX} ${inPort.y}, ${inPort.x} ${inPort.y}`;
            
            edges.push(
                <path key={`${child.id}-${node.id}`} d={path} fill="none" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" />
            );
            
            renderNode(child);
        });
    }
    
    renderNode(root);
    
    const finalOut = getOutputPort(root);
    edges.push(
        <path key="final-out" d={`M ${finalOut.x} ${finalOut.y} L ${finalOut.x + 30} ${finalOut.y}`} fill="none" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" />
    );
    
    return (
        <div className="overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm w-full transition-colors">
            <svg width={width} height={height} style={{ minWidth: '100%', minHeight: '200px' }}>
                {edges}
                {nodes}
            </svg>
        </div>
    );
}
