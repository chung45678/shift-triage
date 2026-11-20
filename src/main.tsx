import { useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { eligibility, planShifts, rosterOrder } from './planner.ts';
import type { Worker } from './planner.ts';
import { crew, defaultBudget, roles } from './scenario.ts';
import './style.css';

const MAX_BUDGET = 120;

function Pips({ total, lit, tone }: { total: number; lit: number; tone: 'ok' | 'warn' | 'cool' }) {
  return <span className={'pips ' + tone} aria-hidden="true">
    {Array.from({ length: total }, (_, index) => <i key={index} className={index < lit ? 'on' : ''} />)}
  </span>;
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('');
}

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
  const proposedWorker = workers.find(worker => worker.id === proposed?.workerId);
  const tone = criticalGap ? 'alert' : unfilled ? 'warn' : 'ok';

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
      <div className="top-inner">
        <div className="brand"><span className="mark" aria-hidden="true"><i /><i /></span> Shift Triage</div>
        <div className="context">Northside Food Bank <span aria-hidden="true">/</span> Sat 08:00–12:00</div>
        <span className="sample"><span className="led" aria-hidden="true" />Synthetic scenario</span>
      </div>
    </header>
    <main>
      <div className="intro">
        <div>
          <p className="eyebrow">Dispatch console</p>
          <h1>Dispatch staffing</h1>
          <p className="lede">Cover critical roles first, then decide which staffing gaps to escalate.</p>
        </div>
        <div className={'state-chip ' + tone} aria-hidden="true">
          <span className="led" />{criticalGap ? 'Critical gap' : unfilled ? 'Partial coverage' : 'Fully staffed'}
        </div>
      </div>

      <div className="metrics" aria-label="Plan summary" aria-live="polite">
        <div><span>Critical coverage</span><strong>{plan.critical}<small> / {criticalTotal}</small></strong>
          <Pips total={criticalTotal} lit={plan.critical} tone="ok" /></div>
        <div><span>Roles to escalate</span><strong>{unfilled}</strong>
          <Pips total={roles.length} lit={unfilled} tone="warn" /></div>
        <div><span>Proposed spend</span><strong>${plan.cost}<small> / ${budget}</small></strong>
          <span className="meter" aria-hidden="true">
            <i style={{ width: `${budget ? Math.min(100, plan.cost / budget * 100) : 0}%` }} /></span></div>
        <div><span>Roster-order coverage</span><strong>{baseline.critical}<small> / {criticalTotal} critical</small></strong>
          <Pips total={criticalTotal} lit={baseline.critical} tone="cool" /></div>
      </div>

      <div className="grid">
        <section className="panel controls" aria-labelledby="controls-title">
          <div className="section-head"><h2 id="controls-title"><span className="step">01</span>Scenario inputs</h2>
            <button className="text-button" onClick={reset}>Reset</button></div>
          <div className="fader">
            <label className="budget-label" htmlFor="budget">Labor budget <strong>${budget}</strong></label>
            <input id="budget" type="range" min="0" max={MAX_BUDGET} step="5" value={budget}
              style={{ '--pct': `${budget / MAX_BUDGET * 100}%` } as CSSProperties}
              onChange={event => {
                setBudget(Number(event.target.value));
                setReviewed(false);
              }} />
            <div className="range-ends"><span>$0</span><span>${MAX_BUDGET}</span></div>
          </div>
          <h3>Available crew <span>{workers.filter(worker => worker.status === 'confirmed').length}/{workers.length} confirmed</span></h3>
          <ul className="crew">{workers.map(worker => <li key={worker.id} data-status={worker.status}>
            <span className="avatar" aria-hidden="true">{initials(worker.name)}</span>
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
          <div className="section-head"><h2 id="results-title"><span className="step">02</span>Recommended plan</h2>
            <span className={criticalGap ? 'badge gap' : 'badge'}>{criticalGap ? 'Critical gap' : 'Critical roles covered'}</span></div>
          <p className="policy">Priority order: critical coverage, standard coverage, lowest spend.</p>
          <ul className="roles">{roles.map(item => {
            const assignment = plan.assignments.find(entry => entry.roleId === item.id);
            const worker = workers.find(person => person.id === assignment?.workerId);
            const state = worker ? 'filled' : item.critical ? 'critical' : 'open';
            return <li key={item.id}><button aria-pressed={item.id === selected} data-state={state}
              onClick={() => setSelected(item.id)}>
              <span className="led" aria-hidden="true" />
              <span><strong>{item.name}</strong><small>{item.critical ? 'Critical' : 'Standard'}</small></span>
              <span className={worker ? 'assignee' : 'assignee attention'}>{worker ? worker.name : 'Escalate'}
                {worker && <em> ${worker.cost}</em>}</span>
              <span className="chevron" aria-hidden="true">›</span>
            </button></li>;
          })}</ul>
        </section>

        <aside className="panel evidence" aria-live="polite" aria-labelledby="evidence-title">
          <div className="section-head"><h3 id="evidence-title"><span className="step">03</span>{role.name} evidence</h3></div>
          <div className="inspect">
            <div><span>Requires</span><strong>{role.skill}</strong></div>
            <div><span>Priority</span><strong>{role.critical ? 'Critical' : 'Standard'}</strong></div>
            <div><span>Proposed</span><strong className={proposedWorker ? '' : 'attention'}>{proposedWorker?.name ?? 'None'}</strong></div>
          </div>
          <p>{proposed ? 'The proposed worker meets both availability and qualification requirements.'
            : workers.some(worker => !eligibility(worker, role))
              ? 'Compare the eligible workers with their current assignments and the remaining budget.'
              : 'No confirmed worker has the required qualification.'}</p>
          <ul>{workers.map(worker => {
            const assigned = plan.assignments.find(item => item.workerId === worker.id);
            const assignedRole = roles.find(item => item.id === assigned?.roleId);
            const blocked = eligibility(worker, role);
            const reason = blocked ?? (assignedRole
              ? assignedRole.id === role.id ? 'Proposed for this role' : 'Assigned to ' + assignedRole.name
              : worker.cost > budget - plan.cost ? 'Exceeds remaining budget' : 'Eligible and unassigned');
            const kind = blocked ? 'blocked' : assignedRole?.id === role.id ? 'match' : 'eligible';
            return <li key={worker.id} data-kind={kind}><span>{worker.name}</span><span>{reason}</span></li>;
          })}</ul>
        </aside>
      </div>

      <section className={'decision ' + (reviewed ? 'done' : tone)} aria-label="Coordinator decision">
        <span className="led" aria-hidden="true" />
        <div><h2>{reviewed ? 'Proposal reviewed' : 'Coordinator decision'}</h2>
          <p role="status">{reviewed ? 'Review marked for the current scenario. No notifications were sent.'
            : criticalGap ? 'Escalate uncovered critical roles before dispatch.'
              : unfilled ? 'Critical work can proceed. Escalate the remaining roles or defer them after review.'
                : 'Every open role has a proposed worker.'}</p></div>
        <button className={reviewed ? 'ghost' : ''} onClick={() => setReviewed(value => !value)}>
          {reviewed ? 'Reopen review' : 'Mark plan reviewed'}</button>
      </section>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
