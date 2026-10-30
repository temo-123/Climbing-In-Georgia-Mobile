// CMS short descriptions arrive as HTML; cards show them as plain text.
// Placeholder texts like "." or "-" (used on the site to leave a field
// "empty") are hidden, same as the website cards do.
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return /^[\s.\-–—_]*$/.test(text) ? '' : text;
}
