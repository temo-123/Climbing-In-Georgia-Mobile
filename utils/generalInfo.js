// Port of the website's GeneralInfoComponent composition rule: a reusable
// "general info" block (admin → General Info) is combined with the article's
// own text for the same section.
//   no general block (API sends [] / nothing) → the article's own text
//   block_action 'befor'   → general text, then own text
//   block_action 'after'   → own text, then general text
//   block_action 'instead' → general text only
// Returns the HTML pieces in display order (empty ones dropped).
export function composeGeneralInfo(globalInfo, ownHtml) {
  const hasGlobal = globalInfo && !Array.isArray(globalInfo) && typeof globalInfo === 'object';
  let parts;
  if (!hasGlobal) parts = [ownHtml];
  else if (globalInfo.block_action === 'befor') parts = [globalInfo.text, ownHtml];
  else if (globalInfo.block_action === 'after') parts = [ownHtml, globalInfo.text];
  else if (globalInfo.block_action === 'instead') parts = [globalInfo.text];
  else parts = [];
  return parts.filter((p) => typeof p === 'string' && p.trim() !== '');
}

// The website hides a general block behind a blurred "Show more" overlay
// when the admin ticked `is_show`.
export function isCollapsedGeneralInfo(globalInfo) {
  return !!(globalInfo && !Array.isArray(globalInfo) && globalInfo.is_show);
}
