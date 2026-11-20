import { spaceUrl } from '../../../shared/lib/spaces.js';

export function Brand() {
  return <a href={spaceUrl(null)} className="landing-brand"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>;
}
