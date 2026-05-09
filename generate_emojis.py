import unicodedata

emojis = []
# Blocks to check:
# Emoticons (1F600–1F64F)
# Miscellaneous Symbols and Pictographs (1F300–1F5FF)
# Transport and Map Symbols (1F680–1F6FF)

ranges = [
    (0x1F600, 0x1F64F),
    (0x1F300, 0x1F5FF),
    (0x1F680, 0x1F6FF)
]

for start, end in ranges:
    for codepoint in range(start, end + 1):
        char = chr(codepoint)
        try:
            name = unicodedata.name(char)
            # Skip variations and complex things if any
            emojis.append(char)
            if len(emojis) == 256:
                break
        except ValueError:
            pass
    if len(emojis) == 256:
        break

print(f"Generated {len(emojis)} emojis.")
with open("emoji-hostage-bot/crypto.py", "w") as f:
    f.write('EMOJI_LIST = [\n    ')
    f.write(', '.join(f'"{e}"' for e in emojis))
    f.write('\n]\n\n')

    f.write('''
def encode_text_to_emojis(text: str) -> str:
    """Encodes a utf-8 string into a sequence of emojis."""
    if not text:
        return ""
    bytes_data = text.encode('utf-8')
    return "".join(EMOJI_LIST[b] for b in bytes_data)

def decode_emojis_to_text(emojis: str) -> str:
    """Decodes a sequence of emojis back into a utf-8 string."""
    if not emojis:
        return ""

    emoji_to_byte = {e: i for i, e in enumerate(EMOJI_LIST)}

    byte_array = bytearray()
    for char in emojis:
        if char in emoji_to_byte:
            byte_array.append(emoji_to_byte[char])
        else:
            # Skip invalid characters (like spaces added by discord, or newlines)
            pass

    try:
        return byte_array.decode('utf-8')
    except UnicodeDecodeError:
        return "Error: Could not decode emojis back to text. Invalid sequence."
''')
