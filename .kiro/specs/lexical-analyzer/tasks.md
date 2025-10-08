# Implementation Plan

- [x] 1. Create helper functions for character classification


  - Implement is_digit(), is_hex_digit(), and is_letter() functions using character comparison
  - Write unit tests for each helper function with valid and invalid inputs
  - _Requirements: 13.4_

- [x] 2. Implement integer recognition


  - Code is_integer() function with state machine for optional sign and digit sequence
  - Write unit tests covering signed, unsigned, leading zeros, and edge cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement decimal number recognition


  - Code is_decimal() function with state machine for integer.fraction pattern
  - Write unit tests for valid decimals, missing parts, and edge cases
  - _Requirements: 2.1, 2.2, 2.3, 2.4_


- [x] 4. Implement scientific number recognition

  - Code is_scientific() function that validates decimal base and non-zero exponent
  - Write unit tests for positive/negative exponents, zero exponent (invalid), and edge cases
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 5. Implement hexadecimal number recognition

  - Code is_hexadecimal() function with state machine for hex digits followed by 'H'
  - Write unit tests for valid hex numbers, case sensitivity, and invalid patterns
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [x] 6. Implement character literal recognition

  - Code is_character_literal() function for exactly two hex digits followed by 'X'
  - Write unit tests for valid character literals, wrong lengths, and case sensitivity
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 7. Implement keyword recognition

  - Code is_keyword() function using set lookup for all six keywords
  - Write unit tests for all keywords and case sensitivity
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Implement string literal recognition


  - Code is_string_literal() function for quoted non-whitespace sequences
  - Write unit tests for valid strings, spaces (invalid), internal quotes, and special characters
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 9. Implement aircraft designation recognition

  - Code is_aircraft_designation() function with state machine for type-version-manufacturer-series-suffix pattern
  - Write unit tests for all format variations, invalid designators, and digit count validation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_


- [x] 10. Implement phone number recognition

  - Code is_phone_number() function for three distinct phone formats
  - Write unit tests for all three formats, invalid digit counts, and mixed separators
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 11. Implement identifier recognition


  - Code is_identifier() function with state machine for letter followed by alphanumeric/underscore
  - Write unit tests for valid identifiers, invalid start characters, and edge cases
  - _Requirements: 9.1, 9.6_

- [x] 12. Implement token classification with priority ordering


  - Code classify_token() function that calls recognizers in correct priority order
  - Write unit tests for priority cases where multiple patterns could match
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 9.2, 9.3, 9.4, 9.5_


- [x] 13. Implement main I/O processing function

  - Code main() function to read N, process N lines, and output results in required format
  - Write integration tests using sample input/output from problem statement
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 14. Create comprehensive test suite


  - Create test_lexer.py with all unit tests organized by token type
  - Add integration test using the grading input/output files
  - Verify all tests pass and coverage is complete
  - _Requirements: All requirements_

- [x] 15. Verify execution script and output format


  - Ensure run.sh correctly executes the lexer
  - Test with grading input to verify output matches expected format exactly
  - _Requirements: 11.3, 11.4, 11.5_
