/**
 * MathFormat Fixer — index.js
 *
 * Fixes a Logseq parser bug where KaTeX math expressions (e.g. $\sigma_i$)
 * fail to render when wrapped in Markdown modifiers like **bold**, *italic*,
 * # headings, <u>underline</u>, or ~~strikethrough~~.
 *
 * Strategy:
 *   1. A MutationObserver watches the Logseq app DOM from inside the plugin iframe.
 *   2. When new content is painted, we scan for formatting tags that contain
 *      raw, un-rendered $ delimiters.
 *   3. We extract each math segment, optionally wrap it in \boldsymbol{} or
 *      \mathit{} to match the surrounding formatting intent, then call the
 *      KaTeX instance that is already bundled in the parent Logseq window.
 *   4. We replace only the raw text node (not the element) so React's virtual
 *      DOM never notices and hydration errors are avoided.
 */

async function main() {
  console.info("[MathFormat Fixer] Initialised — monitoring DOM for stranded LaTeX.");

  // ─── Configuration ──────────────────────────────────────────────────────────

  // HTML tags produced by Logseq for each Markdown modifier we want to fix.
  const TARGET_TAGS = [
    "STRONG", "B",          // **bold**
    "EM",     "I",          // *italic*
    "U",                    // <u>underline</u> / ^^highlight^^
    "S",      "DEL",        // ~~strikethrough~~
    "H1", "H2", "H3",       // # ## ###
    "H4", "H5", "H6",       // #### ##### ######
    "MARK",                 // some Logseq highlight implementations
  ];

  // Tags where math should inherit bold weight → wrap in \boldsymbol{}
  const BOLD_TAGS = new Set(["STRONG", "B", "H1", "H2", "H3", "H4", "H5", "H6"]);

  // Tags where math should be explicitly italicised → wrap in \mathit{}
  const ITALIC_TAGS = new Set(["EM", "I"]);

  // Tags where the wrapper span should inherit text-decoration (underline / strikethrough)
  const DECORATION_TAGS = new Set(["U", "S", "DEL", "MARK"]);

  // Debounce delay in ms — keeps CPU usage low during fast typing
  const DEBOUNCE_MS = 200;

  // Matches $...$ (inline) and $$...$$ (block), non-greedy, no empty content
  // Handles the case where Logseq may already have partially escaped the string.
  const MATH_REGEX = /(\$\$?)([^$\n]+?)\1/g;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Wraps a raw LaTeX string with typographic commands appropriate for
   * the HTML tag that is its ancestor.
   */
  function applyContextualTypography(rawMath, tagName) {
    if (BOLD_TAGS.has(tagName)) {
      return `\\boldsymbol{${rawMath}}`;
    }
    if (ITALIC_TAGS.has(tagName)) {
      return `\\mathit{${rawMath}}`;
    }
    return rawMath;
  }

  /**
   * Render one math string via the KaTeX instance bundled with Logseq.
   * Returns the original match string unchanged on failure so the user
   * always sees *something* rather than a blank.
   */
  function renderMath(mathContent, isBlock) {
    try {
      const katex = parent.window.katex;
      if (!katex) return null; // KaTeX not available yet — will retry next mutation
      return katex.renderToString(mathContent, {
        throwOnError: false,
        displayMode: isBlock,
        output: "html",
      });
    } catch (err) {
      console.warn("[MathFormat Fixer] KaTeX error:", err.message);
      return null;
    }
  }

  // ─── Core DOM processor ────────────────────────────────────────────────────

  function processStrandedMath() {
    const appContainer = parent.document.getElementById("app-container");
    if (!appContainer) return;

    for (const tagName of TARGET_TAGS) {
      const elements = appContainer.getElementsByTagName(tagName);

      // getElementsByTagName returns a live HTMLCollection — snapshot it
      // before iterating because our DOM writes can shift the collection.
      const snapshot = Array.from(elements);

      for (const el of snapshot) {
        // Skip elements we already fixed
        if (el.dataset.mathFixed === "true") continue;

        // Quick bail-out: no $ → nothing to do
        if (!el.innerHTML.includes("$")) {
          el.dataset.mathFixed = "true";
          continue;
        }

        // Use TreeWalker to get only leaf text nodes.
        // This keeps us away from elements React is tracking.
        const walker = parent.document.createTreeWalker(
          el,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const nodesToProcess = [];
        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes("$")) {
            nodesToProcess.push(node);
          }
        }

        let didFix = false;

        for (const textNode of nodesToProcess) {
          const raw = textNode.nodeValue;

          // Reset regex lastIndex before use
          MATH_REGEX.lastIndex = 0;
          if (!MATH_REGEX.test(raw)) continue;

          // Build a replacement node by splitting the text into
          // math segments and plain-text segments.
          const container = parent.document.createElement("span");
          container.className = "math-fixed-container";
          if (DECORATION_TAGS.has(tagName)) {
            container.style.textDecoration = "inherit";
          }

          let lastIndex = 0;
          MATH_REGEX.lastIndex = 0;
          let match;

          while ((match = MATH_REGEX.exec(raw)) !== null) {
            const [fullMatch, delim, mathContent] = match;
            const matchStart = match.index;

            // Append any plain text that came before this math span
            if (matchStart > lastIndex) {
              container.appendChild(
                parent.document.createTextNode(raw.slice(lastIndex, matchStart))
              );
            }

            const isBlock = delim === "$$";
            const styledMath = applyContextualTypography(mathContent.trim(), tagName);
            const rendered = renderMath(styledMath, isBlock);

            if (rendered) {
              const mathSpan = parent.document.createElement("span");
              mathSpan.className = "math-fixed-math";
              mathSpan.dataset.mathFixed = "true";
              // innerHTML is safe here: we wrote the HTML ourselves via katex.renderToString
              mathSpan.innerHTML = rendered;
              container.appendChild(mathSpan);
            } else {
              // KaTeX unavailable — keep original text, we'll retry on next mutation
              container.appendChild(parent.document.createTextNode(fullMatch));
            }

            lastIndex = matchStart + fullMatch.length;
          }

          // Append any trailing plain text after the last math span
          if (lastIndex < raw.length) {
            container.appendChild(
              parent.document.createTextNode(raw.slice(lastIndex))
            );
          }

          // Swap the raw text node for our processed container.
          // Using replaceChild on the *parent* of the text node is the
          // correct way to avoid triggering React hydration mismatches.
          textNode.parentNode.replaceChild(container, textNode);
          didFix = true;
        }

        if (didFix) {
          el.dataset.mathFixed = "true";
        }
      }
    }
  }

  // ─── MutationObserver setup ────────────────────────────────────────────────

  let debounceTimer = null;

  const observer = new MutationObserver((mutations) => {
    // Only act if the change touched a content or editor area
    let relevant = false;
    for (const mutation of mutations) {
      const cls = mutation.target.className;
      if (
        typeof cls === "string" &&
        (cls.includes("block-content") ||
          cls.includes("editor-inner") ||
          cls.includes("ls-block") ||
          cls.includes("page-blocks-inner"))
      ) {
        relevant = true;
        break;
      }
      // Also act if an element with a target tag was added directly
      if (mutation.addedNodes.length) {
        relevant = true;
        break;
      }
    }

    if (!relevant) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processStrandedMath, DEBOUNCE_MS);
  });

  // Wait briefly for Logseq to finish painting its initial UI
  setTimeout(() => {
    const targetNode = parent.document.getElementById("app-container");

    if (!targetNode) {
      console.warn(
        "[MathFormat Fixer] Could not find #app-container. " +
          "The plugin will not run. Check that Logseq has finished loading."
      );
      return;
    }

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Run once immediately to fix anything already on screen
    processStrandedMath();

    console.info("[MathFormat Fixer] Observer attached to #app-container.");
  }, 1500);
}

// ─── Bootstrap via the official Logseq plugin lifecycle hook ─────────────────
logseq.ready(main).catch(console.error);
