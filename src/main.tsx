import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { eligibility, planShifts, rosterOrder } from './planner.ts';
import type { Worker } from './planner.ts';
import { crew, defaultBudget, roles } from './scenario.ts';
import './style.css';

function App() {
  const [budget, setBudget] = useState(defaultBudget);
  const [workers, setWorkers] = useState(crew);
  const [selected, setSelected] = useState('dispatch');
  const [reviewed, setReviewed] = useState(false);
  const plan = planShifts(roles, workers, budget);
  const baseline = rosterOrder(roles, workers, budget);
  const criticalTotal = roles.filter(role => role.critical).length;
  const unfilled = roles.length - plan.assignments.length;
  const criticalGap = criticalTotal - plan.critical;
  const role = roles.find(item => item.id === selected)!;
  const proposed = plan.assignments.find(item => item.roleId === selected);

  function updateStatus(id: string, status: Worker['status']) {
    setWorkers(items => items.map(worker => worker.id === id ? { ...worker, status } : worker));
    setReviewed(false);
  }

  function reset() {
    setBudget(defaultBudget);
    setWorkers(crew);
    setSelected('dispatch');
    setReviewed(false);
  }

  return <>
    <header className="top">
      <div className="top-inner"><div className="brand"><span className="mark" aria-hidden="true">↗</span> Shift Triage</div>
        <span className="sample">Synthetic scenario</span></div>
    </header>
    <main>
      <div className="intro">
        <div className="context">NORTHSIDE FOOD BANK <span> / </span> SAT 08:00–12:00</div>
        <h1>Dispatch staffing</h1>
        <p>Cover critical roles first, then decide which staffing gaps to escalate.</p>
      </div>
      <div className="metrics" aria-label="Plan summary" aria-live="polite">
        <div><span>Critical coverage</span><strong>{plan.critical}<small> / {criticalTotal}</small></strong></div>
        <div><span>Roles to escalate</span><strong>{unfilled}</strong></div>
        <div><span>Proposed spend</span><strong>${plan.cost}<small> / ${budget}</small></strong></div>
        <div><span>Roster-order coverage</span><strong>{baseline.critical}<small> / {criticalTotal} critical</small></strong></div>
      </div>
      <div className="grid">
        <section className="panel controls" aria-labelledby="controls-title">
          <div className="section-head"><h2 id="controls-title">Scenario inputs</h2>
            <button className="text-button" onClick={reset}>Reset</button></div>
          <label className="budget-label" htmlFor="budget">Labor budget <strong>${budget}</strong></label>
          <input id="budget" type="range" min="0" max="120" step="5" value={budget} onChange={event => {
            setBudget(Number(event.target.value));
            setReviewed(false);
          }} />
          <div className="range-ends"><span>$0</span><span>$120</span></div>
          <h3>Available crew</h3>
          <ul className="crew">{workers.map(worker => <li key={worker.id}>
            <div><label htmlFor={worker.id}>{worker.name}</label><small>{worker.skills.join(' · ')} · ${worker.cost}</small></div>
            <select id={worker.id} value={worker.status} onChange={event =>
              updateStatus(worker.id, event.target.value as Worker['status'])}>
              <option value="confirmed">Confirmed</option><option value="unconfirmed">Unconfirmed</option>
              <option value="out">Called out</option>
            </select>
          </li>)}</ul>
          <p className="hint">Try setting Avery Chen to Called out to see what changes.</p>
        </section>
        <section className="panel results" aria-labelledby="results-title">
          <div className="section-head"><h2 id="results-title">Recommended plan</h2>
            <span className={criticalGap ? 'badge gap' : 'badge'}>{criticalGap ? 'Critical gap' : 'Critical roles covered'}</span></div>
          <p className="policy">Priority order: critical coverage, standard coverage, lowest spend.</p>
          <ul className="roles">{roles.map(item => {
            const assignment = plan.assignments.find(entry => entry.roleId === item.id);
            const worker = workers.find(person => person.id === assignment?.workerId);
            return <li key={item.id}><button aria-pressed={item.id === selected}
              onClick={() => setSelected(item.id)}>
              <span><strong>{item.name}</strong><small>{item.critical ? 'Critical' : 'Standard'}</small></span>
              <span className={worker ? '' : 'attention'}>{worker ? worker.name : 'Escalate'}</span>
              <span className="chevron" aria-hidden="true">›</span>
            </button></li>;
          })}</ul>
          <div className="evidence" aria-live="polite">
            <h3>{role.name} evidence</h3>
            <p>{proposed ? 'The proposed worker meets both availability and qualification requirements.'
              : workers.some(worker => !eligibility(worker, role))
                ? 'Compare the eligible workers with their current assignments and the remaining budget.'
                : 'No confirmed worker has the required qualification.'}</p>
            <ul>{workers.map(worker => {
              const assigned = plan.assignments.find(item => item.workerId === worker.id);
              const assignedRole = roles.find(item => item.id === assigned?.roleId);
              const reason = eligibility(worker, role) ?? (assignedRole
                ? assignedRole.id === role.id ? 'Proposed for this role' : 'Assigned to ' + assignedRole.name
                : worker.cost > budget - plan.cost ? 'Exceeds remaining budget' : 'Eligible and unassigned');
              return <li key={worker.id}><span>{worker.name}</span><span>{reason}</span></li>;
            })}</ul>
          </div>
        </section>
      </div>
      <section className="decision" aria-label="Coordinator decision">
        <div><h2>{reviewed ? 'Proposal reviewed' : 'Coordinator decision'}</h2>
          <p role="status">{reviewed ? 'Review marked for the current scenario. No notifications were sent.'
            : criticalGap ? 'Escalate uncovered critical roles before dispatch.'
              : unfilled ? 'Critical work can proceed. Escalate the remaining roles or defer them after review.'
                : 'Every open role has a proposed worker.'}</p></div>
        <button onClick={() => setReviewed(value => !value)}>{reviewed ? 'Reopen review' : 'Mark plan reviewed'}</button>
      </section>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
