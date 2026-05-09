# Emoji Hostage Bot

A Discord bot for encoding plain text into a sequence of emojis, and decoding it back. Perfect for games like "Hostage" where you can only communicate with your driver using emojis!

## Prerequisites

- Python 3.8 or higher installed on your system.
- A Discord account.

## Step 1: Create the Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click the **"New Application"** button in the top right.
3. Give your application a name (e.g., "Hostage Emoji Bot") and click **"Create"**.
4. In the left sidebar, click on **"Bot"**.
5. Click **"Add Bot"** (or "Reset Token" if the bot was already created) and copy the **Bot Token**. *Keep this secret! Never share it with anyone.*

## Step 2: Invite the Bot to Your Server

1. In the Developer Portal, go to **"OAuth2" -> "URL Generator"** in the left sidebar.
2. Under "Scopes", check the box for `bot` and `applications.commands`.
3. Under "Bot Permissions", you generally just need:
   - `Send Messages`
   - `Use Slash Commands`
4. Copy the generated URL at the bottom of the page.
5. Paste the URL into your web browser, select the server you want to invite the bot to, and click **"Authorize"**.

## Step 3: Local Setup

### Linux Setup

1. Open your terminal.
2. Navigate to the project folder (`emoji-hostage-bot`).
3. (Optional but recommended) Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file in the same directory as `bot.py` and add your bot token:
   ```bash
   echo "DISCORD_TOKEN=your_bot_token_here" > .env
   ```
   *(Replace `your_bot_token_here` with the token you copied earlier).*
6. Run the bot:
   ```bash
   python3 bot.py
   ```

### Windows Setup

1. Open Command Prompt or PowerShell.
2. Navigate to the project folder (`emoji-hostage-bot`).
3. (Optional but recommended) Create a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
5. Create a file named `.env` in the same directory as `bot.py`. Open it with Notepad and add this single line:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```
   *(Replace `your_bot_token_here` with the token you copied earlier).*
6. Run the bot:
   ```cmd
   python bot.py
   ```

## Usage

Once the bot is running, it will automatically sync its slash commands to your server (this might take a few minutes the first time).

You can use the following commands in any channel the bot has access to:

- `/encode text:"Your message here" public:False`
  - Encodes your text into emojis.
  - If `public` is False (the default), only you will see the emojis (ephemeral message).
  - If `public` is True, the bot will post the emojis publicly in the channel.

- `/decode emojis:"🍎🍌🍓..." public:False`
  - Decodes the emojis back into plain text.
  - If `public` is False, only you will see the decoded text.
  - If `public` is True, everyone will see the decoded text.

### How to use it in the game:
1. The **Runner** types `/encode text:"We are at 5th and Main"` and gets an ephemeral (private) message back with emojis.
2. The **Runner** copies those emojis and pastes them into the chat for the driver.
3. The **Driver** copies the emojis from chat, types `/decode emojis:"[pastes emojis here]"`, and reads the private decoded text!