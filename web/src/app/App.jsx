import { useState } from 'react';
import Header from '../shared/components/Header.jsx';
import Modal from '../shared/components/Modal.jsx';
import Sidebar, { navigation } from '../shared/components/Sidebar.jsx';
import EventDetails from '../features/requests/components/EventDetails.jsx';
import EventForm from '../features/requests/components/EventForm.jsx';
import Dashboard from '../features/dashboard/Dashboard.jsx';
import Requests from '../features/requests/Requests.jsx';
import Committee from '../features/committee/Committee.jsx';
import Calendar from '../features/calendar/Calendar.jsx';
import Spaces from '../features/spaces/Spaces.jsx';
import Reports from '../features/reports/Reports.jsx';
import Stats from '../features/stats/Stats.jsx';
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

function PageContent({ page, openEvent, openJourney, openNew, openReport, openSpaceRequest, navigate, questions, access }) {
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
  if (page === 'stats') return <Stats />;
  return <section className="panel placeholder-page"><p className="eyebrow">CHEZ MARTHE</p><h1>{navigation.find(item => item.id === page)?.label}</h1><p>Cette section est en cours de préparation.</p></section>;
}

export default function App() {
  const { events, saveEvent, matches, saveJourney, notify, storageError, toast } = useStore();
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const questions = useQuestions();
  const access = useAccessRequests();

  const selectedEvent = events.find(event => event.id === modal?.eventId);
  const selectedMatch = matches.find(match => match.id === modal?.matchId);
  const journeyEvent = events.find(event => event.id === selectedMatch?.eventId);
  const journeyResident = residentById[selectedMatch?.resident_id];
  const linkedParticipations = matches.filter(match => match.eventId === selectedEvent?.id && match.status === 'accepted' && match.journey?.participation === 'participated').length;
  const navigate = nextPage => {
    setPage(nextPage);
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
  const openNew = () => setModal({ type: 'new' });

  return <div className="app-shell">
    <Sidebar
      page={page}
      navigate={navigate}
      mobile={menuOpen}
      close={() => setMenuOpen(false)}
      help={() => setModal({ type: 'help' })}
      newQuestions={questions.questions.filter(question => question.status === 'new').length}
      accessRequests={access.requests.length}
    />
    <div className="app-content">
      <Header page={page} onMenu={() => setMenuOpen(true)} onNew={openNew} />
      <main><PageContent page={page} openEvent={openEvent} openJourney={matchId => setModal({ type: 'journey', matchId })} openNew={openNew} openReport={eventId => setModal({ type: 'report', eventId })} openSpaceRequest={(space, date) => setModal({ type: 'new', initialEvent: { space, date, requestType: 'rental' } })} navigate={navigate} questions={questions} access={access} /></main>
    </div>
    {storageError && <p role="alert" className="notice">{storageError}</p>}
    {toast && <p role="status" className="notice">{toast}</p>}
    {modal && <Modal title={modal.type === 'event' ? selectedEvent?.title || 'Événement' : modal.type === 'edit' ? 'Modifier la demande' : modal.type === 'new' ? 'Nouvelle demande' : modal.type === 'report' ? `Bilan · ${selectedEvent?.title}` : modal.type === 'journey' ? `Parcours · ${journeyResident?.first_name}` : 'À propos'} onClose={closeModal} wide={['new', 'edit', 'report', 'journey'].includes(modal.type)}>
      {['new', 'edit'].includes(modal.type) && <EventForm event={modal.type === 'edit' ? selectedEvent : modal.initialEvent} events={events} onSave={saveDraft} onCancel={closeModal} />}
      {modal.type === 'event' && selectedEvent && <EventDetails event={selectedEvent} events={events} onSave={saveEvent} onEdit={() => setModal({ type: 'edit', eventId: selectedEvent.id })} onClose={closeModal} notify={notify} />}
      {modal.type === 'report' && selectedEvent && <ReportForm event={selectedEvent} linkedParticipations={linkedParticipations} onSave={saveReport} onCancel={closeModal} />}
      {modal.type === 'journey' && selectedMatch && journeyResident && journeyEvent && <JourneyForm match={selectedMatch} resident={journeyResident} event={journeyEvent} onSave={saveJourneyDraft} onCancel={closeModal} />}
      {modal.type === 'help' && <p>Marthe accompagne les lieux solidaires dans l’organisation de leurs événements. Les données affichées sont fictives.</p>}
    </Modal>}
  </div>;
}
