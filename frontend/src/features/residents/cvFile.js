const MAX_SIZE = 4 * 1024 * 1024;

export function validateCv(file) {
  if (!/\.(pdf|docx)$/i.test(file?.name || '')) return 'Ce fichier n’est pas accepté. Choisissez un PDF ou un document Word (.docx).';
  if (file.size > MAX_SIZE) return 'Ce fichier dépasse 4 Mo. Choisissez un fichier plus léger.';
  return '';
}
