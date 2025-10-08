# Lexical Analyzer for PUCK-25.3
# Author: [Your Name]

import sys

# ============================================================================
# HELPER FUNCTIONS - Character Classification
# ============================================================================

def is_digit(char):
    """Check if character is a digit (0-9)."""
    return '0' <= char <= '9'


def is_hex_digit(char):
    """Check if character is a hexadecimal digit (0-9, A-F)."""
    return is_digit(char) or ('A' <= char <= 'F')


def is_letter(char):
    """Check if character is a letter (A-Z, case-insensitive)."""
    return 'A' <= char.upper() <= 'Z'



# ============================================================================
# TOKEN RECOGNITION FUNCTIONS
# ============================================================================

def is_integer(s):
    """
    Recognize integer tokens.
    Pattern: [+/-]? DIGIT+
    Examples: 3, -12, +001, -1230
    """
    if not s:
        return False
    
    pos = 0
    
    # State 0: Check for optional sign
    if s[pos] in '+-':
        pos += 1
    
    # Must have at least one digit after optional sign
    if pos >= len(s):
        return False
    
    start_digits = pos
    
    # State 1-2: Accept one or more digits
    while pos < len(s):
        if not is_digit(s[pos]):
            return False
        pos += 1
    
    # Must have consumed at least one digit
    return pos > start_digits



def is_decimal(s):
    """
    Recognize decimal number tokens.
    Pattern: [+/-]? DIGIT+ '.' DIGIT+
    Examples: 3.14, 00.01, 123.0, -39874.454
    """
    if not s:
        return False
    
    pos = 0
    
    # State 0: Check for optional sign
    if s[pos] in '+-':
        pos += 1
    
    # Must have at least one digit for integer part
    if pos >= len(s):
        return False
    
    start_integer = pos
    
    # State 1: Accept one or more digits (integer part)
    while pos < len(s) and is_digit(s[pos]):
        pos += 1
    
    # Must have at least one digit in integer part
    if pos == start_integer:
        return False
    
    # State 2: Must have a period
    if pos >= len(s) or s[pos] != '.':
        return False
    pos += 1
    
    # Must have at least one digit for fractional part
    if pos >= len(s):
        return False
    
    start_fraction = pos
    
    # State 3: Accept one or more digits (fractional part)
    while pos < len(s) and is_digit(s[pos]):
        pos += 1
    
    # Must have at least one digit in fractional part
    if pos == start_fraction:
        return False
    
    # Must have consumed entire string
    return pos == len(s)



def is_scientific(s):
    """
    Recognize scientific number tokens.
    Pattern: DECIMAL 'E' NON_ZERO_INTEGER
    Examples: 12.0E4, 1.23E-6, +234.34E-941
    """
    if not s or 'E' not in s:
        return False
    
    # Split on 'E' - must have exactly one 'E'
    parts = s.split('E')
    if len(parts) != 2:
        return False
    
    decimal_part, exponent_part = parts
    
    # Validate decimal part
    if not is_decimal(decimal_part):
        return False
    
    # Validate exponent part (must be non-zero integer)
    if not exponent_part:
        return False
    
    pos = 0
    
    # Check for optional sign in exponent
    if exponent_part[pos] in '+-':
        pos += 1
    
    # Must have at least one digit after optional sign
    if pos >= len(exponent_part):
        return False
    
    start_exp_digits = pos
    is_all_zeros = True
    
    # Accept one or more digits and check if all are zeros
    while pos < len(exponent_part):
        if not is_digit(exponent_part[pos]):
            return False
        if exponent_part[pos] != '0':
            is_all_zeros = False
        pos += 1
    
    # Must have at least one digit and not all zeros
    if pos == start_exp_digits or is_all_zeros:
        return False
    
    return True



def is_hexadecimal(s):
    """
    Recognize hexadecimal number tokens.
    Pattern: HEX_DIGIT+ 'H'
    Examples: 12AD0H, 123H, 1A2B3CH, ABCH
    """
    if not s or len(s) < 2:
        return False
    
    # Must end with 'H'
    if s[-1] != 'H':
        return False
    
    # Must have at least one hex digit before 'H'
    pos = 0
    while pos < len(s) - 1:
        if not is_hex_digit(s[pos]):
            return False
        pos += 1
    
    return True



def is_character_literal(s):
    """
    Recognize character literal tokens.
    Pattern: HEX_DIGIT HEX_DIGIT 'X'
    Examples: 12X, AFX, FFX
    """
    if len(s) != 3:
        return False
    
    # Must end with 'X'
    if s[2] != 'X':
        return False
    
    # First two characters must be hex digits
    if not is_hex_digit(s[0]) or not is_hex_digit(s[1]):
        return False
    
    return True



def is_keyword(s):
    """
    Recognize keyword tokens.
    Keywords: DEFUN, IF, FI, LOOP, POOL, PRINT
    """
    return s in {'DEFUN', 'IF', 'FI', 'LOOP', 'POOL', 'PRINT'}



def is_string_literal(s):
    """
    Recognize string literal tokens.
    Pattern: '"' NON_WHITESPACE_NON_QUOTE+ '"'
    Examples: "555.ABC.#$%!", "ProgroTron", "Be-Happy!"
    Note: Spaces and double quotes are not allowed inside string literals.
    """
    if len(s) < 2:
        return False
    
    # Must start and end with double quotes
    if s[0] != '"' or s[-1] != '"':
        return False
    
    # Must have at least one character between quotes
    if len(s) == 2:
        return False
    
    # Check characters between quotes
    pos = 1
    while pos < len(s) - 1:
        # No spaces or double quotes allowed
        if s[pos] == '"' or s[pos].isspace():
            return False
        pos += 1
    
    return True



def is_aircraft_designation(s):
    """
    Recognize aircraft designation tokens.
    Pattern: TYPE[AGJDPL] DIGIT{1,2} MFR[AKMNY] (DIGIT{1,2})? ('-' TYPE)?
    Examples: G5M, J1N1, G10M13-G, A1K2-J, A6M2
    """
    if not s:
        return False
    
    pos = 0
    type_designators = 'AGJDPL'
    mfr_designators = 'AKMNY'
    
    # State 0: Type designator (required)
    if pos >= len(s) or s[pos] not in type_designators:
        return False
    pos += 1
    
    # State 1: Version number - 1 or 2 digits (required)
    if pos >= len(s) or not is_digit(s[pos]):
        return False
    pos += 1
    
    # Optional second digit for version
    if pos < len(s) and is_digit(s[pos]):
        pos += 1
    
    # State 2: Manufacturer designator (required)
    if pos >= len(s) or s[pos] not in mfr_designators:
        return False
    pos += 1
    
    # State 3: End or optional series number or optional suffix
    if pos == len(s):
        return True
    
    # Optional series number - 1 or 2 digits
    if is_digit(s[pos]):
        pos += 1
        # Optional second digit for series
        if pos < len(s) and is_digit(s[pos]):
            pos += 1
    
    # State 4: End or optional suffix
    if pos == len(s):
        return True
    
    # Optional suffix: dash and type designator
    if s[pos] == '-':
        pos += 1
        if pos >= len(s) or s[pos] not in type_designators:
            return False
        pos += 1
    
    # Must have consumed entire string
    return pos == len(s)



def is_phone_number(s):
    """
    Recognize phone number tokens.
    Three formats: ddd.ddd.dddd, (ddd)ddd-dddd, ddd-ddd-dddd
    Examples: 555.923.0100, 101-555-1111, (123)456-7890
    """
    # Format 1: ddd.ddd.dddd (length 12)
    if len(s) == 12 and s[3] == '.' and s[7] == '.':
        if (all(is_digit(s[i]) for i in range(0, 3)) and
            all(is_digit(s[i]) for i in range(4, 7)) and
            all(is_digit(s[i]) for i in range(8, 12))):
            return True
    
    # Format 2: (ddd)ddd-dddd (length 13)
    if len(s) == 13 and s[0] == '(' and s[4] == ')' and s[8] == '-':
        if (all(is_digit(s[i]) for i in range(1, 4)) and
            all(is_digit(s[i]) for i in range(5, 8)) and
            all(is_digit(s[i]) for i in range(9, 13))):
            return True
    
    # Format 3: ddd-ddd-dddd (length 12)
    if len(s) == 12 and s[3] == '-' and s[7] == '-':
        if (all(is_digit(s[i]) for i in range(0, 3)) and
            all(is_digit(s[i]) for i in range(4, 7)) and
            all(is_digit(s[i]) for i in range(8, 12))):
            return True
    
    return False



def is_identifier(s):
    """
    Recognize identifier tokens.
    Pattern: LETTER (LETTER|DIGIT|'_')*
    Examples: x, size, name, p3, r_val
    Note: Must not be a keyword, hexadecimal, character literal, or aircraft designation.
    """
    if not s:
        return False
    
    # Must start with a letter
    if not is_letter(s[0]):
        return False
    
    # Check remaining characters
    pos = 1
    while pos < len(s):
        if not (is_letter(s[pos]) or is_digit(s[pos]) or s[pos] == '_'):
            return False
        pos += 1
    
    return True



# ============================================================================
# TOKEN CLASSIFICATION
# ============================================================================

def classify_token(token):
    """
    Classify a token by applying recognition functions in priority order.
    
    Priority order (from highest to lowest):
    1. Keyword
    2. Character literal
    3. Hexadecimal
    4. Aircraft designation
    5. Phone number
    6. Scientific
    7. Decimal
    8. Integer
    9. String literal
    10. Identifier
    11. INVALID!
    """
    # Check keyword first (highest priority)
    if is_keyword(token):
        return "Keyword"
    
    # Check character literal (can overlap with identifier)
    if is_character_literal(token):
        return "Character"
    
    # Check hexadecimal (can overlap with identifier)
    if is_hexadecimal(token):
        return "Hexadecimal"
    
    # Check aircraft designation (can overlap with identifier)
    if is_aircraft_designation(token):
        return "Aircraft"
    
    # Check phone number (structurally distinct)
    if is_phone_number(token):
        return "Phone"
    
    # Check scientific (must be before decimal and integer)
    if is_scientific(token):
        return "Scientific"
    
    # Check decimal (must be before integer)
    if is_decimal(token):
        return "Decimal"
    
    # Check integer
    if is_integer(token):
        return "Integer"
    
    # Check string literal
    if is_string_literal(token):
        return "String"
    
    # Check identifier (fallback for valid names)
    if is_identifier(token):
        return "Identifier"
    
    # No match found
    return "INVALID!"



# ============================================================================
# MAIN FUNCTION
# ============================================================================

def main():
    """
    Main function to process input and classify tokens.
    Reads N from first line, then N tokens, and outputs classifications.
    """
    try:
        # Read number of tokens
        n = int(input())
        print(n)
        
        # Process each token
        for i in range(1, n + 1):
            token = input().strip()
            result = classify_token(token)
            print(f"{i}: {result}")
    
    except (ValueError, EOFError):
        # Handle malformed input gracefully
        pass


if __name__ == "__main__":
    main()
