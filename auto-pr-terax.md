# Auto-PR Terax: Unified Skill for Autonomous Contribution Workflows

**Type:** Unified Agent Skill  
**Version:** 2.0  
**Target:** `crynta/terax-ai` repository  
**License:** Apache-2.0  
**Status:** Production-Ready

---

## Overview

**Auto-PR Terax** is a complete, self-contained skill that enables autonomous agents to discover, implement, test, and submit high-quality pull requests to `crynta/terax-ai` through an intelligent, gated workflow.

### Key Capabilities

✅ **Autonomous issue discovery** → Aligned with roadmap, high-impact first  
✅ **Intelligent gating** → All quality checks must pass before PR submission  
✅ **Discussion engagement** → Pre-discuss large changes on Discord  
✅ **Fork CI validation** → No conflicts, all upstream tests pass  
✅ **Maintainer feedback loops** → Implement requested changes automatically  
✅ **Multi-platform testing** → Validate on macOS, Linux, Windows, WSL  
✅ **Error recovery** → Retry logic with exponential backoff  
✅ **Success metrics** → Track merge rate, cycle time, quality gates  
✅ **Multi-agent composable** → Integrate with code gen, review, learning agents  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-PR TERAX SKILL                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONFIG LAYER                                               │
│  ├─ Repository config (crynta/terax-ai)                    │
│  ├─ Fork config (marlonmuthiani/terax-ai)                  │
│  ├─ Quality gates (lint, test, clippy, etc)                │
│  ├─ Platform targets (macOS, Linux, Windows, WSL)          │
│  └─ Gating rules (pre-submit, PR, engagement)              │
│                                                             │
│  WORKFLOW LAYER (9 Phases)                                  │
│  ├─ Phase 1: DISCOVERY         (issue selection)           │
│  ├─ Phase 2: ANALYSIS          (scope + discussion gate)    │
│  ├─ Phase 3: FORK_SETUP        (clone, baseline)           │
│  ├─ Phase 4: IMPLEMENT         (code change)               │
│  ├─ Phase 5: LOCAL_TEST        (quality gates)             │
│  ├─ Phase 6: PUSH_AND_PR       (fork push, PR create)      │
│  ├─ Phase 7: FORK_CI           (CI validation)             │
│  ├─ Phase 8: ENGAGEMENT        (review loop)               │
│  └─ Phase 9: SUCCESS           (merge + cleanup)           │
│                                                             │
│  ERROR HANDLING LAYER                                       │
│  ├─ Retry policy (max 3 attempts, exponential backoff)     │
│  ├─ Conflict resolution (auto-rebase)                      │
│  ├─ Transient failure handling                             │
│  └─ PR rejection analysis                                  │
│                                                             │
│  INTEGRATION LAYER                                          │
│  ├─ GitHub API (Issues, PRs, Actions)                      │
│  ├─ Discord API (webhooks, messages)                       │
│  ├─ Shell execution (git, pnpm, cargo)                     │
│  └─ Event emitters (phase-complete, pr-merged, etc)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### SkillConfig Interface

```typescript
interface SkillConfig {
  // ===== REPOSITORY =====
  owner: 'crynta'                    // upstream owner
  repo: 'terax-ai'                   // upstream repo
  defaultBranch: 'main'              // target branch
  
  // ===== FORK (Agent's Working Fork) =====
  forkOwner: string                  // e.g., 'marlonmuthiani'
  forkRepo: string                   // e.g., 'terax-ai'
  githubToken: string                // PAT with repo push + read scopes
  
  // ===== DISCORD (for Discussion Engagement) =====
  discordWebhook?: string            // webhook URL for notifications
  discordChannel?: string            // channel name, e.g., 'contributions'
  discordUserId?: string             // agent discord handle
  
  // ===== LOOP BEHAVIOR =====
  maxIterations: number              // default: 5 (max PRs to attempt)
  maxRetries: number                 // default: 3 (per phase)
  testTimeoutMs: number              // default: 600000 (10 min)
  monitorPRPollingIntervalSec: number // default: 300 (5 min)
  
  // ===== QUALITY GATES =====
  qualityGates: QualityGate[]        // mandatory checks
  
  // ===== PLATFORM TESTING =====
  platforms: Platform[]              // ['macOS', 'Linux', 'Windows', 'WSL']
  
  // ===== GATING RULES =====
  prGateRules: PRGateRule[]          // pre-submission validation rules
  
  // ===== CONSTRAINTS =====
  maxFilesTouch?: number             // default: 5
  maxLinesChanged?: number           // default: 500
  requireDiscussionAbove?: number    // default: 200 lines
  maxBundleSizeBytes?: number        // default: 50KB gzip
  maxRustSizeBytes?: number          // default: 5MB compiled
}

interface QualityGate {
  name: string                       // e.g., 'pnpm-lint'
  command: string | string[]         // shell command(s)
  timeout: number                    // ms
  optional: boolean                  // false = blocking
  errorMessage?: string              // custom error output
  retryable: boolean                 // can retry on failure
}

interface PRGateRule {
  rule: 'no-breaking-changes' | 'max-bundle-size' | 
        'platform-parity' | 'security-review'
  enforced: boolean
  threshold?: string | number
  autoFail?: boolean                 // fail PR if rule violated
}

enum Platform {
  macOS = 'macOS',
  Linux = 'Linux',
  Windows = 'Windows',
  WSL = 'WSL'
}

// ===== ROADMAP ALIGNMENT =====
enum RoadmapArea {
  TestCoverage = 'test-coverage',
  BundleOpt = 'bundle-opt',
  PlatformBugs = 'platform-bugs',
  Documentation = 'docs',
  Themes = 'themes',
  Providers = 'providers'
}

// ===== CONTRIBUTION TYPES =====
enum ContributionType {
  BugFix = 'fix',
  Feature = 'feat',
  Docs = 'docs',
  Refactor = 'refactor',
  Performance = 'perf',
  Security = 'security',
  Chore = 'chore',
  Test = 'test'
}
```

### UserRequest Interface

```typescript
interface UserRequest {
  // ===== ISSUE SELECTION =====
  issueNumber?: number               // specific issue
  issueDescription?: string          // or natural language desc
  
  // ===== PREFERENCES =====
  workType?: ContributionType        // prefer certain types
  targetRoadmapArea?: RoadmapArea    // roadmap alignment
  
  // ===== CONSTRAINTS =====
  maxTimeHours?: number              // stop after N hours
  maxIterations?: number             // override default
  
  // ===== LOOP CONTROL =====
  stopOnFirstSuccess?: boolean       // default: false (continue loop)
  autoSubmitIfNoDiscussionNeeded?: boolean // default: true
  
  // ===== HOOKS =====
  onPhaseComplete?: (phase: Phase, result: any) => void
  onForkCIFail?: (error: Error) => Promise<void>
  onPRMerged?: (prNumber: number, metrics: any) => void
  onDiscussionStarted?: (threadUrl: string) => Promise<void>
}

interface LoopConfig {
  // ===== RETRY POLICY =====
  maxAttemptsPerGate: number         // default: 3
  backoffMs: number                  // default: 1000
  exponentialBackoff: boolean        // default: true
  
  // ===== ENGAGEMENT STRATEGY =====
  monitorPRPollingIntervalSec: number
  discordNotifyOnSubmit: boolean
  discordNotifyOnMerge: boolean
  autoFollowUpAfterHours: number     // default: 24
}
```

### Result Interfaces

```typescript
interface LoopResult {
  status: 'success' | 'partial' | 'failed'
  iterations: IterationResult[]
  successCount: number               // merged PRs
  failureCount: number
  totalTimeMs: number
  
  metrics: {
    avgCycleTimeMs: number
    qualityGatePassRate: number      // 0-100
    prMergeRate: number              // % of submitted PRs merged
    discussionEngagementCount: number
    retryCount: number
    totalIssuesProcessed: number
  }
  
  summary: {
    prUrls: string[]
    issueNumbers: number[]
    roadmapAreasAdressed: RoadmapArea[]
    platformsTestedOn: Platform[]
  }
}

interface IterationResult {
  index: number
  issueNumber: number
  issueTitle: string
  prNumber?: number
  prUrl?: string
  
  status: 'success' | 'failed' | 'pending' | 'retrying'
  
  phases: {
    discovery: PhaseResult
    analysis: PhaseResult
    forkSetup: PhaseResult
    implement: PhaseResult
    localTest: PhaseResult
    pushAndPR: PhaseResult
    forkCI: PhaseResult
    engagement: PhaseResult
    success: PhaseResult
  }
  
  metadata: {
    filesChanged: string[]
    linesChanged: number
    testsAdded: number
    commitCount: number
    discussionNeeded: boolean
    discussionUrl?: string
    mergedAt?: string
    mergeTimeMs?: number
  }
  
  error?: {
    phase: Phase
    reason: string
    retryCount: number
    recoverable: boolean
  }
}

interface PhaseResult {
  name: Phase
  status: 'pending' | 'running' | 'passed' | 'failed'
  startedAt: number
  completedAt?: number
  duration?: number
  output?: any
  error?: string
}

enum Phase {
  Discovery = 'discovery',
  Analysis = 'analysis',
  ForkSetup = 'fork-setup',
  Implement = 'implement',
  LocalTest = 'local-test',
  PushAndPR = 'push-and-pr',
  ForkCI = 'fork-ci',
  Engagement = 'engagement',
  Success = 'success'
}
```

---

## Workflow Phases (Complete Specification)

### Phase 1: Discovery

**Goal:** Find high-impact issues aligned with roadmap.

```typescript
async function phaseDiscovery(
  config: SkillConfig,
  userRequest?: UserRequest
): Promise<DiscoveryResult> {
  // If userRequest.issueNumber:
  //   - Fetch specific issue
  //   - Validate still open and not assigned
  // Else:
  //   - Query GitHub API: good-first-issue OR help-wanted labels
  //   - Filter by ROADMAP.md alignment
  //   - Exclude: archived, assigned, in-progress
  //   - Score by: impact, alignment, scope (small first)
  //   - Select top candidate
  //
  // Return:
  //   - Issue metadata
  //   - Alignment score (0-100)
  //   - Estimated scope (small/medium/large)
  //   - Roadmap area
  //   - Discussion likelihood
}

interface DiscoveryResult {
  issue: GitHubIssue
  alignmentScore: number             // 0-100
  estimatedScope: 'small' | 'medium' | 'large'
  roadmapArea: RoadmapArea
  discussionRequired: boolean
  reason: string
}
```

**Error Handling:**
- API rate limit → wait and retry
- No issues found → return status 'no-candidates'
- Issue still assigned → skip, loop to next

---

### Phase 2: Analysis & Alignment Gate

**Goal:** Validate alignment and determine if pre-discussion needed.

```typescript
async function phaseAnalysis(
  issue: GitHubIssue,
  config: SkillConfig
): Promise<AnalysisResult> {
  // 1. Read full issue:
  //    - Title, description, reproduction steps
  //    - Related PRs, discussions
  //    - Current comments
  //
  // 2. Check out-of-scope list (ROADMAP.md):
  //    - Not: heavy IDE features, notebooks, package managers, browser
  //    - Not: extension marketplaces, telemetry, subscription bridges
  //    → If out-of-scope: return status 'out-of-scope'
  //
  // 3. Determine discussion requirement (CONTRIBUTING.md rules):
  //    - Small bugfix (<200 LOC, single file) → NO discussion
  //    - New feature → YES discussion
  //    - UI/UX change → YES discussion
  //    - Refactor → YES discussion
  //    - Performance rewrite → YES discussion
  //    - Multi-file change (>5 files) → YES discussion
  //    - New provider → YES discussion
  //
  // 4. Create fix plan:
  //    - Identify files to touch
  //    - Estimate LOC
  //    - Perf-sensitive path? (requires test)
  //    - New dependencies?
  //    - Platform parity risk?
  //
  // 5. If discussion needed:
  //    - Return to caller → ENGAGEMENT phase (pre-submission)
  //    - Else: continue to fork setup
}

interface AnalysisResult {
  discussionRequired: boolean
  discussionReason?: string
  outOfScope: boolean
  fixPlan: {
    filesAffected: string[]
    estimatedLOC: number
    testRequired: boolean
    platformsAffected: Platform[]
    newDependencies: string[]
  }
  alignmentScore: number             // 0-100
}
```

---

### Phase 3: Fork Setup & Baseline

**Goal:** Prepare local environment and verify baseline.

```typescript
async function phaseForkSetup(
  config: SkillConfig
): Promise<ForkSetupResult> {
  // 1. Ensure fork exists:
  //    - If not: create fork of crynta/terax-ai
  //
  // 2. Clone or update fork:
  //    - git clone --depth 1 fork
  //    - git fetch origin main
  //    - git checkout main
  //    - git reset --hard origin/main
  //
  // 3. Create feature branch:
  //    - Prefix: fix/, feat/, docs/, perf/, security/, chore/
  //    - Format: lowercase, kebab-case
  //    - Example: fix/ime-duplication, docs/contributing-guide
  //    - git checkout -b <prefix>/<scope>-<description>
  //
  // 4. Install dependencies:
  //    - pnpm install
  //    - Verify Rust stable: rustc --version >= 1.70
  //    - Verify Node 20+: node --version
  //
  // 5. Run baseline quality gates (ALL must pass):
  //    - pnpm lint
  //    - pnpm check-types
  //    - pnpm test
  //    - cargo clippy --all-targets --locked -- -D warnings
  //    - cargo test --locked
  //
  // 6. If ANY gate fails:
  //    - Abort: local env is broken, not agent's fault
  //    - Report error
  //    - Do NOT proceed to Phase 4
}

interface ForkSetupResult {
  branch: string
  workdir: string
  baselineGates: GateResult[]
  allPassed: boolean
}

interface GateResult {
  gateName: string
  passed: boolean
  duration: number
  output?: string
  error?: string
  attempts: number
}
```

---

### Phase 4: Implement

**Goal:** Write minimal, focused code to fix the issue.

```typescript
async function phaseImplement(
  issue: GitHubIssue,
  fixPlan: FixPlan,
  workdir: string,
  config: SkillConfig
): Promise<ImplementResult> {
  // 1. Implement the fix:
  //    - Only touch files in fixPlan.filesAffected
  //    - Make minimal changes (no reformatting)
  //    - No cleanup of unrelated code
  //    - No fixing lint in other files
  //    - Follow existing code patterns
  //
  // 2. Code style (CONTRIBUTING.md):
  //    - TypeScript: no `any`, strict mode
  //    - Rust: cargo fmt + clippy clean
  //    - Comments: explain *why*, not *what*
  //    - American English in user-facing strings
  //
  // 3. Add test if perf-sensitive path:
  //    - shell/terminal spawn
  //    - workspace authorization
  //    - git command layer
  //    - filesystem mutation
  //    - IPC command surface
  //    - pure logic with wide reach
  //    → Real coverage, not placeholder
  //
  // 4. Format code:
  //    - cargo fmt
  //    - pnpm format (if applicable)
  //
  // 5. Commit locally:
  //    - Format: <type>(<scope>): <description>
  //    - Example: fix(terminal): stop IME-committed text duplication
  //    - Include issue reference: Fixes #XYZ
}

interface ImplementResult {
  commit: {
    hash: string
    message: string
    filesChanged: string[]
    linesChanged: number
  }
  testFiles?: string[]
  testsAdded: number
}
```

---

### Phase 5: Local Testing

**Goal:** Validate all quality gates pass locally.

```typescript
async function phaseLocalTest(
  workdir: string,
  config: SkillConfig
): Promise<LocalTestResult> {
  // 1. Run quality gates (in order):
  //    For each QualityGate:
  //      - Execute command
  //      - Capture output
  //      - If PASS: continue
  //      - If FAIL:
  //        * If retryable AND attempts < maxRetries:
  //          → Sleep (backoff), retry
  //        * Else:
  //          → Abort iteration, report error
  //
  // 2. All gates must pass:
  //    - pnpm lint
  //    - pnpm check-types
  //    - pnpm test
  //    - cargo clippy --all-targets --locked -- -D warnings
  //    - cargo test --locked
  //    - cargo fmt (verify clean)
  //
  // 3. Manual testing (if platform available):
  //    - pnpm tauri dev
  //    - Reproduce original issue
  //    - Verify fix resolves it
  //    - Check for perf regressions:
  //      * Terminal renderer latency
  //      * PTY stream handling
  //      * AI streaming latency
  //      * File explorer responsiveness
  //
  // 4. Capture test output for PR description
}

interface LocalTestResult {
  gateResults: GateResult[]
  allPassed: boolean
  manualTestNotes: string
  duration: number
}
```

---

### Phase 6: Push to Fork & Create PR

**Goal:** Push branch and create upstream PR with proper metadata.

```typescript
async function phasePushAndPR(
  workdir: string,
  issue: GitHubIssue,
  commit: Commit,
  config: SkillConfig
): Promise<PushAndPRResult> {
  // 1. Push branch to fork:
  //    - git push -u origin <branch>
  //    - Verify push succeeded
  //
  // 2. Create PR on upstream (crynta/terax-ai):
  //    - Source: marlonmuthiani/terax-ai:<branch>
  //    - Target: crynta/terax-ai:main
  //
  // 3. PR title:
  //    - Format: <type>(<scope>): <description>
  //    - Example: fix(terminal): prevent keystrokes swallowed on open
  //
  // 4. PR body:
  //    - Problem statement (clear one-liner)
  //    - Solution (what changed and why)
  //    - Testing (REQUIRED):
  //      * "Tested manually by: [steps]"
  //      * Platform(s) tested
  //    - Screenshots/GIFs (if UI change)
  //    - Breaking changes (if any)
  //    - Dependencies added (if any)
  //    - Checklist:
  //      * [ ] Problem statement clear
  //      * [ ] Changes minimal and focused
  //      * [ ] All tests pass
  //      * [ ] No perf regressions
  //      * [ ] Follows existing patterns
  //      * [ ] No heavy dependencies
  //      * [ ] Platform parity preserved
  //      * [ ] Manual testing described
  //
  // 5. Link related issues:
  //    - "Fixes #<issue-number>" (auto-closes on merge)
  //    - "Related to #<issue-number>" (for context)
  //
  // 6. Return PR metadata
}

interface PushAndPRResult {
  prNumber: number
  prUrl: string
  branch: string
  forkCI: boolean                    // fork has CI configured
}
```

---

### Phase 7: Fork CI Validation

**Goal:** Wait for fork CI to pass, handle conflicts.

```typescript
async function phaseForkCI(
  prNumber: number,
  forkOwner: string,
  config: SkillConfig
): Promise<ForkCIResult> {
  // 1. Poll fork GitHub Actions:
  //    - Check if fork has CI workflows
  //    - Poll status every 30 seconds
  //    - Timeout: 10 minutes (config.testTimeoutMs)
  //
  // 2. If CI passes:
  //    - Continue to Phase 8
  //
  // 3. If CI fails:
  //    - Fetch logs
  //    - Diagnose failure (lint, test, clippy, cargo test)
  //    - If fixable:
  //      * Return to Phase 4
  //      * Fix locally, commit, push
  //      * If maxRetries exceeded: abort iteration
  //    - Else:
  //      * Abort iteration, report error
  //
  // 4. Check for conflicts:
  //    - If main branch moved:
  //      * git fetch origin main
  //      * git rebase origin/main
  //      * If conflicts: resolve (or abort)
  //      * git push -f origin <branch>
  //      * Retry fork CI
  //
  // 5. If all pass:
  //    - Continue to Phase 8 (engagement)
}

interface ForkCIResult {
  passed: boolean
  duration: number
  conflictResolved?: boolean
  logs?: string
  error?: string
}
```

---

### Phase 8: Engagement & Review Loop

**Goal:** Monitor PR for maintainer feedback and implement changes.

```typescript
async function phaseEngagement(
  prNumber: number,
  config: SkillConfig,
  issue: GitHubIssue
): Promise<EngagementResult> {
  // 1. Poll PR for maintainer feedback (every 5 min):
  //    - Check for comments, reviews, status changes
  //    - Timeout: 48 hours (config.monitorPRPollingIntervalSec)
  //
  // 2. If maintainer requests changes:
  //    - Log feedback in PR
  //    - Implement changes (return to Phase 4)
  //    - Commit and push (no force-push after review)
  //    - Wait for new review
  //    - Loop until approved
  //
  // 3. If maintainer requests discussion:
  //    - Post in Discord #contributions
  //    - Include: issue link, fix plan, question
  //    - Tag @crynta if needed
  //    - Poll for response (24-48 hours)
  //    - If approved: continue to next phase
  //    - If rejected: abort iteration, move to next issue
  //    - If no response: assume not aligned, move to next issue
  //
  // 4. If approved:
  //    - Wait for merge
  //    - Poll merge status
  //
  // 5. If rejected:
  //    - Analyze reason
  //    - Log for learning
  //    - Move to next issue
  //
  // 6. If timeout (48h no response):
  //    - Post follow-up comment
  //    - If still no response: close or abandon
  //    - Move to next issue
}

interface EngagementResult {
  status: 'merged' | 'changes-requested' | 'discussion-needed' | 
          'rejected' | 'timeout'
  feedback: FeedbackMessage[]
  changesImplemented: boolean
  discussionThreads?: string[]
  mergedAt?: string
  mergeTimeMs?: number
}

interface FeedbackMessage {
  author: string
  type: 'comment' | 'review' | 'approval' | 'rejection'
  timestamp: string
  content: string
}
```

---

### Phase 9: Success & Cleanup

**Goal:** Clean up and prepare for next iteration.

```typescript
async function phaseSuccess(
  prNumber: number,
  branch: string,
  workdir: string,
  config: SkillConfig,
  metrics: IterationMetrics
): Promise<SuccessResult> {
  // 1. PR merged:
  //    - Verify merge on upstream main
  //    - Wait up to 5 minutes for verification
  //
  // 2. Clean up branch:
  //    - git checkout main
  //    - git pull origin main
  //    - git branch -D <branch> (locally)
  //    - git push origin --delete <branch> (on fork)
  //
  // 3. Log success:
  //    - Record: issue #, PR #, type (fix/feat/docs)
  //    - Timestamp: when merged
  //    - Metrics: cycle time, LOC, tests added
  //    - Roadmap area addressed
  //
  // 4. Emit events:
  //    - onPRMerged(prNumber, metrics)
  //    - Discord notification (if enabled)
  //
  // 5. Return to Phase 1:
  //    - If stopOnFirstSuccess: STOP
  //    - Else: LOOP_START (discover next issue)
}

interface SuccessResult {
  prNumber: number
  mergeTimeMs: number
  cycleTimeMs: number
  metrics: IterationMetrics
}

interface IterationMetrics {
  issueNumber: number
  prNumber: number
  filesChanged: number
  linesChanged: number
  testsAdded: number
  commitCount: number
  startedAt: string
  mergedAt: string
  cycleTimeMs: number
  discussionNeeded: boolean
  qualityGateAttempts: number
}
```

---

## Error Handling & Recovery

### Retry Strategy

```typescript
interface RetryStrategy {
  scenario: string
  maxAttempts: number
  backoffMs: number
  exponentialBackoff: boolean
}

const RETRY_SCENARIOS = {
  qualityGateFail: {
    maxAttempts: 3,
    backoffMs: 1000,
    exponentialBackoff: true
  },
  forkCIFail: {
    maxAttempts: 3,
    backoffMs: 2000,
    exponentialBackoff: true
  },
  conflictDetected: {
    maxAttempts: 2,
    backoffMs: 1000,
    exponentialBackoff: false
  },
  discardAndRetry: {
    maxAttempts: 1,
    backoffMs: 0,
    exponentialBackoff: false
  }
}
```

### Error Branches

```
ERROR_STATE_1: Quality Gate Fails
├─ Log failure details (stdout, stderr)
├─ If retryable AND attempts < maxRetries:
│  ├─ Sleep (backoff: 1s → 2s → 4s)
│  ├─ Fix cause if identifiable
│  └─ Re-run gate
├─ If still fail after maxRetries:
│  ├─ Abort iteration
│  ├─ Report error to caller
│  └─ Move to next issue
└─ Return: failure

ERROR_STATE_2: Fork CI Fails
├─ Fetch fork Actions logs
├─ Diagnose failure (lint, test, clippy, cargo test)
├─ If fixable:
│  ├─ Fix locally (Phase 4)
│  ├─ Commit, push
│  └─ Retry fork CI
├─ If still fail after maxRetries:
│  ├─ Abort iteration
│  ├─ Report error
│  └─ Move to next issue
└─ Return: failure

ERROR_STATE_3: PR Conflicts with Main
├─ Detect conflict via PR status
├─ git fetch origin main
├─ git rebase origin/main
├─ Resolve conflicts manually or auto
├─ git push -f origin <branch>
├─ Retry fork CI
├─ If still fail:
│  ├─ Abort iteration
│  ├─ Report conflict
│  └─ Move to next issue
└─ Return: conflict-resolved or failure

ERROR_STATE_4: Maintainer Requests Changes
├─ Parse feedback
├─ Implement changes (Phase 4)
├─ Commit and push (no force-push)
├─ Wait for re-review
├─ Loop until approved or timeout (48h)
├─ If timeout:
│  ├─ Post follow-up comment
│  └─ Move to next issue
└─ Return: approved or timeout

ERROR_STATE_5: PR Rejected
├─ Analyze rejection reason
├─ If out-of-scope:
│  ├─ Mark issue as non-eligible
│  └─ Move to next issue
├─ If too large:
│  ├─ Ask for guidance in Discord
│  └─ Move to next issue
├─ If misaligned:
│  ├─ Acknowledge feedback
│  └─ Move to next issue
└─ Return: rejected

ERROR_STATE_6: No Discord Response (48h)
├─ Wait 24 hours
├─ Post follow-up comment
├─ Wait another 24 hours
├─ If still no response:
│  ├─ Assume no alignment
│  └─ Move to next issue
└─ Return: timeout
```

---

## Gating Rules (Multi-Layer)

### Pre-Submission Gates (Phase 5 → Phase 6)

✅ **ALL quality gates must pass:**
- `pnpm lint` clean
- `pnpm check-types` clean
- `pnpm test` pass
- `cargo clippy --all-targets --locked -- -D warnings` clean
- `cargo test --locked` pass
- `cargo fmt` applied

✅ **Code quality rules:**
- No files touched beyond plan (max deviation: +1 file)
- Lines changed ≤ threshold (default: 500)
- No heavy dependencies (>50KB gzip client, >5MB Rust compiled)
- No breaking changes without migration notes
- No mixed-concern changes (one logical change per PR)

✅ **Testing rules:**
- If perf-sensitive path touched: test required
- Test coverage: edge cases + deny paths
- No placeholder tests

---

### Upstream PR Acceptance Gates (Phase 7 → Phase 8)

✅ **Fork CI must pass**
✅ **No conflicts with main**
✅ **PR template complete:**
  - Problem statement
  - Solution description
  - Testing notes (REQUIRED)
  - Reproducible steps (if bug)

✅ **PR metadata:**
  - Title format: `<type>(<scope>): <description>`
  - Related issues linked (`Fixes #N`)
  - Platform parity preserved
  - Screenshots/GIFs (if UI change)

---

### Engagement Gates (Phase 8 → Phase 9)

✅ **If maintainer requests changes:**
  - Implement feedback
  - Commit and push
  - Wait for re-review
  - No force-push after review

✅ **If discussion needed:**
  - Post in Discord before PRs
  - Get alignment before coding

✅ **If rejected:**
  - Analyze reason
  - Move to next issue

✅ **If approved:**
  - Merge (automatic)
  - Move to next issue

---

## Success Metrics & Monitoring

```typescript
interface SuccessMetrics {
  // ===== PER ITERATION =====
  cycleTimeMs: number                // discovery → merge
  qualityGatePassRate: number        // % of gates passed 1st try
  discussionEngagementRate: number   // % requiring pre-discussion
  prMergeRate: number                // % of submitted PRs merged
  
  // ===== AGGREGATE =====
  totalIterations: number
  successfulMerges: number
  failedAttempts: number
  averageCycleTimeMs: number
  totalTimeMs: number
  
  // ===== QUALITY =====
  avgFilesChangedPerPR: number
  avgLinesChangedPerPR: number
  testCoverageAddedPerPR: number
  securityReviewsRequired: number
  
  // ===== ENGAGEMENT =====
  discussionEngagements: number
  averageDiscussionResolutionHours: number
  discordNotificationsSent: number
  
  // ===== RELIABILITY =====
  retryCount: number
  conflictResolutions: number
  ciFailureRecoveries: number
  zeroQualityGateFailures: boolean
}

// ===== TARGET METRICS =====
const TARGET_METRICS = {
  qualityGatePassRate: 100,          // all gates pass before PR
  prMergeRate: 80,                   // 4 of 5 PRs merge
  averageCycleTime: 259200000,       // 3 days (ms)
  discussionEngagementRate: 20,      // ~20% require pre-discussion
  zeroWastedWork: true               // each iteration → merged or alignment
}
```

---

## Core Functions (Composable API)

### Main Orchestrator

```typescript
async function autoPRTerax(
  config: SkillConfig,
  userRequest?: UserRequest,
  loopConfig?: LoopConfig
): Promise<LoopResult> {
  // Initialize
  const result: LoopResult = {
    status: 'pending',
    iterations: [],
    successCount: 0,
    failureCount: 0,
    totalTimeMs: 0,
    metrics: {}
  }
  
  const startTime = Date.now()
  
  // Loop
  for (let i = 0; i < config.maxIterations; i++) {
    try {
      const iteration = await runIteration(
        i,
        config,
        userRequest,
        loopConfig
      )
      
      result.iterations.push(iteration)
      
      if (iteration.status === 'success') {
        result.successCount++
      } else if (iteration.status === 'failed') {
        result.failureCount++
      }
      
      if (userRequest?.stopOnFirstSuccess && iteration.status === 'success') {
        break
      }
    } catch (error) {
      console.error(`Iteration ${i} failed:`, error)
      result.failureCount++
    }
  }
  
  result.totalTimeMs = Date.now() - startTime
  result.status = result.successCount > 0 ? 'partial' : 'failed'
  if (result.successCount === result.iterations.length) {
    result.status = 'success'
  }
  
  return result
}
```

### Single Iteration Runner

```typescript
async function runIteration(
  index: number,
  config: SkillConfig,
  userRequest?: UserRequest,
  loopConfig?: LoopConfig
): Promise<IterationResult> {
  const iteration: IterationResult = {
    index,
    issueNumber: 0,
    issueTitle: '',
    status: 'pending',
    phases: {}
  }
  
  try {
    // Phase 1: Discovery
    const discoveryResult = await phaseDiscovery(config, userRequest)
    iteration.phases.discovery = {
      name: Phase.Discovery,
      status: 'passed',
      output: discoveryResult
    }
    iteration.issueNumber = discoveryResult.issue.number
    iteration.issueTitle = discoveryResult.issue.title
    
    // Phase 2: Analysis
    const analysisResult = await phaseAnalysis(
      discoveryResult.issue,
      config
    )
    iteration.phases.analysis = {
      name: Phase.Analysis,
      status: analysisResult.outOfScope ? 'failed' : 'passed',
      output: analysisResult
    }
    
    if (analysisResult.discussionRequired) {
      // Phase 8 (Early): Pre-submission discussion
      const engagementResult = await phaseEngagement(
        -1, // no PR yet
        config,
        discoveryResult.issue
      )
      
      if (engagementResult.status !== 'approved') {
        iteration.status = 'failed'
        iteration.error = {
          phase: Phase.Analysis,
          reason: 'Pre-discussion not approved',
          retryCount: 0,
          recoverable: false
        }
        return iteration
      }
    }
    
    // Phase 3: Fork Setup
    const setupResult = await phaseForkSetup(config)
    iteration.phases.forkSetup = {
      name: Phase.ForkSetup,
      status: setupResult.allPassed ? 'passed' : 'failed',
      output: setupResult
    }
    
    // Phase 4: Implement
    const implementResult = await phaseImplement(
      discoveryResult.issue,
      analysisResult.fixPlan,
      setupResult.workdir,
      config
    )
    iteration.phases.implement = {
      name: Phase.Implement,
      status: 'passed',
      output: implementResult
    }
    iteration.metadata = {
      filesChanged: implementResult.commit.filesChanged,
      linesChanged: implementResult.commit.linesChanged,
      testsAdded: implementResult.testsAdded,
      commitCount: 1
    }
    
    // Phase 5: Local Test
    const testResult = await phaseLocalTest(setupResult.workdir, config)
    iteration.phases.localTest = {
      name: Phase.LocalTest,
      status: testResult.allPassed ? 'passed' : 'failed',
      output: testResult
    }
    
    // Phase 6: Push & PR
    const prResult = await phasePushAndPR(
      setupResult.workdir,
      discoveryResult.issue,
      implementResult.commit,
      config
    )
    iteration.prNumber = prResult.prNumber
    iteration.prUrl = prResult.prUrl
    iteration.phases.pushAndPR = {
      name: Phase.PushAndPR,
      status: 'passed',
      output: prResult
    }
    
    // Phase 7: Fork CI
    const ciResult = await phaseForkCI(
      prResult.prNumber,
      config.forkOwner,
      config
    )
    iteration.phases.forkCI = {
      name: Phase.ForkCI,
      status: ciResult.passed ? 'passed' : 'failed',
      output: ciResult
    }
    
    // Phase 8: Engagement
    const engagementResult = await phaseEngagement(
      prResult.prNumber,
      config,
      discoveryResult.issue
    )
    iteration.phases.engagement = {
      name: Phase.Engagement,
      status: engagementResult.status === 'merged' ? 'passed' : 'failed',
      output: engagementResult
    }
    
    if (engagementResult.status !== 'merged') {
      iteration.status = 'failed'
      iteration.error = {
        phase: Phase.Engagement,
        reason: `PR ${engagementResult.status}`,
        retryCount: 0,
        recoverable: false
      }
      return iteration
    }
    
    // Phase 9: Success
    const successResult = await phaseSuccess(
      prResult.prNumber,
      prResult.branch,
      setupResult.workdir,
      config,
      iteration.metadata!
    )
    iteration.phases.success = {
      name: Phase.Success,
      status: 'passed',
      output: successResult
    }
    
    iteration.status = 'success'
    iteration.metadata!.mergedAt = new Date().toISOString()
    iteration.metadata!.mergeTimeMs = successResult.mergeTimeMs
    
    return iteration
  } catch (error) {
    iteration.status = 'failed'
    iteration.error = {
      phase: Phase.Discovery, // default
      reason: (error as Error).message,
      retryCount: 0,
      recoverable: false
    }
    return iteration
  }
}
```

### Individual Phase Functions (Signature Examples)

```typescript
// Callable directly by other agents

async function discovery(
  config: SkillConfig,
  userRequest?: UserRequest
): Promise<DiscoveryResult>

async function analysis(
  issue: GitHubIssue,
  config: SkillConfig
): Promise<AnalysisResult>

async function forkSetup(
  config: SkillConfig
): Promise<ForkSetupResult>

async function implement(
  issue: GitHubIssue,
  fixPlan: FixPlan,
  workdir: string,
  config: SkillConfig
): Promise<ImplementResult>

async function localTest(
  workdir: string,
  config: SkillConfig
): Promise<LocalTestResult>

async function pushAndPR(
  workdir: string,
  issue: GitHubIssue,
  commit: Commit,
  config: SkillConfig
): Promise<PushAndPRResult>

async function forkCI(
  prNumber: number,
  forkOwner: string,
  config: SkillConfig
): Promise<ForkCIResult>

async function engagement(
  prNumber: number,
  config: SkillConfig,
  issue: GitHubIssue
): Promise<EngagementResult>

async function success(
  prNumber: number,
  branch: string,
  workdir: string,
  config: SkillConfig,
  metrics: IterationMetrics
): Promise<SuccessResult>

// Utility functions

async function validateQualityGates(
  workdir: string,
  gates: QualityGate[],
  maxRetries: number = 3
): Promise<GateResult[]>

async function engageDiscord(
  issue: GitHubIssue,
  phase: Phase,
  context: any,
  config: SkillConfig
): Promise<DiscordEngagementResult>

async function getAlignmentScore(
  issue: GitHubIssue,
  roadmapAreas: RoadmapArea[]
): Promise<number>

async function estimateScope(
  issue: GitHubIssue
): Promise<'small' | 'medium' | 'large'>

async function isOutOfScope(
  issue: GitHubIssue
): Promise<boolean>

async function requiresDiscussion(
  issue: GitHubIssue,
  fixPlan: FixPlan
): Promise<boolean>
```

---

## Integration Examples

### 1. Standalone Autonomous Loop

```typescript
const config: SkillConfig = {
  owner: 'crynta',
  repo: 'terax-ai',
  forkOwner: 'marlonmuthiani',
  forkRepo: 'terax-ai',
  githubToken: process.env.GITHUB_TOKEN,
  maxIterations: 5,
  qualityGates: [
    {
      name: 'pnpm-lint',
      command: 'pnpm lint',
      timeout: 60000,
      optional: false,
      retryable: true
    },
    // ... other gates
  ],
  platforms: ['Linux', 'macOS'],
  prGateRules: [
    { rule: 'no-breaking-changes', enforced: true },
    { rule: 'max-bundle-size', enforced: true, threshold: 50000 }
  ]
}

const result = await autoPRTerax(config, {
  workType: 'bugfix',
  targetRoadmapArea: 'test-coverage',
  autoSubmitIfNoDiscussionNeeded: true
})

console.log(`Merged: ${result.successCount}/${result.iterations.length}`)
console.log(`Cycle time avg: ${result.metrics.avgCycleTimeMs}ms`)
```

### 2. User-Driven: Fix Specific Issue

```typescript
const result = await autoPRTerax(config, {
  issueNumber: 949,
  autoSubmitIfNoDiscussionNeeded: true,
  stopOnFirstSuccess: true,
  onPRMerged: (prNumber, metrics) => {
    console.log(`PR #${prNumber} merged in ${metrics.cycleTimeMs}ms`)
  }
})
```

### 3. Multi-Agent: Code Gen + Auto-PR + Review

```typescript
const codeGenAgent = new CodeGenerationAgent()
const autoPRAgent = new AutoPRTeraxAgent(config)
const reviewAgent = new ReviewAgent()

// Code gen produces fixes
const generatedFixes = await codeGenAgent.generateFixes(issues)

// Auto-PR submits them with full lifecycle
autoPRAgent.on('fork-ci-passed', async (event) => {
  // Review agent meta-reviews the PR
  await reviewAgent.reviewPR(event.prNumber)
})

for (const fix of generatedFixes) {
  await autoPRAgent.run({
    userRequest: {
      issueNumber: fix.issueNumber,
      autoSubmitIfNoDiscussionNeeded: true
    }
  })
}
```

### 4. Integrated: Learning Loop

```typescript
interface PRPattern {
  workType: ContributionType
  roadmapArea: RoadmapArea
  scope: 'small' | 'medium' | 'large'
  successRate: number
  avgCycleTime: number
}

const learningAgent = {
  patterns: new Map<string, PRPattern>(),
  
  async recordSuccess(result: IterationResult) {
    const key = `${result.metadata?.filesChanged.length}-files`
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        workType: 'fix',
        roadmapArea: 'test-coverage',
        scope: 'small',
        successRate: 0,
        avgCycleTime: 0
      })
    }
    const pattern = this.patterns.get(key)!
    pattern.successRate = (pattern.successRate + 100) / 2
    pattern.avgCycleTime = result.metadata!.mergeTimeMs!
  },
  
  async recommendNextIssue(issues: GitHubIssue[]) {
    // Return issue most likely to succeed based on patterns
    return issues.sort((a, b) => 
      (b.assignees.length || 0) - (a.assignees.length || 0)
    )[0]
  }
}

const result = await autoPRTerax(config)
for (const iteration of result.iterations) {
  if (iteration.status === 'success') {
    await learningAgent.recordSuccess(iteration)
  }
}
```

---

## Configuration Examples

### Example 1: Conservative (Bug Fixes Only)

```typescript
const config: SkillConfig = {
  owner: 'crynta',
  repo: 'terax-ai',
  forkOwner: 'marlonmuthiani',
  forkRepo: 'terax-ai',
  githubToken: process.env.GITHUB_TOKEN,
  
  // Conservative settings
  maxIterations: 3,
  maxRetries: 2,
  requireDiscussionAbove: 100, // stricter
  
  qualityGates: [
    { name: 'pnpm-lint', command: 'pnpm lint', timeout: 60000, optional: false, retryable: true },
    { name: 'pnpm-check-types', command: 'pnpm check-types', timeout: 30000, optional: false, retryable: false },
    { name: 'pnpm-test', command: 'pnpm test', timeout: 120000, optional: false, retryable: true },
  ],
  
  prGateRules: [
    { rule: 'no-breaking-changes', enforced: true },
    { rule: 'max-bundle-size', enforced: true, threshold: 25000 },
    { rule: 'security-review', enforced: true }
  ]
}
```

### Example 2: Aggressive (Full Spectrum)

```typescript
const config: SkillConfig = {
  owner: 'crynta',
  repo: 'terax-ai',
  forkOwner: 'marlonmuthiani',
  forkRepo: 'terax-ai',
  githubToken: process.env.GITHUB_TOKEN,
  
  // Aggressive settings
  maxIterations: 10,
  maxRetries: 3,
  requireDiscussionAbove: 300,
  maxFilesTouch: 10,
  maxLinesChanged: 1000,
  
  qualityGates: [
    { name: 'pnpm-lint', command: 'pnpm lint', timeout: 60000, optional: false, retryable: true },
    { name: 'pnpm-check-types', command: 'pnpm check-types', timeout: 30000, optional: false, retryable: false },
    { name: 'pnpm-test', command: 'pnpm test', timeout: 120000, optional: false, retryable: true },
    { name: 'cargo-clippy', command: 'cargo clippy --all-targets --locked -- -D warnings', timeout: 180000, optional: false, retryable: true },
    { name: 'cargo-test', command: 'cargo test --locked', timeout: 300000, optional: false, retryable: true },
  ],
  
  prGateRules: [
    { rule: 'no-breaking-changes', enforced: true },
    { rule: 'max-bundle-size', enforced: true, threshold: 100000 },
    { rule: 'platform-parity', enforced: true }
  ]
}
```

---

## References & Dependencies

- **CONTRIBUTING.md:** Full contribution guidelines
- **ROADMAP.md:** Project scope and direction
- **TERAX.md:** Architecture and internals
- **GitHub REST API v3:** Issues, PRs, Actions, Comments
- **GitHub GraphQL API:** PR reviews, comments, merges
- **Discord API:** Webhooks, messages, threads
- **Shell Integration:** git, pnpm, cargo
- **Node.js >= 18:** Async/await, Promise
- **TypeScript >= 5.0:** Strict mode, interfaces

---

## Event System

```typescript
interface EventEmitter {
  on(event: EventType, handler: (data: any) => Promise<void>): void
  off(event: EventType, handler: (data: any) => Promise<void>): void
  emit(event: EventType, data: any): Promise<void>
}

enum EventType {
  // Phase events
  PhaseStarted = 'phase-started',
  PhaseCompleted = 'phase-completed',
  PhaseFailed = 'phase-failed',
  
  // Discovery events
  IssueDiscovered = 'issue-discovered',
  IssueFiltered = 'issue-filtered',
  
  // PR events
  PRCreated = 'pr-created',
  PRMerged = 'pr-merged',
  PRRejected = 'pr-rejected',
  
  // Discussion events
  DiscussionStarted = 'discussion-started',
  DiscussionResolved = 'discussion-resolved',
  DiscussionTimeout = 'discussion-timeout',
  
  // Error events
  QualityGateFailed = 'quality-gate-failed',
  ForkCIFailed = 'fork-ci-failed',
  ConflictDetected = 'conflict-detected',
  
  // Lifecycle events
  LoopStarted = 'loop-started',
  LoopCompleted = 'loop-completed',
  IterationStarted = 'iteration-started',
  IterationCompleted = 'iteration-completed'
}

// Usage
autoPRAgent.on(EventType.PRMerged, async (event) => {
  console.log(`PR #${event.prNumber} merged!`)
  await notifySlack(`Merged: ${event.prNumber}`)
})

autoPRAgent.on(EventType.QualityGateFailed, async (event) => {
  console.error(`Gate failed: ${event.gateName}`)
  await logMetrics(event)
})
```

---

## Monitoring & Observability

```typescript
interface ObservabilityConfig {
  enableLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  metrics: MetricsCollector
  tracing: TracingCollector
  errorReporting: ErrorReporter
}

interface MetricsCollector {
  recordPhaseTime(phase: Phase, durationMs: number): void
  recordQualityGateResult(gateName: string, passed: boolean, durationMs: number): void
  recordPRMerge(prNumber: number, cycleTimeMs: number): void
  recordDiscussionEngagement(hours: number, result: 'approved' | 'rejected' | 'timeout'): void
  flush(): Promise<void>
}

// Usage
const metrics = new PrometheusMetricsCollector()
config.metrics = metrics

// Later: query metrics
const mergeRate = await metrics.queryMergeRate() // 80%
const avgCycleTime = await metrics.queryAvgCycleTime() // 3 days
const qgPassRate = await metrics.queryQualityGatePassRate() // 95%
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-07 | **UNIFIED SKILL**: Merged loop + skill specs into single comprehensive spec |
| 1.0 | 2026-07 | Initial two-file spec (AGENT_CONTRIBUTION_LOOP.md + AGENT_CONTRIBUTION_SKILL.md) |

---

## FAQ

**Q: How do I start?**  
A: Copy the config template, set GitHub token, run `autoPRTerax(config)`.

**Q: What if a quality gate fails?**  
A: Retries automatically (max 3x) with exponential backoff. If still fails, moves to next issue.

**Q: How does discussion gating work?**  
A: Large changes (>200 LOC, multi-file, or features) post to Discord first. Agent waits for approval before coding.

**Q: Can I use this with other agents?**  
A: Yes. All phase functions are callable independently. Emit events for other agents to hook into.

**Q: What platforms are tested?**  
A: Config-driven. Default: Linux, macOS. Can add Windows, WSL.

**Q: How long does a typical PR take?**  
A: Small bugfix: 2-3 days. Feature with discussion: 5-7 days.

---

## License

Apache-2.0 (same as Terax)

