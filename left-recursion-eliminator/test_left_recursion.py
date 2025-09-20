import unittest
from left_recursion import eliminate_left_recursion

def normalize_grammar(grammar_str):
    """Normalizes grammar string for comparison by sorting rules and productions."""
    rules = grammar_str.strip().split('\n')
    normalized_rules = []
    for rule in rules:
        if ' -> ' not in rule:
            continue
        head, body = rule.split(' -> ')
        productions = sorted([p.strip() for p in body.split(' | ')])
        normalized_rules.append(f"{head} -> {' | '.join(productions)}")
    return "\n".join(sorted(normalized_rules))

class TestLeftRecursion(unittest.TestCase):

    def test_direct_recursion_only(self):
        input_grammar = "A -> A a | b"
        expected_output = """
A -> b A'
A' -> a A' | empty
""".strip()
        actual_output = eliminate_left_recursion(input_grammar)
        self.assertEqual(normalize_grammar(actual_output), normalize_grammar(expected_output))

    def test_no_recursion(self):
        input_grammar = "S -> a b | c"
        expected_output = "S -> a b | c"
        actual_output = eliminate_left_recursion(input_grammar)
        self.assertEqual(normalize_grammar(actual_output), normalize_grammar(expected_output))

    def test_indirect_recursion_simple(self):
        input_grammar = """
A -> B a | c
B -> A b | d
""".strip()
        # With eager substitution, A will be substituted into B.
        # B -> (B a | c) b | d => B -> B a b | c b | d
        # Then direct LR is eliminated on B.
        expected_output = """
A -> B a | c
B -> c b B' | d B'
B' -> a b B' | empty
""".strip()
        actual_output = eliminate_left_recursion(input_grammar)
        self.assertEqual(normalize_grammar(actual_output), normalize_grammar(expected_output))

    def test_empty_production_handling(self):
        input_grammar = "A -> A a | empty"
        expected_output = """
A -> A'
A' -> a A' | empty
""".strip()
        actual_output = eliminate_left_recursion(input_grammar)
        self.assertEqual(normalize_grammar(actual_output), normalize_grammar(expected_output))

    def test_sample_case_from_prompt(self):
        input_grammar = """
S -> a A | S c
A -> A B b | A d | empty
B -> A d | S c
""".strip()
        # This is the expected output from the problem description,
        # which requires an eager substitution strategy.
        expected_output = """
S -> a A S'
S' -> c S' | empty
A -> A'
A' -> B b A' | d A' | empty
B -> a A S' c B' | d A' d B' | d B'
B' -> b A' d B' | empty
""".strip()
        actual_output = eliminate_left_recursion(input_grammar)
        self.assertEqual(normalize_grammar(actual_output), normalize_grammar(expected_output))


if __name__ == '__main__':
    unittest.main()
