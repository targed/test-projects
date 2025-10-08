# PUCK-25.3 Lexical Analyzer

A hand-coded lexical analyzer for the PUCK-25.3 programming language, built without using regular expressions or lexer generators.

## Features

The lexer recognizes the following token types:

1. **Integers**: `[+/-]? DIGIT+` (e.g., 3, -12, +001)
2. **Decimals**: `[+/-]? DIGIT+ '.' DIGIT+` (e.g., 3.14, -39874.454)
3. **Scientific**: `DECIMAL 'E' NON_ZERO_INTEGER` (e.g., 12.0E4, 1.23E-6)
4. **Hexadecimals**: `HEX_DIGIT+ 'H'` (e.g., 12AD0H, ABCH)
5. **Character Literals**: `HEX_DIGIT HEX_DIGIT 'X'` (e.g., 12X, AFX)
6. **Keywords**: DEFUN, IF, FI, LOOP, POOL, PRINT
7. **String Literals**: `'"' NON_WHITESPACE+ '"'` (e.g., "test", "Be-Happy!")
8. **Aircraft Designations**: `TYPE DIGIT{1,2} MFR (DIGIT{1,2})? ('-' TYPE)?` (e.g., G5M, A6M2, D3Y2-L)
9. **Phone Numbers**: Three formats - `ddd.ddd.dddd`, `(ddd)ddd-dddd`, `ddd-ddd-dddd`
10. **Identifiers**: `LETTER (LETTER|DIGIT|'_')*` (e.g., x, size, r_val)

## Implementation

The lexer is implemented using explicit state machines for each token type. No regular expressions or lexer generators (like flex) are used.

### Architecture

- **Helper Functions**: Character classification (is_digit, is_hex_digit, is_letter)
- **Recognition Functions**: One function per token type implementing a DFA
- **Classification**: Priority-based token classification
- **Main I/O**: Reads from stdin, outputs to stdout

### Priority Order

When multiple patterns could match, tokens are classified in this order:
1. Keyword (highest priority)
2. Character literal
3. Hexadecimal
4. Aircraft designation
5. Phone number
6. Scientific
7. Decimal
8. Integer
9. String literal
10. Identifier
11. INVALID! (no match)

## Usage

### Running the Lexer

```bash
# Using the run script
./run.sh < input.txt > output.txt

# Or directly with Python
python3 lexer.py < input.txt > output.txt
```

### Input Format

```
N
token1
token2
...
tokenN
```

Where N is the number of tokens to classify.

### Output Format

```
N
1: TokenType
2: TokenType
...
N: TokenType
```

## Testing

Run the comprehensive test suite:

```bash
python3 test_lexer.py -v
```

The test suite includes:
- Unit tests for all helper functions
- Unit tests for each token recognition function
- Priority ordering tests
- Integration tests with sample input/output
- 31 total test cases

## Files

- `lexer.py` - Main lexer implementation
- `test_lexer.py` - Comprehensive test suite
- `run.sh` - Execution script for Unix/Linux systems
- `.kiro/specs/lexical-analyzer/` - Design documentation
  - `requirements.md` - Detailed requirements with acceptance criteria
  - `design.md` - Architecture and design decisions
  - `tasks.md` - Implementation task list

## Example

Input:
```
5
123
LOOP
"test"
A1X
invalid!
```

Output:
```
5
1: Integer
2: Keyword
3: String
4: Character
5: INVALID!
```

## Notes

- All pattern matching uses explicit character-by-character state traversal
- Case-sensitive except for letter recognition in identifiers
- O(n) time complexity per token where n is the token length
- Handles edge cases like zero exponents, empty strings, and malformed input
