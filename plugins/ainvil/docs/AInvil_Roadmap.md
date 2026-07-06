# AInvil Roadmap

## Current Position

AInvil is currently at the following level:

```text
Core Release Ready / Release Candidate
Product MVP Ready Candidate
Public Release Ready: No
```

AInvil has validated an evidence-grounded Unity game production workflow through the `DungeonRecoveryCompany` single-project case study.

The verified workflow includes:

```text
User request
→ Director / Orchestrator / Specialist Agents
→ Unity implementation
→ Compile Gate
→ Play Mode validation
→ Visual Validation
→ Validation Evidence
→ Dashboard / Productization / Release Readiness
```

AInvil does **not** currently claim `Public Release Ready`.

---

## Completed

The following capabilities have been implemented and validated with evidence.

### Core Platform

* Core Release Candidate
* Fresh Workspace Verification
* Canonical Unity Bridge Package Verification
* Unity Bridge operational smoke validation
* Production State Graph
* Productization report
* Release Readiness report
* RC baseline manifest
* Project dashboard
* Production Core Review Approved

### Unity Validation Pipeline

* Compile Check
* Compile Gate Safety
* Play Mode validation
* Visual Validation Gate
* EnvironmentBlocked / UnityBridgeDisconnected classification
* LastKnownPassed evidence preservation
* Regression Suite
* Full Regression: `21 passed, 0 failed, 0 blocked`

### Product MVP Case Study

Validated through `DungeonRecoveryCompany`:

* Product MVP E2E
* Human Playability Review Passed
* Human Playable First Build Candidate
* Windows Build Verification
* Procedural Recovery Job
* Random Startup Seed
* Fixed Seed Determinism for validation
* First Person Control / Mouse Look
* Procedural Space Quality
* Visual Validation

---

## Near-Term Roadmap

These are the next highest-priority items.

### 1. DungeonRecoveryCompany Gameplay Loop Expansion

Goal: turn the validated procedural recovery job into a more complete playable loop.

Planned work:

* Extraction / Return-to-Company loop
* Reward / company funds loop
* Basic company result screen
* Clear success / failure state
* Improved recovery interaction feedback
* Basic save/load for run results

Completion criteria:

* Player can enter a dungeon.
* Player can complete recovery objectives.
* Player can return to the company.
* Reward is calculated and displayed.
* Company funds or progress state is updated.
* The loop is validated through Play Mode evidence.

---

### 2. Bridge Watchdog / Auto-Recovery

Goal: reduce validation interruption caused by Unity Bridge disconnects.

Planned work:

* Bridge health watchdog
* Clear recovery instructions when the bridge is down
* Better `EnvironmentBlocked` diagnostics
* Optional retry policy for transient bridge failures
* Distinguish editor closed / port closed / RPC failure / compile wait timeout

Completion criteria:

* Bridge disconnects are reported with actionable next steps.
* Regression reports `blocked` instead of `failed` for environment issues.
* LastKnownPassed evidence remains preserved.
* No product failure is reported solely because the bridge disconnected.

---

### 3. Public Installation Preparation

Goal: make AInvil easier to install and reproduce outside the original development environment.

Planned work:

* Installation guide
* Unity package setup guide
* Environment doctor improvements
* Path configuration guide
* Example project setup guide
* Troubleshooting guide

Completion criteria:

* A fresh user can install the Unity Bridge package.
* A fresh Unity project can run the bridge smoke scenario.
* Setup failures produce clear diagnostic messages.
* Core RC verification can be reproduced from documentation.

---

## Mid-Term Roadmap

### 4. Multi-Project Benchmark Expansion

Goal: move beyond a single-project case study.

Planned validation targets:

* Empty fresh Unity project
* Simple 2D prototype
* Simple 3D prototype
* Existing Unity project with scripts
* Project with compile errors
* Project with missing scene references
* Project with URP materials

Completion criteria:

* AInvil can run appropriate validation in multiple project types.
* Results are reported separately per project.
* Public claims remain limited to verified environments.

---

### 5. Longer Playability Tests

Goal: validate behavior beyond short Play Mode probes.

Planned work:

* Longer automated play sessions
* Repeated dungeon generation tests
* Repeated build verification
* Memory / console error monitoring
* Input stability checks

Completion criteria:

* AInvil can run longer validation without false Passed results.
* Runtime issues are captured as evidence.
* Stability limitations are clearly reported.

---

### 6. Better Game Feedback and Presentation

Goal: improve the playable quality of `DungeonRecoveryCompany`.

Planned work:

* Better recovery feedback
* Better object readability
* Improved lighting
* Basic sound effects
* Basic UI polish
* More meaningful props
* Clearer objective guidance

Completion criteria:

* Human playability review confirms the loop is understandable.
* Visual Validation confirms camera, UI, prompt, and objective visibility.
* Improvements remain validated through evidence.

---

## Public Release Roadmap

AInvil should not claim `Public Release Ready` until the following are addressed.

Required areas:

* User-facing installer or setup flow
* Robust onboarding documentation
* Multi-environment validation
* Multi-project benchmark coverage
* Bridge watchdog / recovery flow
* Clear error handling
* Clear distinction between sample evidence and operational evidence
* Public-facing examples
* Stable documentation for release levels
* Long-session stability checks

Potential Public Release entry criteria:

```text
Core RC reproducible on a fresh machine
Unity Bridge install flow documented
At least several Unity project types validated
Bridge failure recovery documented
Regression suite stable
Evidence/report schema stable
Public limitations clearly documented
```

---

## Not Yet

AInvil does not currently claim:

* Public Release Ready
* Production-finished commercial game
* Support for all Unity projects
* Fully automatic game production
* Human review is unnecessary
* Long-session stability
* Production-quality art direction
* Production-quality sound and effects
* Full reward, economy, and company management loop
* User-facing installer
* Robust UI/UX onboarding
* Multi-project benchmark completion

---

## Release Level Policy

Use these terms precisely.

### Core Release Ready / Release Candidate

AInvil Core, Unity Bridge smoke, evidence pipeline, review, productization, and release reports are verified.

This does not mean the full product is ready for public users.

### Product MVP Ready Candidate

AInvil produced and validated a playable Product MVP slice in `DungeonRecoveryCompany`.

This is a single-project case study result.

### Public Release Ready

Not claimed.

Requires public installation, broader documentation, stronger error handling, multi-environment confidence, stronger onboarding, and broader validation coverage.

---

## Safety Policy

AInvil should continue to preserve the following safety rules.

* Keep Compile Gate before Play Mode validation.
* Do not enter Play Mode when compile errors exist.
* Keep Visual Validation Gate for camera, shader, and UI visibility problems.
* Keep `EnvironmentBlocked` separate from product failure.
* Preserve LastKnownPassed evidence when live revalidation is blocked.
* Keep Example/Sample harnesses out of operational release gates.
* Keep public release claims separate from case-study evidence.
* Do not mark `Public Release Ready` from a single-project case study.
* Do not claim fully automatic game production.
* Do not remove human review from playability decisions.

---

## Summary

AInvil has reached a validated Product MVP case-study stage.

The next roadmap focus is:

```text
1. Expand the DungeonRecoveryCompany gameplay loop.
2. Improve Unity Bridge stability and recovery.
3. Prepare public installation and documentation.
4. Expand validation beyond a single Unity project.
```

AInvil is already strong as an evidence-grounded Unity game production workflow prototype.
The next challenge is moving from a validated single-project case study to a reproducible, user-facing product.
