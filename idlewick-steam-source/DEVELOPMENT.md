# Working on Idlewick

Edit this checkout's js/, css/ and index.html. The standalone HTML is generated.

Use one preview command, passing the existing playable file as its output:

    python3 scripts/preview.py "/absolute/path/to/Play Idlewick.html"

Open http://127.0.0.1:8765. Refresh after editing. Each refresh rebuilds the same playable file from this checkout. Stop the server with Ctrl+C.

Run engine and save regression checks with:

    node tests/regression.cjs

For each focused change, inspect its normal interaction at desktop and phone widths, check the other theme, and rerun relevant regressions. Keep release summaries short and state any unverified behavior.

Create a ZIP or publish a hosted release when requested. The local preview and standalone file are the everyday development and play workflow.
