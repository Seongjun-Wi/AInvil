# KPI Review Process

## 1. Purpose

The KPI Review Process defines how AInvil uses Studio KPIs to guide architectural evolution.

It prevents major decisions from being justified only by subjective confidence or feature count.

## 2. When To Run KPI Review

Run KPI Review:

- At the end of every AInvil dogfooding milestone.
- Before major architectural releases.
- After significant benchmark regressions.
- After repeated user corrections or overrides.
- After a governance, review, prompt, or validation process change.
- When an RFC claims measurable product improvement.

## 3. Inputs

KPI Review should use:

- Current KPI Dashboard.
- Previous KPI Dashboard.
- Relevant RFCs.
- Review records.
- Production Intelligence report.
- Validation evidence.
- Benchmark reports.
- Architecture Retrospective.
- Known user corrections, overrides, and complaints.

## 4. Review Questions

Ask:

- Which KPIs improved?
- Which KPIs regressed?
- Which KPIs are unknown or not collected?
- Which regressions are acceptable and why?
- Did the change improve real production outcomes or only add structure?
- Did governance reduce risk or add unnecessary friction?
- Did AInvil preserve creative ownership?
- Did recommendations become more useful and less noisy?
- Did validation honesty improve?
- Did traceability become stronger or more expensive?
- Should the next milestone prioritize capability, simplification, automation, or measurement?

## 5. Decision Outcomes

KPI Review can recommend:

- Proceed to release.
- Proceed with accepted regressions.
- Require benchmark improvement.
- Require governance simplification.
- Require documentation consolidation.
- Require prompt revision.
- Require validation improvement.
- Require RFC revision.
- Defer architecture work until more dogfooding evidence exists.

## 6. Release Rule

Major architectural releases should identify:

- Target KPIs.
- Actual KPI movement.
- Benchmark impact.
- Regression count.
- Accepted regressions.
- Follow-up actions.

If no measurable improvement exists, the release should explain whether the change was preventive, foundational, compatibility-driven, or speculative.

Speculative changes should not accumulate without dogfooding evidence.

## 7. Retrospective Integration

Architecture Retrospectives should include KPI movement.

Retrospectives should identify:

- KPIs that changed because of the milestone.
- KPIs that were too costly to collect.
- KPIs that failed to explain real outcomes.
- Missing KPIs that would have improved decision quality.
- KPI trends that should trigger new RFCs or governance updates.

## 8. Benchmark Integration

Capability Benchmark scores are product KPIs, but they do not replace operational KPIs.

Benchmark results show whether AInvil performs better on controlled scenarios. Operational KPIs show whether AInvil performs better in real dogfooding work.

Both are required for release confidence.
