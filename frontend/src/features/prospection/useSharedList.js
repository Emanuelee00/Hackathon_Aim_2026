import { useEffect, useRef, useState } from 'react';

// Un tableau partagé par l'équipe, enregistré sur le serveur (/api/store/<key>) peu après chaque modification.
// La première fois (rien d'enregistré), on part des données du fichier de l'équipe (`seed`), aussitôt enregistrées.
export default function useSharedList(key, seed) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const saved = useRef(null);
  const latest = useRef(null);
  latest.current = items;

  useEffect(() => {
    fetch(`/api/store/${key}`)
      .then(async response => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(key);
        return (await response.json()).value;
      })
      .then(value => {
        saved.current = Array.isArray(value) ? JSON.stringify(value) : null;
        setItems(Array.isArray(value) ? value : seed);
      })
      .catch(() => setError('Le tableau n’a pas pu être chargé. Rechargez la page dans un instant.'));
  }, [key]);

  const send = (body, keepalive = false) => fetch(`/api/store/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body, keepalive })
    .then(response => { if (!response.ok) throw new Error(key); saved.current = body; setError(''); })
    .catch(() => setError('Les dernières modifications ne sont pas enregistrées : vérifiez la connexion, elles seront renvoyées à la prochaine modification.'));

  useEffect(() => {
    if (!items) return undefined;
    const body = JSON.stringify(items);
    if (body === saved.current) return undefined;
    const timer = setTimeout(() => send(body), 400);
    return () => clearTimeout(timer);
  }, [items]);
  // En quittant la page, ce qui n'est pas encore parti est envoyé.
  useEffect(() => () => {
    const body = latest.current && JSON.stringify(latest.current);
    if (body && body !== saved.current) send(body, true);
  }, []);

  return { items: items || [], ready: items !== null, setItems, error };
}
