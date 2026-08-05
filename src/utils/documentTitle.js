export function setDocumentTitle(title) {
  if (typeof document === 'undefined') return;

  const normalizedTitle = typeof title === 'string' ? title.trim() : '';

  if (!normalizedTitle) return;

  document.title = `Madar | ${normalizedTitle}`;
}
