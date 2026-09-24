export function bookingsForDate(events, date) {
  return events.filter(event => event.date === date && event.status !== 'cancelled');
}

export function availabilityFor(spaceId, date, events) {
  const bookings = bookingsForDate(events, date).filter(event => event.space === spaceId);
  return {
    confirmed: bookings.filter(event => ['confirmed', 'completed'].includes(event.status)),
    pending: bookings.filter(event => event.status === 'pending'),
  };
}
