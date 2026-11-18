export type Worker = {
  id: string;
  name: string;
  skills: string[];
  status: 'confirmed' | 'unconfirmed' | 'out';
  cost: number;
};
export type Role = { id: string; name: string; skill: string; critical: boolean };
export type Assignment = { roleId: string; workerId: string };
export type Plan = { assignments: Assignment[]; cost: number; critical: number; standard: number };
type Candidate = Pick<Plan, 'assignments' | 'cost'>;

export function eligibility(worker: Worker, role: Role): string | null {
  if (worker.status === 'out') return 'Unavailable';
  if (worker.status !== 'confirmed') return 'Availability unconfirmed';
  if (!worker.skills.includes(role.skill)) return 'Missing qualification';
  return null;
}

function summarize(candidate: Candidate, roles: Role[]): Plan {
  const critical = roles.filter(role =>
    role.critical && candidate.assignments.some(item => item.roleId === role.id)
  ).length;
  return { ...candidate, critical, standard: candidate.assignments.length - critical };
}

export function planShifts(roles: Role[], workers: Worker[], budget: number): Plan {
  if (roles.length > 12 || workers.length > 50) throw new Error('Scenario exceeds planner limits.');
  if (!Number.isSafeInteger(budget) || budget < 0 ||
      workers.some(worker => !Number.isSafeInteger(worker.cost) || worker.cost < 0) ||
      new Set(roles.map(role => role.id)).size !== roles.length ||
      new Set(workers.map(worker => worker.id)).size !== workers.length) {
    throw new Error('Use unique IDs and nonnegative whole-dollar costs and budget.');
  }

  // Each mask identifies covered roles. After processing each worker, only the
  // cheapest way to reach a mask can improve a plan using the remaining workers.
  let states = new Map<number, Candidate>([[0, { cost: 0, assignments: [] }]]);
  for (const worker of [...workers].sort((a, b) => a.id.localeCompare(b.id))) {
    const next = new Map(states);
    for (const [mask, candidate] of states) {
      if (worker.cost > budget - candidate.cost) continue;
      for (const [index, role] of roles.entries()) {
        const bit = 1 << index;
        if ((mask & bit) || eligibility(worker, role)) continue;
        const newMask = mask | bit;
        const cost = candidate.cost + worker.cost;
        const previous = next.get(newMask);
        if (previous && previous.cost <= cost) continue;
        next.set(newMask, {
          cost,
          assignments: [...candidate.assignments, { roleId: role.id, workerId: worker.id }],
        });
      }
    }
    states = next;
  }

  let best = summarize(states.get(0)!, roles);
  for (const candidate of states.values()) {
    const plan = summarize(candidate, roles);
    if (plan.critical > best.critical ||
        (plan.critical === best.critical && plan.standard > best.standard) ||
        (plan.critical === best.critical && plan.standard === best.standard && plan.cost < best.cost)) {
      best = plan;
    }
  }
  return best;
}

export function rosterOrder(roles: Role[], workers: Worker[], budget: number): Plan {
  const candidate: Candidate = { cost: 0, assignments: [] };
  const used = new Set<string>();
  for (const role of roles) {
    const worker = workers.find(person =>
      !used.has(person.id) && !eligibility(person, role) && person.cost <= budget - candidate.cost
    );
    if (!worker) continue;
    used.add(worker.id);
    candidate.cost += worker.cost;
    candidate.assignments.push({ roleId: role.id, workerId: worker.id });
  }
  return summarize(candidate, roles);
}
