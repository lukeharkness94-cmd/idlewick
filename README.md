# Idlewick

A single-player idle RPG where everything is a dashboard. Pick a task, watch the numbers climb, push on to the next town.
Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Run it
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Continue working on it
Read [HANDOFF.md](HANDOFF.md) first. It covers the architecture, the art pipeline, the design rules and the known gaps.
The Playwright test scripts are in `tests/` (they hard-code a path to `index.html` near the top; change it before running).
