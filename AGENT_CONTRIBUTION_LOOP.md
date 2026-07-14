# Terax Contribution Loop Snippet

Agent-driven continuous contribution workflow for `crynta/terax-ai`. This snippet encodes the full loop: discovery → analysis → planning → implementation → testing → submission → discussion engagement.

## Configuration

```yaml
repo: crynta/terax-ai
target_branch: main
maintainer: '@crynta'
discord: 'https://discord.gg/tyveTUyEp7'
quality_gates:
  - pnpm lint
  - pnpm check-types
  - pnpm test
  - cargo clippy --all-targets --locked -- -D warnings
  - cargo test --locked
max_bundle_size: 50KB # gzip client
max_rust_size: 5MB # compiled
platforms: [macOS, Linux, Windows, WSL]
```

---

## Loop: Discover → Fix → Test → Submit → Engage

### Phase 1: Discovery

**Scope:** Find work that aligns with roadmap and quality standards.

```
LOOP_START:
  1. Query GitHub Issues API:
     - label:good-first-issue OR label:help-wanted
     - state:open
     - NOT assigned to anyone
     - Filter by ROADMAP.md categories:
       * "Test coverage" → search issues labeled "test"
       * "Bundle optimization" → issues in dependency/bundle paths
       * "Platform-specific bugs" → WSL, Linux distro rendering
       * "Documentation" → docs/* paths
       * "Themes" → theme-related issues
       * "Provider integrations" → AI provider scope questions
  
  2. Alternative: User-requested work
     - If user provides issue number or description, use that instead
     - Validate alignment: does it fit ROADMAP.md or requested areas?
  
  3. Candidate selection:
     - Prioritize small, focused changes (1-2 files touched max)
     - Avoid large architectural PRs (requires pre-discussion)
     - Avoid mixed-concern changes
     - Check CONTRIBUTING.md §"Discuss first" for scope gate
  
  4. Status check:
     - Is it already solved (closed issue, merged PR)?
     - Is someone already working on it?
     - Check linked PRs/discussions
     - If YES → skip, loop back to step 1
```

---

### Phase 2: Analysis & Planning

**Gate:** Alignment with project direction before writing code.

```
ANALYSIS:
  1. Read the issue completely:
     - Reproduction steps
     - Expected vs. actual behavior
     - Related discussions/PRs
     - "Is this in the out-of-scope list?" (ROADMAP.md §Out of Scope)
  
  2. Check if discussion is required:
     - If issue is NOT a small bugfix or docs change:
       * Large feature → must discuss in Discord first
       * Architectural change → must discuss first
       * New provider → must justify unique value
       * Multi-file refactor → must discuss first
     - If YES → ENGAGE_DISCUSSION (Phase 5)
     - If NO → continue to Phase 3
  
  3. Create fix plan:
     - Identify minimum files to touch (CONTRIBUTING.md §Keep changes focused)
     - Sketch the fix at a high level
     - Identify perf-sensitive paths that need tests:
       * Shell/terminal spawn
       * Workspace authorization
       * Git command layer
       * Filesystem mutation
       * IPC command surface
       * Pure logic with wide reach
     - If touching a perf path: plan test first
     - Confirm no new heavy dependencies (>50KB gzip client, >5MB Rust)
     - Check platform parity (must not break macOS/Linux/Windows/WSL)
  
  4. Dry-run check:
     - Does the plan violate CONTRIBUTING.md quality bar?
     - Does it introduce any breaking changes?
     - Size estimate: if >500 lines, might need pre-discussion
```

---

### Phase 3: Fork Setup & Local Development

**Gate:** Repo state clean, tests pass before modification.

```
LOCAL_DEV:
  1. Clone or update user fork:
     - Fork: github.com/marlonmuthiani/terax-ai (if not exists)
     - git clone <fork>
     - cd terax-ai
  
  2. Ensure clean baseline:
     - git fetch origin
     - git checkout main
     - git reset --hard origin/main
     - git pull origin main
  
  3. Create feature branch (CONTRIBUTING.md §Branches):
     - Prefix rules: feat/, fix/, chore/, docs/, perf/, security/
     - Format: lowercase, kebab-case
     - Examples: fix/ime-duplication, docs/contributing-guide
     - git checkout -b <prefix>/<scope>-<description>
  
  4. Install dependencies:
     - pnpm install
     - Verify Rust toolchain (stable): rustc --version
     - Verify Node 20+: node --version
  
  5. Pre-change test baseline:
     - Run ALL quality gates (must pass):
       a. pnpm lint
       b. pnpm check-types
       c. pnpm test
       d. cargo clippy --all-targets --locked -- -D warnings
       e. cargo test --locked
     - If ANY fail → investigate, don't proceed
     - If ALL pass → log test baseline (for comparison post-fix)
```

---

### Phase 4: Implement & Test Locally

**Gate:** Code change + test coverage + quality gates pass.

```
IMPLEMENT:
  1. Make minimal focused change:
     - Only touch files necessary for the fix
     - Don't reformat unrelated code
     - Don't fix lint in other files
     - Don't combine multiple unrelated fixes
  
  2. Code style (CONTRIBUTING.md §Code Style):
     - TypeScript: no `any` unless justified; strict mode
     - Rust: cargo fmt + clippy clean
     - Comments: explain *why*, not *what*
     - No emojis in code/commits
     - American English in user-facing strings
  
  3. Add test (if touching perf-sensitive paths):
     - Test the edge case that would break
     - Test the deny path
     - Real coverage, not placeholder
     - Test file location: mirrors src/ structure, e.g., src/terminal.test.ts
  
  4. Commit locally:
     - Atomic commits with format (CONTRIBUTING.md §Commits & PRs):
       <type>(<scope>): <short message>
       
       Types: feat, fix, chore, docs, perf, refactor, test, build, ci, security
       Scopes: terminal, editor, explorer, pty, ai, agents, settings, tabs, 
               shortcuts, ui, git, preview, windows, linux, macos, wsl
       
       Example: fix(terminal): stop IME-committed text duplication
  
  5. Run all quality gates again:
     - pnpm lint → must be clean
     - pnpm check-types → must be clean
     - pnpm test → must pass (including new tests)
     - cargo clippy --all-targets --locked -- -D warnings → must be clean
     - cargo test --locked → must pass
     - cargo fmt applied before next step
  
  6. Test locally (manual):
     - pnpm tauri dev
     - Reproduce the original issue
     - Verify the fix resolves it
     - Test on your platform (macOS/Linux/Windows)
     - Check for perf regressions (terminal render, PTY stream, AI streaming)
     - Note manual testing steps for PR description
```

---

### Phase 5: Push to Fork & Create PR

**Gate:** PR title, description, and branch naming follow spec.

```
PUSH_AND_PR:
  1. Push to fork:
     - git push origin <branch-name>
  
  2. Create PR on upstream (crynta/terax-ai):
     - Title format (becomes squash commit):
       <type>(<scope>): <description>
       Example: fix(terminal): prevent keystrokes swallowed on open
     - Use PR template (if exists; see .github/pull_request_template.md)
     - Fill in required fields:
       * **Problem:** Clear one-sentence problem statement
       * **Solution:** What changed and why
       * **Testing:** How you tested it (REQUIRED)
         - "Tested manually by: [steps]"
         - Include manual test steps
       * **Screenshots/GIFs** (if UI change)
       * **Breaking changes:** none/describe
       * **Dependencies added:** none/list & justify
  
  3. PR description checklist:
     - [ ] Problem statement is clear
     - [ ] Changes are minimal and focused
     - [ ] All tests pass (pnpm test, cargo test)
     - [ ] No perf regressions in hot paths
     - [ ] Follows existing code patterns
     - [ ] No new heavy dependencies
     - [ ] Platform parity preserved
     - [ ] Manual testing described
  
  4. Mark as draft if uncertain:
     - Good for mid-flight feedback before final review
     - Mark "Ready for review" when complete
  
  5. Link to related issues:
     - In PR body: "Fixes #<issue-number>" (auto-closes on merge)
     - In PR body: "Related to #<issue-number>" (for context)
```

---

### Phase 6: GitHub PR Validation & Fork Testing

**Gate:** User fork CI passes; no conflicts with main.

```
FORK_CI:
  1. Wait for user fork CI to complete:
     - GitHub Actions (if configured on fork)
     - Must pass before proceeding
  
  2. Check for conflicts:
     - If main has moved since branch creation:
       * git fetch origin main
       * git rebase origin/main
       * Resolve any conflicts
       * git push -f origin <branch-name>
       * Wait for fork CI again
  
  3. Upstream branch protection check:
     - PR target is crynta/terax-ai main
     - Not opened from fork's main (CONTRIBUTING.md §Branches)
     - Verify no accidental commits to main
  
  4. If fork CI fails:
     - Diagnose failure (lint, type-check, tests)
     - Fix locally, commit, push
     - Loop until fork CI passes
```

---

### Phase 7: Discussion Engagement (if needed)

**Gate:** PR review feedback or pre-submission discussion.

```
ENGAGEMENT:
  1. Monitor PR for maintainer feedback:
     - Poll GitHub PR API for new comments every 5 minutes
     - If maintainer requests changes:
       * Acknowledge in PR comment
       * Implement changes (go back to Phase 4)
       * Commit and push
       * Loop until approved
  
  2. If maintainer suggests discussion:
     - Join Discord: https://discord.gg/tyveTUyEp7
     - Post in #contributions or relevant channel
     - Engage as user @marlonmuthiani
     - Await feedback before proceeding
     - Incorporate feedback, return to Phase 4 if code changes needed
  
  3. Handling rejection:
     - If PR closed without merge:
       * Read maintainer's comment
       * Check if misaligned with roadmap
       * If worth revisiting: ask in Discord for reconsideration
       * If scope issue: open GitHub discussion for feedback
     - If acceptance + merge:
       * PR merged ✓
       * LOOP_SUCCESS → return to Phase 1 for next issue
```

---

### Phase 8: Success & Loop Continuation

```
SUCCESS:
  1. PR merged:
     - Branch can be deleted (locally and on fork)
     - git checkout main
     - git pull origin main
     - git branch -D <branch-name>
  
  2. Log success:
     - Record: issue #, PR #, type (fix/feat/docs)
     - Timestamp: when merged
  
  3. Return to Phase 1:
     - LOOP_START: discover next issue
     - Repeat until user stops requesting work
```

---

## Error Handling & Retry Logic

```
ERROR_STATES:

1. FAILED_QUALITY_GATES:
   - Diagnose: which gate failed (lint, test, clippy)?
   - Fix locally
   - Verify locally before push
   - Push and retest on fork
   - Retry until pass

2. FORK_CI_FAILURE:
   - Check fork Actions logs
   - Fix cause locally (Phase 4)
   - Push and retest
   - Max 3 retries before reporting error

3. PR_CONFLICTS:
   - Rebase on main
   - Resolve conflicts
   - Push -f
   - Retest fork CI

4. MAINTAINER_REQUESTS_CHANGES:
   - Implement feedback (Phase 4)
   - Commit and push
   - No force-push after review
   - Retry loop

5. PR_CLOSED_WITHOUT_MERGE:
   - Analyze reason
   - If out-of-scope: mark as completed (not eligible)
   - If too large: ask for split guidance in Discord
   - If misaligned: acknowledge and move to next issue

6. NO_DISCUSSION_RESPONSE:
   - Wait 24 hours
   - Post follow-up in Discord
   - If still no response after 48h: assume no alignment, move to next issue
```

---

## Success Metrics

- **Quality gate pass rate:** 100% (all gates must pass before PR)
- **PR merge rate:** >80% (pre-discussed, well-scoped changes merge faster)
- **Loop cycle time:** ~2-7 days per PR (small fix: 2-3d, feature: 5-7d)
- **Zero wasted work:** Each loop iteration produces either merged code or alignment feedback
- **Platform test coverage:** Changes tested on ≥1 platform; user can document which

---

## Example Run

```
ITERATION 1:
┌─ Discovery: Found issue #949 (Tab title show shell name)
├─ Analysis: Small, scoped fix; in roadmap "Themes and customizations"
├─ Plan: 1 file (src/modules/tabs/tab-label.tsx)
├─ Local Dev: Branch feat/tab-shell-display
├─ Implement: 15 LOC change + 1 test
├─ Quality: All gates pass
├─ PR: #971 opened (already merged as example!)
└─ SUCCESS ✓

ITERATION 2:
┌─ Discovery: Found issue #936 (Editor font-size setting)
├─ Analysis: Feature request; check if pre-discussion needed
├─ Plan: Settings UI + storage; may need discussion
├─ Discussion: Post in Discord for alignment
├─ Feedback: Maintainer approves approach
├─ Local Dev: Branch feat/editor-font-size
├─ Implement: 3 files, 50 LOC, 2 tests
├─ Quality: All gates pass
├─ PR: Submitted, awaiting review
└─ PENDING

ITERATION 3:
┌─ Discovery: Found issue #988 (Editor content not updated)
├─ Analysis: Bug with clear repro; doesn't require discussion
├─ Plan: 1 file (src/modules/editor/index.tsx), fix state sync
├─ Local Dev: Branch fix/editor-state-sync
├─ Implement: 10 LOC change
├─ Quality: All gates pass
├─ PR: #XYZ opened → merged ✓
└─ SUCCESS ✓
```

---

## References

- **CONTRIBUTING.md:** Full contribution guidelines
- **ROADMAP.md:** Project scope and direction
- **TERAX.md:** Architecture and internals (for complex fixes)
- **docs/README.md:** Documentation index
- **Discord:** https://discord.gg/tyveTUyEp7
