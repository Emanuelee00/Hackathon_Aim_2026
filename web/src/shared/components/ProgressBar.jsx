// Fills in about 9 seconds, the maximum wait of an AI answer.
export default function ProgressBar({ label }) {
  return <span className="progress-bar" role="progressbar" aria-label={label}><i /></span>;
}
