export function validateResponse(response) {
  if (![response.satisfaction, response.welcome, response.usefulness].every(value => Number.isInteger(value) && value >= 1 && value <= 5)) return 'Répondez aux trois questions avec une note de 1 à 5.';
  return '';
}

export function satisfactionSummary(responses = []) {
  const valid = responses.filter(response => !validateResponse(response));
  const average = key => valid.length ? (valid.reduce((sum, response) => sum + response[key], 0) / valid.length).toFixed(1) : '—';
  return { count: valid.length, satisfaction: average('satisfaction'), welcome: average('welcome'), usefulness: average('usefulness') };
}
