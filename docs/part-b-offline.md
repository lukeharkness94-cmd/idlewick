# Part B · Offline progress and return digest

Away time counts at full speed up to 24 hours. Counted time and the cap are shown in the Task plan, Gameplay settings and the return digest. Continue dismisses the digest and leaves a surviving task running. A task that stopped for lack of materials gives its actual stop time and missing ingredient.

The return digest shows combined XP and coins first, then actual task-level gains, earned levels and XP per hour. Quest progress comes from the same helper as Home. Pending encounters remain in Activity and appear as one count link. The Task plan estimates XP, output and supply duration where the current task has stable rates. For variable encounters it describes the uncertainty.

The included browser test creates independent fresh fixtures, reloads through the actual Continue button and asserts both the rendered digest and the resumed or stopped state. A 32-hour absence counted as 24 hours. The six-hour cooking fixture ran out of raw shrimp and stayed stopped. None showed a separate decision card. All matched current quest state and fit their viewport.

| Absence | Counted | Local time to rendered digest |
| ---: | ---: | ---: |
| 1 hour | 1 hour | 1.7 s |
| 6 hours, limited cooking supplies | 6 hours | 0.6 s |
| 12 hours | 12 hours | 3.9 s |
| 32 hours | 24 hours | 6.4 s |

The durations above are from one local headless Chromium run and include the browser's navigation and rendering overhead. Core regression checks also passed. Target hardware performance and a human return session remain unmeasured.
