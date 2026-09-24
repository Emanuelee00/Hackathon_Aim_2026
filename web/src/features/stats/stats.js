import { satisfactionSummary } from '../reports/satisfaction.js';

const percent = (part, whole) => whole ? Math.round(part / whole * 100) : null;

// Counts per label, largest first: [{ label, count, share }].
export function breakdown(items, labelOf) {
  const counts = items.reduce((map, item) => map.set(labelOf(item), (map.get(labelOf(item)) || 0) + 1), new Map());
  return [...counts].map(([label, count]) => ({ label, count, share: percent(count, items.length) })).sort((a, b) => b.count - a.count);
}

// Requests received from outside; events Chez Marthe programs itself are not requests.
export function requestStats(events) {
  const requests = events.filter(event => event.organizer !== 'Chez Marthe');
  const accepted = requests.filter(event => ['confirmed', 'completed'].includes(event.status)).length;
  const refused = requests.filter(event => event.status === 'cancelled').length;
  const waiting = requests.filter(event => ['pending', 'incomplete', 'waitlisted'].includes(event.status)).length;
  return { requests, received: requests.length, accepted, refused, waiting, acceptance: percent(accepted, accepted + refused) };
}

// Events held or planned, with attendance and money from the recorded reports.
export function eventStats(events, today) {
  const held = events.filter(event => ['confirmed', 'completed'].includes(event.status));
  const reports = held.filter(event => event.report).map(event => ({ ...event.report, planned: event.participants }));
  const sum = key => reports.reduce((total, report) => total + report[key], 0);
  const upcoming = held.filter(event => event.date >= today);
  return {
    held, total: held.length, upcoming: upcoming.length, past: held.length - upcoming.length, reported: reports.length,
    attendance: sum('attendance'), fillRate: percent(sum('attendance'), sum('planned')),
    revenue: sum('revenue'), costs: sum('costs'), expectedRevenue: upcoming.reduce((total, event) => total + (event.revenue || 0), 0),
    averageAttendance: reports.length ? Math.round(sum('attendance') / reports.length) : null,
  };
}

// Public questionnaires and organisers' feedback; "satisfied" means a rating of 4 or 5.
export function satisfactionStats(events) {
  const responses = events.flatMap(event => event.satisfactionResponses || []);
  const feedbacks = events.map(event => event.organizerFeedback).filter(Boolean);
  const ratings = [...responses.map(response => response.satisfaction), ...feedbacks.map(feedback => feedback.rating)].filter(Number.isInteger);
  return {
    survey: satisfactionSummary(responses), organizers: feedbacks.length, ratings: ratings.length,
    satisfiedRate: percent(ratings.filter(rating => rating >= 4).length, ratings.length),
    distribution: [5, 4, 3, 2, 1].map(stars => ({ label: `${stars} / 5`, count: ratings.filter(rating => rating === stars).length, share: percent(ratings.filter(rating => rating === stars).length, ratings.length) })),
    logisticsReady: percent(feedbacks.filter(feedback => feedback.logistics === 'ready').length, feedbacks.filter(feedback => feedback.logistics).length),
  };
}

// Residents' participation, their journeys and volunteer coverage.
export function communityStats(events, matches) {
  const reports = events.filter(event => event.status === 'completed' && event.report).map(event => event.report);
  const residents = reports.reduce((total, report) => total + report.residents, 0);
  const attendance = reports.reduce((total, report) => total + report.attendance, 0);
  const accepted = matches.filter(match => match.status === 'accepted');
  const needs = events.filter(event => ['pending', 'confirmed'].includes(event.status)).flatMap(event => (event.volunteerNeeds || []).map(need => ({ need, filled: (event.volunteers || []).filter(volunteer => volunteer.needId === need.id).length })));
  const places = needs.reduce((total, item) => total + item.need.needed, 0);
  const filled = needs.reduce((total, item) => total + Math.min(item.filled, item.need.needed), 0);
  return {
    residents, residentShare: percent(residents, attendance), withResidents: reports.filter(report => report.residents > 0).length, reports: reports.length,
    proposals: matches.filter(match => match.status !== 'dismissed').length, accepted: accepted.length,
    participated: accepted.filter(match => match.journey?.participation === 'participated').length,
    nextSteps: accepted.filter(match => match.journey?.nextStep && match.journey.nextStep !== 'none').length,
    places, filled, coverage: percent(filled, places),
  };
}
