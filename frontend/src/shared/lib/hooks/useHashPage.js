import { useEffect, useState } from 'react';
import { navigation } from '../../data/navigation.js';

// The page is kept in the address (#funding), so a reload or the back button stays on it.
const pageFromHash = () => {
  const id = window.location.hash.slice(1);
  return navigation.some(item => item.id === id) ? id : 'dashboard';
};

// Current équipe page and a navigate(id) that writes the hash.
export default function useHashPage() {
  const [page, setPage] = useState(pageFromHash);
  useEffect(() => {
    const follow = () => setPage(pageFromHash());
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  const navigate = nextPage => {
    window.location.hash = nextPage;
    setPage(nextPage);
  };
  return [page, navigate];
}
