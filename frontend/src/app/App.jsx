import { useEffect, useState } from 'react';
import Header from '../shared/components/Header.jsx';
import Modal from '../shared/components/Modal.jsx';
import Sidebar from '../shared/components/Sidebar.jsx';
import { navigation } from '../shared/data/navigation.js';
import useHashPage from '../shared/lib/useHashPage.js';
import useMediaQuery from '../shared/lib/useMediaQuery.js';
import EventDetails from '../features/requests/components/EventDetails.jsx';
import EventForm from '../features/requests/components/EventForm.jsx';
import Dashboard from '../features/dashboard/Dashboard.jsx';
import Requests from '../features/requests/Requests.jsx';
import Committee from '../features/committee/Committee.jsx';
import Calendar from '../features/calendar/Calendar.jsx';
import Spaces from '../features/spaces/Spaces.jsx';
import Reports from '../features/reports/Reports.jsx';
import Stats from '../features/stats/Stats.jsx';
import Funding from '../features/funding/Funding.jsx';
import Prospection from '../features/prospection/Prospection.jsx';
import SiteEditor from '../features/site/SiteEditor.jsx';
import StructureBilans from '../features/bilans/StructureBilans.jsx';
import Messages from '../features/messages/Messages.jsx';
import Quotes from '../features/quotes/Quotes.jsx';
import AccountingWindow from '../features/quotes/AccountingWindow.jsx';
import ReportForm from '../features/reports/components/ReportForm.jsx';
import Opportunities from '../features/opportunities/Opportunities.jsx';
import Journeys from '../features/journeys/Journeys.jsx';
import Residents from '../features/residents/Residents.jsx';
import JourneyForm from '../features/journeys/components/JourneyForm.jsx';
import Questions from '../features/questions/Questions.jsx';
import useQuestions from '../features/questions/useQuestions.js';
import AccessRequests from '../features/access/AccessRequests.jsx';
import useAccessRequests from '../features/access/useAccessRequests.js';
import { residentById } from '../features/opportunities/data/residents.js';
import { TODAY } from '../shared/data/spaces.js';
import { useStore } from './store.jsx';
import ProfileProvider, { useProfile } from '../features/profiles/ProfileProvider.jsx';
import ProfilePicker from '../features/profiles/ProfilePicker.jsx';
import { pageStyle } from '../features/profiles/profiles.js';

function PageContent({ page, openEvent, openAccounting, openJourney, openNew, openReport, openSpaceRequest, navigate, questions, access }) {
  if (page === 'dashboard') return <Dashboard onNew={openNew} onOpen={openEvent} navigate={navigate} />;
  if (page === 'requests') return <Requests onNew={openNew} onOpen={openEvent} />;
  if (page === 'questions') return <Questions {...questions} />;
  if (page === 'access') return <AccessRequests {...access} />;
  if (page === 'committee') return <Committee onOpen={openEvent} />;
  if (page === 'opportunities') return <Opportunities />;
  if (page === 'residents') return <Residents navigate={navigate} />;
  if (page === 'journeys') return <Journeys onEdit={openJourney} navigate={navigate} />;
  if (page === 'calendar') return <Calendar onOpen={openEvent} />;
  if (page === 'spaces') return <Spaces onBook={openSpaceRequest} onOpen={openEvent} />;
  if (page === 'reports') return <Reports onOpen={openEvent} onReport={openReport} />;
  if (page === 'bilans') return <StructureBilans />;
  if (page === 'stats') return <Stats />;
  if (page === 'funding') return <Funding />;
  if (page === 'prospection') return <Prospection navigate={navigate} />;
  if (page === 'messages') return <Messages />;
  if (page === 'quotes') return <Quotes onAccounting={openAccounting} />;
  if (page === 'site') return <SiteEditor />;
  return <section className="panel placeholder-page"><p className="eyebrow">CHEZ MARTHE</p><h1>{navigation.find(item => item.id === page)?.label}</h1><p>Cette section est en cours de préparation.</p></section>;
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
