# Design Document

## Overview

The lexical analyzer is implemented as a hand-coded state machine-based token recognizer in Python. The design follows a modular approach where each token type has its own recognition function that implements a finite automaton. The main classifier function applies these recognizers in a specific priority order to correctly classify input strings.

## Architecture

The system consists of three main layers:

1. **Input/Output Layer**: Handles reading from stdin and writing to stdout
2. **Classification Layer**: Orchestrates token recognition by calling recognizers in priority order
3. **Recognition Layer**: Individual state-machine functions for each token type

```
┌─────────────────────────────────────┐
│         Main Function               │
│  (I/O and Control Flow)             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      classify_token()                │
│  (Priority-based Classification)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Token Recognition Functions        │
│  (State Machine Implementations)     │
│  - is_keyword()                      │
│  - is_integer()                      │
│  - is_decimal()                      │
│  - is_scientific()                   │
│  - is_hexadecimal()                  │
│  - is_character_literal()            │
│  - is_string_literal()               │
│  - is_aircraft_designation()         │
│  - is_identifier()                   │
│  - is_phone_number()                 │
└─────────────────────────────────────┘
```

## Components and Interfaces

### Helper Functions

These provide basic character classification without using regex:

- `is_digit(char)`: Returns True if char is '0'-'9'
- `is_hex_digit(char)`: Returns True if char is '0'-'9' or 'A'-'F' (case-insensitive)
- `is_letter(char)`: Returns True if char is 'A'-'Z' (case-insensitive)

### Token Recognition Functions

Each function implements a deterministic finite automaton (DFA) using explicit state transitions:

#### is_keyword(s: str) -> bool
- Simple lookup in a set of valid keywords
- Keywords: DEFUN, IF, FI, LOOP, POOL, PRINT

#### is_integer(s: str) -> bool
State machine:
```
START → [+/-]? → DIGIT+ → ACCEPT
```
- State 0: Start, check for optional sign
- State 1: Require at least one digit
- State 2: Accept more digits until end

#### is_decimal(s: str) -> bool
State machine:
```
START → [+/-]? → DIGIT+ → '.' → DIGIT+ → ACCEPT
```
- Extends integer pattern with mandatory period and fractional part
- Both integer and fractional parts must be non-empty

#### is_scientific(s: str) -> bool
State machine:
```
DECIMAL → 'E' → [+/-]? → NON_ZERO_INTEGER → ACCEPT
```
- First validates decimal part
- Then validates exponent (must be non-zero integer)
- Splits on 'E' and validates both parts

#### is_hexadecimal(s: str) -> bool
State machine:
```
START → HEX_DIGIT+ → 'H' → ACCEPT
```
- Requires at least one hex digit before 'H' suffix
- Only uppercase A-F allowed

#### is_character_literal(s: str) -> bool
State machine:
```
START → HEX_DIGIT → HEX_DIGIT → 'X' → ACCEPT
```
- Exactly 2 hex digits followed by 'X'
- Fixed length of 3 characters

#### is_string_literal(s: str) -> bool
State machine:
```
START → '"' → NON_WHITESPACE_NON_QUOTE+ → '"' → ACCEPT
```
- Must start and end with double quotes
- No spaces or internal quotes allowed
- Must have at least one character between quotes

#### is_aircraft_designation(s: str) -> bool
State machine:
```
START → TYPE[AGJDPL] → DIGIT{1,2} → MFR[AKMNY] → 
  (DIGIT{1,2})? → ('-' → TYPE)? → ACCEPT
```
- Type designator: A, G, J, D, P, or L
- Version: 1-2 digits
- Manufacturer: A, K, M, N, or Y
- Optional series: 1-2 digits
- Optional suffix: dash and type designator

#### is_phone_number(s: str) -> bool
Three distinct patterns:
```
Pattern 1: ddd.ddd.dddd (length 12)
Pattern 2: (ddd)ddd-dddd (length 13)
Pattern 3: ddd-ddd-dddd (length 12)
```
- Validates structure and digit positions
- Exactly 10 digits total

#### is_identifier(s: str) -> bool
State machine:
```
START → LETTER → (LETTER|DIGIT|'_')* → ACCEPT
```
- Must start with a letter
- Can contain letters, digits, underscores
- Must not match keywords or other special patterns

### Classification Function

`classify_token(token: str) -> str`

Applies recognition functions in priority order:

1. Keyword (highest priority - reserved words)
2. Phone number (structurally distinct)
3. String literal (enclosed in quotes)
4. Scientific (must check before Decimal/Integer)
5. Decimal (must check before Integer)
6. Integer
7. Hexadecimal (can overlap with Identifier)
8. Character literal (can overlap with Identifier)
9. Aircraft designation (can overlap with Identifier)
10. Identifier (fallback for valid names)
11. INVALID! (no match)

This order ensures that more specific patterns are matched before more general ones, and that patterns that could be confused with identifiers are checked first.

### Main Function

`main()`

1. Read integer N from first line
2. Read N subsequent lines
3. Output N
4. For each line (1-indexed):
   - Classify the token
   - Output: "{line_number}: {token_type}"

## Data Models

The system operates on simple string inputs with no complex data structures:

- **Input**: String tokens (one per line)
- **Output**: Classification strings
- **State**: Position index (stepplus) used during state machine traversal

No persistent state is maintained between token classifications.

## Error Handling

The design follows a fail-safe approach:

1. **Invalid tokens**: Any string that doesn't match a pattern returns "INVALID!"
2. **Malformed input**: The main function includes try-except for ValueError/IndexError
3. **Edge cases**: Each recognizer explicitly handles:
   - Empty strings
   - Strings that are too short/long
   - Invalid characters at any position
   - Boundary conditions (e.g., zero exponent in scientific notation)

## Testing Strategy

### Unit Testing

Each recognition function should be tested independently with:

1. **Valid cases**: Strings that should match the pattern
2. **Invalid cases**: Strings that should not match
3. **Edge cases**: Boundary conditions and corner cases
4. **Overlap cases**: Strings that could match multiple patterns

Test categories:

- **Integer tests**: signed, unsigned, leading zeros, single digit
- **Decimal tests**: various formats, edge cases with periods
- **Scientific tests**: positive/negative exponents, zero exponent (invalid)
- **Hexadecimal tests**: various lengths, case sensitivity
- **Character literal tests**: valid hex pairs, invalid lengths
- **Keyword tests**: all keywords, case sensitivity
- **String literal tests**: special characters, spaces (invalid), quotes
- **Aircraft tests**: all format variations, invalid designators
- **Identifier tests**: valid names, keywords (should not match), overlaps
- **Phone tests**: all three formats, invalid digit counts

### Integration Testing

Test the complete classification pipeline:

1. Use the provided sample input/output
2. Test priority ordering (e.g., "IF" is Keyword not Identifier)
3. Test ambiguous cases (e.g., "ABCH" is Hexadecimal not Identifier)
4. Test the grading input file

### Test Execution

Tests should be runnable via:
```bash
python3 test_lexer.py
```

The test suite should:
- Use Python's unittest framework
- Provide clear pass/fail output
- Cover all token types
- Include the sample cases from the problem statement
- Include additional edge cases

## Implementation Notes

1. **No Regular Expressions**: All pattern matching uses explicit character-by-character state traversal
2. **Case Handling**: Most patterns are case-sensitive except for hex digit checking (A-F vs a-f)
3. **Performance**: O(n) time complexity for each recognizer where n is string length
4. **Maintainability**: Each token type is isolated in its own function for easy modification
5. **Extensibility**: New token types can be added by creating a new recognizer and adding it to the classification priority list
