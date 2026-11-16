import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { members } from '../site-pages/teamData.js';
import { CURRENT_KEY, blankProfile, loadProfiles, removeProfile, saveAllProfiles, saveProfile, seedProfiles } from './profiles.js';

// L'espace de la personne qui utilise l'espace équipe sur cet ordinateur : son prénom (gardé dans ce navigateur),
// et son menu et ses fonds (gardés sur le serveur).
const ProfileContext = createContext(null);
export const useProfile = () => useContext(ProfileContext);

// La première fois : l'équipe du site (celle de « Site » › L'équipe si elle a été modifiée).
async function startingTeam() {
  const site = await fetch('/api/site').then(response => (response.ok ? response.json() : null)).catch(() => null);
  const team = site?.content?.team?.members;
  return seedProfiles(Array.isArray(team) && team.length ? team : members);
}

export default function ProfileProvider({ children }) {
  const { notify } = useStore();
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState('');
  const [currentId, setCurrentId] = useState(() => { try { return localStorage.getItem(CURRENT_KEY) || ''; } catch { return ''; } });
  useEffect(() => {
    loadProfiles()
      .then(async saved => setProfiles(saved || await saveAllProfiles(await startingTeam())))
      .catch(problem => setError(problem.message));
  }, []);
  const remember = id => { setCurrentId(id); try { if (id) localStorage.setItem(CURRENT_KEY, id); else localStorage.removeItem(CURRENT_KEY); } catch { /* pour cette visite */ } };
  // Les enregistrements partent l'un après l'autre (deux changements rapides ne se croisent pas en route) ;
  // la réponse du serveur ne remplace pas ce que la personne a changé entre-temps.
  const queue = useRef(Promise.resolve());
  const latest = useRef({});
  const persist = profile => {
    latest.current[profile.id] = profile;
    queue.current = queue.current.then(() => saveProfile(latest.current[profile.id]))
      .then(saved => setProfiles(saved.map(item => latest.current[item.id] || item)), problem => notify(problem.message));
  };
  const value = {
    profiles: profiles || [],
    ready: profiles !== null,
    error,
    profile: profiles?.find(item => item.id === currentId) || null,
    choose: remember,
    leave: () => remember(''),
    update: profile => { setProfiles(list => list.map(item => (item.id === profile.id ? profile : item))); persist(profile); },
    add: async (name, role, photo) => {
      const profile = blankProfile(name, role, photo, profiles.map(item => item.id));
      setProfiles(await saveProfile(profile));
      return profile;
    },
    remove: async id => { delete latest.current[id]; setProfiles(await removeProfile(id)); if (id === currentId) remember(''); },
  };
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
