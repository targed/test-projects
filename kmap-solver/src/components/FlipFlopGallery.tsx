import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Maximize2, Minimize2, Cpu, Box, Binary, Layers, Info, Share2, Network, Activity, Settings2, Plus, Play } from 'lucide-react';

type DrillLevel = 'symbol' | 'internal';
type ComponentType = 'sr_latch' | 'd_latch' | 'd_ff' | 'sr_ff' | 'jk_ff' | 't_ff';
type MainTab = 'explorer' | 'evolution' | 'conversion' | 'timing';

interface TableData {
    title: string;
    headers: string[];
    rows: string[][];
}

interface FFInfo {
    id: ComponentType;
    name: string;
    description: string;
    evolution: string;
    details: string[];
    tables?: TableData[];
}

const galleryItems: FFInfo[] = [
    {
        id: 'sr_latch',
        name: 'SR Latch',
        description: 'The fundamental storage element. Uses cross-coupling to create feedback, allowing it to "remember" its state.',
        evolution: 'Gates -> SR Latch',
        details: ['Basic storage element', 'Level sensitive', 'Has undefined (S=R=1) state', 'Cross-coupled NOR/NAND gates'],
        tables: [
            {
                title: 'Truth Table (Active High)',
                headers: ['S', 'R', 'Qn+1', 'State'],
                rows: [
                    ['0', '0', 'Qn', 'Hold'],
                    ['0', '1', '0', 'Reset'],
                    ['1', '0', '1', 'Set'],
                    ['1', '1', 'X', 'Invalid']
                ]
            }
        ]
    },
    {
        id: 'd_latch',
        name: 'D Latch',
        description: 'Eliminates the invalid SR state by tying inputs together through an inverter.',
        evolution: 'SR Latch + Inverter -> D Latch',
        details: ['D stands for Data', 'Transparent when EN is high', 'Holds data when EN is low', 'Eliminates S=R=1 risk'],
        tables: [
            {
                title: 'Truth Table',
                headers: ['EN', 'D', 'Qn+1', 'State'],
                rows: [
                    ['0', 'X', 'Qn', 'Hold'],
                    ['1', '0', '0', 'Reset'],
                    ['1', '1', '1', 'Set']
                ]
            }
        ]
    },
    {
        id: 'd_ff',
        name: 'D Flip-Flop',
        description: 'Edge-triggered memory. Built from two D-Latches in series (Master-Slave).',
        evolution: '2x D Latches + Inverter -> D-FF',
        details: ['Edge triggered (Rising/Falling)', 'Standard cell for registers', 'No transparency half-cycle', 'Master-Slave operation'],
        tables: [
            {
                title: 'Truth Table',
                headers: ['CLK', 'D', 'Qn+1'],
                rows: [
                    ['0/1', 'X', 'Qn'],
                    ['↑', '0', '0'],
                    ['↑', '1', '1']
                ]
            },
            {
                title: 'Characteristic Table',
                headers: ['Qn', 'D', 'Qn+1'],
                rows: [
                    ['0', '0', '0'],
                    ['0', '1', '1'],
                    ['1', '0', '0'],
                    ['1', '1', '1']
                ]
            },
            {
                title: 'Excitation Table',
                headers: ['Qn', 'Qn+1', 'D'],
                rows: [
                    ['0', '0', '0'],
                    ['0', '1', '1'],
                    ['1', '0', '0'],
                    ['1', '1', '1']
                ]
            }
        ]
    },
    {
        id: 'sr_ff',
        name: 'SR Flip-Flop',
        description: 'Synchronous version of the SR latch. Only updates on the clock edge.',
        evolution: 'SR Latch + Clock Gating -> SR-FF',
        details: ['Clock edge sensitive', 'Maintains SR logic', 'Still has invalid 1,1 state', 'Basis for complex FFs'],
        tables: [
            {
                title: 'Truth Table',
                headers: ['CLK', 'S', 'R', 'Qn+1'],
                rows: [
                    ['0/1', 'X', 'X', 'Qn'],
                    ['↑', '0', '0', 'Qn'],
                    ['↑', '0', '1', '0'],
                    ['↑', '1', '0', '1'],
                    ['↑', '1', '1', 'Invalid']
                ]
            },
            {
                title: 'Characteristic Table',
                headers: ['Qn', 'S', 'R', 'Qn+1'],
                rows: [
                    ['0', '0', '0', '0'],
                    ['0', '0', '1', '0'],
                    ['0', '1', '0', '1'],
                    ['0', '1', '1', 'X'],
                    ['1', '0', '0', '1'],
                    ['1', '0', '1', '0'],
                    ['1', '1', '0', '1'],
                    ['1', '1', '1', 'X']
                ]
            },
            {
                title: 'Excitation Table',
                headers: ['Qn', 'Qn+1', 'S', 'R'],
                rows: [
                    ['0', '0', '0', 'X'],
                    ['0', '1', '1', '0'],
                    ['1', '0', '0', '1'],
                    ['1', '1', 'X', '0']
                ]
            }
        ]
    },
    {
        id: 'jk_ff',
        name: 'JK Flip-Flop',
        description: 'The universal flip-flop. Turns the invalid (1,1) state into a toggle.',
        evolution: 'SR-FF + Feedback Logic -> JK-FF',
        details: ['J=Set, K=Reset', 'J=K=1 Toggles output', 'Most flexible flip-flop', 'Internal feedback loops'],
        tables: [
            {
                title: 'Truth Table',
                headers: ['CLK', 'J', 'K', 'Qn+1'],
                rows: [
                    ['0/1', 'X', 'X', 'Qn'],
                    ['↑', '0', '0', 'Qn'],
                    ['↑', '0', '1', '0'],
                    ['↑', '1', '0', '1'],
                    ['↑', '1', '1', "Qn'"]
                ]
            },
            {
                title: 'Characteristic Table',
                headers: ['Qn', 'J', 'K', 'Qn+1'],
                rows: [
                    ['0', '0', '0', '0'],
                    ['0', '0', '1', '0'],
                    ['0', '1', '0', '1'],
                    ['0', '1', '1', '1'],
                    ['1', '0', '0', '1'],
                    ['1', '0', '1', '0'],
                    ['1', '1', '0', '1'],
                    ['1', '1', '1', '0']
                ]
            },
            {
                title: 'Excitation Table',
                headers: ['Qn', 'Qn+1', 'J', 'K'],
                rows: [
                    ['0', '0', '0', 'X'],
                    ['0', '1', '1', 'X'],
                    ['1', '0', 'X', '1'],
                    ['1', '1', 'X', '0']
                ]
            }
        ]
    },
    {
        id: 't_ff',
        name: 'T Flip-Flop',
        description: 'A Toggle flip-flop. Specific for counters and frequency division.',
        evolution: 'JK-FF (J=K=T) -> T-FF',
        details: ['Toggles every clock edge when T=1', 'Used in synchronous counters', 'Reduces frequency by half', 'Simplest state machine base'],
        tables: [
            {
                title: 'Truth Table',
                headers: ['CLK', 'T', 'Qn+1'],
                rows: [
                    ['0/1', 'X', 'Qn'],
                    ['↑', '0', 'Qn'],
                    ['↑', '1', "Qn'"]
                ]
            },
            {
                title: 'Characteristic Table',
                headers: ['Qn', 'T', 'Qn+1'],
                rows: [
                    ['0', '0', '0'],
                    ['0', '1', '1'],
                    ['1', '0', '1'],
                    ['1', '1', '0']
                ]
            },
            {
                title: 'Excitation Table',
                headers: ['Qn', 'Qn+1', 'T'],
                rows: [
                    ['0', '0', '0'],
                    ['0', '1', '1'],
                    ['1', '0', '1'],
                    ['1', '1', '0']
                ]
            }
        ]
    }
];

const Gate = ({ type, x, y, size = 40 }: { type: 'nor' | 'nand' | 'and' | 'not', x: number, y: number, size?: number }) => (
    <g transform={`translate(${x}, ${y})`} className="stroke-slate-800 dark:stroke-slate-200 fill-none" strokeWidth="2">
        {type === 'and' && <path d={`M 0,0 L ${size*0.4},0 A ${size*0.5},${size*0.5} 0 0 1 ${size*0.4},${size} L 0,${size} Z`} />}
        {type === 'nor' && (
            <g>
                <path d={`M 0,0 C ${size*0.4},0 ${size*0.6},${size*0.25} ${size},${size/2} C ${size*0.6},${size*0.75} ${size*0.4},${size} 0,${size} C ${size*0.2},${size*0.75} ${size*0.2},${size*0.25} 0,0 Z`} />
                <circle cx={size + 3} cy={size/2} r="3" />
            </g>
        )}
        {type === 'not' && (
            <g>
                <path d={`M 0,0 L ${size},${size/2} L 0,${size} Z`} />
                <circle cx={size + 3} cy={size/2} r="3" />
            </g>
        )}
    </g>
);

const Chip = ({ label, x, y, w, h, transparent = false }: { label: string, x: number, y: number, w: number, h: number, transparent?: boolean }) => (
    <g transform={`translate(${x}, ${y})`}>
        <rect width={w} height={h} rx="8" className={`stroke-slate-400 dark:stroke-slate-500 stroke-2 fill-slate-100 dark:fill-slate-800/50 ${transparent ? 'opacity-30' : 'opacity-100'}`} />
        <text x={w/2} y={h/2 + 5} textAnchor="middle" className={`text-xs font-bold fill-slate-600 dark:fill-slate-300 pointer-events-none ${transparent ? 'opacity-0' : 'opacity-100'}`}>{label}</text>
    </g>
);

const ffDefs = {
    sr_ff: { label: 'SR Flip-Flop', inputs: ['S', 'R'], id: 'sr_ff' },
    jk_ff: { label: 'JK Flip-Flop', inputs: ['J', 'K'], id: 'jk_ff' },
    d_ff:  { label: 'D Flip-Flop', inputs: ['D'], id: 'd_ff' },
    t_ff:  { label: 'T Flip-Flop', inputs: ['T'], id: 't_ff' },
};

const getTargetRows = (targetFF: string) => {
    if (targetFF === 'sr_ff') return [['0','0','0','0'], ['0','0','1','1'], ['0','1','0','0'], ['0','1','1','0'], ['1','0','0','1'], ['1','0','1','1'], ['1','1','0','X'], ['1','1','1','X']];
    if (targetFF === 'jk_ff') return [['0','0','0','0'], ['0','0','1','1'], ['0','1','0','0'], ['0','1','1','0'], ['1','0','0','1'], ['1','0','1','1'], ['1','1','0','1'], ['1','1','1','0']];
    if (targetFF === 'd_ff') return [['0','0','0'], ['0','1','1'], ['1','0','0'], ['1','1','1']];
    if (targetFF === 't_ff') return [['0','0','0'], ['0','1','1'], ['1','0','1'], ['1','1','0']];
    return [];
};

const mapSourceOutputs = (sourceFF: string, qn: string, qn1: string) => {
    if (qn1 === 'X') return sourceFF === 'sr_ff' || sourceFF === 'jk_ff' ? ['X','X'] : ['X'];
    if (sourceFF === 'sr_ff') {
        if (qn==='0' && qn1==='0') return ['0','X'];
        if (qn==='0' && qn1==='1') return ['1','0'];
        if (qn==='1' && qn1==='0') return ['0','1'];
        if (qn==='1' && qn1==='1') return ['X','0'];
    }
    if (sourceFF === 'jk_ff') {
        if (qn==='0' && qn1==='0') return ['0','X'];
        if (qn==='0' && qn1==='1') return ['1','X'];
        if (qn==='1' && qn1==='0') return ['X','1'];
        if (qn==='1' && qn1==='1') return ['X','0'];
    }
    if (sourceFF === 'd_ff') return [qn1];
    if (sourceFF === 't_ff') return [(qn === qn1 ? '0' : '1')];
    return [];
};

const conversionEqs: Record<string, string[]> = {
    'sr_ff_to_jk_ff': ['S = J · Qn\'', 'R = K · Qn'],
    'sr_ff_to_d_ff': ['S = D', 'R = D\''],
    'sr_ff_to_t_ff': ['S = T · Qn\'', 'R = T · Qn'],
    'jk_ff_to_sr_ff': ['J = S', 'K = R'],
    'jk_ff_to_d_ff': ['J = D', 'K = D\''],
    'jk_ff_to_t_ff': ['J = T', 'K = T'],
    'd_ff_to_sr_ff': ['D = S + R\' · Qn'],
    'd_ff_to_jk_ff': ['D = J · Qn\' + K\' · Qn'],
    'd_ff_to_t_ff': ['D = T ⊕ Qn'],
    't_ff_to_sr_ff': ['T = S · Qn\' + R · Qn'],
    't_ff_to_jk_ff': ['T = J · Qn\' + K · Qn'],
    't_ff_to_d_ff': ['T = D ⊕ Qn']
};

const LogicGate = ({ type, x, y, size = 40 }: { type: 'nor' | 'nand' | 'and' | 'not' | 'or' | 'xor', x: number, y: number, size?: number }) => {
    const stroke = "currentColor";
    const strokeWidth = 2;
    return (
        <g transform={`translate(${x}, ${y})`} className="stroke-slate-800 dark:stroke-slate-200 fill-none" strokeWidth={strokeWidth}>
            {type === 'and' && <path d={`M 0,0 L ${size*0.4},0 A ${size*0.5},${size*0.5} 0 0 1 ${size*0.4},${size} L 0,${size} Z`} />}
            {type === 'or' && <path d={`M 0,0 C ${size*0.4},0 ${size*0.6},${size*0.25} ${size},${size/2} C ${size*0.6},${size*0.75} ${size*0.4},${size} 0,${size} C ${size*0.2},${size*0.75} ${size*0.2},${size*0.25} 0,0 Z`} />}
            {type === 'xor' && (
                <g>
                    <path d={`M ${size*0.1},0 C ${size*0.5},0 ${size*0.7},${size*0.25} ${size},${size/2} C ${size*0.7},${size*0.75} ${size*0.5},${size} ${size*0.1},${size} C ${size*0.3},${size*0.75} ${size*0.3},${size*0.25} ${size*0.1},0 Z`} />
                    <path d={`M 0,0 C ${size*0.2},${size*0.25} ${size*0.2},${size*0.75} 0,${size}`} />
                </g>
            )}
            {type === 'nor' && (
                <g>
                    <path d={`M 0,0 C ${size*0.4},0 ${size*0.6},${size*0.25} ${size},${size/2} C ${size*0.6},${size*0.75} ${size*0.4},${size} 0,${size} C ${size*0.2},${size*0.75} ${size*0.2},${size*0.25} 0,0 Z`} />
                    <circle cx={size + 3} cy={size/2} r="3" />
                </g>
            )}
            {type === 'nand' && (
                <g>
                    <path d={`M 0,0 L ${size*0.4},0 A ${size*0.5},${size*0.5} 0 0 1 ${size*0.4},${size} L 0,${size} Z`} />
                    <circle cx={size + 3} cy={size/2} r="3" />
                </g>
            )}
            {type === 'not' && (
                <g transform={`translate(${size*0.2}, ${size*0.2}) scale(0.6)`}>
                    <path d={`M 0,0 L ${size},${size/2} L 0,${size} Z`} />
                    <circle cx={size + 3} cy={size/2} r="3" />
                </g>
            )}
        </g>
    );
};

const CircuitGenerator = ({ source, target }: { source: string, target: string }) => {
    const key = `${source}_to_${target}`;
    const stroke = "currentColor";
    const strokeWidth = 2;

    const sourceDef = ffDefs[source as keyof typeof ffDefs];
    const targetDef = ffDefs[target as keyof typeof ffDefs];
    if (!sourceDef || !targetDef) return null;

    const sourceIns = sourceDef.inputs;
    const targetIns = targetDef.inputs;

    return (
        <svg viewBox="0 0 500 240" className="w-full max-w-2xl h-auto text-slate-800 dark:text-slate-200">
            {/* The base source FF on the right side */}
            <g transform="translate(320, 60)">
                <rect x="0" y="0" width="80" height="120" fill="white" className="dark:fill-slate-800" stroke={stroke} strokeWidth={strokeWidth} rx="8" />
                <text x="40" y="-10" textAnchor="middle" className="text-[10px] font-bold fill-current tracking-wider uppercase">Given</text>
                <text x="40" y="60" textAnchor="middle" className="text-sm font-bold fill-current uppercase">{sourceDef.label.replace(' Flip-Flop', '')}</text>
                
                {/* Clock */}
                <path d="M 0,105 L 10,110 L 0,115" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                <line x1="-300" y1="110" x2="0" y2="110" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="2 4" />
                <text x="-290" y="105" className="text-[10px] font-mono fill-current">CLK</text>

                {/* Outputs */}
                <line x1="80" y1="30" x2="140" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
                <text x="145" y="34" className="text-xs font-bold fill-current">Qn+1</text>
                <circle cx="140" cy="30" r="3" fill={stroke} />

                <line x1="80" y1="90" x2="140" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                <text x="145" y="94" className="text-xs font-bold fill-current">Qn+1'</text>
                
                {/* Inputs for Source FF */}
                {sourceIns.length === 2 ? (
                    <>
                        <text x="10" y="34" className="text-xs font-bold fill-current">{sourceIns[0]}</text>
                        <text x="10" y="94" className="text-xs font-bold fill-current">{sourceIns[1]}</text>
                    </>
                ) : (
                    <text x="10" y="64" className="text-xs font-bold fill-current">{sourceIns[0]}</text>
                )}
            </g>

            {/* Target inputs on far left */}
            {targetIns.length === 2 ? (
                <g>
                    <text x="10" y="94" className="text-sm font-bold fill-current bg-blue-100">{targetIns[0]}</text>
                    <circle cx="25" cy="90" r="4" className="fill-blue-500" />
                    <text x="10" y="154" className="text-sm font-bold fill-current">{targetIns[1]}</text>
                    <circle cx="25" cy="150" r="4" className="fill-blue-500" />
                </g>
            ) : (
                <g>
                    <text x="10" y="124" className="text-sm font-bold fill-current">{targetIns[0]}</text>
                    <circle cx="25" cy="120" r="4" className="fill-blue-500" />
                </g>
            )}

            {/* Circuit wiring */}
            <g transform="translate(0, 0)">
                {key === 'sr_ff_to_jk_ff' && (
                    <g>
                        <LogicGate type="and" x={200} y={70} size={40} />
                        <line x1="25" y1="90" x2="200" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="240" y1="90" x2="320" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <LogicGate type="and" x={200} y={130} size={40} />
                        <line x1="25" y1="150" x2="200" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="240" y1="150" x2="320" y2="150" stroke={stroke} strokeWidth={strokeWidth} />

                        <path d="M 440,150 L 440,210 L 170,210 L 170,80 L 200,80" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        <path d="M 440,90 L 440,30 L 180,30 L 180,140 L 200,140" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        <circle cx="440" cy="150" r="3" fill={stroke} opacity="0.4" />
                        <circle cx="440" cy="90" r="3" fill={stroke} opacity="0.4" />
                    </g>
                )}

                {key === 'sr_ff_to_d_ff' && (
                    <g>
                        <line x1="25" y1="120" x2="60" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 60,120 L 60,90 L 320,90" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <circle cx="60" cy="120" r="3" fill={stroke} />
                        <path d="M 60,120 L 60,150 L 200,150" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <LogicGate type="not" x={200} y={130} size={40} />
                        <line x1="240" y1="150" x2="320" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 'sr_ff_to_t_ff' && (
                    <g>
                        <LogicGate type="and" x={200} y={70} size={40} />
                        <line x1="150" y1="90" x2="200" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="240" y1="90" x2="320" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <LogicGate type="and" x={200} y={130} size={40} />
                        <line x1="150" y1="150" x2="200" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="240" y1="150" x2="320" y2="150" stroke={stroke} strokeWidth={strokeWidth} />

                        <path d="M 25,120 L 150,120 L 150,90" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 150,120 L 150,150" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <circle cx="150" cy="120" r="3" fill={stroke} />

                        <path d="M 440,150 L 440,210 L 170,210 L 170,80 L 200,80" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        <path d="M 440,90 L 440,30 L 180,30 L 180,140 L 200,140" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                    </g>
                )}

                {key === 'jk_ff_to_sr_ff' && (
                    <g>
                        <line x1="25" y1="90" x2="320" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="25" y1="150" x2="320" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 'jk_ff_to_d_ff' && (
                    <g>
                        <line x1="25" y1="120" x2="60" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 60,120 L 60,90 L 320,90" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <circle cx="60" cy="120" r="3" fill={stroke} />
                        <path d="M 60,120 L 60,150 L 200,150" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <LogicGate type="not" x={200} y={130} size={40} />
                        <line x1="240" y1="150" x2="320" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 'jk_ff_to_t_ff' && (
                    <g>
                        <line x1="25" y1="120" x2="160" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 160,120 L 160,90 L 320,90" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 160,120 L 160,150 L 320,150" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <circle cx="160" cy="120" r="3" fill={stroke} />
                    </g>
                )}

                {key === 'd_ff_to_sr_ff' && (
                    <g>
                        <LogicGate type="not" x={80} y={130} size={40} />
                        <line x1="25" y1="150" x2="80" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <LogicGate type="and" x={160} y={130} size={40} />
                        <line x1="120" y1="140" x2="160" y2="140" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,90 L 440,30 L 140,30 L 140,160 L 160,160" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="or" x={250} y={100} size={40} />
                        <path d="M 25,90 L 220,90 L 220,110 L 250,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 200,150 L 220,150 L 220,130 L 250,130" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="290" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 'd_ff_to_jk_ff' && (
                    <g>
                        <LogicGate type="and" x={160} y={70} size={40} />
                        <line x1="25" y1="90" x2="160" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,150 L 440,220 L 140,220 L 140,80 L 160,80" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="not" x={80} y={130} size={40} />
                        <line x1="25" y1="150" x2="80" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <LogicGate type="and" x={160} y={130} size={40} />
                        <line x1="120" y1="140" x2="160" y2="140" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,90 L 440,30 L 130,30 L 130,160 L 160,160" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="or" x={250} y={100} size={40} />
                        <path d="M 200,90 L 230,90 L 230,110 L 250,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 200,150 L 230,150 L 230,130 L 250,130" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="290" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 'd_ff_to_t_ff' && (
                    <g>
                         <LogicGate type="xor" x={200} y={100} size={40} />
                         <line x1="25" y1="120" x2="200" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                         <path d="M 440,90 L 440,30 L 180,30 L 180,110 L 200,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                         <line x1="240" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 't_ff_to_sr_ff' && (
                    <g>
                        <LogicGate type="and" x={160} y={70} size={40} />
                        <line x1="25" y1="90" x2="160" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,150 L 440,220 L 140,220 L 140,80 L 160,80" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="and" x={160} y={130} size={40} />
                        <line x1="25" y1="150" x2="160" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,90 L 440,30 L 130,30 L 130,160 L 160,160" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="or" x={250} y={100} size={40} />
                        <path d="M 200,90 L 230,90 L 230,110 L 250,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 200,150 L 230,150 L 230,130 L 250,130" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="290" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 't_ff_to_jk_ff' && (
                    <g>
                        <LogicGate type="and" x={160} y={70} size={40} />
                        <line x1="25" y1="90" x2="160" y2="90" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,150 L 440,220 L 140,220 L 140,80 L 160,80" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="and" x={160} y={130} size={40} />
                        <line x1="25" y1="150" x2="160" y2="150" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 440,90 L 440,30 L 130,30 L 130,160 L 160,160" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                        
                        <LogicGate type="or" x={250} y={100} size={40} />
                        <path d="M 200,90 L 230,90 L 230,110 L 250,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 200,150 L 230,150 L 230,130 L 250,130" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1="290" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}

                {key === 't_ff_to_d_ff' && (
                    <g>
                         <LogicGate type="xor" x={200} y={100} size={40} />
                         <line x1="25" y1="120" x2="200" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                         <path d="M 440,90 L 440,30 L 180,30 L 180,110 L 200,110" fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity="0.4" />
                         <line x1="240" y1="120" x2="320" y2="120" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                )}
            </g>
        </svg>
    )
};

const parseEquations = (eqStr: string) => {
    const stmts = eqStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const ffs = [];
    for (const s of stmts) {
        const m = s.match(/([a-zA-Z0-9_]+)\s*=\s*(D|T|JK|SR)\s*\((.+)\)/i);
        if (m) {
            ffs.push({
                id: Math.random().toString(),
                target: m[1].toUpperCase(),
                type: m[2].toUpperCase() as 'D' | 'T' | 'JK' | 'SR',
                clocking: 'rising' as const,
                args: m[3].split(',').map(a => a.trim()),
            });
        }
    }
    return ffs;
};

const evaluateExpr = (expr: string, context: Record<string, number>): number => {
    try {
        let s = expr.toUpperCase();
        
        let sortedVars = Object.keys(context).sort((a,b) => b.length - a.length);
        let tokens: any[] = [];
        let i = 0;
        while(i < s.length) {
            let char = s[i];
            if (/\s/.test(char)) { i++; continue; }
            if (['(', ')', '+', '^', "'", '!', '&', '|'].includes(char)) {
                tokens.push(char); i++; continue;
            }
            
            let matched = false;
            for(let v of sortedVars) {
                if(s.substring(i, i+v.length) === v) {
                    tokens.push({type: 'var', name: v});
                    i += v.length;
                    matched = true;
                    break;
                }
            }
            if(!matched) {
                if (char === '0' || char === '1') tokens.push({type: 'val', val: parseInt(char)});
                else if (/[A-Z]/.test(char)) tokens.push({type: 'var', name: char}); 
                i++;
            }
        }
        
        let newTokens = [];
        for(let j=0; j<tokens.length; j++) {
            newTokens.push(tokens[j]);
            if (j < tokens.length - 1) {
                let curr = tokens[j];
                let next = tokens[j+1];
                let leftIsVal = (typeof curr === 'object') || curr === ')' || curr === "'";
                let rightIsVal = (typeof next === 'object') || next === '(' || next === "!";
                if (leftIsVal && rightIsVal) newTokens.push('&');
            }
        }
        tokens = newTokens;

        let output = [];
        let ops = [];
        let precedence: Record<string, number> = { '+': 1, '|': 1, '^': 2, '&': 3, '!': 4, "'": 4 };
        
        for(let t of tokens) {
            if (typeof t === 'object') {
                output.push(t);
            } else if (t === '!' || t === "'") {
                if (t === "'") output.push(t);
                else ops.push(t);
            } else if (t === '(') {
                ops.push(t);
            } else if (t === ')') {
                while(ops.length && ops[ops.length-1] !== '(') output.push(ops.pop());
                ops.pop();
            } else {
                while(ops.length && ops[ops.length-1] !== '(' && precedence[ops[ops.length-1] as string] >= precedence[t]) {
                    output.push(ops.pop());
                }
                ops.push(t);
            }
        }
        while(ops.length) output.push(ops.pop());

        let stack: number[] = [];
        for(let t of output) {
            if (typeof t === 'object') {
                if (t.type === 'val') stack.push(t.val);
                else stack.push(context[t.name] || 0);
            } else if (t === "'" || t === "!") {
                let val = stack.pop() || 0;
                stack.push(val ? 0 : 1);
            } else {
                let b = stack.pop() || 0;
                let a = stack.pop() || 0;
                if (t === '&') stack.push((a && b) ? 1 : 0);
                else if (t === '+' || t === '|') stack.push((a || b) ? 1 : 0);
                else if (t === '^') stack.push((a !== b) ? 1 : 0);
            }
        }
        
        return stack.length ? stack[0] : 0;
    } catch (e) {
        return 0; 
    }
};

const TimingLab = () => {
    const [cycles, setCycles] = useState(12);
    const [resolution, setResolution] = useState(4);
    const [zoom, setZoom] = useState(1);
    const [signals, setSignals] = useState([
        { id: 'clk', name: 'CLK', role: 'clock', data: Array(12 * 4).fill(0).map((_, i) => (Math.floor(i / 4) % 2 === 0 ? 0 : 1)) },
        { id: 'in', name: 'IN', role: 'input', data: Array(12 * 4).fill(0).map((_, i) => (i > 8 && i < 16 ? 1 : 0)) },
        { id: 'log_d_q1', name: 'D1', role: 'logic', data: Array(12 * 4).fill(0) },
        { id: 'out_q1', name: 'Q1', role: 'output', data: Array(12 * 4).fill(0) },
        { id: 'log_t_q0', name: 'T0', role: 'logic', data: Array(12 * 4).fill(0) },
        { id: 'out_q0', name: 'Q0', role: 'output', data: Array(12 * 4).fill(0) },
    ]);
    const [equation, setEquation] = useState('Q1 = D(IN), Q0 = T((Q1 Q0)\')');
    const [clkStart, setClkStart] = useState(0);
    const [inputMode, setInputMode] = useState<'visual' | 'equation'>('visual');
    const [ffNodes, setFfNodes] = useState<{id: string, target: string, category: 'ff'|'latch', type: 'D'|'T'|'JK'|'SR', clocking: 'rising'|'falling'|'high'|'low', args: string[]}[]>([
        { id: '1', target: 'Q1', category: 'ff', type: 'D', clocking: 'falling', args: ['IN'] },
        { id: '2', target: 'Q0', category: 'ff', type: 'T', clocking: 'rising', args: ['(Q1 Q0)\''] }
    ]);

    const totalSteps = cycles * resolution;
    const stepWidth = 40 * zoom;
    const rowHeight = 80;
    const labelWidth = 100;

    const parsedFFs = inputMode === 'visual' ? ffNodes : parseEquations(equation).map(f => ({ ...f, id: Math.random().toString(), clocking: 'rising' as const, category: 'ff' as const }));

    const handleCellClick = (sigIdx: number, stepIdx: number, part: 'top' | 'bottom' | 'middle') => {
        const newSignals = [...signals];
        const data = [...newSignals[sigIdx].data];
        
        if (part === 'top') {
            data[stepIdx] = 1;
        } else if (part === 'bottom') {
            data[stepIdx] = 0;
        } else {
            data[stepIdx] = data[stepIdx] === 1 ? 0 : 1;
        }

        newSignals[sigIdx].data = data;
        setSignals(newSignals);
    };

    const getLogicName = (pfx: string, tgt: string) => {
        const suf = tgt.replace(/^[A-Z]+/i, '');
        return `${pfx}${suf}`;
    };

    const solveSignals = () => {
        let baseSignals = [...signals];
        const inputsAndClock = baseSignals.filter(s => s.role === 'clock' || s.role === 'input');
        const ffs = parsedFFs;
        
        const stateHist: Record<string, number[]> = {};
        const logicHist: Record<string, number[]> = {};
        
        for(let s of inputsAndClock) stateHist[s.name.toUpperCase()] = s.data;
        
        for (const ff of ffs) {
            const tgt = ff.target.toUpperCase();
            if(!stateHist[tgt]) {
                stateHist[tgt] = new Array(totalSteps).fill(0);
            }
            if (ff.type === 'D') logicHist[`D_${tgt}`] = new Array(totalSteps).fill(0);
            else if (ff.type === 'T') logicHist[`T_${tgt}`] = new Array(totalSteps).fill(0);
            else if (ff.type === 'JK') {
                logicHist[`J_${tgt}`] = new Array(totalSteps).fill(0);
                logicHist[`K_${tgt}`] = new Array(totalSteps).fill(0);
            }
            else if (ff.type === 'SR') {
                logicHist[`S_${tgt}`] = new Array(totalSteps).fill(0);
                logicHist[`R_${tgt}`] = new Array(totalSteps).fill(0);
            }
        }

        const getCtx = (idx: number) => {
            let c: Record<string, number> = {};
            for(let k in stateHist) c[k] = stateHist[k][idx];
            return c;
        };

        const evalAllLogic = (idx: number) => {
            let c = getCtx(idx);
            for (let ff of ffs) {
                let tgt = ff.target.toUpperCase();
                if (ff.type === 'D') logicHist[`D_${tgt}`][idx] = evaluateExpr(ff.args[0], c);
                else if (ff.type === 'T') logicHist[`T_${tgt}`][idx] = evaluateExpr(ff.args[0], c);
                else if (ff.type === 'JK') {
                    logicHist[`J_${tgt}`][idx] = evaluateExpr(ff.args[0], c);
                    logicHist[`K_${tgt}`][idx] = evaluateExpr(ff.args[1], c);
                }
                else if (ff.type === 'SR') {
                    logicHist[`S_${tgt}`][idx] = evaluateExpr(ff.args[0], c);
                    logicHist[`R_${tgt}`][idx] = evaluateExpr(ff.args[1], c);
                }
            }
        };

        evalAllLogic(0);
        
        const clkData = stateHist['CLK'] || [];
        
        for(let i=1; i<totalSteps; i++) {
            const isRising = clkData[i] === 1 && clkData[i-1] === 0;
            const isFalling = clkData[i] === 0 && clkData[i-1] === 1;
            const isHigh = clkData[i] === 1;
            const isLow = clkData[i] === 0;
            
            for (const ff of ffs) {
                const cat = ff.category || 'ff';
                const clocking = ff.clocking || (cat === 'ff' ? 'rising' : 'high');
                const trigger = (cat === 'ff') ? 
                    ((clocking === 'rising' && isRising) || (clocking === 'falling' && isFalling)) :
                    ((clocking === 'high' && isHigh) || (clocking === 'low' && isLow));
                
                const tgt = ff.target.toUpperCase();
                let nextVal = stateHist[tgt][i-1];
                
                if (trigger) {
                    let logicCtx = getCtx(i-1);
                    
                    if (ff.type === 'D') {
                        nextVal = evaluateExpr(ff.args[0], logicCtx);
                    } else if (ff.type === 'T') {
                        const tVal = evaluateExpr(ff.args[0], logicCtx);
                        if (tVal) nextVal = nextVal === 1 ? 0 : 1;
                    } else if (ff.type === 'JK') {
                        const jVal = evaluateExpr(ff.args[0], logicCtx);
                        const kVal = evaluateExpr(ff.args[1] || '1', logicCtx);
                        if (jVal && kVal) nextVal = nextVal === 1 ? 0 : 1;
                        else if (jVal) nextVal = 1;
                        else if (kVal) nextVal = 0;
                    } else if (ff.type === 'SR') {
                        const sVal = evaluateExpr(ff.args[0], logicCtx);
                        const rVal = evaluateExpr(ff.args[1] || '0', logicCtx);
                        if (sVal && !rVal) nextVal = 1;
                        else if (rVal && !sVal) nextVal = 0;
                        else if (sVal && rVal) nextVal = 0;
                    }
                }
                stateHist[tgt][i] = nextVal;
            }
            
            evalAllLogic(i);
        }
        
        let resultSignals = [...inputsAndClock];
        for (const ff of ffs) {
            let tgt = ff.target.toUpperCase();
            if (ff.type === 'D') {
                resultSignals.push({ id: `log_d_${tgt}`, name: getLogicName('D', tgt), role: 'logic', data: logicHist[`D_${tgt}`] });
            } else if (ff.type === 'T') {
                resultSignals.push({ id: `log_t_${tgt}`, name: getLogicName('T', tgt), role: 'logic', data: logicHist[`T_${tgt}`] });
            } else if (ff.type === 'JK') {
                resultSignals.push({ id: `log_j_${tgt}`, name: getLogicName('J', tgt), role: 'logic', data: logicHist[`J_${tgt}`] });
                resultSignals.push({ id: `log_k_${tgt}`, name: getLogicName('K', tgt), role: 'logic', data: logicHist[`K_${tgt}`] });
            } else if (ff.type === 'SR') {
                resultSignals.push({ id: `log_s_${tgt}`, name: getLogicName('S', tgt), role: 'logic', data: logicHist[`S_${tgt}`] });
                resultSignals.push({ id: `log_r_${tgt}`, name: getLogicName('R', tgt), role: 'logic', data: logicHist[`R_${tgt}`] });
            }
            resultSignals.push({ id: `out_${tgt}`, name: tgt, role: 'output', data: stateHist[tgt] });
        }
        
        setSignals(resultSignals);
    };

    const addSignal = () => {
        const name = prompt('Signal Name (e.g., IN2, EN):');
        if (name) {
            const uName = name.toUpperCase();
            if (!signals.find(s => s.name === uName)) {
                setSignals([...signals, { id: uName.toLowerCase(), name: uName, role: 'input', data: Array(totalSteps).fill(0) }]);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-700 shadow-xl mt-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Activity className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">TIMING LABORATORY</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5 opacity-60">Professional Logic Verifier</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 group">
                        <div className="flex items-center gap-2 px-3 mr-2 border-r border-slate-200 dark:border-slate-700">
                             <Binary size={14} className="text-slate-400" />
                             <span className="text-[10px] font-black text-slate-500">CLK START:</span>
                        </div>
                        {[0, 1].map(v => (
                            <button
                                key={v}
                                onClick={() => {
                                    setClkStart(v);
                                    setSignals(signals.map(s => s.role === 'clock' ? { 
                                        ...s, 
                                        data: Array(totalSteps).fill(0).map((_, i) => (Math.floor(i / resolution) % 2 === 0 ? v : (v === 0 ? 1 : 0))) 
                                    } : s));
                                }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${clkStart === v ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 group">
                        <div className="flex items-center gap-2 px-3 mr-2 border-r border-slate-200 dark:border-slate-700">
                             <Settings2 size={14} className="text-slate-400" />
                             <span className="text-[10px] font-black text-slate-500">RES:</span>
                        </div>
                        {[1, 2, 4, 8].map(r => (
                            <button
                                key={r}
                                onClick={() => {
                                    setResolution(r);
                                    setSignals(signals.map(s => ({ ...s, data: Array(cycles * r).fill(0) })));
                                }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${resolution === r ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={addSignal}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-2xl font-black text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
                    >
                        <Plus size={14} /> ADD SIGNAL
                    </button>

                    <button 
                        onClick={solveSignals}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <Play size={14} fill="currentColor" /> RUN SOLVER
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Logic Definition
                            </h4>
                            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                <button 
                                    onClick={() => setInputMode('visual')} 
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'visual' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    VISUAL
                                </button>
                                <button 
                                    onClick={() => setInputMode('equation')} 
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'equation' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    EQ
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4 flex-1 flex flex-col">
                            {inputMode === 'equation' ? (
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1">SYSTEM EQUATION</label>
                                    <textarea 
                                        value={equation}
                                        onChange={(e) => setEquation(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-mono text-xs focus:border-blue-500 outline-none transition-all resize-none shadow-sm"
                                        placeholder="e.g., Q1 = D(IN), Q0 = T(Q1 & IN)"
                                    />
                                    <div className="mt-2 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <p className="font-bold mb-1 text-slate-600 dark:text-slate-400">Syntax Help:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Assign outputs: <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">Q1 = D(IN)</code></li>
                                            <li>Available FF types: <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">D</code>, <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">T</code>, <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">JK</code></li>
                                            <li>Multiple FFs: comma separate. e.g. <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">Q0 = JK(IN, Q1)</code></li>
                                            <li>Logic ops: <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">A'</code>, <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">A B</code> (AND), <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">+</code> (OR), <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-blue-500">^</code> (XOR)</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 flex-1">
                                    {ffNodes.map((node, i) => (
                                        <div key={node.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl shadow-sm relative group">
                                            <button 
                                                onClick={() => setFfNodes(ffNodes.filter((_, idx) => idx !== i))}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs shadow-md"
                                            >
                                                &times;
                                            </button>
                                            <div className="flex gap-2 mb-2">
                                                <div className="flex-1">
                                                    <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">TARGET (Q)</label>
                                                    <input 
                                                        value={node.target} 
                                                        onChange={e => {
                                                            const newNodes = [...ffNodes];
                                                            newNodes[i].target = e.target.value.toUpperCase();
                                                            setFfNodes(newNodes);
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-blue-500 uppercase"
                                                        placeholder="Q1"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">CATEGORY</label>
                                                    <select 
                                                        value={node.category || 'ff'}
                                                        onChange={e => {
                                                            const newNodes = [...ffNodes];
                                                            newNodes[i].category = e.target.value as any;
                                                            newNodes[i].clocking = e.target.value === 'ff' ? 'rising' : 'high';
                                                            setFfNodes(newNodes);
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none focus:border-blue-500 appearance-none text-center"
                                                    >
                                                        <option value="ff">Flip-Flop</option>
                                                        <option value="latch">Latch</option>
                                                    </select>
                                                </div>
                                                <div className="w-16">
                                                    <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">TYPE</label>
                                                    <select 
                                                        value={node.type}
                                                        onChange={e => {
                                                            const newNodes = [...ffNodes];
                                                            newNodes[i].type = e.target.value as any;
                                                            if (['JK', 'SR'].includes(e.target.value) && newNodes[i].args.length < 2) {
                                                                newNodes[i].args = [newNodes[i].args[0] || '1', '1'];
                                                            } else if (!['JK', 'SR'].includes(e.target.value)) {
                                                                newNodes[i].args = [newNodes[i].args[0] || '1'];
                                                            }
                                                            setFfNodes(newNodes);
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none focus:border-blue-500 appearance-none text-center"
                                                    >
                                                        <option value="D">D</option>
                                                        <option value="T">T</option>
                                                        <option value="JK">JK</option>
                                                        <option value="SR">SR</option>
                                                    </select>
                                                </div>
                                                <div className="w-28">
                                                    <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">CLOCKING</label>
                                                    <select 
                                                        value={node.clocking || (node.category === 'latch' ? 'high' : 'rising')}
                                                        onChange={e => {
                                                            const newNodes = [...ffNodes];
                                                            newNodes[i].clocking = e.target.value as any;
                                                            setFfNodes(newNodes);
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-blue-500 appearance-none text-center leading-tight overflow-hidden text-ellipsis"
                                                    >
                                                        {node.category === 'latch' ? (
                                                            <>
                                                                <option value="high">Active High</option>
                                                                <option value="low">Active Low</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="rising">Rising Edge</option>
                                                                <option value="falling">Falling Edge</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {['JK', 'SR'].includes(node.type) ? (
                                                    <>
                                                        <div className="flex-1">
                                                            <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">{node.type === 'JK' ? 'J' : 'S'} INPUT LOGIC</label>
                                                            <input 
                                                                value={node.args[0]} 
                                                                onChange={e => {
                                                                    const newNodes = [...ffNodes];
                                                                    newNodes[i].args[0] = e.target.value;
                                                                    setFfNodes(newNodes);
                                                                }}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-blue-500"
                                                                placeholder="1"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">{node.type === 'JK' ? 'K' : 'R'} INPUT LOGIC</label>
                                                            <input 
                                                                value={node.args[1]} 
                                                                onChange={e => {
                                                                    const newNodes = [...ffNodes];
                                                                    newNodes[i].args[1] = e.target.value;
                                                                    setFfNodes(newNodes);
                                                                }}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-blue-500"
                                                                placeholder="1"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex-1">
                                                        <label className="block text-[8px] font-black text-slate-400 mb-1 ml-1">{node.type} INPUT LOGIC</label>
                                                        <input 
                                                            value={node.args[0]} 
                                                            onChange={e => {
                                                                const newNodes = [...ffNodes];
                                                                newNodes[i].args[0] = e.target.value;
                                                                setFfNodes(newNodes);
                                                            }}
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-blue-500"
                                                            placeholder={node.type === 'D' ? 'IN' : '1'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setFfNodes([...ffNodes, { id: Math.random().toString(), target: `Q${ffNodes.length}`, type: 'D', clocking: 'rising', args: ['IN'] }])}
                                        className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 font-bold text-xs hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> ADD FLIP-FLOP
                                    </button>
                                </div>
                            )}

                            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-auto">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Circuit Diagram</p>
                                <div className="flex flex-wrap gap-4 items-center justify-center p-2">
                                    {parsedFFs.length > 0 ? parsedFFs.map((ff, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <svg width="64" height="80" viewBox="0 0 64 80" className="text-slate-800 dark:text-slate-200 drop-shadow-sm">
                                                <rect x="16" y="16" width="32" height="48" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
                                                
                                                {/* Clock input */}
                                                <line x1="0" y1="56" x2={['falling', 'low'].includes(ff.clocking) ? "12" : "16"} y2="56" stroke="currentColor" strokeWidth="2" />
                                                { ['falling', 'low'].includes(ff.clocking) && <circle cx="14" cy="56" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" /> }
                                                { ff.category === 'ff' && <path d="M 16 51 L 23 56 L 16 61" fill="none" stroke="currentColor" strokeWidth="2" /> }
                                                <text x="4" y="52" fontSize="6" fill="currentColor" fontWeight="bold">CLK</text>
                                                
                                                {/* Logic Inputs */}
                                                {['D', 'T'].includes(ff.type) ? (
                                                     <g>
                                                        <line x1="0" y1="26" x2="16" y2="26" stroke="currentColor" strokeWidth="2" />
                                                        <text x="21" y="29" fontSize="9" fill="currentColor" fontWeight="bold">{ff.type}</text>
                                                     </g>
                                                ) : (
                                                     <g>
                                                        <line x1="0" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="2" />
                                                        <text x="20" y="27" fontSize="8" fill="currentColor" fontWeight="bold">{ff.type === 'JK' ? 'J' : 'S'}</text>
                                                        <line x1="0" y1="40" x2="16" y2="40" stroke="currentColor" strokeWidth="2" />
                                                        <text x="20" y="43" fontSize="8" fill="currentColor" fontWeight="bold">{ff.type === 'JK' ? 'K' : 'R'}</text>
                                                     </g>
                                                )}
                                                
                                                {/* Outputs */}
                                                <line x1="48" y1="26" x2="64" y2="26" stroke="currentColor" strokeWidth="2" />
                                                <text x="36" y="29" fontSize="9" fill="currentColor" fontWeight="bold">Q</text>
                                                <line x1="48" y1="56" x2="60" y2="56" stroke="currentColor" strokeWidth="2" />
                                                <circle cx="62" cy="56" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                <text x="34" y="59" fontSize="9" fill="currentColor" fontWeight="bold">Q'</text>
                                                
                                                {/* Title */}
                                                <text x="32" y="10" fontSize="10" textAnchor="middle" fill="currentColor" fontWeight="black" className="fill-blue-500 dark:fill-blue-400">{ff.target}</text>
                                            </svg>
                                        </div>
                                    )) : (
                                        <div className="text-xs text-slate-400 text-center italic py-4">Configure FF logic to view symbols</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                         <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase">View Details</label>
                            <span className="text-[10px] font-bold text-blue-500">{Math.round(zoom * 100)}%</span>
                         </div>
                         <input 
                            type="range" min="0.5" max="3" step="0.1" value={zoom} 
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-slate-900 dark:bg-black rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden relative">
                        <div className="overflow-x-auto custom-scrollbar-dark scroll-smooth cursor-crosshair">
                            <div style={{ width: totalSteps * stepWidth + labelWidth + 80, padding: '40px' }}>
                                <svg 
                                    width={totalSteps * stepWidth + labelWidth} 
                                    height={signals.length * rowHeight}
                                    className="select-none"
                                >
                                    {/* Vertical Dividers */}
                                    {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                                        <line 
                                            key={i}
                                            x1={labelWidth + i * stepWidth}
                                            y1={0}
                                            x2={labelWidth + i * stepWidth}
                                            y2={signals.length * rowHeight}
                                            stroke={i % resolution === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)"}
                                            strokeWidth={i % resolution === 0 ? 2 : 0.5}
                                            strokeDasharray={i % resolution === 0 ? "" : "2 2"}
                                        />
                                    ))}

                                    {signals.map((sig, sIdx) => {
                                        const yBase = sIdx * rowHeight + 40;
                                        const highY = yBase - 25;
                                        const lowY = yBase + 25;

                                        // Path Generation
                                        let d = `M ${labelWidth} ${sig.data[0] === 1 ? highY : lowY}`;
                                        for (let i = 0; i < totalSteps; i++) {
                                            const xEnd = labelWidth + (i+1) * stepWidth;
                                            const val = sig.data[i];
                                            const nextVal = sig.data[i+1];
                                            
                                            d += ` L ${xEnd} ${val === 1 ? highY : lowY}`;
                                            if (nextVal !== undefined && nextVal !== val) {
                                                d += ` L ${xEnd} ${nextVal === 1 ? highY : lowY}`;
                                            }
                                        }

                                        return (
                                            <g key={sig.id}>
                                                <rect x="0" y={sIdx * rowHeight} width="100%" height={rowHeight} fill="transparent" />
                                                <rect x="0" y={sIdx * rowHeight} width="100%" height={rowHeight} className="fill-white/[0.02]" />
                                                
                                                <text 
                                                    x={20} y={yBase + 5} 
                                                    className="fill-slate-500 font-extrabold text-[10px] tracking-widest uppercase italic"
                                                >
                                                    {sig.name}
                                                </text>

                                                {/* Interaction Areas */}
                                                {Array.from({ length: totalSteps }).map((_, i) => (
                                                    <g key={i}>
                                                        {/* Top Half */}
                                                        <rect 
                                                            x={labelWidth + i * stepWidth} y={yBase - 35} 
                                                            width={stepWidth} height={35} 
                                                            fill="transparent"
                                                            className="hover:fill-blue-500/20 cursor-pointer"
                                                            style={{ pointerEvents: 'all' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCellClick(sIdx, i, 'top');
                                                            }}
                                                        />
                                                        {/* Bottom Half */}
                                                        <rect 
                                                            x={labelWidth + i * stepWidth} y={yBase} 
                                                            width={stepWidth} height={35} 
                                                            fill="transparent"
                                                            className="hover:fill-blue-500/20 cursor-pointer"
                                                            style={{ pointerEvents: 'all' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCellClick(sIdx, i, 'bottom');
                                                            }}
                                                        />
                                                        {/* Horizontal Guide */}
                                                        <line 
                                                            x1={labelWidth + i * stepWidth} y1={yBase}
                                                            x2={labelWidth + (i+1) * stepWidth} y2={yBase}
                                                            className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="4 4"
                                                        />
                                                    </g>
                                                ))}

                                                {/* Waveform Path */}
                                                <path 
                                                    d={d} fill="none" 
                                                    stroke={sig.role === 'output' ? "#60a5fa" : sig.role === 'logic' ? "#c084fc" : sig.role === 'clock' ? "#f8fafc" : "#94a3b8"} 
                                                    strokeWidth={sig.role === 'output' ? "4" : sig.role === 'logic' ? "3" : "2"} 
                                                    strokeLinecap="round" strokeLinejoin="round" 
                                                    className={`transition-all duration-200 ${sig.role === 'output' ? 'drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]' : sig.role === 'logic' ? 'drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]' : ''}`}
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 tracking-wider">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-slate-100" /> CLOCK
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-slate-500" /> IN
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-purple-400" /> FF INPUT (L)
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-blue-400" /> OUTPUT (Q)
                                </div>
                            </div>
                            <div className="uppercase">Click segments to draw | Res {resolution}x | {cycles} Cycles</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FlipFlopConversion = () => {
    const [source, setSource] = useState('d_ff');
    const [target, setTarget] = useState('t_ff');

    const sourceDef = ffDefs[source as keyof typeof ffDefs];
    const targetDef = ffDefs[target as keyof typeof ffDefs];

    const targetRows = getTargetRows(target);
    const combinedRows = targetRows.map(row => {
        const qn = row[row.length - 2];
        const qn1 = row[row.length - 1];
        const exOuts = mapSourceOutputs(source, qn, qn1);
        return [...row, ...exOuts];
    });

    const isSame = source === target;
    const conversionKey = `${source}_to_${target}`;
    const eqs = conversionEqs[conversionKey] || [];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mt-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 tracking-tight">Flip-Flop Architecture Conversion</h3>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Target Required</label>
                    <select 
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-blue-500"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                    >
                        {Object.values(ffDefs).map(ff => <option key={ff.id} value={ff.id}>{ff.label}</option>)}
                    </select>
                </div>

                <div className="flex items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                            <path d="m19 12-7-7-7 7"/><path d="M12 19V5"/>
                        </svg>
                    </div>
                </div>

                <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Given Source</label>
                    <select 
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-blue-500"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                    >
                        {Object.values(ffDefs).map(ff => <option key={ff.id} value={ff.id}>{ff.label}</option>)}
                    </select>
                </div>
            </div>

            {isSame ? (
                <div className="text-center py-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                    Please select different component types to view the conversion process.
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">1</span>
                            Truth Table Derivation
                        </h4>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-center bg-white dark:bg-slate-800">
                                <thead>
                                    <tr>
                                        <th colSpan={targetDef.inputs.length + 2} className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 font-semibold border-b border-r border-slate-200 dark:border-slate-700 text-blue-800 dark:text-blue-300">
                                            Target ({targetDef.label}) Characteristic
                                        </th>
                                        <th colSpan={sourceDef.inputs.length} className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 text-amber-800 dark:text-amber-300">
                                            Given ({sourceDef.label}) Excitation
                                        </th>
                                    </tr>
                                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium text-xs tracking-wider uppercase">
                                        {targetDef.inputs.map(i => <th key={i} className="px-4 py-2 border-b border-r border-slate-200 dark:border-slate-800">{i}</th>)}
                                        <th className="px-4 py-2 border-b border-r border-slate-200 dark:border-slate-800">Qn</th>
                                        <th className="px-4 py-2 border-b border-r border-slate-200 dark:border-slate-800">Qn+1</th>
                                        {sourceDef.inputs.map((i, idx) => <th key={i} className={`px-4 py-2 border-b border-slate-200 dark:border-slate-800 ${idx === 0 ? 'border-l' : ''}`}>{i}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {combinedRows.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className={`px-4 py-2 font-mono ${cIdx >= targetDef.inputs.length + 2 ? 'bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 border-l border-amber-100 dark:border-amber-900/30' : (cIdx === targetDef.inputs.length + 1 ? 'font-bold' : '')}`}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">2</span>
                            Boolean Expressions (via K-Map)
                        </h4>
                        <div className="flex gap-4">
                            {eqs.map((eq, i) => (
                                <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-center shadow-sm">
                                    <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300">{eq}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">3</span>
                            Circuit Integration
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex justify-center">
                            <CircuitGenerator source={source} target={target} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const treeNodes = [
    { id: 'gates', label: 'Logic Gates', description: 'Combinational logic', detail: 'Basic AND, OR, NOT operations with no memory capability. Outputs depend only on current inputs.', x: '50%', y: '8%' },
    { id: 'sr_latch', label: 'SR Latch', description: 'The feedback loop', detail: 'Combines NOR/NAND gates in a cross-coupled loop to create feedback, storing 1 bit of data. Has an invalid state when S=R=1.', x: '50%', y: '28%' },
    { id: 'd_latch', label: 'D Latch', description: 'Solved S=R=1', detail: 'Ties S and R inputs together with an inverter (Data input) and adds an Enable (EN) pin. Transparent when EN=1, holds when EN=0.', x: '25%', y: '50%' },
    { id: 'sr_ff', label: 'SR Flip-Flop', description: 'Edge triggering', detail: 'Uses clock signals (often Master-Slave) to only update output on the clock edge, avoiding level-sensitivity race conditions. Still has invalid S=R=1.', x: '75%', y: '50%' },
    { id: 'd_ff', label: 'D Flip-Flop', description: 'The standard cell', detail: 'Combines two D-Latches (Master-Slave) so data only updates exactly on the clock edge. Used everywhere in digital design.', x: '25%', y: '72%' },
    { id: 'jk_ff', label: 'JK Flip-Flop', description: 'Toggle capability', detail: 'Adds feedback from the outputs (Q, Q\') back into the input logic of an SR Flip-Flop. When J=K=1, it toggles instead of being invalid.', x: '75%', y: '72%' },
    { id: 't_ff', label: 'T Flip-Flop', description: 'Simplified toggle', detail: 'Ties J and K inputs together to form a single Toggle (T) input. Great for dividing frequencies and building synchronous counters.', x: '75%', y: '92%' },
];

const treeEdges = [
    { from: 'gates', to: 'sr_latch' },
    { from: 'sr_latch', to: 'd_latch' },
    { from: 'sr_latch', to: 'sr_ff' },
    { from: 'd_latch', to: 'd_ff' },
    { from: 'sr_ff', to: 'jk_ff' },
    { from: 'jk_ff', to: 't_ff' },
];

const EvolutionTreeView = () => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl relative w-full h-[800px] overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {treeEdges.map((edge, idx) => {
                    const fromNode = treeNodes.find(n => n.id === edge.from);
                    const toNode = treeNodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    
                    return (
                        <line 
                            key={idx}
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="text-slate-300 dark:text-slate-600"
                            strokeDasharray="6 6"
                        />
                    );
                })}
            </svg>

            {/* Nodes */}
            {treeNodes.map(node => (
                <div 
                    key={node.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col ${selectedNode === node.id ? 'z-50' : 'z-10'}`}
                    style={{ left: node.x, top: node.y }}
                >
                    <button 
                        onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                        className={`relative z-10 w-44 p-4 rounded-[1.5rem] border-2 bg-white dark:bg-slate-900 transition-all text-center focus:outline-none ${selectedNode === node.id ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 dark:hover:shadow-black/50'}`}
                    >
                        <h4 className="font-black text-slate-800 dark:text-white mb-1">{node.label}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{node.description}</p>
                        <div className={`mt-3 mx-auto w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 transition-colors ${selectedNode === node.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-500' : ''}`}>
                            <Info size={16} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {selectedNode === node.id && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-72 bg-slate-800 dark:bg-white p-6 rounded-3xl z-20 shadow-2xl text-white dark:text-slate-800 pointer-events-auto"
                            >
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-800 dark:bg-white rotate-45" />
                                <div className="relative z-10">
                                    <h5 className="font-black text-blue-400 dark:text-blue-600 uppercase tracking-wider text-[10px] mb-2 border-b border-white/10 dark:border-black/5 pb-2">Evolution Fact</h5>
                                    <p className="text-sm leading-relaxed">{node.detail}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

export function FlipFlopGallery() {
    const [mainTab, setMainTab] = useState<MainTab>('explorer');
    const [selectedId, setSelectedId] = useState<ComponentType>('sr_latch');
    const [viewLevel, setViewLevel] = useState<DrillLevel>('symbol');

    const selectedItem = galleryItems.find(item => item.id === selectedId);

    const renderDiagram = () => {
        const stroke = "currentColor";
        const strokeWidth = 2;
        
        switch (selectedId) {
            case 'sr_latch':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="SR LATCH" x={0} y={0} w={100} h={120} />
                        <line x1={-30} y1={30} x2={0} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={35} textAnchor="end" className="text-xs fill-current uppercase font-bold">S</text>
                        <line x1={-30} y1={90} x2={0} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={95} textAnchor="end" className="text-xs fill-current uppercase font-bold">R</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(60, 60)">
                        <Chip label="INTERNAL GATES" x={40} y={-20} w={150} h={160} transparent />
                        <text x={0} y={15} textAnchor="end" className="text-xs font-bold fill-current">R</text>
                        <line x1={10} y1={10} x2={80} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <text x={0} y={115} textAnchor="end" className="text-xs font-bold fill-current">S</text>
                        <line x1={10} y1={110} x2={80} y2={110} stroke={stroke} strokeWidth={strokeWidth} />

                        <Gate type="nor" x={80} y={-10} size={40} />
                        <Gate type="nor" x={80} y={90} size={40} />

                        <line x1={123} y1={10} x2={220} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={230} y={15} textAnchor="start" className="text-xs font-bold fill-current">Q</text>

                        <line x1={123} y1={110} x2={220} y2={110} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={230} y={115} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>

                        <path d="M 160 10 L 160 60 L 60 60 L 60 100 L 80 100" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d="M 180 110 L 180 80 L 50 80 L 50 20 L 80 20" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <circle cx={160} cy={10} r="3" fill="currentColor" />
                        <circle cx={180} cy={110} r="3" fill="currentColor" />
                    </g>
                );
            case 'd_latch':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="D LATCH" x={0} y={0} w={100} h={120} />
                        <line x1={-30} y1={30} x2={0} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={35} textAnchor="end" className="text-xs fill-current uppercase font-bold">D</text>
                        <line x1={-30} y1={90} x2={0} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={95} textAnchor="end" className="text-xs fill-current uppercase font-bold">EN</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(20, 40)">
                        <text x={0} y={25} textAnchor="end" className="text-xs font-bold fill-current">D</text>
                        <line x1={10} y1={20} x2={50} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <circle cx={30} cy={20} r={3} fill="currentColor" />
                        <line x1={30} y1={20} x2={30} y2={100} stroke={stroke} strokeWidth={strokeWidth} />
                        <Gate type="not" x={25} y={85} size={25} /> 
                        
                        <text x={0} y={65} textAnchor="end" className="text-xs font-bold fill-current">EN</text>
                        <line x1={10} y1={60} x2={40} y2={60} stroke={stroke} strokeWidth={strokeWidth} />
                        <circle cx={40} cy={60} r={3} fill="currentColor" />
                        <line x1={40} y1={60} x2={40} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={30} x2={50} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={60} x2={40} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={90} x2={60} y2={90} stroke={stroke} strokeWidth={strokeWidth} />

                        <Gate type="and" x={50} y={10} size={30} /> 
                        <Gate type="and" x={60} y={80} size={30} /> 
                        
                        <line x1={60} y1={100} x2={60} y2={100} stroke={stroke} strokeWidth={strokeWidth} />

                        <g transform="translate(100, 5)">
                            <Chip label="SR LATCH CORE" x={0} y={-10} w={120} h={120} transparent />
                            <text x={10} y={25} className="text-[10px] fill-current uppercase font-bold">S</text>
                            <line x1={-18} y1={20} x2={20} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={10} y={95} className="text-[10px] fill-current uppercase font-bold">R</text>
                            <line x1={-8} y1={90} x2={20} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                            
                            <Gate type="nor" x={20} y={0} size={40} />
                            <Gate type="nor" x={20} y={70} size={40} />
                            
                            <line x1={63} y1={20} x2={140} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={150} y={25} textAnchor="start" className="text-xs font-bold fill-current">Q</text>
                            <line x1={63} y1={90} x2={140} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={150} y={95} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>

                            <path d="M 90 20 L 90 50 L 0 50 L 0 80 L 20 80" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <path d="M 100 90 L 100 60 L -10 60 L -10 30 L 20 30" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <circle cx={90} cy={20} r="3" fill="currentColor" />
                            <circle cx={100} cy={90} r="3" fill="currentColor" />
                        </g>
                    </g>
                );
            case 'd_ff':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="D FLIP-FLOP" x={0} y={0} w={100} h={120} />
                        <path d="M 0 80 L 15 90 L 0 100" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={-30} y1={30} x2={0} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={35} textAnchor="end" className="text-xs fill-current uppercase font-bold">D</text>
                        <line x1={-30} y1={90} x2={0} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={95} textAnchor="end" className="text-xs fill-current uppercase font-bold">CLK</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(10, 80)">
                        <text x={0} y={15} textAnchor="end" className="text-xs font-bold fill-current">D</text>
                        <line x1={10} y1={10} x2={40} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <text x={0} y={65} textAnchor="end" className="text-xs font-bold fill-current">CLK</text>
                        <line x1={10} y1={60} x2={30} y2={60} stroke={stroke} strokeWidth={strokeWidth} />

                        <circle cx={30} cy={60} r={3} fill="currentColor" />
                        
                        <line x1={30} y1={60} x2={30} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <Gate type="not" x={25} y={15} size={25} />
                        <line x1={53} y1={28} x2={60} y2={28} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <line x1={30} y1={60} x2={180} y2={60} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={180} y1={60} x2={180} y2={28} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={180} y1={28} x2={200} y2={28} stroke={stroke} strokeWidth={strokeWidth} />

                        <Chip label="Master D-Latch" x={60} y={-10} w={80} h={60} />
                        <text x={70} y={15} className="text-[10px] fill-current uppercase font-bold text-slate-800">D</text>
                        <text x={70} y={35} className="text-[10px] fill-current uppercase font-bold text-slate-800">EN</text>
                        <line x1={60} y1={28} x2={40} y2={28} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={125} y={15} className="text-[10px] fill-current uppercase font-bold text-slate-800">Q</text>
                        
                        <line x1={140} y1={10} x2={200} y2={10} stroke={stroke} strokeWidth={strokeWidth} />

                        <Chip label="Slave D-Latch" x={200} y={-10} w={80} h={60} />
                        <text x={210} y={15} className="text-[10px] fill-current uppercase font-bold text-slate-800">D</text>
                        <text x={210} y={35} className="text-[10px] fill-current uppercase font-bold text-slate-800">EN</text>
                        <text x={265} y={15} className="text-[10px] fill-current uppercase font-bold text-slate-800">Q</text>
                        <text x={265} y={45} className="text-[10px] fill-current uppercase font-bold text-slate-800">Q'</text>

                        <line x1={280} y1={10} x2={320} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={330} y={15} textAnchor="start" className="text-xs font-bold fill-current">Q</text>
                        
                        <line x1={280} y1={40} x2={320} y2={40} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={330} y={45} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>
                    </g>
                );
            case 'sr_ff':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="SR FLIP-FLOP" x={0} y={0} w={100} h={120} />
                        <path d="M 0 50 L 15 60 L 0 70" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={-30} y1={20} x2={0} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={25} textAnchor="end" className="text-xs fill-current uppercase font-bold">S</text>
                        <line x1={-30} y1={60} x2={0} y2={60} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={65} textAnchor="end" className="text-xs fill-current uppercase font-bold">CLK</text>
                        <line x1={-30} y1={100} x2={0} y2={100} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={105} textAnchor="end" className="text-xs fill-current uppercase font-bold">R</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(20, 50)">
                        <text x={0} y={15} textAnchor="end" className="text-xs font-bold fill-current">S</text>
                        <line x1={10} y1={10} x2={50} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <text x={0} y={65} textAnchor="end" className="text-xs font-bold fill-current">CLK</text>
                        <line x1={10} y1={60} x2={40} y2={60} stroke={stroke} strokeWidth={strokeWidth} />

                        <text x={0} y={115} textAnchor="end" className="text-xs font-bold fill-current">R</text>
                        <line x1={10} y1={110} x2={50} y2={110} stroke={stroke} strokeWidth={strokeWidth} />

                        <circle cx={40} cy={60} r={3} fill="currentColor" />
                        <line x1={40} y1={60} x2={40} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={30} x2={50} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={60} x2={40} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={90} x2={50} y2={90} stroke={stroke} strokeWidth={strokeWidth} />

                        <Gate type="and" x={50} y={0} size={30} />
                        <Gate type="and" x={50} y={80} size={30} />

                        <line x1={83} y1={15} x2={120} y2={15} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={83} y1={95} x2={120} y2={95} stroke={stroke} strokeWidth={strokeWidth} />

                        <g transform="translate(100, -10)">
                            <Chip label="SR Latch Core" x={20} y={0} w={100} h={130} transparent />
                            <Gate type="nor" x={40} y={15} size={35} />
                            <Gate type="nor" x={40} y={80} size={35} />
                            
                            <line x1={78} y1={32} x2={150} y2={32} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={160} y={37} textAnchor="start" className="text-xs font-bold fill-current">Q</text>
                            
                            <line x1={78} y1={97} x2={150} y2={97} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={160} y={102} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>

                            <path d="M 120 32 L 120 65 L 20 65 L 20 95 L 40 95" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <path d="M 130 97 L 130 55 L 10 55 L 10 32 L 40 32" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <circle cx={120} cy={32} r={3} fill="currentColor" />
                            <circle cx={130} cy={97} r={3} fill="currentColor" />
                        </g>

                    </g>
                );
            case 'jk_ff':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="JK FLIP-FLOP" x={0} y={0} w={100} h={120} />
                        <path d="M 0 50 L 15 60 L 0 70" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={-30} y1={20} x2={0} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={25} textAnchor="end" className="text-xs fill-current uppercase font-bold">J</text>
                        <line x1={-30} y1={60} x2={0} y2={60} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={65} textAnchor="end" className="text-xs fill-current uppercase font-bold">CLK</text>
                        <line x1={-30} y1={100} x2={0} y2={100} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={105} textAnchor="end" className="text-xs fill-current uppercase font-bold">K</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(20, 50)">
                        <text x={0} y={15} textAnchor="end" className="text-xs font-bold fill-current">J</text>
                        <line x1={20} y1={10} x2={50} y2={10} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <text x={0} y={65} textAnchor="end" className="text-xs font-bold fill-current">CLK</text>
                        <line x1={20} y1={60} x2={40} y2={60} stroke={stroke} strokeWidth={strokeWidth} />

                        <text x={0} y={115} textAnchor="end" className="text-xs font-bold fill-current">K</text>
                        <line x1={20} y1={110} x2={50} y2={110} stroke={stroke} strokeWidth={strokeWidth} />

                        <circle cx={40} cy={60} r={3} fill="currentColor" />
                        <line x1={40} y1={60} x2={40} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={20} x2={50} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={60} x2={40} y2={100} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={100} x2={50} y2={100} stroke={stroke} strokeWidth={strokeWidth} />

                        <Gate type="and" x={50} y={-5} size={35} /> {/* J AND */}
                        <Gate type="and" x={50} y={85} size={35} /> {/* K AND */}

                        {/* Extra lines for 3-input AND logic emulation - drawing a third input line */}
                        <line x1={20} y1={-5} x2={50} y2={-5} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={20} y1={120} x2={50} y2={120} stroke={stroke} strokeWidth={strokeWidth} />

                        <line x1={88} y1={12} x2={120} y2={12} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={88} y1={102} x2={120} y2={102} stroke={stroke} strokeWidth={strokeWidth} />

                        <g transform="translate(100, -10)">
                            <Chip label="SR Flip-Flop Core" x={20} y={0} w={100} h={130} transparent />
                            
                            <text x={30} y={25} className="text-[8px] fill-current uppercase font-bold">S</text>
                            <text x={30} y={115} className="text-[8px] fill-current uppercase font-bold">R</text>
                            
                            <Gate type="nor" x={40} y={15} size={35} />
                            <Gate type="nor" x={40} y={80} size={35} />
                            
                            <line x1={78} y1={32} x2={170} y2={32} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={180} y={37} textAnchor="start" className="text-xs font-bold fill-current">Q</text>
                            
                            <line x1={78} y1={97} x2={170} y2={97} stroke={stroke} strokeWidth={strokeWidth} />
                            <text x={180} y={102} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>

                            <path d="M 120 32 L 120 65 L 20 65 L 20 95 L 40 95" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <path d="M 130 97 L 130 55 L 10 55 L 10 32 L 40 32" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                            <circle cx={120} cy={32} r={3} fill="currentColor" />
                            <circle cx={130} cy={97} r={3} fill="currentColor" />
                            
                            {/* Feedback loop for JK */}
                            <path d="M 150 97 L 150 140 L -80 140 L -80 5 L -50 5" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 2" />
                            <path d="M 160 32 L 160 -20 L -90 -20 L -90 130 L -50 130" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 2" />
                            <circle cx={150} cy={97} r={3} fill="currentColor" />
                            <circle cx={160} cy={32} r={3} fill="currentColor" />
                        </g>
                    </g>
                );
            case 't_ff':
                return viewLevel === 'symbol' ? (
                    <g transform="translate(100, 60)">
                        <Chip label="T FLIP-FLOP" x={0} y={0} w={100} h={120} />
                        <path d="M 0 80 L 15 90 L 0 100" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={-30} y1={30} x2={0} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={35} textAnchor="end" className="text-xs fill-current uppercase font-bold">T</text>
                        <line x1={-30} y1={90} x2={0} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={-40} y={95} textAnchor="end" className="text-xs fill-current uppercase font-bold">CLK</text>
                        <line x1={100} y1={30} x2={130} y2={30} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={35} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q</text>
                        <line x1={100} y1={90} x2={130} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={140} y={95} textAnchor="start" className="text-xs fill-current uppercase font-bold">Q'</text>
                    </g>
                ) : (
                    <g transform="translate(60, 60)">
                        <text x={0} y={35} textAnchor="end" className="text-xs font-bold fill-current">T</text>
                        <line x1={10} y1={30} x2={40} y2={30} stroke={stroke} strokeWidth={strokeWidth} />

                        <text x={0} y={95} textAnchor="end" className="text-xs font-bold fill-current">CLK</text>
                        <line x1={10} y1={90} x2={80} y2={90} stroke={stroke} strokeWidth={strokeWidth} />
                        
                        <circle cx={40} cy={30} r={3} fill="currentColor" />
                        <line x1={40} y1={30} x2={40} y2={0} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={0} x2={80} y2={0} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={30} x2={40} y2={120} stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={40} y1={120} x2={80} y2={120} stroke={stroke} strokeWidth={strokeWidth} />

                        <Chip label="JK FLIP-FLOP" x={80} y={-10} w={100} h={140} transparent />
                        <text x={90} y={5} className="text-[10px] fill-current uppercase font-bold">J</text>
                        <text x={90} y={95} className="text-[10px] fill-current uppercase font-bold">CLK</text>
                        <path d="M 80 85 L 90 90 L 80 95" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={90} y={125} className="text-[10px] fill-current uppercase font-bold">K</text>
                        
                        <line x1={180} y1={20} x2={220} y2={20} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={230} y={25} textAnchor="start" className="text-xs font-bold fill-current">Q</text>
                        
                        <line x1={180} y1={100} x2={220} y2={100} stroke={stroke} strokeWidth={strokeWidth} />
                        <text x={230} y={105} textAnchor="start" className="text-xs font-bold fill-current">Q'</text>
                    </g>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Cpu size={28} />
                        </div>
                        <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                            FlipFlop <span className="text-blue-500">Lab</span>
                        </h2>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner flex-wrap justify-center">
                    <button 
                        onClick={() => setMainTab('explorer')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${mainTab === 'explorer' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Box size={16} /> EXPLORER
                    </button>
                    <button 
                        onClick={() => setMainTab('evolution')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${mainTab === 'evolution' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Network size={16} /> EVOLUTION TREE
                    </button>
                    <button 
                        onClick={() => setMainTab('timing')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${mainTab === 'timing' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Activity size={16} /> TIMING LAB
                    </button>
                </div>
            </div>

            {mainTab === 'evolution' ? (
                <EvolutionTreeView />
            ) : mainTab === 'conversion' ? (
                <FlipFlopConversion />
            ) : mainTab === 'timing' ? (
                <TimingLab />
            ) : (
                <>
                    <div className="flex justify-end">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner inline-flex">
                            <button 
                                onClick={() => setViewLevel('symbol')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewLevel === 'symbol' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                BLOCK VIEW
                            </button>
                            <button 
                                onClick={() => setViewLevel('internal')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewLevel === 'internal' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                SCHEMATIC
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Binary size={14} /> Components
                        </h3>
                        <div className="space-y-4">
                            {galleryItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setSelectedId(item.id); setViewLevel('symbol'); }}
                                    className={`w-full text-left p-5 rounded-3xl transition-all border-2 flex items-center justify-between group
                                        ${selectedId === item.id 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/40' 
                                            : 'bg-transparent border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                                        }
                                    `}
                                >
                                    <span className="font-black text-sm">{item.name}</span>
                                    <ChevronRight size={16} className={`transition-transform ${selectedId === item.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9 space-y-10">
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-4 md:p-12 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group cursor-pointer"
                        onClick={() => setViewLevel(l => l === 'symbol' ? 'internal' : 'symbol')}
                    >
                        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-white/[0.03] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none" />
                        <div className="relative z-10 w-full flex flex-col items-center">
                             <div className="absolute top-0 left-0 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hidden md:block">
                                {viewLevel}
                             </div>
                             <svg width="400" height="300" viewBox="0 0 400 300" className="text-slate-800 dark:text-slate-200">
                                <AnimatePresence mode="wait">
                                    <motion.g
                                        key={`${selectedId}-${viewLevel}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {renderDiagram()}
                                    </motion.g>
                                </AnimatePresence>
                             </svg>
                             <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold text-xs">
                                <Maximize2 size={14} /> CLICK TO DRILL {viewLevel === 'symbol' ? 'DOWN' : 'UP'}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Evolutionary Path</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Layers size={20} className="text-blue-500" />
                                </div>
                                <span className="font-mono font-black text-lg text-slate-800 dark:text-slate-100">{selectedItem?.evolution}</span>
                            </div>
                            <p className="mt-8 text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{selectedItem?.description}"
                            </p>
                        </div>
                        <div className="bg-blue-600 p-10 rounded-[3rem] shadow-xl shadow-blue-600/30">
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-8 border-b border-white/20 pb-4">Key Characteristics</h4>
                            <ul className="space-y-4">
                                {selectedItem?.details.map((detail, idx) => (
                                    <li key={idx} className="flex items-center gap-3 font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {selectedItem?.tables && selectedItem.tables.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700 w-full overflow-x-auto">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8 text-center">Reference Tables</h4>
                            <div className="flex flex-wrap gap-8 justify-center items-start">
                                {selectedItem.tables.map((table, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 min-w-[200px]">
                                        <div className="bg-slate-200 dark:bg-slate-800 p-3 text-center border-b border-slate-300 dark:border-slate-700">
                                            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{table.title}</h5>
                                        </div>
                                        <table className="w-full text-sm text-center">
                                            <thead className="bg-slate-100 dark:bg-slate-800/50">
                                                <tr>
                                                    {table.headers.map((header, hIdx) => (
                                                        <th key={hIdx} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.rows.map((row, rIdx) => (
                                                    <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-mono">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
