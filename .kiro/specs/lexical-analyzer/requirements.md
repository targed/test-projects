# Requirements Document

## Introduction

This feature implements a hand-coded lexical analyzer for the PUCK-25.3 programming language. The analyzer recognizes various token types including integers, decimals, scientific numbers, hexadecimals, character literals, keywords, string literals, aircraft designations, identifiers, and phone numbers. The implementation must use manually encoded automata without relying on pre-existing regular expression libraries or tools like flex.

## Requirements

### Requirement 1: Integer Recognition

**User Story:** As a lexical analyzer, I want to recognize integer tokens, so that I can identify numeric literals in source code.

#### Acceptance Criteria

1. WHEN the input is a non-empty sequence of digits THEN the system SHALL classify it as an Integer
2. WHEN the input is a non-empty sequence of digits preceded by '+' THEN the system SHALL classify it as an Integer
3. WHEN the input is a non-empty sequence of digits preceded by '-' THEN the system SHALL classify it as an Integer
4. WHEN the input contains leading zeros THEN the system SHALL still classify it as a valid Integer
5. WHEN the input is just a sign without digits THEN the system SHALL NOT classify it as an Integer

### Requirement 2: Decimal Number Recognition

**User Story:** As a lexical analyzer, I want to recognize decimal number tokens, so that I can identify floating-point literals.

#### Acceptance Criteria

1. WHEN the input is an Integer followed by '.' followed by non-empty digits THEN the system SHALL classify it as a Decimal
2. WHEN the input has optional sign, digits, period, and trailing digits THEN the system SHALL classify it as a Decimal
3. WHEN the input has a period but no trailing digits THEN the system SHALL NOT classify it as a Decimal
4. WHEN the input has a period but no leading digits THEN the system SHALL NOT classify it as a Decimal

### Requirement 3: Scientific Number Recognition

**User Story:** As a lexical analyzer, I want to recognize scientific notation tokens, so that I can identify exponential numeric literals.

#### Acceptance Criteria

1. WHEN the input is a Decimal followed by 'E' followed by a non-zero Integer THEN the system SHALL classify it as a Scientific number
2. WHEN the exponent part is zero THEN the system SHALL NOT classify it as a Scientific number
3. WHEN the exponent has a sign (+ or -) THEN the system SHALL classify it as a Scientific number if the exponent is non-zero
4. WHEN the base is not a valid Decimal THEN the system SHALL NOT classify it as a Scientific number
5. WHEN there are extra characters after the exponent THEN the system SHALL NOT classify it as a Scientific number

### Requirement 4: Hexadecimal Number Recognition

**User Story:** As a lexical analyzer, I want to recognize hexadecimal number tokens, so that I can identify hex literals.

#### Acceptance Criteria

1. WHEN the input is a non-empty sequence of hex digits (0-9, A-F) followed by 'H' THEN the system SHALL classify it as a Hexadecimal
2. WHEN the input contains lowercase hex letters (a-f) THEN the system SHALL NOT classify it as a Hexadecimal
3. WHEN the input has 'H' suffix but no preceding hex digits THEN the system SHALL NOT classify it as a Hexadecimal
4. WHEN the input is a valid identifier that ends with 'H' but contains non-hex characters THEN the system SHALL NOT classify it as a Hexadecimal

### Requirement 5: Character Literal Recognition

**User Story:** As a lexical analyzer, I want to recognize character literal tokens, so that I can identify character constants.

#### Acceptance Criteria

1. WHEN the input is exactly two hexadecimal digits followed by 'X' THEN the system SHALL classify it as a Character literal
2. WHEN the input has fewer or more than two hex digits before 'X' THEN the system SHALL NOT classify it as a Character literal
3. WHEN the input has lowercase hex letters before 'X' THEN the system SHALL NOT classify it as a Character literal

### Requirement 6: Keyword Recognition

**User Story:** As a lexical analyzer, I want to recognize keyword tokens, so that I can identify reserved words in the language.

#### Acceptance Criteria

1. WHEN the input exactly matches 'DEFUN' THEN the system SHALL classify it as a Keyword
2. WHEN the input exactly matches 'IF' THEN the system SHALL classify it as a Keyword
3. WHEN the input exactly matches 'FI' THEN the system SHALL classify it as a Keyword
4. WHEN the input exactly matches 'LOOP' THEN the system SHALL classify it as a Keyword
5. WHEN the input exactly matches 'POOL' THEN the system SHALL classify it as a Keyword
6. WHEN the input exactly matches 'PRINT' THEN the system SHALL classify it as a Keyword
7. WHEN the input is a keyword with different casing THEN the system SHALL NOT classify it as a Keyword

### Requirement 7: String Literal Recognition

**User Story:** As a lexical analyzer, I want to recognize string literal tokens, so that I can identify string constants.

#### Acceptance Criteria

1. WHEN the input starts with '"' and ends with '"' and contains non-whitespace characters THEN the system SHALL classify it as a String literal
2. WHEN the string contains spaces THEN the system SHALL NOT classify it as a String literal
3. WHEN the string contains internal double quotes THEN the system SHALL NOT classify it as a String literal
4. WHEN the string is empty (just "")  THEN the system SHALL NOT classify it as a String literal
5. WHEN the string contains special characters (non-alphanumeric, non-whitespace) THEN the system SHALL classify it as a String literal

### Requirement 8: Aircraft Designation Recognition

**User Story:** As a lexical analyzer, I want to recognize aircraft designation tokens, so that I can identify aircraft model identifiers.

#### Acceptance Criteria

1. WHEN the input has type designator (A/G/J/D/P/L), 1-2 digits, manufacturer (A/K/M/N/Y) THEN the system SHALL classify it as an Aircraft designation
2. WHEN the input additionally has a series number (1-2 digits) after manufacturer THEN the system SHALL classify it as an Aircraft designation
3. WHEN the input additionally has '-' and type designator at the end THEN the system SHALL classify it as an Aircraft designation
4. WHEN the type designator is not one of A/G/J/D/P/L THEN the system SHALL NOT classify it as an Aircraft designation
5. WHEN the manufacturer is not one of A/K/M/N/Y THEN the system SHALL NOT classify it as an Aircraft designation
6. WHEN the version number has more than 2 digits THEN the system SHALL NOT classify it as an Aircraft designation

### Requirement 9: Identifier Recognition

**User Story:** As a lexical analyzer, I want to recognize identifier tokens, so that I can identify variable and function names.

#### Acceptance Criteria

1. WHEN the input starts with a letter and contains only letters, digits, or underscores THEN the system SHALL classify it as an Identifier
2. WHEN the input matches a keyword THEN the system SHALL NOT classify it as an Identifier
3. WHEN the input matches a hexadecimal number pattern THEN the system SHALL NOT classify it as an Identifier
4. WHEN the input matches a character literal pattern THEN the system SHALL NOT classify it as an Identifier
5. WHEN the input matches an aircraft designation pattern THEN the system SHALL NOT classify it as an Identifier
6. WHEN the input starts with a digit or underscore THEN the system SHALL NOT classify it as an Identifier

### Requirement 10: Phone Number Recognition

**User Story:** As a lexical analyzer, I want to recognize phone number tokens, so that I can identify telephone number literals.

#### Acceptance Criteria

1. WHEN the input matches format ddd.ddd.dddd THEN the system SHALL classify it as a Phone number
2. WHEN the input matches format (ddd)ddd-dddd THEN the system SHALL classify it as a Phone number
3. WHEN the input matches format ddd-ddd-dddd THEN the system SHALL classify it as a Phone number
4. WHEN the input has exactly 10 digits in the specified format THEN the system SHALL classify it as a Phone number
5. WHEN the input has fewer or more than 10 digits THEN the system SHALL NOT classify it as a Phone number
6. WHEN the input uses mixed separators not matching the patterns THEN the system SHALL NOT classify it as a Phone number

### Requirement 11: Input/Output Processing

**User Story:** As a user, I want to provide input via standard input and receive output via standard output, so that the analyzer can be used in command-line pipelines.

#### Acceptance Criteria

1. WHEN the program starts THEN the system SHALL read the first line as integer N from standard input
2. WHEN N is read THEN the system SHALL read exactly N subsequent lines
3. WHEN processing begins THEN the system SHALL output N as the first line
4. WHEN processing each line THEN the system SHALL output line number, colon, space, and token type
5. WHEN a string doesn't match any token type THEN the system SHALL output "INVALID!"
6. WHEN all lines are processed THEN the system SHALL terminate

### Requirement 12: Token Priority and Classification

**User Story:** As a lexical analyzer, I want to apply correct priority when multiple patterns could match, so that tokens are classified correctly.

#### Acceptance Criteria

1. WHEN a string could be both a keyword and identifier THEN the system SHALL classify it as a Keyword
2. WHEN a string could be both a hexadecimal and identifier THEN the system SHALL classify it as a Hexadecimal
3. WHEN a string could be both a character literal and identifier THEN the system SHALL classify it as a Character literal
4. WHEN a string could be both an aircraft designation and identifier THEN the system SHALL classify it as an Aircraft designation
5. WHEN checking token types THEN the system SHALL check in order: Keyword, Character literal, Hexadecimal, Aircraft designation, Phone number, Scientific, Decimal, Integer, String literal, Identifier

### Requirement 13: Manual Automata Implementation

**User Story:** As a developer, I want to implement automata manually without regex libraries, so that the solution demonstrates understanding of lexical analysis fundamentals.

#### Acceptance Criteria

1. WHEN implementing token recognition THEN the system SHALL NOT use pre-existing regular expression libraries
2. WHEN implementing token recognition THEN the system SHALL NOT use flex or similar tools
3. WHEN implementing token recognition THEN the system SHALL use state-machine based approaches
4. WHEN implementing automata THEN the system SHALL encode state transitions explicitly in code
