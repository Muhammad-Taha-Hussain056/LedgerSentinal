# 04. The Daily Developer Runbook: Your Daily Operating Checklist

> **The exact ritual to follow every single morning, throughout the day, and at the end of your shift.**
> Follow this checklist and you will never experience session burnout, lost work, or anxiety at your job.

---

## 1. Morning Routine (09:00 - 09:15)

```
[Wake Up / Arrive at Work]
       │
       ▼
1. Git Sync: git checkout main && git pull
       │
       ▼
2. Branch Check: git checkout feat/your-feature
       │
       ▼
3. Open docs/execution.md
       │ (Inspect: What task was left IN_PROGRESS or NOT_STARTED?)
       ▼
4. Open Clean Terminal & Launch Fresh AI Session
```

### The Exact Morning Kickoff Prompt:
```text
We are resuming work on this repository.
Read CLAUDE.md and docs/execution.md.
Run 'git status' to inspect current working tree.
Identify the first approved task whose dependencies are complete.

Before writing code:
1. State the Task ID and intended outcome.
2. List the exact 2 to 3 files you plan to touch.
3. Name the exact verification command we will run to prove it works.

Wait for my approval.
```

---

## 2. The 30-Minute Sliced Sprint Ritual (Repeated All Day)

Never let a session exceed 30 minutes. Run this cycle for every single task:

```
┌────────────────────────────────────────────────────────┐
│ STEP 1: APPROVE SCOPE (1 min)                          │
│ Look at the files the AI proposed. If > 3 files,       │
│ tell it: "Too big. Only do [file A and B] first."      │
├────────────────────────────────────────────────────────┤
│ STEP 2: IMPLEMENT & TEST (15 mins)                     │
│ Tell the AI: "Approved. Implement and run the test."   │
│ AI writes code, runs 'npm test', and reports output.   │
├────────────────────────────────────────────────────────┤
│ STEP 3: RUN MECHANICAL PROOFS (2 mins)                 │
│ In your terminal:                                      │
│   npm run typecheck                                    │
│   npm run lint                                         │
│   npm test path/to/spec.ts                             │
│ If all 3 pass ──► Code is verified.                   │
├────────────────────────────────────────────────────────┤
│ STEP 4: 60-SECOND GIT DIFF AUDIT (1 min)               │
│ Run: git diff                                          │
│ Check: Did it edit any unrelated files?                │
│ Check: Did it add any random unapproved packages?      │
│ Check: Did it weaken test assertions?                  │
├────────────────────────────────────────────────────────┤
│ STEP 5: COMMIT & EXIT (2 mins)                         │
│ Tell AI: "Update docs/execution.md with VERIFIED status│
│ and test evidence. Stop coding."                       │
│ In terminal:                                           │
│   git add .                                            │
│   git commit -m "feat(module): complete TASK-ID"       │
│ CLOSE THE SESSION. Stretch for 3 minutes.              │
└────────────────────────────────────────────────────────┘
```

---

## 3. The Emergency Protocol: What to Do When a Bug Occurs

If a test or build fails, **DO NOT PANIC.** Follow the strict **Two-Strike Protocol**:

```
Test Fails
   │
   ├─► STRIKE 1: Run Diagnostic Prompt
   │     "A test failed. Do not modify files. Diagnose the root cause,
   │      state your hypothesis, and show the proposed diff."
   │     (Review proposed diff -> Approve -> Test again)
   │
   ├─► Test Still Fails? (STRIKE 2)
   │     Give the AI ONE more chance with the exact compiler error message.
   │
   └─► Test Still Fails After Strike 2? (HARD STOP)
         1. In terminal: git checkout . (Revert all messy edits from this turn)
         2. DO NOT let the AI try a 3rd time in this chat.
         3. Note the error in docs/execution.md as a blocker.
         4. Close the session. Open a fresh session dedicated to diagnosis.
```

---

## 4. End-of-Day Wrap-Up (05:00 - 05:15)

Never leave your desk with uncommitted code or open questions.

1. **Run Git Status:** Ensure working tree is clean.
2. **Pre-PR Audit:** Run the `security-reviewer` and `contract-reviewer` prompts (from [02-HYBRID-AGENT-WORKFLOW.md](02-HYBRID-AGENT-WORKFLOW.md)).
3. **Push to Remote:**
   ```bash
   git push origin feat/your-feature
   ```
4. **Update `docs/execution.md`:** Ensure "Current Session State" has the exact next step for tomorrow morning.
5. **Standup / Manager Update:** Copy this template into Slack or your daily standup tool:
   > *"Today I completed [Module Name] through 4 test-verified tasks. The Drizzle schema, repository layer, and domain service are completed with all unit tests green. Typecheck and lint are 100% passing. Tomorrow morning I will wire the controller endpoints and submit the PR."*

You log off knowing your code is clean, tested, and impossible to criticize.
