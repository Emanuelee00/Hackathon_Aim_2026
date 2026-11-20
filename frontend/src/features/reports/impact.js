import { duration } from '../../shared/lib/format.js';
import { slotsOn } from '../calendar/week.js';

// Opening hours used as the denominator of occupancy (hypothesis: 9 h – 21 h, every day).
export const OPEN_HOURS_PER_DAY = 12;

function monthDays(month) {
  const [year, index] = month.split('-').map(Number);
  const count = new Date(year, index, 0).getDate();
  return Array.from({ length: count }, (_, day) => `${month}-${String(day + 1).padStart(2, '0')}`);
}

// Share of opening hours booked per space, counting confirmed events and synced association slots.
export function occupancy(spaces, events, associations, month) {
  const days = monthDays(month);
  const booked = [...events.filter(event => ['confirmed', 'completed'].includes(event.status) && event.date.startsWith(month)), ...days.flatMap(day => slotsOn(associations, day))];
  return spaces.map(space => {
    const hours = booked.filter(item => item.space === space.id).reduce((sum, item) => sum + duration(item), 0);
    return { space, hours, rate: Math.min(100, Math.round(hours / (days.length * OPEN_HOURS_PER_DAY) * 100)) };
  });
}

// Days between the request and the first answer (reply sent or decision recorded).
export function responseDelay(events) {
  const delays = events.filter(event => event.submittedAt && (event.replySentAt || event.approval?.date)).map(event => (new Date(event.replySentAt || event.approval.date) - new Date(event.submittedAt)) / 86400000);
  return delays.length ? Math.max(0, Math.round(delays.reduce((sum, days) => sum + days, 0) / delays.length)) : null;
}

export function organizerSummary(events) {
  const feedbacks = events.map(event => event.organizerFeedback).filter(Boolean);
  const average = feedbacks.length ? (feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(1) : '—';
  return { count: feedbacks.length, average, withResidents: feedbacks.filter(feedback => feedback.residents === 'yes').length };
}
