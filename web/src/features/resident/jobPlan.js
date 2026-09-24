import { useEffect, useState } from 'react';
import demoPlan from './demoPlan.json';

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
    setRecord(saved || (resident.id === 'marie' ? demoPlan : null)); setObjective(saved?.objective || (resident.id === 'marie' ? 'Commis de cuisine' : ''));
    setCv(null); setError('');
    let active = true;
    if (resident.id === 'marie') fetch('/demo/cv-marie-demo.docx').then(response => {
      if (!response.ok) throw new Error('CV indisponible');
      return response.blob();
    }).then(blob => {
      const file = new File([blob], 'cv-marie-demo.docx', { type: blob.type });
      file.isMarieExample = true;
      if (active) setCv(current => current || file);
    })
      .catch(() => { if (active) setError('Le CV exemple est indisponible. Vous pouvez choisir votre propre fichier.'); });
    return () => { active = false; };
  }, [resident.id]);
  async function useTechExample() {
    setError('');
    try {
      const response = await fetch('/demo/cv-tech-demo.docx');
      if (!response.ok) throw new Error('Le CV exemple est indisponible.');
      const blob = await response.blob();
      setCv(new File([blob], 'cv-tech-demo.docx', { type: blob.type }));
      setObjective('Commis de cuisine'); setRecord(null);
    } catch (reason) { setError(reason.message); }
  }
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData();
    data.append('cv', cv); data.append('objective', objective.trim());
    data.append('resident_name', resident.first_name);
    data.append('acquired_skills', JSON.stringify(cv?.isMarieExample ? skills.map(item => item.skill) : []));
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
  return { cv, setCv: file => { setCv(file); setRecord(null); }, objective, setObjective: value => { setObjective(value); setRecord(null); }, record, error, loading, submit, useTechExample };
}
