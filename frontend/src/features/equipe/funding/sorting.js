import { followupDate, fundingStatuses } from './funding.js';

const statusOrder = Object.keys(fundingStatuses);

// The first amount in a free-text cell ("250 000 €", "3 000–15 000 €", "30K", "35000.0");
// small numbers ("2 ans", "70 %") are not amounts.
export function amountValue(text) {
  for (const [, digits, thousand] of String(text || '').matchAll(/(\d[\d   ]*)(?:[.,]\d+)?\s*(k(?![a-z]))?/gi)) {
    const number = Number(digits.replace(/\D/g, ''));
    if (thousand) return number * 1000;
    if (number >= 100) return number;
  }
  return null;
}

const sortValues = {
  amount: funder => amountValue(funder.amount),
  deadline: funder => funder.deadline || null,
  obtained: funder => funder.obtainedOn || null,
  followup: funder => followupDate(funder) || null,
  status: funder => statusOrder.indexOf(funder.status),
};
export const sortableColumns = Object.keys(sortValues);

// Sorted like a shop listing; funders without a value always come last.
export function sortFunders(funders, sort) {
  const value = sortValues[sort?.key];
  if (!value) return funders;
  const sign = sort.direction === 'desc' ? -1 : 1;
  return [...funders].sort((a, b) => {
    const [first, second] = [value(a), value(b)];
    if (first === second) return 0;
    if (first === null) return 1;
    if (second === null) return -1;
    return (first < second ? -1 : 1) * sign;
  });
}
