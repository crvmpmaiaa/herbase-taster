# Claude Code session usage report

Generated: 2026-09-09T01:13:36.666Z
Date range: last 5.0 hour(s) — sessions with last activity on or after `2026-09-08T20:13:35.678Z` (filtered on each session's own timestamps, not file mtime).
Store root: `C:\Users\JS\.claude\projects`

## Header notes

- **workflows/\*.json vs subagents/ overlap:** resolved as case (a) for the agent roster — every workflow-DSL-dispatched agent's raw transcript lives inside `subagents/workflows/wf_*/agent-*.jsonl`, which this script's recursive subagent walk already includes in the usage-based token/tool-call totals below. The top-level `workflows/*.json` manifest is a SEPARATE, differently-computed rollup (its self-reported token counts did not reconcile against summed `message.usage` fields on spot check) and is reported only in its own "Workflow manifests" column — never summed into the totals. Full reasoning in the script's header comment.
  - Workflow manifests found in range: 14. Workflow-DSL-dispatched agent transcripts included in totals: 60.
- **Cross-project-key duplicate sessions:** 1 session UUID(s) exist as an identically-named top-level .jsonl in more than one project key (of 213 raw .jsonl files on disk store-wide). Each is counted ONCE using the largest/most-complete copy; see Deduplication section below for the sessions that fall in this report's date range.
- **In-range token filtering (added 2026-08-06):** token/tool-call totals count ONLY messages timestamped within the date range. A long-lived session that was active in range contributes just its in-range slice, not its whole history — required for `--hours` window-headroom checks and correct cycle reconciliation.
- **One record per API response (fixed 2026-09-03):** Claude Code stores an assistant response as one jsonl line per content block, each repeating the same message.id and usage. Before this fix every line was summed, inflating main-loop totals ≈3.5x. Lines are now collapsed on message.id (then requestId, then uuid), keeping the largest usage seen; figures produced before 2026-09-03 are not comparable without dividing main-loop numbers by ~3.5.
- **Session forks (resumed/continued sessions):** a session resumed via `--resume`/`--continue` (or similar) writes a NEW session-uuid file that starts by literally replaying the prior session's messages, so two-plus session files can share an identical prefix of message uuids. Left unhandled this double-counts the shared prefix's tokens in the grand totals. This script dedupes globally by message uuid across every session in this report run, processing sessions in ascending first-timestamp order so the earliest-starting session in a fork group is credited for the shared prefix and later forks show only their unique continuation. 0 session(s) in this range had at least one message deduped away (0 messages total); see Session forks section below.

## Sessions (4, most recent first)

### 302aba87-a54b-4c9d-8ad1-7e1dc4a434b2
- Project key: `V--dev`
- Window: 2026-09-05T21:28:52.449Z → 2026-09-09T01:13:26.847Z (duration 75h 44m)
- Main-loop tokens (output 123,861; all-types sum 18,862,694 — cache-read-dominated, never quote as usage):
  - `claude-fable-5-1`: in 2,294 / out 123,861 / cacheRead 18,183,869 / cacheCreate 552,670
- Subagent tokens (output 939,740; all-types sum 142,608,676; fan-out 17 agents):
  - `claude-opus-5`: in 1,080 / out 502,937 / cacheRead 83,559,552 / cacheCreate 1,733,188
  - `claude-sonnet-5`: in 684 / out 436,803 / cacheRead 54,107,979 / cacheCreate 2,266,453
  - spawn depths: depth1:17; agentTypes: general-purpose(17); dispatch: agent-tool 17, workflow-dsl 0
- Tool calls (main+subagent combined, total 1,202): Bash:533, Read:272, Edit:237, Write:48, mcp__Claude_Browser__browser_batch:32, mcp__Claude_Browser__javascript_tool:18, Agent:17, mcp__Claude_Browser__computer:10

### 3134bca4-ae16-4b30-9957-5e29970a5312
- Project key: `V--dev`
- Window: 2026-09-06T01:19:09.120Z → 2026-09-09T01:04:50.474Z (duration 71h 45m)
- Main-loop tokens (output 128,212; all-types sum 36,550,667 — cache-read-dominated, never quote as usage):
  - `claude-fable-5-1`: in 1,286 / out 128,212 / cacheRead 36,034,375 / cacheCreate 386,794
- Subagent tokens (output 875,898; all-types sum 102,212,462; fan-out 66 agents):
  - `claude-opus-5`: in 1,538 / out 773,978 / cacheRead 89,686,417 / cacheCreate 2,353,887
  - `claude-sonnet-5`: in 210 / out 101,920 / cacheRead 8,760,737 / cacheCreate 533,775
  - spawn depths: depth1:66; agentTypes: general-purpose(6), workflow-subagent(60); dispatch: agent-tool 6, workflow-dsl 60
- Tool calls (main+subagent combined, total 1,150): Bash:918, Write:76, Edit:57, WebFetch:30, Read:23, StructuredOutput:22, ToolSearch:5, Workflow:4
- Workflow manifests (self-reported, NOT included in token totals above): agencybuildv2-wave0-shared (agents 6, self-reported tokens 727,774, tool calls 176, 23m 42s, completed); agencybuildv2-recon (agents 6, self-reported tokens 0, tool calls 0, 0s, completed); agencybuildv2-wave1-cohort1 (agents 7, self-reported tokens 868,496, tool calls 280, 36m 47s, completed); agencybuildv2-plan-rereview (agents 1, self-reported tokens 163,029, tool calls 19, 9m 39s, completed); agencybuildv2-interview-kb-swarm (agents 5, self-reported tokens 563,443, tool calls 136, 19m 7s, completed); agencybuildv2-recon2-cohort2 (agents 4, self-reported tokens 501,187, tool calls 146, 31m 39s, completed); agencybuildv2-wave2-cohort1 (agents 6, self-reported tokens 1,007,783, tool calls 373, 33m 37s, completed); agencybuildv2-recon2-cohort1 (agents 6, self-reported tokens 668,111, tool calls 193, 13m 50s, completed); agencybuildv2-lighthouse-options (agents 4, self-reported tokens 277,195, tool calls 85, 9m 10s, completed); agencybuildv2-plan-review (agents 2, self-reported tokens 421,510, tool calls 76, 23m 1s, completed); agencybuildv2-wave0-closeout (agents 5, self-reported tokens 410,761, tool calls 107, 5m 57s, completed); agencybuildv2-reference-loading-spike (agents 3, self-reported tokens 174,345, tool calls 10, 22s, completed); agencybuildv2-wave0-replay-double-run (agents 2, self-reported tokens 117,210, tool calls 8, 1m 43s, completed); agencybuildv2-wave0-vibe-match-spike (agents 3, self-reported tokens 283,189, tool calls 87, 20m 28s, completed)

### cda24f5b-5ca4-4f2e-bb3a-afc6de9c1c02
- Project key: `V--dev`
- Window: 2026-09-08T21:32:23.230Z → 2026-09-08T21:42:34.324Z (duration 10m 11s)
- Main-loop tokens (output 34,709; all-types sum 1,640,853 — cache-read-dominated, never quote as usage):
  - `claude-fable-5-1`: in 420 / out 34,709 / cacheRead 1,498,438 / cacheCreate 107,286
- Subagent tokens (output 0; all-types sum 0; fan-out 0 agents):
  - _none_
- Tool calls (main+subagent combined, total 31): Bash:26, WebSearch:2, Skill:1, ToolSearch:1, Write:1

### cdc1160d-fea4-4003-b643-07ea6bb18cb3
- Project key: `V--dev`
- Window: 2026-09-08T20:30:18.801Z → 2026-09-08T20:31:02.424Z (duration 44s)
- Main-loop tokens (output 1,734; all-types sum 644,809 — cache-read-dominated, never quote as usage):
  - `claude-opus-5`: in 20 / out 1,734 / cacheRead 599,374 / cacheCreate 43,681
- Subagent tokens (output 0; all-types sum 0; fan-out 0 agents):
  - _none_
- Tool calls (main+subagent combined, total 9): Bash:7, Read:2

## Rollups

### Totals by model (across all 4 sessions in range)

| Scope | Model | Input | Output | Cache read | Cache create | Total |
|---|---|---:|---:|---:|---:|---:|
| main | `claude-fable-5-1` | 4,000 | 286,782 | 55,716,682 | 1,046,750 | 57,054,214 |
| main | `claude-opus-5` | 20 | 1,734 | 599,374 | 43,681 | 644,809 |
| subagent | `claude-opus-5` | 2,618 | 1,276,915 | 173,245,969 | 4,087,075 | 178,612,577 |
| subagent | `claude-sonnet-5` | 894 | 538,723 | 62,868,716 | 2,800,228 | 66,208,561 |

### Top 10 sessions by output tokens (main+subagent combined)

| Session | Project key | Output tokens | Main output | Subagent output | Main all-types sum | Subagent all-types sum |
|---|---|---:|---:|---:|---:|---:|
| `302aba87-a54b-4c9d-8ad1-7e1dc4a434b2` | V--dev | 1,063,601 | 123,861 | 939,740 | 18,862,694 | 142,608,676 |
| `3134bca4-ae16-4b30-9957-5e29970a5312` | V--dev | 1,004,110 | 128,212 | 875,898 | 36,550,667 | 102,212,462 |
| `cda24f5b-5ca4-4f2e-bb3a-afc6de9c1c02` | V--dev | 34,709 | 34,709 | 0 | 1,640,853 | 0 |
| `cdc1160d-fea4-4003-b643-07ea6bb18cb3` | V--dev | 1,734 | 1,734 | 0 | 644,809 | 0 |

### Grand totals

**Output tokens — the work signal (what the budget meters):**
- Main loop: 288,516
- Subagents: 1,815,638
- **Combined output: 2,104,154**
- **Fable output (what the Weekly · Fable bar meters; cap ≈2.2M/week as of 2026-09-03): 286,782** (main 286,782 / subagents 0)

**Other token classes (reported separately — never add these to the headline):**
- Fresh input: 7,532
- Cache creation: 7,977,734
- Cache reads: 292,430,741 — re-reads of already-cached context, billed at a fraction of input rate. High values reflect long sessions with many turns, NOT extra work done.

- All-types sum (main 57,699,023 / subagent 244,821,138 / combined 302,520,161) — retained for completeness only; do NOT quote this as usage.
- Sessions in range: 4 across 1 project key(s)

## Deduplication

No duplicate-project-key sessions fall in this date range.

## Session forks

Resumed/continued sessions that share a message-uuid prefix with an earlier session in this range (see header note). Token totals above already reflect the dedup; this table just names which sessions overlapped.

No forked/resumed sessions detected in this date range.

## Project keys

- Active in range (1): V--dev
- Scanned but zero in-range sessions (29): C--Users-JS, C--Users-sashk-OneDrive-Desktop-claude, C--Users-sashk-OneDrive-Desktop-openhiggs, C--agency-openhiggs, C--dev, C--dev-claude-tools, C--dev-claude-tools--claude-worktrees-nice-swartz-cc7cc8, C--dev-openhiggs, C--dev-openhiggs--claude-worktrees-heuristic-fermat-a0b205, C--dev-openhiggs-amigo, C--dev-openhiggs-app-rig--claude-worktrees-sad-cannon-060f07, V--agency-automation, V--agency-automation-workspace--claude-worktrees-optimistic-burnell-b4f452, V--agency-openhiggs, V--agency-openhiggs-d3-testlab-d3-ayurvuru-arm-f--claude-worktrees-fervent-khayyam-04c29d, V--agency-openhiggs-d3-testlab-d3-ayurvuru-arm-r, V--agency-openhiggs-library--claude-worktrees-kind-hermann-0c48a9, V--dev--share-agencybuildv2, V--dev--share-agencybuildv2-plan-review, V--dev--share-agencybuildv2-recon, V--dev--share-agencybuildv2-spike, V--dev--share-optimise-week-one, V--dev-claude-tools, V--dev-gstack-rebuild-upstream, V--dev-herbase-pilot-inputs, V--dev-higgsfield-33-day-sprint, V--dev-openhiggs, V--dev-space-training, V--dev-transcripts-vault-Claude-Code-dev

