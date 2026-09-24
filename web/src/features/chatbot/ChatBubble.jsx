import { useEffect, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { askAgent } from './chat.js';

function Message({ message }) {
  return <li className={`chat-message ${message.role}`}>{message.content}
    {message.handoff && <span className="chat-handoff"><Icon name="check" size={14} />Transmis à l’équipe · Q-{message.handoff}</span>}</li>;
}

// Floating chat with one of the platform's agents; the conversation lives in the page only.
export default function ChatBubble({ agentId, label, title, subtitle, greeting }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, pending]);
  const send = async event => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next); setDraft(''); setError(''); setPending(true);
    try {
      const { reply, handoff } = await askAgent(agentId, next);
      setMessages([...next, { role: 'assistant', content: reply, handoff }]);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  };
  return <div className="chat-bubble" onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    {open && <section className="chat-panel" role="dialog" aria-labelledby={`chat-${agentId}`}>
      <header>
        <span className="chat-avatar"><Icon name="sparkles" size={19} /></span>
        <div><strong id={`chat-${agentId}`}>{title}</strong><small>{subtitle}</small></div>
        <button className="icon-button" aria-label="Fermer la discussion" onClick={() => setOpen(false)}><Icon name="close" size={16} /></button>
      </header>
      <ol className="chat-messages" aria-live="polite">
        <Message message={{ role: 'assistant', content: greeting }} />
        {messages.map((message, index) => <Message key={index} message={message} />)}
        {pending && <li className="chat-message assistant chat-typing" aria-label="L’assistant écrit"><i /><i /><i /></li>}
        <li ref={endRef} aria-hidden="true" />
      </ol>
      {error && <p className="form-error" role="alert">{error}</p>}
      <form onSubmit={send}><label className="sr-only" htmlFor={`chat-input-${agentId}`}>Votre question</label>
        <input id={`chat-input-${agentId}`} ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} placeholder="Écrivez votre question…" autoComplete="off" />
        <button className="button button-dark" aria-label="Envoyer" disabled={pending || !draft.trim()}><Icon name="send" size={16} /></button></form>
    </section>}
    <div className="chat-launcher-row">
      {!open && <span className="chat-hint" aria-hidden="true"><strong>{label || 'Une question ?'}</strong><small>Assistant IA</small></span>}
      <button className="chat-launcher" aria-expanded={open} aria-label={open ? 'Fermer la discussion' : 'Ouvrir l’assistant IA'} onClick={() => setOpen(current => !current)}>
        {open ? <Icon name="close" size={22} /> : <span className="chat-avatar chat-avatar-lg"><Icon name="sparkles" size={24} /></span>}
      </button>
    </div>
  </div>;
}
