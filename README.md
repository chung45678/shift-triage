# Shift Triage

**[Open the live demo](https://shift-triage-lab.robustoatcake2.chatgpt.site)**

A food-bank shift coordinator needs to cover critical roles after a call-out and decide what to escalate. Shift Triage proposes a feasible assignment based on qualifications, availability and the labor cap. The sample roster and rules are synthetic.

## Try it in one minute

1. Open **Dispatch staffing**. At $60, compare the recommended 2/2 critical coverage against 1/2 for roster order.
2. Open **Dispatch lead** in the recommended plan and review Avery's qualification.
3. Set **Avery Chen** to **Called out**. Dispatch changes to **Escalate** and critical coverage falls to 1/2.
4. Read the candidate evidence, then select **Mark plan reviewed**.

## Run locally

Use Node 22.18 or newer.

```sh
npm ci
npm test
npm run build
npm run dev
```

- [Case study](docs/case-study.md)
- [Engineering](docs/engineering.md)
- [Research](docs/research.md)
- [Interview prep](docs/interview-prep.md)

## Attribution

Inspired by [Cal.com](https://cal.com/) and its use of availability to route work across a team. Shift Triage independently implements the assignment model, example data and visual design. Codex assisted with research, implementation, documentation and verification.
