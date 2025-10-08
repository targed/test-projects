# Jules
# Lexical Analyzer for PUCK-25.3

import sys

# Helper functions
def is_digit(char):
    return '0' <= char <= '9'

def is_hex_digit(char):
    return is_digit(char) or 'A' <= char.upper() <= 'F'

def is_letter(char):
    return 'A' <= char.upper() <= 'Z'

# Token recognition functions

def is_keyword(s):
    return s in ['DEFUN', 'IF', 'FI', 'LOOP', 'POOL', 'PRINT']

def is_integer(s):
    if not s: return False
    stepplus = 0
    if s[0] in "+-":
        stepplus += 1
    if stepplus == len(s): return False
    start_digits = stepplus
    while stepplus < len(s):
        if not is_digit(s[stepplus]):
            return False
        stepplus += 1
    return stepplus > start_digits

def is_decimal(s):
    if not s: return False
    stepplus = 0
    if s[0] in "+-":
        stepplus += 1

    start_integer = stepplus
    while stepplus < len(s) and is_digit(s[stepplus]):
        stepplus += 1
    if stepplus == start_integer: return False

    if stepplus == len(s) or s[stepplus] != '.': return False
    stepplus += 1

    start_fraction = stepplus
    while stepplus < len(s) and is_digit(s[stepplus]):
        stepplus += 1
    if stepplus == start_fraction: return False

    return stepplus == len(s)

def is_scientific(s):
    if 'E' not in s: return False
    parts = s.split('E')
    if len(parts) != 2: return False

    decimal_part, exponent_part = parts
    if not is_decimal(decimal_part): return False

    if not exponent_part: return False

    stepplus = 0
    if exponent_part[0] in "+-":
        stepplus += 1

    if stepplus == len(exponent_part): return False

    is_all_zeros = True
    start_exp_digits = stepplus
    while stepplus < len(exponent_part):
        if not is_digit(exponent_part[stepplus]): return False
        if exponent_part[stepplus] != '0':
            is_all_zeros = False
        stepplus += 1

    if stepplus == start_exp_digits: return False

    return not is_all_zeros

def is_hexadecimal(s):
    if not s or s[-1].upper() != 'H': return False
    if len(s) == 1: return False
    stepplus = 0
    while stepplus < len(s) - 1:
        if not is_hex_digit(s[stepplus]):
            return False
        stepplus += 1
    return True

def is_character_literal(s):
    if len(s) != 3: return False
    if s[-1].upper() != 'X': return False
    if not is_hex_digit(s[0]) or not is_hex_digit(s[1]):
        return False
    stepplus = 3
    return True

def is_string_literal(s):
    if len(s) < 2 or s[0] != '"' or s[-1] != '"':
        return False
    stepplus = 1
    while stepplus < len(s) - 1:
        if s[stepplus] == '"' or s[stepplus].isspace():
            return False
        stepplus += 1
    return True

def is_aircraft_designation(s):
    stepplus = 0
    if not s: return False

    type_designators = "AGJDPL"
    mfr_designators = "AKMNY"

    if stepplus >= len(s) or s[stepplus] not in type_designators: return False
    stepplus += 1

    if stepplus >= len(s) or not is_digit(s[stepplus]): return False
    stepplus += 1
    if stepplus < len(s) and is_digit(s[stepplus]):
        stepplus += 1

    if stepplus >= len(s) or s[stepplus] not in mfr_designators: return False
    stepplus += 1

    if stepplus == len(s): return True

    if is_digit(s[stepplus]):
        stepplus += 1
        if stepplus < len(s) and is_digit(s[stepplus]):
            stepplus += 1

    if stepplus == len(s): return True

    if s[stepplus] == '-':
        stepplus += 1
        if stepplus >= len(s) or s[stepplus] not in type_designators: return False
        stepplus += 1

    return stepplus == len(s)

def is_phone_number(s):
    # ddd.ddd.dddd
    if len(s) == 12 and s[3] == '.' and s[7] == '.':
        parts = s.split('.')
        if len(parts) == 3 and len(parts[0]) == 3 and len(parts[1]) == 3 and len(parts[2]) == 4:
            if all(is_digit(c) for c in parts[0]) and \
               all(is_digit(c) for c in parts[1]) and \
               all(is_digit(c) for c in parts[2]):
                return True
    # (ddd)ddd-dddd
    if len(s) == 13 and s[0] == '(' and s[4] == ')' and s[8] == '-':
        if all(is_digit(c) for c in s[1:4]) and \
           all(is_digit(c) for c in s[5:8]) and \
           all(is_digit(c) for c in s[9:13]):
            return True
    # ddd-ddd-dddd
    if len(s) == 12 and s[3] == '-' and s[7] == '-':
        parts = s.split('-')
        if len(parts) == 3 and len(parts[0]) == 3 and len(parts[1]) == 3 and len(parts[2]) == 4:
            if all(is_digit(c) for c in parts[0]) and \
               all(is_digit(c) for c in parts[1]) and \
               all(is_digit(c) for c in parts[2]):
                return True
    return False

def is_identifier(s):
    if not s: return False
    if not is_letter(s[0]): return False
    stepplus = 1
    while stepplus < len(s):
        if not (is_letter(s[stepplus]) or is_digit(s[stepplus]) or s[stepplus] == '_'):
            return False
        stepplus += 1
    return True

def classify_token(token):
    if is_keyword(token):
        return "Keyword"
    # The problem statement implies a specific recognition order.
    # Phone numbers are structurally distinct.
    if is_phone_number(token):
        return "Phone"
    if is_string_literal(token):
        return "String"
    # Scientific must be checked before Decimal and Integer to avoid misclassification.
    if is_scientific(token):
        return "Scientific"
    if is_decimal(token):
        return "Decimal"
    if is_integer(token):
        return "Integer"
    # Hexadecimal, Character Literals, and Aircraft Designations can overlap with Identifiers
    # so they need to be checked first.
    if is_hexadecimal(token):
        return "Hexadecimal"
    if is_character_literal(token):
        return "Character"
    if is_aircraft_designation(token):
        return "Aircraft"
    # An identifier is the fallback for name-like tokens that are not keywords etc.
    if is_identifier(token):
        return "Identifier"
    return "INVALID!"

def main():
    try:
        num_lines_str = sys.stdin.readline()
        if not num_lines_str.strip():
            return
        num_lines = int(num_lines_str)
        print(num_lines)
        # Read all lines at once and strip them
        lines = [line.strip() for line in sys.stdin.readlines()]
        # Process only the number of lines specified
        for i, line in enumerate(lines[:num_lines]):
            if line: # Process only non-empty lines
                result = classify_token(line)
                print(f"{i+1}: {result}")
    except (ValueError, IndexError):
        # As per spec, assume input is well-formed.
        pass

if __name__ == "__main__":
    main()