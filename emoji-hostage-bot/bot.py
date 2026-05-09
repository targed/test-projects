import discord
from discord.ext import commands
from discord import app_commands
import os
from dotenv import load_dotenv
import crypto

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# Intents
intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name} ({bot.user.id})')
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} command(s).")
    except Exception as e:
        print(f"Failed to sync commands: {e}")

@bot.tree.command(name="encode", description="Encodes plain text into emojis.")
@app_commands.describe(
    text="The text to encode",
    public="Whether the response should be visible to everyone (True) or just you (False). Default is False."
)
async def encode(interaction: discord.Interaction, text: str, public: bool = False):
    try:
        encoded_text = crypto.encode_text_to_emojis(text)
        # Discord has a 2000 character limit per message.
        # Since emojis can take up to 4 characters visually but our logic uses 1 character code points mapped to string emojis.
        if len(encoded_text) > 1900:
            await interaction.response.send_message("Text is too long to encode! Try a shorter message.", ephemeral=True)
            return

        await interaction.response.send_message(encoded_text, ephemeral=not public)
    except Exception as e:
        await interaction.response.send_message(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="decode", description="Decodes emojis back into plain text.")
@app_commands.describe(
    emojis="The emoji string to decode",
    public="Whether the response should be visible to everyone (True) or just you (False). Default is False."
)
async def decode(interaction: discord.Interaction, emojis: str, public: bool = False):
    try:
        decoded_text = crypto.decode_emojis_to_text(emojis)
        await interaction.response.send_message(decoded_text, ephemeral=not public)
    except Exception as e:
        await interaction.response.send_message(f"An error occurred: {e}", ephemeral=True)

if __name__ == '__main__':
    if not TOKEN:
        print("Error: DISCORD_TOKEN is not set in the .env file.")
    else:
        bot.run(TOKEN)
