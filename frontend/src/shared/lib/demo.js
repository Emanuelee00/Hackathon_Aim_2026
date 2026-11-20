// Fake demo data (profiles, prewritten matches, « Données de démonstration » label).
// Shown everywhere unless the build sets VITE_DEMO=off; Vite inlines the constant,
// so a build with `off` drops the demo modules from the bundle.
export const SHOW_DEMO_DATA = import.meta.env.VITE_DEMO !== 'off';
