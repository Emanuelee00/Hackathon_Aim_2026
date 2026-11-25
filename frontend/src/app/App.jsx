import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Modal from '../shared/components/Modal.jsx';
import Sidebar from './Sidebar.jsx';
import { navigation } from '../shared/data/navigation.js';
import useHashPage from '../shared/lib/hooks/useHashPage.js';
import useMediaQuery from '../shared/lib/hooks/useMediaQuery.js';
import EventDetails from '../features/equipe/requests/event/EventDetails.jsx';
import EventForm from '../features/equipe/requests/event/EventForm.jsx';
import Dashboard from '../features/equipe/dashboard/Dashboard.jsx';
import Requests from '../features/equipe/requests/Requests.jsx';
import Committee from '../features/equipe/committee/Committee.jsx';
import Calendar from '../features/equipe/calendar/Calendar.jsx';
import Spaces from '../features/equipe/spaces/Spaces.jsx';
import Reports from '../features/equipe/reports/Reports.jsx';
import Stats from '../features/equipe/stats/Stats.jsx';
import Funding from '../features/equipe/funding/Funding.jsx';
import Prospection from '../features/equipe/prospection/Prospection.jsx';
import SiteEditor from '../features/equipe/site/SiteEditor.jsx';
import StructureBilans from '../features/equipe/bilans/StructureBilans.jsx';
import Messages from '../features/equipe/messages/Messages.jsx';
import Quotes from '../features/equipe/quotes/Quotes.jsx';
import AccountingWindow from '../features/equipe/quotes/accounting/AccountingWindow.jsx';
import ReportForm from '../features/equipe/reports/components/ReportForm.jsx';
import Opportunities from '../features/equipe/opportunities/Opportunities.jsx';
import Journeys from '../features/equipe/journeys/Journeys.jsx';
import Residents from '../features/equipe/residents/Residents.jsx';
import JourneyForm from '../features/equipe/journeys/components/JourneyForm.jsx';
import Questions from '../features/equipe/questions/Questions.jsx';
import useQuestions from '../features/equipe/questions/useQuestions.js';
import AccessRequests from '../features/equipe/access/AccessRequests.jsx';
import useAccessRequests from '../features/equipe/access/useAccessRequests.js';
import { residentById } from '../features/equipe/opportunities/data/residents.js';
import { TODAY } from '../shared/data/spaces.js';
import { useStore } from './store.jsx';
import ProfileProvider, { useProfile } from '../features/equipe/profiles/ProfileProvider.jsx';
import ProfilePicker from '../features/equipe/profiles/ProfilePicker.jsx';
import { pageStyle } from '../features/equipe/profiles/profiles.js';

// One entry per équipe page, same style as MODALS: handlers come from the Shell.
const PAGES = {
  dashboard: h => <Dashboard onNew={h.openNew} onOpen={h.openEvent} navigate={h.navigate} />,
  requests: h => <Requests onNew={h.openNew} onOpen={h.openEvent} />,
  questions: h => <Questions {...h.questions} />,
  access: h => <AccessRequests {...h.access} />,
  committee: h => <Committee onOpen={h.openEvent} />,
  opportunities: () => <Opportunities />,
  residents: h => <Residents navigate={h.navigate} />,
  journeys: h => <Journeys onEdit={h.openJourney} navigate={h.navigate} />,
  calendar: h => <Calendar onOpen={h.openEvent} />,
  spaces: h => <Spaces onBook={h.openSpaceRequest} onOpen={h.openEvent} />,
  reports: h => <Reports onOpen={h.openEvent} onReport={h.openReport} />,
  bilans: () => <StructureBilans />,
  stats: () => <Stats />,
  funding: () => <Funding />,
  prospection: h => <Prospection navigate={h.navigate} />,
  messages: () => <Messages />,
  quotes: h => <Quotes onAccounting={h.openAccounting} />,
  site: () => <SiteEditor />,
};

function PageContent(h) {
  const render = PAGES[h.page];
  return render ? render(h) : <section className="panel placeholder-page"><p className="eyebrow">CHEZ MARTHE</p><h1>{navigation.find(item => item.id === h.page)?.label}</h1><p>Cette section est en cours de préparation.</p></section>;
}

// One definition per modal window: title, width, class and body; all fed from the Shell context.
const MODALS = {
  event: {
    title: ({ event }) => event?.title || 'Événement',
    render: ({ event, events, saveEvent, notify, onEdit, onAccounting, closeModal }) => event && <EventDetails event={event} events={events} onSave={saveEvent} onEdit={onEdit} onClose={closeModal} notify={notify} onAccounting={onAccounting} />,
  },
  edit: {
    title: () => 'Modifier la demande',
    wide: true,
    render: ({ event, events, saveDraft, closeModal }) => <EventForm event={event} events={events} onSave={saveDraft} onCancel={closeModal} />,
  },
  new: {
    title: () => 'Nouvelle demande',
    wide: true,
    render: ({ initialEvent, events, saveDraft, closeModal }) => <EventForm event={initialEvent} events={events} onSave={saveDraft} onCancel={closeModal} />,
  },
  accounting: {
    title: ({ event }) => `Comptabilité · ${event?.title || 'Événement'}`,
    className: 'modal-accounting',
    render: ({ event, saveEvent, notify, from, openEvent }) => event && <AccountingWindow key={event.id} event={event} onSave={saveEvent} notify={notify} onBack={from === 'event' ? () => openEvent(event.id) : undefined} />,
  },
  report: {
    title: ({ event }) => `Bilan · ${event?.title}`,
    wide: true,
    render: ({ event, linkedParticipations, saveReport, closeModal }) => event && <ReportForm event={event} linkedParticipations={linkedParticipations} onSave={saveReport} onCancel={closeModal} />,
  },
  journey: {
    title: ({ resident }) => `Parcours · ${resident?.first_name}`,
    wide: true,
    render: ({ match, resident, journeyEvent, saveJourneyDraft, closeModal }) => match && resident && journeyEvent && <JourneyForm match={match} resident={resident} event={journeyEvent} onSave={saveJourneyDraft} onCancel={closeModal} />,
  },
  help: {
    title: () => 'À propos',
    render: () => <p>Marthe accompagne les lieux solidaires dans l’organisation de leurs événements. Les données affichées sont fictives.</p>,
  },
};

// Après la connexion : « Qui êtes-vous ? », puis l'espace de la personne choisie.
export default function App() {
  return <ProfileProvider><ProfileGate /></ProfileProvider>;
}

function ProfileGate() {
  const { profile } = useProfile();
  return profile ? <Shell key={profile.id} /> : <ProfilePicker />;
}

function Shell() {
  const { events, saveEvent, matches, saveJourney, notify, storageError, toast } = useStore();
  const [page, navigatePage] = useHashPage();
  const [menuOpen, setMenuOpen] = useState(false);
  // Grand écran : le panneau latéral se replie pour voir la page en entier ; le choix est gardé pour la prochaine visite.
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('marthe-sidebar') === 'collapsed'; } catch { return false; } });
  // Petit écran : le menu est un tiroir. On suit la taille de la fenêtre pour que la linguette (flèche) montre le bon sens.
  const narrow = useMediaQuery('(max-width: 820px)');
  const toggleMenu = () => {
    if (narrow) { setMenuOpen(open => !open); return; }
    setCollapsed(current => {
      const next = !current;
      try { localStorage.setItem('marthe-sidebar', next ? 'collapsed' : 'open'); } catch { /* le choix vaut pour cette visite */ }
      return next;
    });
  };
  const [modal, setModal] = useState(null);
  const questions = useQuestions();
  const access = useAccessRequests();

  const selectedEvent = events.find(event => event.id === modal?.eventId);
  const selectedMatch = matches.find(match => match.id === modal?.matchId);
  const journeyEvent = events.find(event => event.id === selectedMatch?.eventId);
  const journeyResident = residentById[selectedMatch?.resident_id];
  const linkedParticipations = matches.filter(match => match.eventId === selectedEvent?.id && match.status === 'accepted' && match.journey?.participation === 'participated').length;
  const navigate = nextPage => {
    navigatePage(nextPage);
    setMenuOpen(false);
  };
  const closeModal = () => setModal(null);
  const saveDraft = event => {
    saveEvent(event);
    notify(event.status === 'pending' ? 'La demande est enregistrée.' : 'Les modifications sont enregistrées.');
    closeModal();
  };
  const saveReport = report => {
    saveEvent({ ...selectedEvent, status: 'completed', report: { ...report, recorded: TODAY } });
    notify('Le bilan est enregistré et les indicateurs sont mis à jour.');
    closeModal();
  };
  const saveJourneyDraft = journey => {
    saveJourney(selectedMatch.id, journey);
    notify('Le suivi du parcours est enregistré.');
    closeModal();
  };
  const openEvent = eventId => setModal({ type: 'event', eventId });
  const openAccounting = (eventId, from) => setModal({ type: 'accounting', eventId, from });
  const openNew = () => setModal({ type: 'new' });

  const { profile } = useProfile();
  // Le thème de la personne (clair, sombre, violet) vaut pour toute la page, fenêtres comprises.
  const theme = profile.theme || 'light';
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-violet');
    if (theme !== 'light') root.classList.add(`theme-${theme}`);
    return () => root.classList.remove('theme-dark', 'theme-violet');
  }, [theme]);
  // The open window: one definition per type, fed from this context.
  const modalDef = MODALS[modal?.type] ?? MODALS.help;
  const modalCtx = {
    event: selectedEvent, match: selectedMatch, resident: journeyResident, journeyEvent,
    initialEvent: modal?.initialEvent, from: modal?.from, linkedParticipations,
    events, saveEvent, saveDraft, saveReport, saveJourneyDraft, notify, closeModal, openEvent,
    onEdit: () => setModal({ type: 'edit', eventId: selectedEvent?.id }),
    onAccounting: () => selectedEvent && openAccounting(selectedEvent.id, 'event'),
  };
  return <div className={`app-shell${collapsed ? ' is-collapsed' : ''}${menuOpen ? ' menu-open' : ''}`} style={pageStyle(profile.pageBackground, theme)}>
    <Sidebar
      page={page}
      navigate={navigate}
      mobile={menuOpen}
      close={() => setMenuOpen(false)}
      onCollapse={toggleMenu}
      expanded={narrow ? menuOpen : !collapsed}
      help={() => setModal({ type: 'help' })}
      newQuestions={questions.questions.filter(question => question.status === 'new').length}
      accessRequests={access.requests.length}
    />
    <div className="app-content">
      <Header page={page} onMenu={toggleMenu} expanded={narrow ? menuOpen : !collapsed} onNew={openNew} />
      <main><PageContent page={page} openEvent={openEvent} openAccounting={openAccounting} openJourney={matchId => setModal({ type: 'journey', matchId })} openNew={openNew} openReport={eventId => setModal({ type: 'report', eventId })} openSpaceRequest={(space, date) => setModal({ type: 'new', initialEvent: { space, date, requestType: 'rental' } })} navigate={navigate} questions={questions} access={access} /></main>
    </div>
    {storageError && <p role="alert" className="notice">{storageError}</p>}
    {toast && <p role="status" className="notice">{toast}</p>}
    {modal && <Modal title={modalDef.title(modalCtx)} onClose={closeModal} wide={modalDef.wide} className={modalDef.className}>{modalDef.render(modalCtx)}</Modal>}
  </div>;
}
