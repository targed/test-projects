"""
Unit tests for PUCK-25.3 Lexical Analyzer
"""

import unittest
from lexer import (
    is_digit, is_hex_digit, is_letter,
    is_integer, is_decimal, is_scientific, is_hexadecimal, is_character_literal,
    is_keyword, is_string_literal, is_aircraft_designation, is_phone_number,
    is_identifier, classify_token
)


class TestHelperFunctions(unittest.TestCase):
    """Test character classification helper functions."""
    
    def test_is_digit(self):
        """Test digit recognition."""
        # Valid digits
        for d in '0123456789':
            self.assertTrue(is_digit(d), f"'{d}' should be a digit")
        
        # Invalid digits
        for c in 'abcABC!@# -+.':
            self.assertFalse(is_digit(c), f"'{c}' should not be a digit")
    
    def test_is_hex_digit(self):
        """Test hexadecimal digit recognition."""
        # Valid hex digits
        for h in '0123456789ABCDEF':
            self.assertTrue(is_hex_digit(h), f"'{h}' should be a hex digit")
        
        # Invalid hex digits (lowercase not allowed per requirements)
        for c in 'ghijGHIJ!@# -+.':
            self.assertFalse(is_hex_digit(c), f"'{c}' should not be a hex digit")
    
    def test_is_letter(self):
        """Test letter recognition (case-insensitive)."""
        # Valid letters (uppercase)
        for l in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
            self.assertTrue(is_letter(l), f"'{l}' should be a letter")
        
        # Valid letters (lowercase)
        for l in 'abcdefghijklmnopqrstuvwxyz':
            self.assertTrue(is_letter(l), f"'{l}' should be a letter")
        
        # Invalid letters
        for c in '0123456789!@# -+._':
            self.assertFalse(is_letter(c), f"'{c}' should not be a letter")


class TestIntegerRecognition(unittest.TestCase):
    """Test integer token recognition."""
    
    def test_valid_integers(self):
        """Test valid integer patterns."""
        valid = ['3', '83462', '-12', '+001', '-1230', '+0', '0', '00', '123']
        for token in valid:
            self.assertTrue(is_integer(token), f"'{token}' should be an Integer")
    
    def test_invalid_integers(self):
        """Test invalid integer patterns."""
        invalid = [
            '',           # Empty string
            '+',          # Sign only
            '-',          # Sign only
            'abc',        # Letters
            '12.34',      # Decimal
            '12E3',       # Scientific
            '12H',        # Hexadecimal
            '+-12',       # Double sign
            '1 2',        # Space
        ]
        for token in invalid:
            self.assertFalse(is_integer(token), f"'{token}' should not be an Integer")


class TestDecimalRecognition(unittest.TestCase):
    """Test decimal number token recognition."""
    
    def test_valid_decimals(self):
        """Test valid decimal patterns."""
        valid = ['3.14', '00.01', '123.0', '-39874.454', '+1.5', '0.0', '12.345']
        for token in valid:
            self.assertTrue(is_decimal(token), f"'{token}' should be a Decimal")
    
    def test_invalid_decimals(self):
        """Test invalid decimal patterns."""
        invalid = [
            '',           # Empty string
            '4.',         # No fractional part
            '.5',         # No integer part
            '12',         # No period
            '12.34.56',   # Multiple periods
            'abc',        # Letters
            '+.',         # Sign and period only
            '-.5',        # No integer part with sign
        ]
        for token in invalid:
            self.assertFalse(is_decimal(token), f"'{token}' should not be a Decimal")


class TestScientificRecognition(unittest.TestCase):
    """Test scientific number token recognition."""
    
    def test_valid_scientific(self):
        """Test valid scientific patterns."""
        valid = ['12.0E4', '1.23E-6', '+234.34E-941', '3.14E1', '0.5E10', '1.0E+5']
        for token in valid:
            self.assertTrue(is_scientific(token), f"'{token}' should be Scientific")
    
    def test_invalid_scientific(self):
        """Test invalid scientific patterns."""
        invalid = [
            '',              # Empty string
            '12.0E0',        # Zero exponent
            '12.0E00',       # Zero exponent with leading zero
            '-1.23E-3.5',    # Decimal in exponent
            '12E4',          # No decimal base
            '12.0',          # No exponent
            '12.0EE4',       # Double E
            '12.0E',         # No exponent value
            '12.0E+',        # Sign but no digits
        ]
        for token in invalid:
            self.assertFalse(is_scientific(token), f"'{token}' should not be Scientific")


class TestHexadecimalRecognition(unittest.TestCase):
    """Test hexadecimal number token recognition."""
    
    def test_valid_hexadecimal(self):
        """Test valid hexadecimal patterns."""
        valid = ['12AD0H', '123H', '1A2B3CH', 'ABCH', '0H', 'FFFFH', 'DEADBEEFH']
        for token in valid:
            self.assertTrue(is_hexadecimal(token), f"'{token}' should be Hexadecimal")
    
    def test_invalid_hexadecimal(self):
        """Test invalid hexadecimal patterns."""
        invalid = [
            '',           # Empty string
            'H',          # No hex digits
            '12',         # No H suffix
            '12GH',       # Invalid hex digit (G)
            'abcH',       # Lowercase (not allowed per requirements)
            '12 H',       # Space
            'GHIJ',       # No H suffix, invalid chars
        ]
        for token in invalid:
            self.assertFalse(is_hexadecimal(token), f"'{token}' should not be Hexadecimal")


class TestCharacterLiteralRecognition(unittest.TestCase):
    """Test character literal token recognition."""
    
    def test_valid_character_literals(self):
        """Test valid character literal patterns."""
        valid = ['12X', 'AFX', 'FFX', '00X', 'A1X', 'F0X']
        for token in valid:
            self.assertTrue(is_character_literal(token), f"'{token}' should be Character literal")
    
    def test_invalid_character_literals(self):
        """Test invalid character literal patterns."""
        invalid = [
            '',           # Empty string
            'X',          # Too short
            '1X',         # Only one hex digit
            '123X',       # Too long
            'GGX',        # Invalid hex digits
            'abX',        # Lowercase (not allowed)
            '12Y',        # Wrong suffix
            '12 X',       # Space
        ]
        for token in invalid:
            self.assertFalse(is_character_literal(token), f"'{token}' should not be Character literal")


class TestKeywordRecognition(unittest.TestCase):
    """Test keyword token recognition."""
    
    def test_valid_keywords(self):
        """Test all valid keywords."""
        valid = ['DEFUN', 'IF', 'FI', 'LOOP', 'POOL', 'PRINT']
        for token in valid:
            self.assertTrue(is_keyword(token), f"'{token}' should be a Keyword")
    
    def test_invalid_keywords(self):
        """Test invalid keyword patterns."""
        invalid = [
            '',           # Empty string
            'defun',      # Lowercase
            'If',         # Mixed case
            'WHILE',      # Not a keyword
            'LOOPS',      # Similar but not exact
            'PRINT ',     # Trailing space
            ' PRINT',     # Leading space
        ]
        for token in invalid:
            self.assertFalse(is_keyword(token), f"'{token}' should not be a Keyword")


class TestStringLiteralRecognition(unittest.TestCase):
    """Test string literal token recognition."""
    
    def test_valid_string_literals(self):
        """Test valid string literal patterns."""
        valid = ['"555.ABC.#$%!"', '"ProgroTron"', '"Be-Happy!"', '"for4"', '"123"', '"a"']
        for token in valid:
            self.assertTrue(is_string_literal(token), f"'{token}' should be a String literal")
    
    def test_invalid_string_literals(self):
        """Test invalid string literal patterns."""
        invalid = [
            '',           # Empty string
            '""',         # Empty quotes
            '"',          # Single quote
            'abc',        # No quotes
            '"dummy',     # Missing closing quote
            '"hello world"',  # Contains space
            '"say"hi"',   # Internal quote
            '" "',        # Just a space
        ]
        for token in invalid:
            self.assertFalse(is_string_literal(token), f"'{token}' should not be a String literal")


class TestAircraftDesignationRecognition(unittest.TestCase):
    """Test aircraft designation token recognition."""
    
    def test_valid_aircraft_designations(self):
        """Test valid aircraft designation patterns."""
        valid = ['G5M', 'J1N1', 'G10M13-G', 'A1K2-J', 'A6M2', 'D3Y2-L', 'P1A', 'L99N99-A']
        for token in valid:
            self.assertTrue(is_aircraft_designation(token), f"'{token}' should be Aircraft designation")
    
    def test_invalid_aircraft_designations(self):
        """Test invalid aircraft designation patterns."""
        invalid = [
            '',           # Empty string
            'G5',         # Missing manufacturer
            'G5X',        # Invalid manufacturer
            'X5M',        # Invalid type
            'G5M-',       # Dash without type
            'G5M-X',      # Invalid suffix type
            'G123M',      # Too many version digits
            'G5M123',     # Too many series digits
            'A1X',        # This is a character literal, not aircraft
        ]
        for token in invalid:
            self.assertFalse(is_aircraft_designation(token), f"'{token}' should not be Aircraft designation")


class TestPhoneNumberRecognition(unittest.TestCase):
    """Test phone number token recognition."""
    
    def test_valid_phone_numbers(self):
        """Test valid phone number patterns."""
        valid = [
            '555.923.0100',    # Format 1
            '101-555-1111',    # Format 3
            '(123)456-7890',   # Format 2
            '000.000.0000',    # All zeros
            '(111)111-1111',   # All ones
        ]
        for token in valid:
            self.assertTrue(is_phone_number(token), f"'{token}' should be a Phone number")
    
    def test_invalid_phone_numbers(self):
        """Test invalid phone number patterns."""
        invalid = [
            '',                # Empty string
            '123.5.6',         # Too short
            '555-923-01000',   # Too many digits
            '555.923-0100',    # Mixed separators
            '(555-923-0100',   # Wrong format
            '555)923-0100',    # Wrong format
            'abc.def.ghij',    # Letters
            '12.345.6789',     # Wrong digit distribution
        ]
        for token in invalid:
            self.assertFalse(is_phone_number(token), f"'{token}' should not be a Phone number")


class TestIdentifierRecognition(unittest.TestCase):
    """Test identifier token recognition."""
    
    def test_valid_identifiers(self):
        """Test valid identifier patterns."""
        valid = ['x', 'size', 'name', 'p3', 'r_val', 'WHILE', 'FFFF', 'myVar123', 'test_var']
        for token in valid:
            self.assertTrue(is_identifier(token), f"'{token}' should be an Identifier")
    
    def test_invalid_identifiers(self):
        """Test invalid identifier patterns."""
        invalid = [
            '',           # Empty string
            '3dfx',       # Starts with digit
            '_var',       # Starts with underscore
            'my-var',     # Contains dash
            'my var',     # Contains space
            '123',        # All digits
        ]
        for token in invalid:
            self.assertFalse(is_identifier(token), f"'{token}' should not be an Identifier")


class TestTokenClassification(unittest.TestCase):
    """Test token classification with priority ordering."""
    
    def test_priority_keyword_over_identifier(self):
        """Keywords should be classified as Keyword, not Identifier."""
        self.assertEqual(classify_token('LOOP'), 'Keyword')
        self.assertEqual(classify_token('IF'), 'Keyword')
        self.assertEqual(classify_token('PRINT'), 'Keyword')
    
    def test_priority_hexadecimal_over_identifier(self):
        """Hexadecimal should be classified before Identifier."""
        self.assertEqual(classify_token('ABCH'), 'Hexadecimal')
        self.assertEqual(classify_token('FFFF'), 'Identifier')  # No H suffix
    
    def test_priority_character_over_identifier(self):
        """Character literals should be classified before Identifier."""
        self.assertEqual(classify_token('A1X'), 'Character')
        self.assertEqual(classify_token('FFX'), 'Character')
    
    def test_priority_aircraft_over_identifier(self):
        """Aircraft designations should be classified before Identifier."""
        self.assertEqual(classify_token('D3Y2-L'), 'Aircraft')
        self.assertEqual(classify_token('G5M'), 'Aircraft')
    
    def test_priority_scientific_over_decimal(self):
        """Scientific should be classified before Decimal."""
        self.assertEqual(classify_token('+234.34E-941'), 'Scientific')
        self.assertEqual(classify_token('12.0E4'), 'Scientific')
    
    def test_priority_decimal_over_integer(self):
        """Decimal should be classified before Integer."""
        self.assertEqual(classify_token('-39874.454'), 'Decimal')
        self.assertEqual(classify_token('3.14'), 'Decimal')
    
    def test_sample_input_cases(self):
        """Test cases from the sample input."""
        test_cases = [
            ('83462', 'Integer'),
            ('-39874.454', 'Decimal'),
            ('LOOP', 'Keyword'),
            ('ABCH', 'Hexadecimal'),
            ('+234.34E-941', 'Scientific'),
            ('124.235.2345', 'Phone'),
            ('WHILE', 'Identifier'),
            ('-1.23E-3.5', 'INVALID!'),
            ('4.', 'INVALID!'),
            ('+0', 'Integer'),
            ('A1X', 'Character'),
            ('FFFF', 'Identifier'),
            ('"for4"', 'String'),
            ('(111)111-1111', 'Phone'),
            ('3dfx', 'INVALID!'),
            ('D3Y2-L', 'Aircraft'),
            ('"dummy', 'INVALID!'),
            ('123.5.6', 'INVALID!'),
        ]
        for token, expected in test_cases:
            self.assertEqual(classify_token(token), expected, 
                           f"'{token}' should be classified as {expected}")


class TestIntegration(unittest.TestCase):
    """Integration tests using sample input/output."""
    
    def test_grading_input(self):
        """Test with the grading input file."""
        import subprocess
        import os
        
        # Check if grading files exist
        grading_input = 'OLD_CS3500_HW1/gradinginput.txt'
        grading_output = 'OLD_CS3500_HW1/gradingoutput.txt'
        
        if not os.path.exists(grading_input):
            self.skipTest("Grading input file not found")
        
        # Run the lexer with grading input
        with open(grading_input, 'r') as f:
            result = subprocess.run(['python', 'lexer.py'], 
                                  stdin=f, 
                                  capture_output=True, 
                                  text=True)
        
        # Read expected output
        with open(grading_output, 'r') as f:
            expected = f.read()
        
        # Compare outputs
        self.assertEqual(result.stdout, expected, 
                        "Output should match expected grading output")


if __name__ == '__main__':
    unittest.main()
