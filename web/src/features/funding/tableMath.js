// Width and order of the funders table's columns, in pixels.
// Columns whose content has a set size: the date field, the state menu, the row actions.
const FIXED = ['deadline', 'status', 'card'];
export const MIN_COLUMN = 50;

export const totalWidth = widths => Object.values(widths).reduce((sum, width) => sum + width, 0);

// The text columns grow or shrink in proportion; the fixed ones keep their width.
export function scaleWidths(widths, total) {
  const fixed = totalWidth(Object.fromEntries(Object.entries(widths).filter(([key]) => FIXED.includes(key))));
  const ratio = Math.max(0, total - fixed) / (totalWidth(widths) - fixed);
  const scaled = Object.fromEntries(Object.entries(widths).map(([key, width]) => [key, FIXED.includes(key) ? width : Math.max(MIN_COLUMN, Math.floor(width * ratio))]));
  // Rounding leftovers go to the widest text column: the table is exactly as wide as asked.
  const rest = total - totalWidth(scaled);
  const widest = Object.keys(scaled).filter(key => !FIXED.includes(key)).sort((a, b) => scaled[b] - scaled[a])[0];
  return rest > 0 && widest ? { ...scaled, [widest]: scaled[widest] + rest } : scaled;
}

// A column dropped on another takes its place, the others shift toward where it came from.
export function moveColumn(order, key, target) {
  const rest = order.filter(item => item !== key);
  const index = rest.indexOf(target) + (order.indexOf(key) < order.indexOf(target) ? 1 : 0);
  return [...rest.slice(0, index), key, ...rest.slice(index)];
}

// A column made wider or narrower takes or gives the difference to its right neighbour
// (its left one for the last column), so the table keeps its width.
export function resizeWithNeighbour(widths, order, key, width) {
  const index = order.indexOf(key);
  const neighbour = order[index + 1] ?? order[index - 1];
  const pair = widths[key] + widths[neighbour];
  const next = Math.min(pair - MIN_COLUMN, Math.max(MIN_COLUMN, Math.round(width)));
  return { ...widths, [key]: next, [neighbour]: pair - next };
}
