import { useEffect, useState } from 'react';
import demoPlan from './demoPlan.json';
import { validateCv } from './cvFile.js';

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

async function fetchExample(name) {
  const response = await fetch(`/demo/${name}`);
  if (!response.ok) throw new Error('Le CV d’exemple est indisponible. Choisissez votre propre fichier.');
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type });
}

async function requestPlan(cv, objective, resident, skills) {
  const data = new FormData();
  data.append('cv', cv); data.append('objective', objective);
  data.append('resident_name', resident.first_name);
  data.append('acquired_skills', JSON.stringify(skills.map(item => item.skill)));
  const response = await fetch('/api/employment-plan', { method: 'POST', body: data });
  const plan = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(plan.detail || 'Le service n’a pas répondu.');
  return plan;
}

export function useJobPlan(resident, skills) {
  const isMarie = resident.id === 'marie';
  const [cv, setCv] = useState(null);
  const [fileError, setFileError] = useState('');
  const [objective, setObjective] = useState(() => loadJobPlan(resident.id)?.objective || (isMarie ? demoPlan.objective : ''));
  const [record, setRecord] = useState(() => loadJobPlan(resident.id) || (isMarie ? demoPlan : null));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function loadExample(name, marieExample = false) {
    setFileError('');
    try {
      const file = await fetchExample(name);
      file.isMarieExample = marieExample;
      setCv(file);
      return true;
    } catch (reason) { setFileError(reason.message); return false; }
  }
  useEffect(() => { if (isMarie) loadExample('cv-marie-demo.docx', true); }, [isMarie]); // eslint-disable-line react-hooks/exhaustive-deps
  function chooseCv(file) {
    const problem = validateCv(file);
    setFileError(problem);
    if (!problem) setCv(file);
  }
  async function analyze() {
    setLoading(true); setError('');
    try {
      const next = { objective: objective.trim(), plan: await requestPlan(cv, objective.trim(), resident, cv?.isMarieExample ? skills : []) };
      setRecord(next);
      if (!saveJobPlan(resident.id, next)) setError('Votre plan est affiché, mais il ne pourra pas être retrouvé plus tard sur cet appareil.');
      return true;
    } catch (reason) {
      setError(reason instanceof TypeError ? 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.' : reason.message);
      return false;
    } finally { setLoading(false); }
  }
  return { cv, chooseCv, fileError, objective, setObjective, record, error, loading, analyze, isMarie, pickMarieExample: () => loadExample('cv-marie-demo.docx', true), pickTechExample: async () => { const ok = await loadExample('cv-tech-demo.docx'); if (ok) setObjective('Commis de cuisine'); return ok; } };
}
