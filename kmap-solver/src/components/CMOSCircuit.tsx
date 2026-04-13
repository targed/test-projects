import React from 'react';

type Layout = {
    width: number;
    height: number;
    centerX: number;
    elements: React.ReactNode[];
};

function layoutFET(label: string, isPFET: boolean, keyPrefix: string): Layout {
    const width = 80;
    const height = 60;
    const centerX = 50;
    
    const elements = [
        <line key={`${keyPrefix}-top`} x1={centerX} y1={0} x2={centerX} y2={20} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-bot`} x1={centerX} y1={40} x2={centerX} y2={60} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-chan`} x1={centerX} y1={20} x2={centerX} y2={40} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-gate`} x1={centerX - 8} y1={20} x2={centerX - 8} y2={40} stroke="currentColor" strokeWidth={2} />,
    ];

    if (isPFET) {
        elements.push(
            <circle key={`${keyPrefix}-circ`} cx={centerX - 12} cy={30} r={4} fill="none" stroke="currentColor" strokeWidth={2} />,
            <line key={`${keyPrefix}-gwire`} x1={centerX - 30} y1={30} x2={centerX - 16} y2={30} stroke="currentColor" strokeWidth={2} />
        );
    } else {
        elements.push(
            <line key={`${keyPrefix}-gwire`} x1={centerX - 30} y1={30} x2={centerX - 8} y2={30} stroke="currentColor" strokeWidth={2} />
        );
    }

    elements.push(
        <text key={`${keyPrefix}-label`} x={centerX - 35} y={35} fontSize={16} fontFamily="monospace" textAnchor="end" fill="currentColor">{label}</text>
    );

    return { width, height, centerX, elements };
}

function layoutSeries(children: Layout[], keyPrefix: string): Layout {
    if (children.length === 0) return { width: 0, height: 0, centerX: 0, elements: [] };
    if (children.length === 1) return children[0];

    let currentY = 0;
    const elements: React.ReactNode[] = [];

    const maxCenterX = Math.max(...children.map(c => c.centerX));
    const maxRightWidth = Math.max(...children.map(c => c.width - c.centerX));
    
    const width = maxCenterX + maxRightWidth;
    const centerX = maxCenterX;

    children.forEach((child, i) => {
        const offsetX = centerX - child.centerX;
        const offsetY = currentY;
        
        elements.push(
            <g key={`${keyPrefix}-child-${i}`} transform={`translate(${offsetX}, ${offsetY})`}>
                {child.elements}
            </g>
        );
        
        currentY += child.height;
    });

    return { width, height: currentY, centerX, elements };
}

function layoutParallel(children: Layout[], keyPrefix: string): Layout {
    if (children.length === 0) return { width: 0, height: 0, centerX: 0, elements: [] };
    if (children.length === 1) return children[0];

    const spacing = 20;
    const topMargin = 20;
    const bottomMargin = 20;

    let currentX = 0;
    let maxHeight = Math.max(...children.map(c => c.height));
    
    const elements: React.ReactNode[] = [];
    const childCenters: number[] = [];

    children.forEach((child, i) => {
        const offsetX = currentX;
        const offsetY = topMargin + (maxHeight - child.height) / 2;
        
        elements.push(
            <g key={`${keyPrefix}-child-${i}`} transform={`translate(${offsetX}, ${offsetY})`}>
                {child.elements}
            </g>
        );
        
        childCenters.push(currentX + child.centerX);
        
        elements.push(
            <line key={`${keyPrefix}-topwire-${i}`} x1={currentX + child.centerX} y1={topMargin} x2={currentX + child.centerX} y2={offsetY} stroke="currentColor" strokeWidth={2} />,
            <line key={`${keyPrefix}-botwire-${i}`} x1={currentX + child.centerX} y1={offsetY + child.height} x2={currentX + child.centerX} y2={topMargin + maxHeight} stroke="currentColor" strokeWidth={2} />
        );

        currentX += child.width + spacing;
    });

    const width = currentX - spacing;
    const height = maxHeight + topMargin + bottomMargin;
    
    const firstCenter = childCenters[0];
    const lastCenter = childCenters[childCenters.length - 1];
    const centerX = (firstCenter + lastCenter) / 2;

    elements.push(
        <line key={`${keyPrefix}-topbus`} x1={firstCenter} y1={topMargin} x2={lastCenter} y2={topMargin} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-botbus`} x1={firstCenter} y1={topMargin + maxHeight} x2={lastCenter} y2={topMargin + maxHeight} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-in`} x1={centerX} y1={0} x2={centerX} y2={topMargin} stroke="currentColor" strokeWidth={2} />,
        <line key={`${keyPrefix}-out`} x1={centerX} y1={topMargin + maxHeight} x2={centerX} y2={height} stroke="currentColor" strokeWidth={2} />
    );

    childCenters.forEach((cx, i) => {
        if (i > 0 && i < childCenters.length - 1) {
            elements.push(
                <circle key={`${keyPrefix}-topdot-${i}`} cx={cx} cy={topMargin} r={3} fill="currentColor" />,
                <circle key={`${keyPrefix}-botdot-${i}`} cx={cx} cy={topMargin + maxHeight} r={3} fill="currentColor" />
            );
        }
    });

    elements.push(
        <circle key={`${keyPrefix}-topmaindot`} cx={centerX} cy={topMargin} r={3} fill="currentColor" />,
        <circle key={`${keyPrefix}-botmaindot`} cx={centerX} cy={topMargin + maxHeight} r={3} fill="currentColor" />
    );

    return { width, height, centerX, elements };
}

function flattenAST(node: any, type: string): any[] {
    if (!node) return [];
    if (node.type === type) {
        return [...flattenAST(node.left, type), ...flattenAST(node.right, type)];
    }
    return [node];
}

function astToLayout(node: any, isPUN: boolean, path: string = "root"): Layout {
    if (!node) return layoutFET("?", isPUN, path);

    if (node.type === 'CONST') {
        if (node.value === 1) {
            if (isPUN) {
                return { width: 20, height: 40, centerX: 10, elements: [
                    <line key={`${path}-short`} x1={10} y1={0} x2={10} y2={40} stroke="currentColor" strokeWidth={2} />
                ]};
            } else {
                return { width: 40, height: 40, centerX: 20, elements: [
                    <line key={`${path}-open1`} x1={20} y1={0} x2={20} y2={10} stroke="currentColor" strokeWidth={2} />,
                    <line key={`${path}-open2`} x1={20} y1={30} x2={20} y2={40} stroke="currentColor" strokeWidth={2} />
                ]};
            }
        } else {
            if (isPUN) {
                return { width: 40, height: 40, centerX: 20, elements: [
                    <line key={`${path}-open1`} x1={20} y1={0} x2={20} y2={10} stroke="currentColor" strokeWidth={2} />,
                    <line key={`${path}-open2`} x1={20} y1={30} x2={20} y2={40} stroke="currentColor" strokeWidth={2} />
                ]};
            } else {
                return { width: 20, height: 40, centerX: 10, elements: [
                    <line key={`${path}-short`} x1={10} y1={0} x2={10} y2={40} stroke="currentColor" strokeWidth={2} />
                ]};
            }
        }
    }

    if (node.type === 'AND') {
        const children = flattenAST(node, 'AND').map((c, i) => astToLayout(c, isPUN, `${path}-${i}`));
        if (isPUN) return layoutSeries(children, path);
        else return layoutParallel(children, path);
    } else if (node.type === 'OR') {
        const children = flattenAST(node, 'OR').map((c, i) => astToLayout(c, isPUN, `${path}-${i}`));
        if (isPUN) return layoutParallel(children, path);
        else return layoutSeries(children, path);
    } else if (node.type === 'NOT') {
        let varName = "?";
        if (node.left && node.left.type === 'VAR') {
            varName = node.left.value;
        }
        return layoutFET(varName, isPUN, path);
    } else if (node.type === 'VAR') {
        return layoutFET(node.value + "'", isPUN, path);
    }

    return layoutFET("?", isPUN, path);
}

function layoutCMOS(ast: any): Layout {
    const pun = astToLayout(ast, true, "pun");
    const pdn = astToLayout(ast, false, "pdn");

    const spacing = 40;
    const vddHeight = 30;
    const gndHeight = 30;

    const maxCenterX = Math.max(pun.centerX, pdn.centerX);
    const maxRightWidth = Math.max(pun.width - pun.centerX, pdn.width - pdn.centerX);
    const width = maxCenterX + maxRightWidth + 60;
    const centerX = maxCenterX + 20; // Add some left padding

    const height = vddHeight + pun.height + spacing + pdn.height + gndHeight;

    const elements: React.ReactNode[] = [];

    // VDD
    elements.push(
        <line key="vdd-line" x1={centerX - 15} y1={10} x2={centerX + 15} y2={10} stroke="currentColor" strokeWidth={2} />,
        <text key="vdd-text" x={centerX} y={5} fontSize={14} textAnchor="middle" fill="currentColor">VDD</text>,
        <line key="vdd-wire" x1={centerX} y1={10} x2={centerX} y2={vddHeight} stroke="currentColor" strokeWidth={2} />
    );

    // PUN
    elements.push(
        <g key="pun-group" transform={`translate(${centerX - pun.centerX}, ${vddHeight})`}>
            {pun.elements}
        </g>
    );

    // Output
    const outY = vddHeight + pun.height + spacing / 2;
    elements.push(
        <line key="out-wire-v" x1={centerX} y1={vddHeight + pun.height} x2={centerX} y2={vddHeight + pun.height + spacing} stroke="currentColor" strokeWidth={2} />,
        <line key="out-wire-h" x1={centerX} y1={outY} x2={centerX + 30} y2={outY} stroke="currentColor" strokeWidth={2} />,
        <circle key="out-dot" cx={centerX} cy={outY} r={3} fill="currentColor" />,
        <text key="out-text" x={centerX + 35} y={outY + 5} fontSize={16} fontFamily="monospace" fill="currentColor">F</text>
    );

    // PDN
    elements.push(
        <g key="pdn-group" transform={`translate(${centerX - pdn.centerX}, ${vddHeight + pun.height + spacing})`}>
            {pdn.elements}
        </g>
    );

    // GND
    const gndY = vddHeight + pun.height + spacing + pdn.height;
    elements.push(
        <line key="gnd-wire" x1={centerX} y1={gndY} x2={centerX} y2={gndY + 10} stroke="currentColor" strokeWidth={2} />,
        <line key="gnd-line1" x1={centerX - 15} y1={gndY + 10} x2={centerX + 15} y2={gndY + 10} stroke="currentColor" strokeWidth={2} />,
        <line key="gnd-line2" x1={centerX - 10} y1={gndY + 15} x2={centerX + 10} y2={gndY + 15} stroke="currentColor" strokeWidth={2} />,
        <line key="gnd-line3" x1={centerX - 5} y1={gndY + 20} x2={centerX + 5} y2={gndY + 20} stroke="currentColor" strokeWidth={2} />
    );

    return { width, height, centerX, elements };
}

export const CMOSCircuit: React.FC<{ ast: any }> = ({ ast }) => {
    if (!ast) return null;

    const layout = layoutCMOS(ast);

    return (
        <div className="flex justify-center overflow-auto p-8 bg-white dark:bg-slate-800 rounded-lg w-full">
            <svg width={layout.width} height={layout.height} className="text-slate-800 dark:text-gray-200">
                {layout.elements}
            </svg>
        </div>
    );
};
