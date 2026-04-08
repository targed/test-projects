import React, { useState, useEffect } from 'react';
import { BinaryAddition } from './BinaryAddition';
import { BinaryMultiplication } from './BinaryMultiplication';
import { BinaryDivision } from './BinaryDivision';

export const BinaryEducation: React.FC = () => {
    const [binaryInput, setBinaryInput] = useState('');
    const [decimalInput, setDecimalInput] = useState('');
    const [octalInput, setOctalInput] = useState('');
    const [hexInput, setHexInput] = useState('');
    const [isSigned, setIsSigned] = useState(false);
    const [showBinToDecSteps, setShowBinToDecSteps] = useState(false);
    const [showDecToBinSteps, setShowDecToBinSteps] = useState(false);
    const [showOctToBinSteps, setShowOctToBinSteps] = useState(false);
    const [showHexToBinSteps, setShowHexToBinSteps] = useState(false);
    const [showBinToOctSteps, setShowBinToOctSteps] = useState(false);
    const [showBinToHexSteps, setShowBinToHexSteps] = useState(false);
    const [lastEdited, setLastEdited] = useState<'binary' | 'decimal' | 'octal' | 'hex'>('binary');
    const [activeTab, setActiveTab] = useState<'conversions' | 'addition' | 'multiplication' | 'division'>('conversions');

    useEffect(() => {
        if (lastEdited === 'binary') {
            updateAllFromBinary(binaryInput, isSigned);
        } else if (lastEdited === 'decimal') {
            updateAllFromDecimal(decimalInput, isSigned);
        } else if (lastEdited === 'octal') {
            const [intOct = '', fracOct = ''] = octalInput.split('.');
            let intBin = intOct ? intOct.split('').map(char => parseInt(char, 8).toString(2).padStart(3, '0')).join('') : '0';
            intBin = intBin.replace(/^0+(?=\d)/, '');
            let fracBin = fracOct ? fracOct.split('').map(char => parseInt(char, 8).toString(2).padStart(3, '0')).join('') : '';
            const bin = intBin + (octalInput.includes('.') ? '.' + fracBin : '');
            setBinaryInput(bin);
            updateAllFromBinary(bin, isSigned, 'octal');
        } else if (lastEdited === 'hex') {
            const [intHex = '', fracHex = ''] = hexInput.split('.');
            let intBin = intHex ? intHex.split('').map(char => parseInt(char, 16).toString(2).padStart(4, '0')).join('') : '0';
            intBin = intBin.replace(/^0+(?=\d)/, '');
            let fracBin = fracHex ? fracHex.split('').map(char => parseInt(char, 16).toString(2).padStart(4, '0')).join('') : '';
            const bin = intBin + (hexInput.includes('.') ? '.' + fracBin : '');
            setBinaryInput(bin);
            updateAllFromBinary(bin, isSigned, 'hex');
        }
    }, [isSigned]);

    const handleBinaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^01.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        setBinaryInput(val);
        setLastEdited('binary');
        updateAllFromBinary(val, isSigned);
    };

    const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9.-]/g, '');
        if (val.lastIndexOf('-') > 0) val = val.replace(/-/g, (match, offset) => offset === 0 ? '-' : '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        setDecimalInput(val);
        setLastEdited('decimal');
        updateAllFromDecimal(val, isSigned);
    };

    const handleOctalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-7.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        setOctalInput(val);
        setLastEdited('octal');
        
        if (!val || val === '.') {
            setBinaryInput('');
            updateAllFromBinary('', isSigned, 'octal');
            return;
        }
        
        const [intOct = '', fracOct = ''] = val.split('.');
        let intBin = intOct ? intOct.split('').map(char => parseInt(char, 8).toString(2).padStart(3, '0')).join('') : '0';
        intBin = intBin.replace(/^0+(?=\d)/, '');
        let fracBin = fracOct ? fracOct.split('').map(char => parseInt(char, 8).toString(2).padStart(3, '0')).join('') : '';
        const bin = intBin + (val.includes('.') ? '.' + fracBin : '');
        setBinaryInput(bin);
        updateAllFromBinary(bin, isSigned, 'octal');
    };

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9A-Fa-f.]/g, '').toUpperCase();
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        setHexInput(val);
        setLastEdited('hex');
        
        if (!val || val === '.') {
            setBinaryInput('');
            updateAllFromBinary('', isSigned, 'hex');
            return;
        }
        
        const [intHex = '', fracHex = ''] = val.split('.');
        let intBin = intHex ? intHex.split('').map(char => parseInt(char, 16).toString(2).padStart(4, '0')).join('') : '0';
        intBin = intBin.replace(/^0+(?=\d)/, '');
        let fracBin = fracHex ? fracHex.split('').map(char => parseInt(char, 16).toString(2).padStart(4, '0')).join('') : '';
        const bin = intBin + (val.includes('.') ? '.' + fracBin : '');
        setBinaryInput(bin);
        updateAllFromBinary(bin, isSigned, 'hex');
    };

    const updateAllFromBinary = (bin: string, signed: boolean, skip?: string) => {
        if (!bin || bin === '-' || bin === '.' || bin === '-.' || bin.includes('Error')) {
            if (skip !== 'decimal') setDecimalInput(bin.includes('Error') ? 'Error' : '');
            if (skip !== 'octal') setOctalInput(bin.includes('Error') ? 'Error' : '');
            if (skip !== 'hex') setHexInput(bin.includes('Error') ? 'Error' : '');
            return;
        }

        const [intBin = '', fracBin = ''] = bin.split('.');

        if (skip !== 'decimal') {
            let intDec = 0n;
            if (!signed) {
                for (let i = 0; i < intBin.length; i++) {
                    if (intBin[intBin.length - 1 - i] === '1') intDec += 1n << BigInt(i);
                }
                let decStr = intDec.toString();
                if (fracBin) {
                    let fracVal = 0;
                    for (let i = 0; i < fracBin.length; i++) {
                        if (fracBin[i] === '1') fracVal += Math.pow(2, -(i + 1));
                    }
                    let fracStr = fracVal.toString().split('.')[1] || '';
                    if (fracStr) decStr += '.' + fracStr;
                }
                setDecimalInput(decStr);
            } else {
                if (intBin[0] === '0' || intBin === '') {
                    for (let i = 0; i < intBin.length; i++) {
                        if (intBin[intBin.length - 1 - i] === '1') intDec += 1n << BigInt(i);
                    }
                    let decStr = intDec.toString();
                    if (fracBin) {
                        let fracVal = 0;
                        for (let i = 0; i < fracBin.length; i++) {
                            if (fracBin[i] === '1') fracVal += Math.pow(2, -(i + 1));
                        }
                        let fracStr = fracVal.toString().split('.')[1] || '';
                        if (fracStr) decStr += '.' + fracStr;
                    }
                    setDecimalInput(decStr);
                } else {
                    for (let i = 0; i < intBin.length - 1; i++) {
                        if (intBin[intBin.length - 1 - i] === '1') intDec += 1n << BigInt(i);
                    }
                    intDec -= 1n << BigInt(intBin.length - 1);
                    
                    let decStr = '';
                    if (fracBin) {
                        let fracVal = 0;
                        for (let i = 0; i < fracBin.length; i++) {
                            if (fracBin[i] === '1') fracVal += Math.pow(2, -(i + 1));
                        }
                        let absInt = -intDec;
                        let intPart = absInt - 1n;
                        let newFrac = 1 - fracVal;
                        if (newFrac === 1) {
                            intPart += 1n;
                            newFrac = 0;
                        }
                        let newFracStr = newFrac.toString().split('.')[1] || '';
                        decStr = '-' + intPart.toString() + (newFracStr ? '.' + newFracStr : '');
                    } else {
                        decStr = intDec.toString();
                    }
                    setDecimalInput(decStr);
                }
            }
        }

        if (skip !== 'octal') {
            let paddedInt = intBin;
            const signBit = (signed && intBin.length > 0) ? intBin[0] : '0';
            while (paddedInt.length % 3 !== 0 || paddedInt.length === 0) {
                paddedInt = signBit + paddedInt;
            }
            let octInt = '';
            for (let i = 0; i < paddedInt.length; i += 3) {
                octInt += parseInt(paddedInt.slice(i, i + 3), 2).toString(8);
            }
            octInt = octInt.replace(/^0+(?=\d)/, '');
            
            let octStr = octInt || '0';
            if (fracBin !== undefined && bin.includes('.')) {
                let paddedFrac = fracBin;
                while (paddedFrac.length % 3 !== 0) paddedFrac += '0';
                let octFrac = '';
                for (let i = 0; i < paddedFrac.length; i += 3) {
                    octFrac += parseInt(paddedFrac.slice(i, i + 3), 2).toString(8);
                }
                octStr += '.' + octFrac;
            }
            setOctalInput(octStr);
        }

        if (skip !== 'hex') {
            let paddedInt = intBin;
            const signBit = (signed && intBin.length > 0) ? intBin[0] : '0';
            while (paddedInt.length % 4 !== 0 || paddedInt.length === 0) {
                paddedInt = signBit + paddedInt;
            }
            let hexInt = '';
            for (let i = 0; i < paddedInt.length; i += 4) {
                hexInt += parseInt(paddedInt.slice(i, i + 4), 2).toString(16).toUpperCase();
            }
            hexInt = hexInt.replace(/^0+(?=\d)/, '');
            
            let hexStr = hexInt || '0';
            if (fracBin !== undefined && bin.includes('.')) {
                let paddedFrac = fracBin;
                while (paddedFrac.length % 4 !== 0) paddedFrac += '0';
                let hexFrac = '';
                for (let i = 0; i < paddedFrac.length; i += 4) {
                    hexFrac += parseInt(paddedFrac.slice(i, i + 4), 2).toString(16).toUpperCase();
                }
                hexStr += '.' + hexFrac;
            }
            setHexInput(hexStr);
        }
    };

    const updateAllFromDecimal = (decStr: string, signed: boolean) => {
        if (!decStr || decStr === '-' || decStr === '.' || decStr === '-.') {
            setBinaryInput('');
            setOctalInput('');
            setHexInput('');
            return;
        }

        try {
            const isNegative = decStr.startsWith('-');
            if (!signed && isNegative) {
                setBinaryInput('Error: Negative unsigned');
                setOctalInput('Error');
                setHexInput('Error');
                return;
            }

            const [intDecStr = '0', fracDecStr = ''] = decStr.replace('-', '').split('.');
            const intDec = BigInt(intDecStr || '0');

            let intBin = '';
            let temp = intDec;
            if (temp === 0n) intBin = '0';
            while (temp > 0n) {
                intBin = (temp % 2n).toString() + intBin;
                temp = temp / 2n;
            }

            let fracBin = '';
            if (fracDecStr) {
                let fracNum = parseFloat('0.' + fracDecStr);
                let limit = 12; // 12 bits of fractional precision
                while (fracNum > 0 && limit > 0) {
                    fracNum *= 2;
                    if (fracNum >= 1) {
                        fracBin += '1';
                        fracNum -= 1;
                    } else {
                        fracBin += '0';
                    }
                    limit--;
                }
            }

            let bin = '';
            if (!signed || !isNegative) {
                if (signed) intBin = '0' + intBin;
                bin = intBin + (decStr.includes('.') ? '.' + fracBin : '');
            } else {
                let absBin = '0' + intBin + fracBin;
                let inverted = absBin.split('').map(b => b === '0' ? '1' : '0').join('');
                let carry = 1;
                let twosComp = '';
                for (let i = inverted.length - 1; i >= 0; i--) {
                    let sum = parseInt(inverted[i]) + carry;
                    twosComp = (sum % 2).toString() + twosComp;
                    carry = Math.floor(sum / 2);
                }
                if (carry) twosComp = '1' + twosComp;
                
                if (decStr.includes('.')) {
                    const dotPos = twosComp.length - fracBin.length;
                    bin = twosComp.slice(0, dotPos) + '.' + twosComp.slice(dotPos);
                } else {
                    bin = twosComp;
                }
            }
            
            setBinaryInput(bin);
            updateAllFromBinary(bin, signed, 'decimal');
        } catch (e) {
            setBinaryInput('Error');
            setOctalInput('Error');
            setHexInput('Error');
        }
    };

    const renderBinToDecSteps = () => {
        if (!binaryInput || binaryInput === '-' || binaryInput === '.' || binaryInput === '-.' || binaryInput.includes('Error')) return null;

        const [intBin = '', fracBin = ''] = binaryInput.split('.');
        const steps = [];
        let sumStr = '';
        
        const intLen = intBin.length;
        for (let i = 0; i < intLen; i++) {
            const bit = intBin[i];
            const power = intLen - 1 - i;
            const isSignBit = isSigned && i === 0;
            
            const term = `${isSignBit ? '-' : ''}${bit} × 2^${power}`;
            const val = isSignBit ? -1 * parseInt(bit) * Math.pow(2, power) : parseInt(bit) * Math.pow(2, power);
            
            steps.push(
                <div key={`int-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                    <span>Position {power}:</span>
                    <span className="font-mono">{term} = {val}</span>
                </div>
            );
            
            if (sumStr.length > 0) sumStr += ' + ';
            if (isSignBit && bit === '1') sumStr += `(-${Math.pow(2, power)})`;
            else sumStr += `${val}`;
        }

        for (let i = 0; i < fracBin.length; i++) {
            const bit = fracBin[i];
            const power = -(i + 1);
            
            const term = `${bit} × 2^${power}`;
            const val = parseInt(bit) * Math.pow(2, power);
            
            steps.push(
                <div key={`frac-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1 text-blue-600 dark:text-blue-400">
                    <span>Position {power}:</span>
                    <span className="font-mono">{term} = {val}</span>
                </div>
            );
            
            if (sumStr.length > 0) sumStr += ' + ';
            sumStr += `${val}`;
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Binary to Decimal Steps</h4>
                <div className="text-slate-700 dark:text-gray-300 text-sm">
                    {steps}
                    <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 font-bold flex justify-between">
                        <span>Sum:</span>
                        <span className="font-mono">{sumStr} = {decimalInput}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderDecToBinSteps = () => {
        if (!decimalInput || decimalInput === '-' || decimalInput === '.' || decimalInput === '-.' || binaryInput.includes('Error')) return null;

        const [intDecStr = '0', fracDecStr = ''] = decimalInput.replace('-', '').split('.');
        const dec = BigInt(intDecStr || '0');
        const isNegative = decimalInput.startsWith('-');

        const intSteps = [];
        let temp = dec;
        
        if (temp > 0n) {
            while (temp > 0n) {
                const quotient = temp / 2n;
                const remainder = temp % 2n;
                intSteps.push({ dividend: temp, quotient, remainder });
                temp = quotient;
            }
        }

        const intBinStr = dec === 0n ? '0' : intSteps.map(s => s.remainder).reverse().join('');
        
        const fracSteps = [];
        let fracBinStr = '';
        if (fracDecStr) {
            let fracNum = parseFloat('0.' + fracDecStr);
            let limit = 12;
            while (fracNum > 0 && limit > 0) {
                const multiplied = fracNum * 2;
                const bit = Math.floor(multiplied);
                fracSteps.push({
                    multiplicand: fracNum,
                    multiplied: multiplied,
                    bit: bit
                });
                fracBinStr += bit.toString();
                fracNum = multiplied - bit;
                limit--;
            }
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Decimal to Binary Steps</h4>
                
                {isNegative && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        For negative numbers, we first find the binary of the absolute value, then apply Two's Complement.
                    </p>
                )}

                <div className="mb-4">
                    <h5 className="font-semibold text-sm mb-2 text-slate-800 dark:text-gray-100">Integer Part (Divide by 2):</h5>
                    {dec === 0n ? (
                        <p className="text-sm text-slate-700 dark:text-gray-300">0 is simply 0 in binary.</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4 text-sm text-slate-700 dark:text-gray-300 font-mono mb-2">
                                <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Division</div>
                                <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Quotient</div>
                                <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Remainder</div>
                                
                                {intSteps.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div>{step.dividend.toString()} / 2</div>
                                        <div>{step.quotient.toString()}</div>
                                        <div className="text-orange-600 dark:text-orange-400 font-bold">{step.remainder.toString()}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 dark:text-gray-300">
                                Read remainders from bottom to top: <span className="font-mono font-bold">{intBinStr}</span>
                            </p>
                        </>
                    )}
                </div>

                {fracDecStr && (
                    <div className="mb-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                        <h5 className="font-semibold text-sm mb-2 text-slate-800 dark:text-gray-100">Fractional Part (Multiply by 2):</h5>
                        <div className="grid grid-cols-3 gap-4 text-sm text-slate-700 dark:text-gray-300 font-mono mb-2">
                            <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Multiplication</div>
                            <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Result</div>
                            <div className="font-bold border-b border-slate-300 dark:border-slate-600 pb-1">Integer Bit</div>
                            
                            {fracSteps.map((step, i) => (
                                <React.Fragment key={i}>
                                    <div>{step.multiplicand} × 2</div>
                                    <div>{step.multiplied.toFixed(4).replace(/\.?0+$/, '')}</div>
                                    <div className="text-blue-600 dark:text-blue-400 font-bold">{step.bit}</div>
                                </React.Fragment>
                            ))}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-gray-300">
                            Read bits from top to bottom: <span className="font-mono font-bold">.{fracBinStr}</span>
                        </p>
                    </div>
                )}

                {isNegative && isSigned && (
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                        <h5 className="font-semibold text-sm mb-2 text-slate-800 dark:text-gray-100">Two's Complement Process:</h5>
                        <p className="text-sm text-slate-700 dark:text-gray-300 mb-2">
                            Absolute binary: <span className="font-mono">0{intBinStr}{fracBinStr ? '.' + fracBinStr : ''}</span>
                        </p>
                        <p className="text-sm text-slate-700 dark:text-gray-300 mb-2">
                            Invert bits and add 1 to the least significant bit to get the final result.
                        </p>
                        <p className="text-sm text-slate-700 dark:text-gray-300 font-mono font-bold">
                            Result: {binaryInput}
                        </p>
                    </div>
                )}
                
                {!isNegative && isSigned && (
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                        <p className="text-sm text-slate-700 dark:text-gray-300">
                            Since this is a signed positive number, we add a <span className="font-mono font-bold">0</span> sign bit to the front: <span className="font-mono font-bold">{binaryInput}</span>
                        </p>
                    </div>
                )}
                
                {!isSigned && (
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                        <p className="text-sm text-slate-700 dark:text-gray-300">
                            Final Unsigned Binary: <span className="font-mono font-bold">{binaryInput}</span>
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderOctToBinSteps = () => {
        if (!octalInput || octalInput.includes('Error')) return null;

        const steps = [];
        for (let i = 0; i < octalInput.length; i++) {
            const digit = octalInput[i];
            if (digit === '.') {
                steps.push(
                    <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                        <span>Decimal Point:</span>
                        <span className="font-mono">.</span>
                    </div>
                );
                continue;
            }
            const bin = parseInt(digit, 8).toString(2).padStart(3, '0');
            steps.push(
                <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                    <span>Digit '{digit}':</span>
                    <span className="font-mono">{bin}</span>
                </div>
            );
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Octal to Binary Steps</h4>
                <div className="text-slate-700 dark:text-gray-300 text-sm">
                    {steps}
                    <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 font-bold flex justify-between">
                        <span>Result:</span>
                        <span className="font-mono">{binaryInput}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderHexToBinSteps = () => {
        if (!hexInput || hexInput.includes('Error')) return null;

        const steps = [];
        for (let i = 0; i < hexInput.length; i++) {
            const digit = hexInput[i];
            if (digit === '.') {
                steps.push(
                    <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                        <span>Decimal Point:</span>
                        <span className="font-mono">.</span>
                    </div>
                );
                continue;
            }
            const bin = parseInt(digit, 16).toString(2).padStart(4, '0');
            steps.push(
                <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                    <span>Digit '{digit}':</span>
                    <span className="font-mono">{bin}</span>
                </div>
            );
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Hexadecimal to Binary Steps</h4>
                <div className="text-slate-700 dark:text-gray-300 text-sm">
                    {steps}
                    <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 font-bold flex justify-between">
                        <span>Result:</span>
                        <span className="font-mono">{binaryInput}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderBinToOctSteps = () => {
        if (!binaryInput || binaryInput.includes('Error')) return null;

        const [intBin = '', fracBin = ''] = binaryInput.split('.');
        
        let paddedInt = intBin;
        const signBit = (isSigned && intBin.length > 0) ? intBin[0] : '0';
        while (paddedInt.length % 3 !== 0 || paddedInt.length === 0) {
            paddedInt = signBit + paddedInt;
        }

        let paddedFrac = fracBin;
        if (fracBin) {
            while (paddedFrac.length % 3 !== 0) {
                paddedFrac += '0';
            }
        }

        const steps = [];
        
        steps.push(<div key="int-header" className="font-semibold text-xs text-slate-500 uppercase tracking-wider mt-2">Integer Part</div>);
        for (let i = 0; i < paddedInt.length; i += 3) {
            const group = paddedInt.slice(i, i + 3);
            const octDigit = parseInt(group, 2).toString(8);
            steps.push(
                <div key={`int-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                    <span className="font-mono">{group}</span>
                    <span>→ {octDigit}</span>
                </div>
            );
        }

        if (fracBin) {
            steps.push(<div key="frac-header" className="font-semibold text-xs text-slate-500 uppercase tracking-wider mt-4">Fractional Part</div>);
            for (let i = 0; i < paddedFrac.length; i += 3) {
                const group = paddedFrac.slice(i, i + 3);
                const octDigit = parseInt(group, 2).toString(8);
                steps.push(
                    <div key={`frac-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1 text-blue-600 dark:text-blue-400">
                        <span className="font-mono">{group}</span>
                        <span>→ {octDigit}</span>
                    </div>
                );
            }
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Binary to Octal Steps</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Pad integer part with sign bit (or 0) on the left to a multiple of 3 bits. Pad fractional part with 0s on the right to a multiple of 3 bits.
                </p>
                <div className="text-slate-700 dark:text-gray-300 text-sm">
                    <div className="mb-2">
                        Padded Binary: <span className="font-mono">{paddedInt}{fracBin ? '.' + paddedFrac : ''}</span>
                    </div>
                    {steps}
                    <div className="mt-4 pt-2 border-t border-slate-300 dark:border-slate-600 font-bold flex justify-between">
                        <span>Result:</span>
                        <span className="font-mono">{octalInput}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderBinToHexSteps = () => {
        if (!binaryInput || binaryInput.includes('Error')) return null;

        const [intBin = '', fracBin = ''] = binaryInput.split('.');
        
        let paddedInt = intBin;
        const signBit = (isSigned && intBin.length > 0) ? intBin[0] : '0';
        while (paddedInt.length % 4 !== 0 || paddedInt.length === 0) {
            paddedInt = signBit + paddedInt;
        }

        let paddedFrac = fracBin;
        if (fracBin) {
            while (paddedFrac.length % 4 !== 0) {
                paddedFrac += '0';
            }
        }

        const steps = [];
        
        steps.push(<div key="int-header" className="font-semibold text-xs text-slate-500 uppercase tracking-wider mt-2">Integer Part</div>);
        for (let i = 0; i < paddedInt.length; i += 4) {
            const group = paddedInt.slice(i, i + 4);
            const hexDigit = parseInt(group, 2).toString(16).toUpperCase();
            steps.push(
                <div key={`int-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1">
                    <span className="font-mono">{group}</span>
                    <span>→ {hexDigit}</span>
                </div>
            );
        }

        if (fracBin) {
            steps.push(<div key="frac-header" className="font-semibold text-xs text-slate-500 uppercase tracking-wider mt-4">Fractional Part</div>);
            for (let i = 0; i < paddedFrac.length; i += 4) {
                const group = paddedFrac.slice(i, i + 4);
                const hexDigit = parseInt(group, 2).toString(16).toUpperCase();
                steps.push(
                    <div key={`frac-${i}`} className="flex justify-between border-b border-slate-200 dark:border-slate-700 py-1 text-blue-600 dark:text-blue-400">
                        <span className="font-mono">{group}</span>
                        <span>→ {hexDigit}</span>
                    </div>
                );
            }
        }

        return (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-2 text-slate-800 dark:text-gray-100">Binary to Hexadecimal Steps</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Pad integer part with sign bit (or 0) on the left to a multiple of 4 bits. Pad fractional part with 0s on the right to a multiple of 4 bits.
                </p>
                <div className="text-slate-700 dark:text-gray-300 text-sm">
                    <div className="mb-2">
                        Padded Binary: <span className="font-mono">{paddedInt}{fracBin ? '.' + paddedFrac : ''}</span>
                    </div>
                    {steps}
                    <div className="mt-4 pt-2 border-t border-slate-300 dark:border-slate-600 font-bold flex justify-between">
                        <span>Result:</span>
                        <span className="font-mono">{hexInput}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'conversions' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('conversions')}
                >
                    Conversions
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'addition' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('addition')}
                >
                    Addition & Flags
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'multiplication' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('multiplication')}
                >
                    Multiplication
                </button>
                <button 
                    className={`pb-2 px-4 font-semibold ${activeTab === 'division' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('division')}
                >
                    Division
                </button>
            </div>

            {activeTab === 'conversions' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Binary Number Education</h2>
                    
                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Number Type:</span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input 
                        type="radio" 
                        checked={!isSigned} 
                        onChange={() => setIsSigned(false)} 
                        className="accent-blue-500"
                    />
                    Unsigned
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input 
                        type="radio" 
                        checked={isSigned} 
                        onChange={() => setIsSigned(true)} 
                        className="accent-blue-500"
                    />
                    Signed (Two's Complement)
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Binary Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Binary Input</label>
                        <input
                            type="text"
                            value={binaryInput}
                            onChange={handleBinaryChange}
                            placeholder="e.g. 1010"
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                            <input 
                                type="checkbox" 
                                checked={showBinToDecSteps} 
                                onChange={(e) => setShowBinToDecSteps(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600"
                            />
                            Show Binary → Decimal Steps
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                            <input 
                                type="checkbox" 
                                checked={showBinToOctSteps} 
                                onChange={(e) => setShowBinToOctSteps(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600"
                            />
                            Show Binary → Octal Steps
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                            <input 
                                type="checkbox" 
                                checked={showBinToHexSteps} 
                                onChange={(e) => setShowBinToHexSteps(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600"
                            />
                            Show Binary → Hex Steps
                        </label>
                    </div>

                    {showBinToDecSteps && renderBinToDecSteps()}
                    {showBinToOctSteps && renderBinToOctSteps()}
                    {showBinToHexSteps && renderBinToHexSteps()}
                </div>

                {/* Decimal Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Decimal Input</label>
                        <input
                            type="text"
                            value={decimalInput}
                            onChange={handleDecimalChange}
                            placeholder="e.g. 10"
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                        <input 
                            type="checkbox" 
                            checked={showDecToBinSteps} 
                            onChange={(e) => setShowDecToBinSteps(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Show Decimal → Binary Steps
                    </label>

                    {showDecToBinSteps && renderDecToBinSteps()}
                </div>

                {/* Octal Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Octal Input</label>
                        <input
                            type="text"
                            value={octalInput}
                            onChange={handleOctalChange}
                            placeholder="e.g. 12"
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                        <input 
                            type="checkbox" 
                            checked={showOctToBinSteps} 
                            onChange={(e) => setShowOctToBinSteps(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Show Octal → Binary Steps
                    </label>

                    {showOctToBinSteps && renderOctToBinSteps()}
                </div>

                {/* Hexadecimal Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-800 dark:text-gray-100">Hexadecimal Input</label>
                        <input
                            type="text"
                            value={hexInput}
                            onChange={handleHexChange}
                            placeholder="e.g. A"
                            className="p-3 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                        <input 
                            type="checkbox" 
                            checked={showHexToBinSteps} 
                            onChange={(e) => setShowHexToBinSteps(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Show Hexadecimal → Binary Steps
                    </label>

                    {showHexToBinSteps && renderHexToBinSteps()}
                </div>
            </div>
        </div>
            )}
            {activeTab === 'addition' && <BinaryAddition />}
            {activeTab === 'multiplication' && <BinaryMultiplication />}
            {activeTab === 'division' && <BinaryDivision />}
        </div>
    );
};
