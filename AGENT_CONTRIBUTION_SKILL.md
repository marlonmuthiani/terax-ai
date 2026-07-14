# Terax Continuous Contribution Skill

**Type:** Reusable Agent Skill  
**Version:** 1.0  
**Maintainer:** Agent contribution orchestration  
**Target:** `crynta/terax-ai` repository  
**License:** Apache-2.0  

---

## Overview

This skill enables autonomous agents to drive high-quality contributions to `crynta/terax-ai` through a closed-loop workflow: issue discovery, analysis, implementation, testing, and PR submission with intelligent gating and discussion engagement.

**Key properties:**
- ✓ Aligns with project ROADMAP and CONTRIBUTING guidelines
- ✓ Gated PR submission (no low-quality code pushed)
- ✓ Automatic fork CI validation
- ✓ Discussion engagement for out-of-scope or complex work
- ✓ Retry logic for transient failures
- ✓ User-initiated + autonomous loops

---

## Skill Signature

```typescript
async function teraxContributionLoop(
  config: SkillConfig,
  userRequest?: UserRequest,
  loopConfig?: LoopConfig
): Promise<LoopResult>
```

---

## Configuration

### SkillConfig

```typescript
interface SkillConfig {
  // Repository
  owner: 'crynta'
  repo: 'terax-ai'
  defaultBranch: 'main'
  
  // Fork (required for autonomous pushes)
  forkOwner: string // e.g., 'marlonmuthiani'
  forkRepo: string // e.g., 'terax-ai'
  githubToken: string // with push to fork + read upstream
  
  // Discord (for discussion engagement)
  discordWebhook?: string
  discordChannel?: string // #contributions
  
  // Loop behavior
  maxIterations: number // default: 5
  maxRetries: number // per iteration: default 3
  testTimeoutMs: number // default: 600000 (10min)
  
  // Quality gates (must all pass)
  qualityGates: QualityGate[]
  
  // Platform testing
  platforms: Platform[] // ['macOS', 'Linux', 'Windows']
  
  // Upstream PR gating
  prGateRules: PRGateRule[]
}

interface QualityGate {
  name: string
  command: string | string[] // pnpm lint, cargo test, etc.
  timeout: number
  optional: boolean // false = blocking
  errorMessage?: string
}

interface PRGateRule {
  rule: 'no-breaking-changes' | 'max-bundle-size' | 'platform-parity' | 'security-review'
  enforced: boolean
  threshold?: string | number
}

enum Platform {
  macOS = 'macOS',
  Linux = 'Linux',
  Windows = 'Windows',
  WSL = 'WSL'
}

interface SkillConfig {
  // ... (shown above)
  maxFilesTouch?: number // default: 5 (warn if exceeded)
  maxLinesChanged?: number // default: 500 (warn if exceeded)
  requireDiscussionAbove?: number // lines: default 200
}
```

### UserRequest (Optional)

```typescript
interface UserRequest {
  // Either specify an issue or a description
  issueNumber?: number
  issueDescription?: string
  
  // Work type preference
  workType?: 'bugfix' | 'feature' | 'docs' | 'refactor' | 'any'
  
  // Constraints
  maxTimeHours?: number // stop loop after N hours
  targetRoadmapArea?: 'test-coverage' | 'bundle-opt' | 'platform-bugs' | 'docs' | 'themes' | 'providers'
  
  // Loop control
  stopOnFirstSuccess?: boolean // default: false (continue loop)
  autoSubmitIfNoDiscussionNeeded?: boolean // default: true
  
  // Feedback hooks
  onPhaseComplete?: (phase: Phase, result: any) => void
  onForkCIFail?: (error: Error) => Promise<void>
}

interface LoopConfig {
  iterations: LoopIteration[]
  retryPolicy: RetryPolicy
  engagementStrategy: EngagementStrategy
}

interface RetryPolicy {
  maxAttemptsPerGate: number
  backoffMs: number
  exponentialBackoff: boolean
}

interface EngagementStrategy {
  monitorPRPollingIntervalSec: number
  discordNotifyOnSubmit: boolean
  discordNotifyOnMerge: boolean
  autoFollowUpAfterHours: number
}
```

### LoopResult

```typescript
interface LoopResult {
  status: 'success' | 'partial' | 'failed'
  iterations: IterationResult[]
  successCount: number
  failureCount: number
  totalTimeMs: number
  
  metrics: {
    avgCycleTimeMs: number
    qualityGatePassRate: number
    prMergeRate: number
    discussionEngagementCount: number
  }
}

interface IterationResult {
  index: number
  phase: Phase
  issueNumber: number
  issueTitle: string
  prNumber?: number
  status: 'success' | 'failed' | 'pending' | 'retrying'
  
  discoveryPhase?: {
    candidateCount: number
    selectedReason: string
    alignmentScore: number // 0-100
  }
  
  implementationPhase?: {
    filesChanged: string[]
    linesChanged: number
    testsAdded: number
  }
  
  testingPhase?: {
    qualityGates: GateResult[]
    manualTestNotes: string
  }
  
  submissionPhase?: {
    prUrl: string
    branchName: string
    commitCount: number
  }
  
  engagementPhase?: {
    discussionStarted: boolean
    feedbackReceived: FeedbackType[]
    changesRequested: boolean
  }
  
  error?: {
    phase: Phase
    reason: string
    retryCount: number
  }
}

interface GateResult {
  gateName: string
  passed: boolean
  duration: number
  output?: string
  error?: string
}

enum FeedbackType {
  RequestedChanges = 'requested-changes',
  Approved = 'approved',
  Commented = 'commented',
  ReviewRequested = 'review-requested',
  Dismissed = 'dismissed'
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

## Skill Orchestration Flow

### Primary Loop

```
INIT(config, userRequest)
  ↓
LOOP (iteration 0..maxIterations)
  ├─ Phase 1: DISCOVERY
  │  ├─ Query issues: good-first-issue OR help-wanted (if no userRequest)
  │  ├─ Filter by roadmap alignment
  │  ├─ Check if already solved
  │  └─ Select candidate → emit(discovered, issue)
  │
  ├─ Phase 2: ANALYSIS
  │  ├─ Read issue fully
  │  ├─ Check out-of-scope list
  │  ├─ Determine if discussion required
  │  └─ If YES → goto Phase 7; If NO → continue
  │
  ├─ Phase 3: FORK_SETUP
  │  ├─ Clone/update fork
  │  ├─ Create feature branch (prefix/scope)
  │  ├─ pnpm install + Rust toolchain check
  │  └─ Baseline: all quality gates must pass → emit(baseline, gates)
  │
  ├─ Phase 4: IMPLEMENT
  │  ├─ Make minimal focused change
  │  ├─ Add test if perf-sensitive path
  │  ├─ Format code (cargo fmt, pnpm lint)
  │  └─ Commit with conventional format → emit(implemented, commit)
  │
  ├─ Phase 5: LOCAL_TEST
  │  ├─ Run quality gates: lint, check-types, test, clippy, cargo test
  │  ├─ If ANY fail → retry up to maxRetries
  │  ├─ If ALL pass → emit(tests_passed, gates)
  │  ├─ Manual test: pnpm tauri dev + repro steps
  │  └─ Check perf: terminal render, PTY, AI streaming
  │
  ├─ Phase 6: PUSH_AND_PR
  │  ├─ git push origin branch
  │  ├─ Create PR on upstream (crynta/terax-ai main)
  │  ├─ Fill PR template: problem, solution, testing, screenshots
  │  ├─ Link related issues (#XYZ)
  │  └─ emit(pr_created, prUrl) → emit(pr_linking, linkedIssues)
  │
  ├─ Phase 7: FORK_CI
  │  ├─ Poll fork CI status
  │  ├─ If fail → fix locally (goto Phase 4), retry maxRetries
  │  ├─ If pass → emit(fork_ci_passed)
  │  ├─ Check for conflicts with main
  │  └─ If conflicts → rebase, re-test, retry
  │
  ├─ Phase 8: ENGAGEMENT
  │  ├─ Poll PR for maintainer comments every 5 min
  │  ├─ If changes requested → implement (goto Phase 4)
  │  ├─ If approved → wait for merge → emit(pr_merged)
  │  ├─ If discussion needed → post in Discord, await response
  │  ├─ If rejected → analyze reason, log, move to next issue
  │  └─ Timeout: if no response after 48h, abandon
  │
  ├─ Phase 9: SUCCESS
  │  ├─ Clean up branch
  │  ├─ Log success metrics
  │  ├─ emit(iteration_success, metrics)
  │  └─ If stopOnFirstSuccess → RETURN result
  │
  └─ LOOP_END (if maxIterations reached or user stops)

RETURN (LoopResult)
```

---

## Core Functions

### 1. discovery(config, userRequest?)

**Purpose:** Find and select a contribution opportunity.

```typescript
async function discovery(
  config: SkillConfig,
  userRequest?: UserRequest
): Promise<{
  issue: GitHubIssue
  alignmentScore: number
  discussionRequired: boolean
  estimatedScope: 'small' | 'medium' | 'large'
}> {
  // If userRequest.issueNumber: fetch and return
  // Else: Query GitHub API
  //   - label:good-first-issue OR label:help-wanted
  //   - state:open
  //   - NOT assigned
  //   - NOT closed in last 24h
  
  // Filter by alignment with ROADMAP.md
  // Exclude out-of-scope categories
  // Return highest-priority candidate
}
```

### 2. analysis(issue, config)

**Purpose:** Validate alignment and determine discussion needs.

```typescript
async function analysis(
  issue: GitHubIssue,
  config: SkillConfig
): Promise<{
  discussionRequired: boolean
  discussionReason?: string
  fixPlan: {
    filesAffected: string[]
    estimatedLOC: number
    testRequired: boolean
    platformsAffected: Platform[]
  }
  alignmentScore: number // 0-100
}> {
  // Check ROADMAP.md scope
  // Check CONTRIBUTING.md "Discuss first" rules
  // Return discussion requirement + fix plan
}
```

### 3. forkSetup(config)

**Purpose:** Clone/update fork, create branch, verify baseline.

```typescript
async function forkSetup(
  config: SkillConfig
): Promise<{
  branch: string
  baselineGates: GateResult[]
  workdir: string
}> {
  // Clone or update fork
  // Create feature branch
  // Run baseline quality gates
  // All must pass before proceeding
}
```

### 4. implement(issue, fixPlan, workdir)

**Purpose:** Write code to fix the issue.

```typescript
async function implement(
  issue: GitHubIssue,
  fixPlan: FixPlan,
  workdir: string
): Promise<{
  commit: {
    hash: string
    message: string
    filesChanged: string[]
  }
  testFiles: string[]
  linesChanged: number
}> {
  // Apply fix to minimal set of files
  // Add test if perf-sensitive path
  // Format code (cargo fmt, lint)
  // Commit with conventional format
}
```

### 5. localTest(workdir, config)

**Purpose:** Run all quality gates locally + manual testing.

```typescript
async function localTest(
  workdir: string,
  config: SkillConfig
): Promise<{
  gateResults: GateResult[]
  allPassed: boolean
  manualTestNotes: string
}> {
  // Run each QualityGate sequentially
  // If any fail: retry up to maxRetries
  // Manual test: pnpm tauri dev, verify fix
  // Check perf: profile hot paths
  // Return results
}
```

### 6. pushAndPR(workdir, issue, config)

**Purpose:** Push to fork and create upstream PR.

```typescript
async function pushAndPR(
  workdir: string,
  issue: GitHubIssue,
  commit: Commit,
  config: SkillConfig
): Promise<{
  prNumber: number
  prUrl: string
  branch: string
}> {
  // git push origin branch
  // Create PR on crynta/terax-ai
  // Fill template: problem, solution, testing
  // Link related issues
  // Return PR metadata
}
```

### 7. forkCI(prNumber, config)

**Purpose:** Wait for and validate fork CI + handle conflicts.

```typescript
async function forkCI(
  prNumber: number,
  config: SkillConfig,
  timeout: number = 600000
): Promise<{
  passed: boolean
  duration: number
  conflictResolved?: boolean
  logs?: string
}> {
  // Poll fork Actions
  // If fail: return error for retry
  // Check for conflicts with main
  // If conflict: rebase, retry
  // If pass: return success
}
```

### 8. engagement(prNumber, config, issue)

**Purpose:** Monitor PR for feedback, engage in discussions.

```typescript
async function engagement(
  prNumber: number,
  config: SkillConfig,
  issue: GitHubIssue,
  pollingIntervalSec: number = 300
): Promise<{
  status: 'merged' | 'changes-requested' | 'discussion-needed' | 'rejected' | 'timeout'
  feedback: FeedbackType[]
  changesImplemented?: boolean
  discussionThreads?: string[]
}> {
  // Poll PR for comments every pollingIntervalSec
  // If changes requested → emit event for retry
  // If discussion suggested → post in Discord
  // If approved → wait for merge
  // If rejected → analyze reason
  // Timeout: 48 hours
}
```

### 9. discordEngage(issue, phase, context)

**Purpose:** Engage with maintainer via Discord for discussion.

```typescript
async function discordEngage(
  issue: GitHubIssue,
  phase: Phase,
  context: {
    fixPlan?: FixPlan
    prNumber?: number
    prUrl?: string
    feedback?: string
  },
  config: SkillConfig
): Promise<{
  responsesReceived: Message[]
  alignment: 'approved' | 'rejected' | 'needs-revision' | 'no-response'
  actionItems?: string[]
}> {
  // Post in Discord #contributions
  // Include issue link, question, context
  // Poll for response
  // Timeout: 24-48 hours
  // Return alignment + action items
}
```

---

## Error Handling

### Retry Policy

```typescript
interface RetryScenario {
  scenario: string
  maxAttempts: number
  backoffMs: number
  exponentialBackoff: boolean
  
  examples: {
    qualityGateFail: 3 // retry local tests
    forkCIFail: 3 // retry fork CI
    conflictDetected: 2 // rebase and retry
    discardAndRetry: 1 // skip issue, move to next
  }
}
```

### Error Branches

```
ERROR: Quality gate fails
  → Log failure details
  → Fix locally (Phase 4)
  → Rerun gate
  → If still fail after maxRetries: abort iteration

ERROR: Fork CI fails
  → Check fork Actions logs
  → Fix cause locally
  → Push and retry
  → If still fail: abort iteration

ERROR: PR conflicts with main
  → git rebase origin/main
  → Resolve conflicts
  → Force push
  → Retry fork CI

ERROR: Maintainer requests changes
  → Implement feedback (Phase 4)
  → Push (no force-push after review)
  → Rerun gate
  → Wait for re-review

ERROR: PR rejected
  → Log reason
  → If out-of-scope: mark complete, move to next
  → If too large: ask for guidance in Discord
  → Move to next issue

ERROR: No Discord response after 48h
  → Assume no alignment
  → Move to next issue
```

---

## Gating Rules

### Pre-Submission Gates

- ✓ All quality gates pass (100% enforcement)
- ✓ No files touched beyond plan (max deviation: +1 file)
- ✓ No heavy dependencies added (>50KB gzip, >5MB Rust)
- ✓ Platform parity preserved (if touchable on target OS)
- ✓ No breaking changes without migration notes

### Upstream PR Acceptance Gates

- ✓ Fork CI passes
- ✓ No conflicts with main
- ✓ PR template complete
- ✓ Manual testing documented
- ✓ Related issues linked (Fixes #N)

### Engagement Gates

- ✓ If maintainer requests changes: implement + retry
- ✓ If discussion needed: engage in Discord first
- ✓ If rejected: log reason and move to next issue
- ✓ If approved: merge (automatically after maintainer action)

---

## Success Metrics

```typescript
interface SuccessMetrics {
  // Per iteration
  cycleTimeMs: number
  qualityGatePassRate: number // 0-100
  prMergeRate: number // % of submitted PRs that merged
  
  // Aggregate
  totalIterations: number
  successfulMerges: number
  discussionEngagements: number
  retryCount: number
  totalTimeMs: number
  
  // Quality
  avgFilesChangedPerPR: number
  avgLinesChangedPerPR: number
  testCoverageAddedPerPR: number
  zeroQualityGateFailures: boolean
}
```

---

## Integration with Other Agents

This skill can be composed with:

- **Code generation agents:** Use output of code gen → validate with this skill
- **Review agents:** Feed PR metadata to review agent for meta-review
- **Documentation agents:** Request docs updates from this skill's feedback
- **Learning agents:** Log patterns from successful PRs for future iterations

---

## Example Usage

```typescript
// Standalone loop: autonomous contribution
const skill = new TeraxContributionSkill(config)
const result = await skill.run({
  maxIterations: 5,
  userRequest: {
    workType: 'bugfix',
    targetRoadmapArea: 'test-coverage'
  }
})

// User-driven: fix specific issue
const result = await skill.run({
  userRequest: {
    issueNumber: 949,
    autoSubmitIfNoDiscussionNeeded: true
  }
})

// Integrated with other agents
const skill = new TeraxContributionSkill(config)
skill.on('phase-complete', (phase, result) => {
  if (phase === 'fork-ci-passed') {
    reviewAgent.reviewPR(result.prNumber)
  }
})
const result = await skill.run({ maxIterations: 3 })
```

---

## References

- **CONTRIBUTING.md:** Full contribution guidelines (`crynta/terax-ai`)
- **ROADMAP.md:** Project scope and priorities
- **GitHub API:** PR, Issue, Actions endpoints
- **Discord API:** Webhook + message endpoints
- **Tauri Docs:** Development and build workflows

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07 | Initial skill: discovery → PR loop with gating |

