import sys

def parse_grammar(grammar_str):
    """
    Parses the grammar from a string into a dictionary and a list of non-terminals.
    """
    grammar = {}
    non_terminals = []
    for line in grammar_str.strip().split('\n'):
        if not line:
            continue
        head, body = line.split(' -> ')
        head = head.strip()
        if head not in non_terminals:
            non_terminals.append(head)

        productions = [p.strip().split(' ') for p in body.split(' | ')]
        grammar[head] = productions
    return grammar, non_terminals

def format_grammar(grammar, non_terminals):
    """
    Formats the grammar dictionary back into a string with sorted productions.
    """
    output_lines = []
    for nt in non_terminals:
        if nt in grammar and grammar[nt]:
            sorted_prods = sorted([" ".join(p) for p in grammar[nt]])
            productions_str = " | ".join(sorted_prods)
            output_lines.append(f"{nt} -> {productions_str}")
    return "\n".join(output_lines)

def eliminate_direct_left_recursion(grammar, non_terminal, all_nts, nt_to_index):
    """
    Eliminates direct left recursion for a given non-terminal.
    """
    productions = grammar.get(non_terminal, [])
    recursive_prods = []
    non_recursive_prods = []

    for prod in productions:
        if prod and prod[0] == non_terminal:
            recursive_prods.append(prod[1:])
        else:
            non_recursive_prods.append(prod)

    if not recursive_prods:
        return

    new_nt = non_terminal + "'"
    while new_nt in grammar or new_nt in all_nts:
        new_nt += "'"

    all_nts.insert(all_nts.index(non_terminal) + 1, new_nt)
    if non_terminal in nt_to_index:
        nt_to_index[new_nt] = nt_to_index[non_terminal]

    new_prods_for_nt = []
    if not non_recursive_prods:
        new_prods_for_nt.append([new_nt])
    else:
        for prod in non_recursive_prods:
            if prod == ['empty']:
                new_prods_for_nt.append([new_nt])
            else:
                new_prods_for_nt.append(prod + [new_nt])

    grammar[non_terminal] = new_prods_for_nt

    new_prods_for_new_nt = []
    for prod in recursive_prods:
        new_prods_for_new_nt.append(prod + [new_nt])
    new_prods_for_new_nt.append(['empty'])
    grammar[new_nt] = new_prods_for_new_nt

def eliminate_left_recursion(grammar_str):
    """
    Performs left recursion elimination on a given context-free grammar.
    This version uses an eager substitution strategy to match the sample output.
    """
    grammar, non_terminals = parse_grammar(grammar_str)
    all_nts = list(non_terminals)
    nt_to_index = {nt: i for i, nt in enumerate(non_terminals)}

    for i in range(len(non_terminals)):
        Ai = non_terminals[i]

        prods_to_process = list(grammar.get(Ai, []))
        final_prods_for_Ai = []

        expansion_count = 0
        max_expansions = 500

        while prods_to_process and expansion_count < max_expansions:
            expansion_count += 1
            prod = prods_to_process.pop(0)
            first_sym = prod[0]

            is_substitutable = False
            if first_sym in nt_to_index and nt_to_index.get(first_sym, i) < i:
                is_substitutable = True

            if is_substitutable:
                for subst_prod in grammar.get(first_sym, []):
                    if subst_prod == ['empty']:
                        new_prod = prod[1:]
                        if not new_prod:
                            new_prod = ['empty']
                    else:
                        new_prod = list(subst_prod) + prod[1:]
                    prods_to_process.insert(0, new_prod)
            else:
                final_prods_for_Ai.append(prod)

        if expansion_count >= max_expansions:
            final_prods_for_Ai.extend(prods_to_process)

        grammar[Ai] = final_prods_for_Ai

        eliminate_direct_left_recursion(grammar, Ai, all_nts, nt_to_index)

    return format_grammar(grammar, all_nts)

if __name__ == '__main__':
    input_grammar = sys.stdin.read()
    output_grammar = eliminate_left_recursion(input_grammar)
    print(output_grammar)
