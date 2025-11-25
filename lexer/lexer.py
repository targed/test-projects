# Author: Luke Kaiser

import sys

def is_digit(char):
    return '0' <= char <= '9'

def is_hex_digit(char):
    return is_digit(char) or ('A' <= char <= 'F')

def is_letter(char):
    return 'A' <= char.upper() <= 'Z'

def is_integer(s):
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
    
    return pos > start_digits


def is_decimal(s):
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
    
    return pos == len(s)



def is_scientific(s):
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
    return s in {'DEFUN', 'IF', 'FI', 'LOOP', 'POOL', 'PRINT'}

def is_string_literal(s):
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
    
    # dash and type designator
    if s[pos] == '-':
        pos += 1
        if pos >= len(s) or s[pos] not in type_designators:
            return False
        pos += 1
    
    return pos == len(s)

def is_phone_number(s):
    # ddd.ddd.dddd
    if len(s) == 12 and s[3] == '.' and s[7] == '.':
        if (all(is_digit(s[i]) for i in range(0, 3)) and
            all(is_digit(s[i]) for i in range(4, 7)) and
            all(is_digit(s[i]) for i in range(8, 12))):
            return True
    
    # (ddd)ddd-dddd
    if len(s) == 13 and s[0] == '(' and s[4] == ')' and s[8] == '-':
        if (all(is_digit(s[i]) for i in range(1, 4)) and
            all(is_digit(s[i]) for i in range(5, 8)) and
            all(is_digit(s[i]) for i in range(9, 13))):
            return True
    
    # ddd-ddd-dddd
    if len(s) == 12 and s[3] == '-' and s[7] == '-':
        if (all(is_digit(s[i]) for i in range(0, 3)) and
            all(is_digit(s[i]) for i in range(4, 7)) and
            all(is_digit(s[i]) for i in range(8, 12))):
            return True
    
    return False

def is_identifier(s):
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

def classify_token(token):

    if is_keyword(token):
        return "Keyword"
    
    if is_character_literal(token):
        return "Character"
    
    if is_hexadecimal(token):
        return "Hexadecimal"
    
    if is_aircraft_designation(token):
        return "Aircraft"
    
    if is_phone_number(token):
        return "Phone"
    
    if is_scientific(token):
        return "Scientific"
    
    if is_decimal(token):
        return "Decimal"
    
    if is_integer(token):
        return "Integer"
    
    if is_string_literal(token):
        return "String"
    
    if is_identifier(token):
        return "Identifier"
    
    return "INVALID!"

def main():

    n = int(input())
    print(n)

    for i in range(1, n + 1):
        token = input().strip()
        result = classify_token(token)
        print(f"{i}: {result}")

if __name__ == "__main__":
    main()