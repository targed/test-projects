# MathFormat Fixer — Logseq Plugin

Fixes a long-standing Logseq parser bug where KaTeX math expressions
**fail to render** when they are placed inside Markdown formatting modifiers.

## The Problem

Logseq uses two separate parsing passes: one for Markdown, one for LaTeX.
Because Markdown is processed first and the math renderer does not look
inside already-formatted nodes, anything like this breaks:

| Syntax you type               | What Logseq shows (broken)          |
|-------------------------------|-------------------------------------|
| `**Variance ($\sigma_i$):**`  | **Variance ($\sigma_i$):** (raw)    |
| `*Energy ($E = mc^2$)*`       | *Energy ($E = mc^2$)* (raw)         |
| `# Heading ($\mu$)`           | # Heading ($\mu$) (raw)             |
| `<u>See ($\alpha$)</u>`       | underlined raw text                 |
| `~~old ($\beta$)~~`           | struck-through raw text             |

## The Fix

This plugin attaches a `MutationObserver` to the Logseq DOM. Every time
Logseq repaints a block, the plugin scans for unrendered `$...$` / `$$...$$`
sequences inside formatting tags, calls the KaTeX engine that is already
bundled in Logseq, and swaps in the rendered math — all within ~200 ms and
invisible to the user.

Bold/header math is automatically wrapped in `\boldsymbol{}` so the symbol
visually matches the surrounding bold text. Italic math is wrapped in
`\mathit{}`. Underline and strikethrough styling is inherited automatically.

---

## Installation (no Node.js / build tools needed)

### Step 1 — Enable Developer Mode in Logseq

1. Open Logseq.
2. Go to **Settings** (gear icon, bottom-left).
3. Click the **Advanced** tab.
4. Toggle **Developer mode** ON.
5. **Restart Logseq** fully (quit and reopen).

### Step 2 — Copy the plugin folder to your computer

Put the folder `logseq-mathformat-fixer/` (the one containing `package.json`,
`index.html`, `index.js`, and `icon.svg`) somewhere permanent on your machine.

Good locations:
- `~/Documents/logseq-plugins/logseq-mathformat-fixer/`  (Mac/Linux)
- `C:\Users\YourName\Documents\logseq-plugins\logseq-mathformat-fixer\` (Windows)

**Do not move or rename the folder after installing.**

### Step 3 — Load the plugin in Logseq

1. Open Logseq.
2. Click the **three-dot menu** (top-right) → **Plugins**, OR press `t p`.
3. Click **Load unpacked plugin** (top-right of the Plugins panel).
4. In the file browser, select the **`logseq-mathformat-fixer` folder** itself
   (the folder, not any file inside it).
5. The plugin will appear in the list as **MathFormat Fixer** with a ✓.

---

## Verifying it works

Type this into any Logseq block and press Enter:

```
**Dynamic Variance ($\sigma_i$):**
```

Within a fraction of a second the sigma symbol should render properly in bold.
Try the same with italics, a heading, `<u>underline</u>`, and `~~strikethrough~~`.

If it does **not** work:

1. Open the developer console: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac).
2. Check the Console tab for any messages starting with `[MathFormat Fixer]`.
3. If you see `Could not find #app-container`, wait until Logseq has fully loaded
   the graph and try refreshing the page (`r` shortcut in Logseq).

---

## Supported modifiers

| Markdown syntax             | HTML tag fixed | Bold math?          |
|-----------------------------|----------------|---------------------|
| `**bold**` / `__bold__`     | `<strong>` `<b>` | ✅ `\boldsymbol{}`  |
| `*italic*` / `_italic_`     | `<em>` `<i>`   | Uses `\mathit{}`    |
| `# H1` … `###### H6`        | `<h1>`–`<h6>`  | ✅ `\boldsymbol{}`  |
| `<u>underline</u>`          | `<u>`          | Inherits decoration |
| `^^highlight^^`             | `<mark>`       | Inherits decoration |
| `~~strikethrough~~`         | `<s>` `<del>`  | Inherits decoration |

---

## Uninstalling

Open **Plugins** → find **MathFormat Fixer** → click the **trash icon** or toggle
it off. No files outside the plugin folder are modified.

---

## Notes & limitations

- The plugin runs entirely client-side inside Logseq's sandboxed iframe; it does
  not send any data anywhere.
- It is a *post-processing* fix. The underlying Logseq parser bug still exists;
  the plugin corrects the visual output after the fact.
- If a future Logseq update renames the CSS class `block-content` or the DOM
  element `app-container`, the observer may stop triggering. Open an issue and
  the class names in `index.js` can be updated.
- PDF export and printed output will reflect the rendered math as long as you
  are exporting from within Logseq with the plugin active.
