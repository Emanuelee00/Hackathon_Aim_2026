// What an imported Excel file changes, funder by funder (files saved by the site keep their ids).
const comparable = funder => JSON.stringify({ ...funder, tasks: funder.tasks.map(({ id, ...task }) => task) });

export function importChanges(current, imported) {
  const before = new Map(current.map(funder => [funder.id, funder]));
  const after = new Set(imported.map(funder => funder.id));
  const known = imported.filter(funder => before.has(funder.id));
  return {
    matched: known.length > 0,
    unchanged: known.filter(funder => comparable(funder) === comparable(before.get(funder.id))).length,
    changed: known.filter(funder => comparable(funder) !== comparable(before.get(funder.id))).map(funder => funder.name),
    added: imported.filter(funder => !before.has(funder.id)).map(funder => funder.name),
    removed: current.filter(funder => !after.has(funder.id)).map(funder => funder.name),
  };
}
