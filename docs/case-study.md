# Shift Triage case study

## Project brief

A food-bank shift coordinator decides which open roles to cover with available staff after a call-out, and which gaps to escalate before dispatch. The assumed current workflow compares a roster, availability messages, and role requirements in a spreadsheet. Assigning the first available person can consume the only worker qualified for a later role. The coordinator needs a defensible proposal before contacting the crew.

All staff, locations, priorities, and costs are synthetic. Stakeholder needs and rules are hypotheses. The tool models one site, a single planning window, one assignment per person, full-window availability, and a cap on incremental labor spend.

## Acceptance criteria

1. Load a populated staffing scenario in a signed-out browser without a file or key.
2. Enforce role qualification, confirmed availability, no duplicate workers, and a hard budget cap.
3. Prefer covering critical roles, then standard roles, then lower cost. Show eligibility and reasons for gaps.
4. Recompute after a budget or workforce change and let the coordinator review a proposal.
5. When coverage is impossible, keep the feasible partial plan and identify the unfilled roles.

The evaluation outcome is critical roles covered at the same budget compared with roster-order assignment. The expected reference cases are two critical roles at $60 with the initial roster, and one after the sole dispatch-qualified worker calls out. This assesses policy behavior on synthetic fixtures.

## Decision and alternatives

The primary decision is which role assignments to propose and which uncovered roles require escalation. The coordinator can reduce the labor cap or change a worker's confirmation status and inspect the revised plan before marking it reviewed. The review marker is local to the open page and represents no external approval or notification.

Roster-order assignment was chosen as a simple baseline. It uses the same hard constraints but can spend scarce qualifications early. A weighted score was considered, but a fixed lexicographic priority communicates the assumed policy directly: critical work first, then standard work, then lowest spend. A calendar integration would add access and maintenance costs without testing that policy.

## Worked example and observed results

At $60, roster order assigns Avery to receiving for $35. This leaves dispatch vacant because Avery is the only dispatch-qualified worker. The planner puts Morgan on receiving for $25 and Avery on dispatch for $35. Critical coverage goes from 1/2 to 2/2 in the fixture. Packing and check-in remain open.

Set Avery to Called out. The recommendation covers receiving, packing and check-in for $60 and explicitly escalates dispatch. In the dispatch evidence, Avery is unavailable, Imani is unconfirmed, and the other three lack the qualification. At a $50 cap, confirming Imani restores two critical roles when Avery is available.

The automated suite compares the planner's objective to independently enumerated feasible plans in 225 budget and availability iterations. This validates optimization of the stated policy on one synthetic roster. It does not estimate decision time, safety, adoption or operational savings.

## Limits and next validation

The model excludes simultaneous sites, partial shifts, travel, breaks, fairness, overtime tiers and labor agreements. The definition of criticality is fixed for the example. Availability and pay assumptions would need confirmation before operation. With real coordinators, I would test the policy on anonymized historical call-outs and measure time to a defensible plan, critical gaps identified, and how often coordinators override the recommendation. I would also ask what information would justify an override and whether lower-priority assignments should proceed once a critical vacancy is escalated.
