import { useEffect, useState } from 'react';

import { apiUrl } from '../../../../../shared/lib/apiUrl.js';

// Types out each city, pauses, erases it, then moves to the next — skipped for reduced motion.
function useTypewriter(words, { typingMs = 90, deletingMs = 45, pauseMs = 1500 } = {}) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let index = 0;
    let current = words[0];
    let deleting = true;
    let timerId;
    function step() {
      const word = words[index];
      current = deleting ? current.slice(0, -1) : word.slice(0, current.length + 1);
      setText(current);
      let delay = deleting ? deletingMs : typingMs;
      if (!deleting && current === word) { delay = pauseMs; deleting = true; }
      else if (deleting && current === '') { deleting = false; index = (index + 1) % words.length; }
      timerId = setTimeout(step, delay);
    }
    timerId = setTimeout(step, pauseMs);
    return () => clearTimeout(timerId);
  }, []);
  return text;
}

export default function Hero({ content, show }) {
  const cities = content.cities?.length ? content.cities : ['Marseille'];
  const city = useTypewriter(cities);
  const original = content.photo === '/foto/haut-de-page-hd.webp';
  return <section className="home-hero">
    <div className="hero-inner">
      <div className="hero-media" aria-hidden="true"><img className="clip is-on" src={apiUrl(content.photo)} {...(original ? { srcSet: '/foto/haut-de-page.jpg 1200w, /foto/haut-de-page-hd.webp 2400w', sizes: '100vw' } : {})} alt="" fetchPriority="high" decoding="async" /></div>
      <div className="hero-text">
        <div className="hero-headline">
          <p className="hero-eyebrow">Chez Marthe · {/* Every city is laid out invisibly in the same cell: the widest one sets the width, so the line never moves. */}
            <span className="city" aria-hidden="true">
              <span className="city-sizer">{cities.map(c => <span key={c}>{c}|</span>)}</span>
              <span className="city-now">{city}<span className="city-cursor">|</span></span>
            </span>
            <span className="sr-only">{cities.join(', ')}.</span>
          </p>
          <h1 className="hero-title">
            <span className="ht" style={{ '--n': 0 }}><span>{content.title1}</span></span>
            <span className="ht" style={{ '--n': 1 }}><span><mark className="ht-mark" style={{ '--ink': '0.9s' }}>{content.mark1}</mark></span></span>
            <span className="ht" style={{ '--n': 2 }}><span>{content.title2}</span></span>
            <span className="ht" style={{ '--n': 3 }}><span><mark className="ht-mark" style={{ '--ink': '1.5s' }}>{content.mark2}</mark></span></span>
          </h1>
          <p className="hero-sub">{content.subtitle}</p>
          <div className="hero-actions">
            {show.involve && content.button1 && <a className="btn btn-primary" href="#s-impliquer">{content.button1}</a>}
            {show.spaces && content.button2 && <a className="btn btn-rent" href="#espaces">{content.button2}</a>}
          </div>
        </div>
      </div>
    </div>
    <button type="button" className="scroll-cue" aria-label="Découvrir la suite" onClick={() => document.querySelector('.home-hero + *')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
    </button>
  </section>;
}
