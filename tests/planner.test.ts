import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eligibility, planShifts, rosterOrder } from '../src/planner.ts';
import { crew, roles } from '../src/scenario.ts';

test('protects sole dispatch qualification and beats roster order at the same budget', () => {
  const plan = planShifts(roles, crew, 60);
  assert.deepEqual(plan, {
    critical: 2, standard: 0, cost: 60,
    assignments: [{ roleId: 'dispatch', workerId: 'avery' }, { roleId: 'receiving', workerId: 'morgan' }],
  });
  assert.equal(rosterOrder(roles, crew, 60).critical, 1);
});

test('a call-out leaves dispatch open and retains the feasible assignments', () => {
  const absent = crew.map(worker => worker.id === 'avery' ? { ...worker, status: 'out' as const } : worker);
  const plan = planShifts(roles, absent, 60);
  assert.equal(plan.critical, 1);
  assert.equal(plan.standard, 2);
  assert.equal(plan.cost, 60);
  assert.ok(plan.assignments.every(item => item.roleId !== 'dispatch' && item.workerId !== 'avery'));
});

test('a $59 cap forces a different plan', () => {
  const plan = planShifts(roles, crew, 59);
  assert.equal(plan.critical, 1);
  assert.equal(plan.standard, 1);
  assert.equal(plan.cost, 40);
});

test('a newly confirmed worker makes two critical roles viable at $50', () => {
  const confirmed = crew.map(worker => worker.id === 'imani' ? { ...worker, status: 'confirmed' as const } : worker);
  assert.equal(eligibility(crew[4], roles[0]), 'Availability unconfirmed');
  assert.equal(planShifts(roles, confirmed, 50).critical, 2);
});

test('empty and fully unconfirmed rosters remain feasible at zero spend', () => {
  const empty = { assignments: [], cost: 0, critical: 0, standard: 0 };
  assert.deepEqual(planShifts(roles, [], 60), empty);
  assert.deepEqual(planShifts(roles, crew.map(worker => ({ ...worker, status: 'unconfirmed' })), 60), empty);
  assert.deepEqual(planShifts(roles, crew, 0), empty);
});

test('validates budget, cost, unique IDs and capacity limits', () => {
  assert.throws(() => planShifts(roles, crew, NaN), /whole-dollar/);
  assert.throws(() => planShifts(roles, [{ ...crew[0], cost: -1 }], 60), /whole-dollar/);
  assert.throws(() => planShifts(roles, [crew[0], crew[0]], 60), /unique/);
  assert.throws(() => planShifts([...roles, roles[0]], crew, 60), /unique/);
  assert.throws(() => planShifts(Array.from({ length: 13 }, () => roles[0]), crew, 60), /limits/);
});

test('matches independently enumerated plans across 225 budget and availability scenarios', () => {
  for (const budget of [0, 15, 25, 30, 45, 50, 59, 60, 95]) {
    for (let a = 0; a < crew.length; a++) {
      for (let b = 0; b < crew.length; b++) {
        const workers = crew.map((worker, index) => ({
          ...worker, status: index === a ? 'out' as const : index === b ? 'confirmed' as const : worker.status,
        }));
        const plans: Array<[number, number, number]> = [];
        function enumerate(index: number, used: Set<string>, critical: number, standard: number, cost: number) {
          if (index === roles.length) {
            plans.push([critical, standard, cost]);
            return;
          }
          const role = roles[index];
          enumerate(index + 1, used, critical, standard, cost);
          for (const worker of workers) {
            if (used.has(worker.id) || worker.status !== 'confirmed' || !worker.skills.includes(role.skill) ||
                cost + worker.cost > budget) continue;
            enumerate(index + 1, new Set([...used, worker.id]), critical + Number(role.critical),
              standard + Number(!role.critical), cost + worker.cost);
          }
        }
        enumerate(0, new Set(), 0, 0, 0);
        plans.sort((left, right) => right[0] - left[0] || right[1] - left[1] || left[2] - right[2]);
        const plan = planShifts(roles, workers, budget);
        assert.deepEqual([plan.critical, plan.standard, plan.cost], plans[0]);
        assert.equal(new Set(plan.assignments.map(item => item.workerId)).size, plan.assignments.length);
        assert.equal(new Set(plan.assignments.map(item => item.roleId)).size, plan.assignments.length);
        for (const assignment of plan.assignments) {
          const worker = workers.find(item => item.id === assignment.workerId)!;
          const role = roles.find(item => item.id === assignment.roleId)!;
          assert.equal(eligibility(worker, role), null);
        }
        assert.equal(plan.cost, plan.assignments.reduce((cost, item) =>
          cost + workers.find(worker => worker.id === item.workerId)!.cost, 0));
      }
    }
  }
});
