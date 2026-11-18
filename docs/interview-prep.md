# Interview prep

## Business analyst walkthrough · 90 seconds

“Shift Triage models the decisions a food-bank shift coordinator might face after a call-out. Before dispatch, the coordinator needs to allocate qualified people within a fixed labor cap and know which roles to escalate. I used a synthetic scenario and a spreadsheet-style workflow assumption. The policy covers critical roles first, then as much standard work as possible, then minimizes spend.

“At $60, a first-eligible assignment puts Avery on receiving and leaves dispatch vacant. The proposal covers both critical roles by giving receiving to Morgan and reserving Avery for dispatch. Now I mark Avery as called out. Dispatch changes to Escalate and the evidence shows that the roster has no other confirmed dispatch-qualified worker.

“The measured result is coverage on the stated example. The model hasn't been validated with a food-bank team. I would test real anonymized call-outs to see whether coordinators agree with criticality and whether the evidence helps them decide faster. I used Codex to research examples, implement the demo and run checks. Before presenting, I'd reproduce each scenario and be ready to explain the trade-offs myself.”

## Software engineering walkthrough · 90 seconds

“The UI is React and TypeScript. Its state represents availability, budget and review status. The assignment planner is a pure function that runs in the browser. It walks the workers and uses a bitmask for filled roles. Each worker can fill only one open role. Of two ways to reach the same mask, the cheaper one is sufficient because the unprocessed workers are identical for both possibilities.

“At the end the planner compares critical coverage, standard coverage, then cost. Missing qualification and unconfirmed availability exclude candidates. When no complete assignment fits, the result still contains the best partial plan. The default example catches a real weakness of first-eligible assignment. A second test implementation brute-forces small scenarios to check the objective independently.

“This is intentionally a single-window planner with a small role limit. To scale, I'd study integer programming or flow-based formulations and model multiple windows and overtime explicitly. Codex assisted with the implementation and tests. Before interviewing, I'd trace both algorithms on paper and add a fixture of my own.”

## Follow-up questions

1. **Who set the priority policy?** It is a modeling assumption. I would review it with the shift lead and test examples where a critical gap and several standard roles compete for scarce staff.
2. **Why does roster order lose?** Receiving appears first, and Avery is first on the roster. Giving Avery to receiving consumes the only dispatch qualification. Morgan can cover receiving within the same total budget.
3. **How do you handle incomplete inputs?** Unconfirmed workers appear in the evidence and are excluded until confirmed. Planner validation rejects invalid costs and duplicate identifiers.
4. **Why can a costlier state be discarded?** After processing the same workers, two states with the same mask leave the same roles and future workers. The cheaper state can afford every continuation of the costlier state.
5. **How would you show business value?** Compare coordinator decisions and time-to-plan on anonymized historical scenarios, record overrides with reasons, and obtain agreement on the escalation policy before piloting.
