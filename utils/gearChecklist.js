import { parseDocument } from 'htmlparser2';

// Port of the website's GearChecklistComponent parser: the "What you need"
// HTML (already composed with its general-info block) → groups of
// { note, items: [{ key, text }] }. Each <li> (nested lists flattened) or
// each <br>-separated line is an item; other sentences become a note that
// heads the items after them. Fewer than 2 items → no checklist.

// short stable key per item text, so ticks survive the list being edited
export function keyOf(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const decode = (s) => String(s || '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const cleanText = (s) => decode(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const meaningful = (s) => cleanText(s).replace(/[.\-–—:;,]/g, '').trim().length > 0;

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.data;
  if (node.name === 'br') return '\n';
  return (node.children || []).map(textOf).join('');
}

function isTag(node, ...names) {
  return node && (node.type === 'tag' || node.type === 'script' || node.type === 'style') && names.includes(node.name);
}

// Split a block's children on <br> into text lines.
function brLines(node) {
  const lines = [''];
  (node.children || []).forEach((c) => {
    if (isTag(c, 'br')) lines.push('');
    else lines[lines.length - 1] += textOf(c);
  });
  return lines.filter(meaningful);
}

export function parseChecklist(html) {
  if (!html) return [];
  const doc = parseDocument(`<div>${html}</div>`, { decodeEntities: true });
  const root = doc.children[0];
  const groups = [];
  let current = null;
  const group = () => {
    if (!current) { current = { note: '', items: [] }; groups.push(current); }
    return current;
  };
  const add = (text) => {
    if (!meaningful(text)) return;
    const clean = cleanText(text);
    group().items.push({ key: keyOf(clean), text: clean });
  };
  const addList = (list) => {
    (list.children || []).forEach((li) => {
      if (!isTag(li, 'li')) return;
      const nested = (li.children || []).filter((c) => isTag(c, 'ul', 'ol'));
      const own = (li.children || []).filter((c) => !nested.includes(c)).map(textOf).join('');
      add(own);
      nested.forEach(addList);
    });
  };
  const hasBlock = (n) => (n.children || []).some((c) => isTag(c, 'ul', 'ol', 'p'));
  const walk = (parent) => {
    (parent.children || []).forEach((node) => {
      if (node.type === 'text') {
        if (meaningful(node.data)) { current = null; group().note = cleanText(node.data); }
        return;
      }
      if (node.type !== 'tag') return;
      if (isTag(node, 'ul', 'ol')) { addList(node); return; }
      if (isTag(node, 'div') || (isTag(node, 'span') && hasBlock(node))) { walk(node); return; }
      const lines = brLines(node);
      if (lines.length >= 2) {
        lines.forEach(add);
      } else if (meaningful(textOf(node))) {
        current = null;
        group().note = cleanText(textOf(node));
      }
    });
  };
  walk(root);
  const out = groups.filter((g) => g.items.length || g.note);
  return out.reduce((n, g) => n + g.items.length, 0) >= 2 ? out : [];
}
