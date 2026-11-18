import type { Role, Worker } from './planner.ts';

export const roles: Role[] = [
  { id: 'receiving', name: 'Receiving lead', skill: 'Receiving', critical: true },
  { id: 'dispatch', name: 'Dispatch lead', skill: 'Dispatch', critical: true },
  { id: 'packing', name: 'Packing station', skill: 'Packing', critical: false },
  { id: 'check-in', name: 'Volunteer check-in', skill: 'Check-in', critical: false },
];

export const crew: Worker[] = [
  { id: 'avery', name: 'Avery Chen', skills: ['Receiving', 'Dispatch'], cost: 35, status: 'confirmed' },
  { id: 'morgan', name: 'Morgan Ellis', skills: ['Receiving'], cost: 25, status: 'confirmed' },
  { id: 'jules', name: 'Jules Rivera', skills: ['Packing'], cost: 15, status: 'confirmed' },
  { id: 'sam', name: 'Sam Patel', skills: ['Check-in', 'Packing'], cost: 20, status: 'confirmed' },
  { id: 'imani', name: 'Imani Brooks', skills: ['Receiving', 'Check-in'], cost: 15, status: 'unconfirmed' },
];

export const defaultBudget = 60;
