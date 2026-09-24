import { useEffect, useState } from 'react';

const KEY = 'marthe-employment-plans-v1';

export function loadJobPlan(residentId) {
  try {
    const plans = JSON.parse(localStorage.getItem(KEY)) || {};
    return plans[residentId] || null;
  } catch { return null; }
}

export function saveJobPlan(residentId, plan) {
  try {
    const plans = JSON.parse(localStorage.getItem(KEY)) || {};
    localStorage.setItem(KEY, JSON.stringify({ ...plans, [residentId]: plan }));
    return true;
  } catch { return false; }
}

export function useJobPlan(resident, skills) {
  const [cv, setCv] = useState(null);
  const [objective, setObjective] = useState('');
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const saved = loadJobPlan(resident.id);
    setRecord(saved); setObjective(saved?.objective || '');
    setCv(null); setError('');
  }, [resident.id]);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData();
    data.append('cv', cv); data.append('objective', objective.trim());
    data.append('resident_name', resident.first_name);
    data.append('acquired_skills', JSON.stringify(skills.map(item => item.skill)));
    try {
      const response = await fetch('/api/employment-plan', { method: 'POST', body: data });
      const plan = await response.json();
      if (!response.ok) throw new Error(plan.detail || 'Le CV n’a pas pu être analysé.');
      const next = { objective: objective.trim(), plan };
      setRecord(next);
      if (!saveJobPlan(resident.id, next)) setError('Le plan est affiché, mais sa sauvegarde locale est indisponible.');
    } catch (reason) { setError(reason.message || 'Le service est momentanément indisponible.'); }
    finally { setLoading(false); }
  }
  return { cv, setCv, objective, setObjective, record, error, loading, submit };
}
